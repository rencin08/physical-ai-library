"use client";

import { useEffect, useState } from "react";
import type { Paper } from "@/lib/data";
import { MAX_NOTE_LENGTH, type ReadingStatus } from "@/lib/reading-state";
import { useReading } from "./ReadingProvider";
import { SavePaperButton } from "./SavePaperButton";

const fields = [
  { key: "learned", label: "What I learned", placeholder: "Explain the idea in your own words…" },
  { key: "questions", label: "Questions I still have", placeholder: "What would you like to understand better?" },
  { key: "nextSteps", label: "What I want to try next", placeholder: "An experiment, a connection, or another paper to read…" },
] as const;

export function ReadingJournal({ paper }: { paper: Paper }) {
  const { state, ready, update, error } = useReading();
  const record = state.records[paper.slug];
  return <section className="reading-journal" aria-labelledby="journal-title">
    <div className="journal-heading"><div><div className="eyebrow">Your reading record</div><h2 id="journal-title">Keep your place.</h2></div><SavePaperButton paper={paper} showLabel/></div>
    <div className="journal-status"><label htmlFor="reading-status">Reading status</label><select id="reading-status" disabled={!ready} value={record?.status ?? "unread"} onChange={event => update(paper, { status: event.target.value as ReadingStatus })}><option value="unread">To read</option><option value="reading">Reading</option><option value="completed">Finished</option></select>{record?.completedAt && <span>Finished {new Date(record.completedAt).toLocaleDateString()}</span>}</div>
    <details className="paper-reflection"><summary>End-of-paper reflection</summary><p>Optional: gather your thoughts after reading. Your existing reflections are kept here.</p>
    <div className="journal-fields">{fields.map(field => <div className="journal-field" key={field.key}><label htmlFor={`journal-${field.key}`}>{field.label}</label><NoteField key={paper.slug} id={`journal-${field.key}`} disabled={!ready} placeholder={field.placeholder} value={record?.[field.key] ?? ""} save={value => update(paper, { [field.key]: value })}/></div>)}</div>
    </details>
    <p className="journal-save-status" role="status">{!ready ? "Loading your journal…" : error ? "Changes could not be saved. See the message above." : "Saved on this device · Only you can mark a paper finished."}</p>
  </section>;
}

function NoteField({ id, disabled, placeholder, value, save }: { id: string; disabled: boolean; placeholder: string; value: string; save: (value: string) => boolean }) {
  const [draft, setDraft] = useState(value);
  const [unsaved, setUnsaved] = useState(false);
  useEffect(() => { if (!unsaved) setDraft(value); }, [value, unsaved]);
  return <><textarea id={id} disabled={disabled} rows={6} maxLength={MAX_NOTE_LENGTH} placeholder={placeholder} value={draft} onChange={event => {
    setDraft(event.target.value);
    setUnsaved(!save(event.target.value));
  }} onBlur={() => { if (unsaved) setUnsaved(!save(draft)); }}/>{unsaved && <small role="status">Not saved. Keep this tab open and copy this note somewhere safe.</small>}</>;
}
