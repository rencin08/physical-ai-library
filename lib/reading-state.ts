import { validAnnotation, type Annotation } from "./annotations.ts";
import type { RecommendationPreferences } from "./recommendations";
import type { Paper } from "./data";

export const STORAGE_KEY = "reading-library:v1";
export const MAX_NOTE_LENGTH = 20000;
export type ReadingStatus = "unread" | "reading" | "completed";
export type ReaderMode = "guide" | "paper" | "code";
export type ReadingRecord = {
  paper: Paper;
  saved: boolean;
  status: ReadingStatus;
  chapter: number;
  mode: ReaderMode;
  learned: string;
  questions: string;
  nextSteps: string;
  lastOpenedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  annotations?: Annotation[];
};
export type ReadingState = { version: 1; records: Record<string, ReadingRecord>; preferences?: RecommendationPreferences };
export type ReadingPatch = Partial<Omit<ReadingRecord, "paper" | "updatedAt">>;
export const emptyReadingState = (): ReadingState => ({ version: 1, records: {} });

export function newRecord(paper: Paper, now: string): ReadingRecord {
  return { paper, saved: false, status: "unread", chapter: 0, mode: "guide", learned: "", questions: "", nextSteps: "", lastOpenedAt: null, completedAt: null, updatedAt: now };
}

export function updateRecord(state: ReadingState, paper: Paper, patch: ReadingPatch, now = new Date().toISOString()): ReadingState {
  const current = state.records[paper.slug] ?? newRecord(paper, now);
  const next = { ...current, ...patch, paper, updatedAt: now };
  if (patch.status === "completed") next.completedAt = current.completedAt ?? now;
  else if (patch.status) next.completedAt = null;
  return { ...state, records: { ...state.records, [paper.slug]: next } };
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const nullableDate = (value: unknown) => value === null || date(value);
const strings = (value: unknown) => Array.isArray(value) && value.every(item => typeof item === "string");
const paperStrings = ["slug", "arxivId", "title", "shortTitle", "authors", "institution", "summary", "why", "accent", "architecture", "task", "embodiments", "modalities", "dataset"];
const paperArrays = ["topics", "contributions", "limitations", "lineage"];

// Treat browser storage and imported files as untrusted input. Reject the entire
// file on error so a damaged backup can never silently erase part of a journal.
export function parseReadingState(raw: string): ReadingState {
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.version !== 1 || !object(value.records)) throw new Error("This is not a supported library backup (version 1).");
  const records: Record<string, ReadingRecord> = Object.create(null);
  for (const [slug, record] of Object.entries(value.records)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(slug) || ["__proto__", "constructor", "prototype"].includes(slug) || !object(record)) throw new Error("The backup contains an invalid paper record.");
    const paper = record.paper;
    if (!object(paper) || paper.slug !== slug || !paperStrings.every(key => typeof paper[key] === "string") || !paperArrays.every(key => strings(paper[key])) || typeof paper.year !== "number" || !Number.isFinite(paper.year) || typeof paper.openSource !== "boolean") throw new Error("The backup contains invalid paper details.");
    if (typeof record.saved !== "boolean" || !["unread", "reading", "completed"].includes(String(record.status)) || !["guide", "paper", "code"].includes(String(record.mode)) || !Number.isInteger(record.chapter) || Number(record.chapter) < 0 || Number(record.chapter) > 1000 || !["learned", "questions", "nextSteps"].every(key => typeof record[key] === "string" && (record[key] as string).length <= MAX_NOTE_LENGTH) || !date(record.updatedAt) || !nullableDate(record.lastOpenedAt) || !nullableDate(record.completedAt)) throw new Error("The backup contains invalid reading progress or notes.");
    if (record.annotations !== undefined && (!Array.isArray(record.annotations) || record.annotations.length > 2000 || !record.annotations.every(validAnnotation) || new Set(record.annotations.map(item => item.id)).size !== record.annotations.length)) throw new Error("The backup contains invalid annotations.");
    records[slug] = record as ReadingRecord;
  }
  if (value.preferences !== undefined) {
    const prefs = value.preferences;
    if (!object(prefs) || !strings(prefs.interests) || (prefs.interests as string[]).length > 200 || !(prefs.interests as string[]).every(topic => topic.length <= 200) || typeof prefs.useReadingHistory !== "boolean" || !object(prefs.feedback) || !Object.entries(prefs.feedback).every(([slug, choice]) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(slug) && !["__proto__", "constructor", "prototype"].includes(slug) && ["more", "less"].includes(String(choice)))) throw new Error("The backup contains invalid recommendation preferences.");
    return { version: 1, records, preferences: prefs as RecommendationPreferences };
  }
  return { version: 1, records };
}

// Existing records win conflicts: importing never overwrites newer local notes
// or deliberately removed bookmarks. New papers are added to the journal.
export function mergeReadingStates(current: ReadingState, incoming: ReadingState): ReadingState {
  return { version: 1, records: { ...incoming.records, ...current.records }, ...(current.preferences || incoming.preferences ? { preferences: current.preferences ?? incoming.preferences } : {}) };
}
