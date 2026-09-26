"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Paper } from "@/lib/data";
import { useReading } from "./ReadingProvider";

export function SavePaperButton({ paper, showLabel = false }: { paper: Paper; showLabel?: boolean }) {
  const { state, ready, update } = useReading();
  const saved = state.records[paper.slug]?.saved ?? false;
  const label = saved ? "Remove bookmark" : "Save paper";
  return <button type="button" className={`save-paper ${saved ? "is-saved" : ""}`} aria-label={`${label}: ${paper.title}`} title={label} aria-pressed={saved} disabled={!ready} onClick={() => update(paper, { saved: !saved })}>
    {saved ? <BookmarkCheck size={17}/> : <Bookmark size={17}/>}{showLabel && <span>{saved ? "Saved" : "Save paper"}</span>}
  </button>;
}
