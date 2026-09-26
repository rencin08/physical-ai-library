"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { defaultPreferences, type RecommendationPreferences } from "@/lib/recommendations";
import type { Annotation } from "@/lib/annotations";
import type { Paper } from "@/lib/data";
import { emptyReadingState, mergeReadingStates, parseReadingState, STORAGE_KEY, updateRecord, type ReadingPatch, type ReadingState } from "@/lib/reading-state";

type ReadingContext = {
  state: ReadingState;
  ready: boolean;
  folderBackup: string;
  retryFolderBackup: () => void;
  error: string;
  update: (paper: Paper, patch: ReadingPatch) => boolean;
  importBackup: (raw: string) => number;
  changeAnnotations: (paper: Paper, transform: (annotations: Annotation[]) => Annotation[]) => boolean;
  changePreferences: (transform: (preferences: RecommendationPreferences) => RecommendationPreferences) => boolean;
};
const Context = createContext<ReadingContext | null>(null);

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReadingState>(emptyReadingState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);
  const [backupConfigured, setBackupConfigured] = useState(false);
  const [folderBackup, setFolderBackup] = useState("");
  const [backupAttempt, setBackupAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/local-backup", { cache: "no-store", signal: controller.signal }).then(response => response.json()).then(result => setBackupConfigured(result.configured === true)).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!ready || error || !backupConfigured) return;
    let cancelled = false;
    setFolderBackup("Saving a copy to your local folder…");
    const timer = setTimeout(async () => {
      try {
        const key = "reading-library:backup-browser-id";
        let browserId = localStorage.getItem(key);
        if (!browserId) { browserId = crypto.randomUUID(); localStorage.setItem(key, browserId); }
        const response = await fetch("/api/local-backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ browserId, state }) });
        if (!response.ok) throw new Error("Backup failed");
        const result = await response.json();
        if (!cancelled) setFolderBackup(result.configured ? "A copy is saved in your local backup folder." : "Local folder backups are not enabled on this server.");
      } catch { if (!cancelled) setFolderBackup("Your browser copy is saved, but the folder backup failed. Retry while the local app is running."); }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [state, ready, error, backupConfigured, backupAttempt]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const next = raw ? parseReadingState(raw) : emptyReadingState();
        setState(next);
        setError("");
      } catch {
        setError("Your reading record could not be loaded. Existing data has been left untouched. Check that browser storage is available.");
      }
      loaded.current = true;
      setReady(true);
    }
    load();
    function onStorage(event: StorageEvent) { if (event.key === STORAGE_KEY || event.key === null) load(); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((transform: (value: ReadingState) => ReadingState) => {
    if (!loaded.current) throw new Error("Your reading record is still loading.");
    // Read the latest value before each write to preserve changes from other tabs.
    const raw = localStorage.getItem(STORAGE_KEY);
    const latest = raw ? parseReadingState(raw) : emptyReadingState();
    const next = transform(latest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    setError("");
  }, []);

  const update = useCallback((paper: Paper, patch: ReadingPatch) => {
    try { commit(latest => updateRecord(latest, paper, patch)); return true; }
    catch { setError("This change could not be saved. Browser storage may be full, unavailable, or contain a damaged record. Your last saved data has been left untouched."); return false; }
  }, [commit]);

  const changeAnnotations = useCallback((paper: Paper, transform: (annotations: Annotation[]) => Annotation[]) => {
    try { commit(latest => {
      const annotations = transform(latest.records[paper.slug]?.annotations ?? []);
      if (annotations.length > 2000) throw new Error("Too many annotations for one paper.");
      return updateRecord(latest, paper, { annotations });
    }); return true; }
    catch { setError("Your annotation could not be saved. Keep the note open and copy your text before leaving."); return false; }
  }, [commit]);

  const changePreferences = useCallback((transform: (preferences: RecommendationPreferences) => RecommendationPreferences) => {
    try { commit(latest => ({ ...latest, preferences: transform(latest.preferences ?? defaultPreferences()) })); return true; }
    catch { setError("Your shelf preferences could not be saved. Your previous preferences have been left untouched."); return false; }
  }, [commit]);

  const importBackup = useCallback((raw: string) => {
    const incoming = parseReadingState(raw);
    let added = 0;
    commit(latest => {
      added = Object.keys(incoming.records).filter(slug => !latest.records[slug]).length;
      return mergeReadingStates(latest, incoming);
    });
    return added;
  }, [commit]);

  return <Context.Provider value={{ state, ready, folderBackup, retryFolderBackup: () => setBackupAttempt(value => value + 1), error, update, importBackup, changePreferences, changeAnnotations }}>
    {error && <div className="storage-error" role="alert">{error}</div>}
    {children}
  </Context.Provider>;
}

export function useReading() {
  const context = useContext(Context);
  if (!context) throw new Error("ReadingProvider is missing.");
  return context;
}
