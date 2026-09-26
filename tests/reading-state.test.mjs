import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyReadingState, mergeReadingStates, parseReadingState, updateRecord } from "../lib/reading-state.ts";

const paper = { slug: "sample-paper", arxivId: "2401.00001", title: "Sample paper", shortTitle: "Sample", authors: "A. Author", institution: "Lab", year: 2024, summary: "An abstract", why: "An idea", topics: ["Science"], accent: "blue", architecture: "", task: "", embodiments: "", modalities: "", dataset: "", openSource: false, contributions: [], limitations: [], lineage: [] };
const time = "2026-09-22T12:00:00.000Z";

test("bookmark removal preserves a reader’s position and learning notes", () => {
  let state = updateRecord(emptyReadingState(), paper, { saved: true, status: "reading", chapter: 3, learned: "A useful insight" }, time);
  state = updateRecord(state, paper, { saved: false }, time);
  assert.equal(state.records[paper.slug].saved, false);
  assert.equal(state.records[paper.slug].chapter, 3);
  assert.equal(state.records[paper.slug].learned, "A useful insight");
  assert.equal(state.records[paper.slug].status, "reading");
});

test("completion is explicit, retains its date on revisits, and can be undone", () => {
  let state = updateRecord(emptyReadingState(), paper, { chapter: 4, status: "reading" }, time);
  assert.equal(state.records[paper.slug].completedAt, null);
  state = updateRecord(state, paper, { status: "completed" }, time);
  state = updateRecord(state, paper, { status: "completed", lastOpenedAt: "2026-09-23T12:00:00.000Z" }, "2026-09-23T12:00:00.000Z");
  assert.equal(state.records[paper.slug].completedAt, time);
  state = updateRecord(state, paper, { status: "reading" }, time);
  assert.equal(state.records[paper.slug].completedAt, null);
});

test("backup round trip retains imported-paper metadata, dates and Unicode notes", () => {
  const state = updateRecord(emptyReadingState(), paper, { saved: true, learned: "π₀ — 理解", questions: "Why?", nextSteps: "Reproduce", lastOpenedAt: time, mode: "paper" }, time);
  const restored = parseReadingState(JSON.stringify(state));
  assert.deepEqual(restored.records[paper.slug], state.records[paper.slug]);
});

test("import merges new papers and does not overwrite existing notes or unsaved bookmarks", () => {
  const current = updateRecord(emptyReadingState(), paper, { learned: "Keep this", saved: false }, time);
  let incoming = updateRecord(emptyReadingState(), paper, { learned: "Older note", saved: true }, time);
  incoming = updateRecord(incoming, { ...paper, slug: "another-paper" }, { saved: true }, time);
  const merged = mergeReadingStates(current, incoming);
  assert.equal(Object.keys(merged.records).length, 2);
  assert.equal(merged.records[paper.slug].learned, "Keep this");
  assert.equal(merged.records[paper.slug].saved, false);
});

test("damaged or unsupported backups fail before modifying any records", () => {
  const valid = updateRecord(emptyReadingState(), paper, { saved: true }, time);
  const cases = ["{", "null", JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ version: 1, records: { [paper.slug]: { ...valid.records[paper.slug], chapter: -1 } } }), JSON.stringify({ version: 1, records: { [paper.slug]: { ...valid.records[paper.slug], learned: 5 } } }), JSON.stringify({ version: 1, records: { [paper.slug]: { ...valid.records[paper.slug], paper: { ...paper, slug: "mismatched" } } } }), '{"version":1,"records":{"__proto__":{}}}'];
  for (const raw of cases) assert.throws(() => parseReadingState(raw));
  assert.equal(valid.records[paper.slug].saved, true);
});
