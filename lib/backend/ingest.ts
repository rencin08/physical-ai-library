import {readPersonal,writePersonal} from '@/lib/imports/store';
import {personalizedArxivQuery,discoveryReason,type DiscoveryProfile} from '@/lib/discovery-profile';
import { canonicalArxivId, mergeEnrichmentResults } from "./ingest-utils";
import { createAdminClient } from "./supabase";
import { fetchRecentArxiv } from "./sources/arxiv";
import { enrichFromSemanticScholar } from "./sources/semantic-scholar";
import { findGithubRepository } from "./sources/github";
import { fetchFeed } from "./sources/rss";
import { normalizeTitle, scorePhysicalAi, slugify } from "./normalize";

type IngestOptions = { maxResults?: number; enrichLimit?: number; includeFeeds?: boolean };

export async function runIngestion(options: IngestOptions = {}) {
  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + 45000;
  const { data: run, error: runError } = await supabase.from("ingestion_runs").insert({ source: "all", status: "running", started_at: startedAt }).select("id").single();
  if (runError) throw runError;
  const stats = { discovered: 0, relevant: 0, inserted: 0, updated: 0, feeds: 0, errors: [] as string[] };

  try {
    const profile=await readPersonal<DiscoveryProfile|null>('discovery-profile.json',null);
    const arxivPapers = await fetchRecentArxiv(options.maxResults ?? 50,profile?.topics.length?personalizedArxivQuery(profile):undefined);
    if(profile){
      const excluded=new Set(profile.excludedIds);
      const fresh=arxivPapers.filter(p=>!excluded.has(canonicalArxivId(p.externalId))).map(p=>({id:p.externalId,title:p.title,abstract:p.abstract,authors:p.authors,published:p.publishedAt,url:p.url,pdfUrl:p.pdfUrl||p.url.replace('/abs/','/pdf/'),...discoveryReason(p.title,p.abstract,profile)})).sort((a,b)=>b.score-a.score||b.published.localeCompare(a.published)).slice(0,12);
      await writePersonal('discoveries.json',{papers:fresh,updatedAt:new Date().toISOString(),profileKey:JSON.stringify(profile)});
    }
    stats.discovered = arxivPapers.length;

    for (const paper of arxivPapers) {
      if (Date.now() > deadline) { stats.errors.push("Run reached its time budget; remaining candidates will be retried on the next run."); break; }
      paper.externalId = canonicalArxivId(paper.externalId);
      const relevance = scorePhysicalAi(paper.title, paper.abstract);
      if (relevance.score < 0.18) continue;
      stats.relevant++;
      let enrichment = {};
      if (stats.relevant <= (options.enrichLimit ?? 12)) {
        const result = mergeEnrichmentResults(await Promise.allSettled([
          enrichFromSemanticScholar(paper.externalId), findGithubRepository(paper.title)
        ]));
        enrichment = result.values;
        stats.errors.push(...result.errors.map(message => `${paper.externalId}: ${message}`));
      }

      const payload = {
        arxiv_id: paper.externalId,
        slug: `${slugify(paper.title)}-${paper.externalId.replace(/[^a-zA-Z0-9]/g, "-")}`,
        normalized_title: normalizeTitle(paper.title),
        title: paper.title,
        abstract: paper.abstract,
        published_at: paper.publishedAt,
        source_updated_at: paper.updatedAt,
        arxiv_url: paper.url,
        pdf_url: paper.pdfUrl,
        categories: paper.categories,
        authors_json: paper.authors,
        relevance_score: relevance.score,
        relevance_terms: relevance.matches,
        status: "needs_review",
        source_payload: paper.raw,
        ...mapEnrichment(enrichment)
      };
      const { data: existing, error: lookupError } = await supabase.from("papers").select("id,status,slug").or(`arxiv_id.eq.${paper.externalId},arxiv_id.like.${paper.externalId}v%`).maybeSingle();
      if (lookupError) { stats.errors.push(`${paper.externalId}: ${lookupError.message}`); continue; }
      // Preserve the stable reader URL and editorial decision, including concurrent reviews.
      const { status: _status, slug: _slug, ...update } = payload;
      const { error } = existing
        ? await supabase.from("papers").update(update).eq("id", existing.id)
        : await supabase.from("papers").insert(payload);
      if (error) stats.errors.push(`${paper.externalId}: ${error.message}`); else if (existing) stats.updated++; else stats.inserted++;
    }

    if (options.includeFeeds !== false) {
      const feeds = (process.env.CONTENT_FEED_URLS ?? "").split(",").map((url) => url.trim()).filter(Boolean);
      for (const feedUrl of feeds) {
        if (Date.now() > deadline) { stats.errors.push("Feed work deferred to stay within the run time budget."); break; }
        try {
          const items = await fetchFeed(feedUrl);
          for (const item of items) {
            const relevance = scorePhysicalAi(item.title, item.summary);
            if (relevance.score < 0.12) continue;
            if (Date.now() > deadline) { stats.errors.push("Feed item work deferred to the next run."); break; }
            const { data: existingItem, error: itemLookupError } = await supabase.from("content_items").select("id").eq("source_external_id", item.externalId).maybeSingle();
            if (itemLookupError) { stats.errors.push(`Feed lookup: ${itemLookupError.message}`); continue; }
            const feedPayload = {
              source_external_id: item.externalId,
              content_type: item.contentKind,
              source_name: item.sourceName,
              title: item.title,
              summary: item.summary,
              canonical_url: item.url,
              published_at: item.publishedAt,
              relevance_score: relevance.score,
              source_payload: item.raw
            };
            const { error } = existingItem
              ? await supabase.from("content_items").update(feedPayload).eq("id", existingItem.id)
              : await supabase.from("content_items").insert({ ...feedPayload, status: "needs_review" });
            if (!error) stats.feeds++; else stats.errors.push(`Feed write: ${error.message}`);
          }
        } catch (error) { stats.errors.push(`${feedUrl}: ${error instanceof Error ? error.message : String(error)}`); }
      }
    }

    const { error: completionError } = await supabase.from("ingestion_runs").update({ status: stats.errors.length ? "completed_with_errors" : "completed", completed_at: new Date().toISOString(), stats, error_message: stats.errors.join("\n") || null }).eq("id", run.id);
    if (completionError) throw new Error(`Could not record ingestion completion: ${completionError.message}`);
    return { runId: run.id, ...stats };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from("ingestion_runs").update({ status: "failed", completed_at: new Date().toISOString(), error_message: message, stats }).eq("id", run.id);
    throw error;
  }
}

function mapEnrichment(value: Record<string, unknown>) {
  return {
    semantic_scholar_id: value.semanticScholarId,
    citation_count: value.citationCount,
    influential_citation_count: value.influentialCitationCount,
    reference_count: value.referenceCount,
    github_url: value.githubUrl,
    github_stars: value.githubStars,
    github_license: value.githubLicense,
    github_updated_at: value.githubUpdatedAt,
    open_access_pdf_url: value.openAccessPdf
  };
}
