import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { parseReadingState } from "@/lib/reading-state";

export const runtime = "nodejs";
const queues = new Map<string, Promise<void>>();
function enabled(request: NextRequest) {
  try {
    const hostname = new URL(`http://${request.headers.get("host") ?? ""}`).hostname;
    return Boolean(process.env.LIBRARY_BACKUP_DIRECTORY) && ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  } catch { return false; }
}
export async function GET(request: NextRequest) {
  return NextResponse.json({ configured: enabled(request) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (!enabled(request)) return NextResponse.json({ configured: false });
  if (request.headers.get("origin") !== `${request.nextUrl.protocol}//${request.headers.get("host")}` || !request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Local same-origin requests only." }, { status: 403 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 10 * 1024 * 1024) return NextResponse.json({ error: "Backup exceeds 10 MB." }, { status: 413 });
    const body = JSON.parse(raw);
    if (typeof body.browserId !== "string" || !/^[a-f0-9-]{36}$/.test(body.browserId)) return NextResponse.json({ error: "Invalid browser identifier." }, { status: 400 });
    const state = parseReadingState(JSON.stringify(body.state));
    const directory = process.env.LIBRARY_BACKUP_DIRECTORY!;
    const id: string = body.browserId;
    const destination = join(directory, `reading-${id}.json`);
    const operation = (queues.get(id) ?? Promise.resolve()).catch(() => {}).then(async () => {
      await mkdir(directory, { recursive: true });
      const temporary = join(directory, `.${id}-${randomUUID()}.tmp`);
      await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
      await rename(temporary, destination);
      const daily = join(directory, `reading-${id}-${new Date().toISOString().slice(0, 10)}.json`);
      await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
      await rename(temporary, daily);
    });
    queues.set(id, operation);
    try { await operation; } finally { if (queues.get(id) === operation) queues.delete(id); }
    return NextResponse.json({ configured: true, savedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "The folder backup could not be written. Your browser copy is unchanged." }, { status: 500 });
  }
}
