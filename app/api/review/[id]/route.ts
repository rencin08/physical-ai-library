import { NextRequest, NextResponse } from "next/server";
import { hasOriginalPaperFigures } from "@/lib/learning/paper-figures";
import { learningGuides } from "@/lib/learning/guides";
import { createAdminClient } from "@/lib/backend/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (!["published", "rejected", "needs_review"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const supabase = createAdminClient();
  if (body.status === "published") {
    const { data: candidate, error: lookupError } = await supabase.from("papers").select("slug").eq("id", id).single();
    if (lookupError || !candidate) return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    if (!learningGuides[candidate.slug] || !hasOriginalPaperFigures(candidate.slug)) return NextResponse.json({ error: "Prepare and review this paper’s five-chapter simplified guide with original paper figures and source references before publishing it to the library." }, { status: 409 });
  }
  const { data, error } = await supabase.from("papers").update({ status: body.status, reviewed_at: new Date().toISOString(), plain_english_summary: body.plainEnglishSummary, why_it_matters: body.whyItMatters, topics: body.topics, tags: body.tags }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
