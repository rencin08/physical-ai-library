import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/backend/supabase";

export async function GET(request: NextRequest) {
  const supabase = createPublicClient();
  if (!supabase) return NextResponse.json({ papers: [], configured: false });
  const query = request.nextUrl.searchParams.get("q")?.trim();
  let requestBuilder = supabase.from("papers").select("id,slug,title,plain_english_summary,why_it_matters,published_at,arxiv_url,pdf_url,github_url,citation_count,topics,tags,authors_json,institutions_json").eq("status", "published").order("published_at", { ascending: false }).limit(50);
  if (query) requestBuilder = requestBuilder.textSearch("search_document", query, { type: "websearch", config: "english" });
  const { data, error } = await requestBuilder;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ papers: data, configured: true });
}
