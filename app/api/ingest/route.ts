import { NextRequest, NextResponse } from "next/server";
import { backendConfigured } from "@/lib/backend/config";
import { ingestionOptions } from "@/lib/backend/ingest-utils";
import { runIngestion } from "@/lib/backend/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!backendConfigured()) return NextResponse.json({ error: "Supabase is not configured", setup: "Copy .env.example to .env.local and provide Supabase credentials." }, { status: 503 });
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const result = await runIngestion(ingestionOptions(body));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 });
  }
}
