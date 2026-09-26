"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bookmark, Download, Upload, ArrowRight } from "lucide-react";
import { useReading } from "./ReadingProvider";
import { SavePaperButton } from "./SavePaperButton";
import { libraryConfig } from "@/lib/library-config";
import { learningGuides } from "@/lib/learning/guides";
import { learningChapterNames } from "./LearningChapter";

const tabs = ["Saved papers", "Continue reading", "Finished", "Learning notes", "Recently viewed"] as const;
type Tab = typeof tabs[number];

export function SavedLibrary() {
  const { state, ready, importBackup, folderBackup, retryFolderBackup } = useReading();
  const [tab, setTab] = useState<Tab>("Saved papers");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const records = Object.values(state.records);
  const shown = records.filter(record => tab === "Saved papers" ? record.saved : tab === "Continue reading" ? record.status === "reading" : tab === "Finished" ? record.status === "completed" : tab === "Learning notes" ? Boolean(record.learned || record.questions || record.nextSteps || record.annotations?.length) : Boolean(record.lastOpenedAt)).sort((a, b) => (tab === "Recently viewed" ? b.lastOpenedAt!.localeCompare(a.lastOpenedAt!) : b.updatedAt.localeCompare(a.updatedAt)));

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${libraryConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-journal-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Backup exported. It includes your bookmarks, reading positions, and private notes.");
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose a backup smaller than 10 MB.");
      const added = importBackup(await file.text());
      setMessage(`Imported ${added} new paper ${added === 1 ? "record" : "records"}. Existing records and notes were kept.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "This backup could not be imported."); }
    if (fileInput.current) fileInput.current.value = "";
  }

  return <div className="wrap inner-page min-page">
    <div className="page-intro"><div className="eyebrow">Your personal archive</div><h1>Saved <em>library</em></h1><p>The papers you return to, and the understanding you build along the way.</p></div>
    <div className="journal-toolbar"><p>Stored in this browser, with no account. Export regularly: clearing browser data removes your record. Imports add new papers and keep existing records.</p><div><button disabled={!ready} onClick={exportBackup}><Download size={15}/> Export backup</button><button disabled={!ready} onClick={() => fileInput.current?.click()}><Upload size={15}/> Import backup</button><input ref={fileInput} hidden type="file" accept="application/json,.json" aria-label="Import library backup" onChange={event => void importFile(event.target.files?.[0])}/></div></div>
    {folderBackup && <p className="backup-message" role="status">{folderBackup}{folderBackup.includes("failed") && <button onClick={retryFolderBackup}>Retry folder backup</button>}</p>}
    {message && <p className="backup-message" role="status">{message}</p>}
    <div className="journal-counts"><span><b>{records.filter(record => record.saved).length}</b> saved</span><span><b>{records.filter(record => record.status === "reading").length}</b> reading</span><span><b>{records.filter(record => record.status === "completed").length}</b> finished</span></div>
    <div className="tabs journal-tabs" role="tablist" aria-label="Your library">{tabs.map(item => <button id={`tab-${tabs.indexOf(item)}`} role="tab" aria-selected={tab === item} aria-controls="library-records" className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div id="library-records" role="tabpanel" aria-labelledby={`tab-${tabs.indexOf(tab)}`}>
      {!ready ? <p role="status">Loading your library…</p> : !shown.length ? <div className="empty-state"><Bookmark/><h2>{tab === "Saved papers" ? "Your shelf is waiting." : "A little reading goes a long way."}</h2><p>{tab === "Learning notes" ? "Add a thought or question in a paper’s learning journal." : tab === "Finished" ? "Mark a paper finished in its learning journal or a collection." : "Explore a paper, save it for later, or pick a chapter to begin."}</p><Link className="primary-link" href="/">Explore papers <ArrowRight size={15}/></Link></div> : <div className="saved-records">{shown.map(record => {
        const { paper } = record;
        const chapter = learningGuides[paper.slug] ? learningChapterNames[record.chapter] : undefined;
        return <article className="saved-record" key={paper.slug}><Link href={`/paper/${paper.slug}`} className={`saved-cover ${paper.accent}`}><strong>{paper.shortTitle}</strong><small>{paper.year}</small></Link><div className="saved-record-body"><div className="eyebrow">{record.status === "completed" ? "Finished" : record.status === "reading" ? "Reading" : "To read"}{chapter && record.lastOpenedAt ? ` · ${chapter}` : ""}</div><h2><Link href={`/paper/${paper.slug}`}>{paper.title}</Link></h2><p>{paper.authors}</p>{tab === "Learning notes" && <div className="saved-notes">{record.annotations?.map(annotation => <p key={annotation.id}><b>Annotated passage</b>“{annotation.quote}”{annotation.note && <><br/>{annotation.note}</>}</p>)}{record.learned && <p><b>Learned</b>{record.learned}</p>}{record.questions && <p><b>Questions</b>{record.questions}</p>}{record.nextSteps && <p><b>Next steps</b>{record.nextSteps}</p>}</div>}<div className="saved-record-actions"><Link className="text-link" href={`/paper/${paper.slug}`}>{record.lastOpenedAt ? "Return to paper" : "Start reading"} <ArrowRight size={15}/></Link><SavePaperButton paper={paper} showLabel/></div><small>{record.lastOpenedAt ? `Last opened ${new Date(record.lastOpenedAt).toLocaleDateString()}` : "Saved for later"}</small></div></article>;
      })}</div>}
    </div>
  </div>;
}
