import { learningPriority, learningReason } from "./learning-paths.ts";
import type { Paper } from "./data";
import type { ReadingState } from "./reading-state";

export type RecommendationPreferences = {
  interests: string[];
  feedback: Record<string, "more" | "less">;
  useReadingHistory: boolean;
};
export const defaultPreferences = (): RecommendationPreferences => ({ interests: [], feedback: {}, useReadingHistory: true });
const normalize = (topic: string) => topic.trim().toLowerCase();

// Deterministic topic matching, entirely on-device. Notes and incidental page
// views are deliberately not inputs. Scores are only used to order the shelf.
export function recommendPapers(papers: Paper[], state: ReadingState, preferences: RecommendationPreferences) {
  const interests = new Set(preferences.interests.map(normalize));
  const sources = new Map(papers.map(paper => [paper.slug, paper]));
  for (const record of Object.values(state.records)) if (!sources.has(record.paper.slug)) sources.set(record.paper.slug, record.paper);
  const signals = [...sources.values()].flatMap(paper => {
    if (preferences.feedback[paper.slug] === "less") return [];
    const record = state.records[paper.slug];
    const more = preferences.feedback[paper.slug] === "more";
    const finished = preferences.useReadingHistory && record?.status === "completed";
    const saved = preferences.useReadingHistory && record?.saved;
    if (!more && !finished && !saved) return [];
    return [{ paper, weight: more ? 6 : finished ? 4 : 3, reason: more ? `Because you want more like ${paper.shortTitle}` : finished ? `Because you finished ${paper.shortTitle}` : `Because you saved ${paper.shortTitle}` }];
  });
  const hasSignals = interests.size > 0 || signals.length > 0;
  return papers.filter(paper => preferences.feedback[paper.slug] !== "less").map((paper, index) => {
    const topics = new Set(paper.topics.map(normalize));
    const matched = paper.topics.filter(topic => interests.has(normalize(topic)));
    let score = matched.length * 8 + learningPriority(paper);
    // Citations are a bounded secondary signal; never overwhelm relevance.
    score += Math.min(1, Math.log10(1 + Math.max(0, paper.citationCount ?? 0)) / 6);
    let strongest = 0;
    let reason = matched.length ? `Matches your interest in ${matched[0]}` : hasSignals ? "Something different to explore" : learningReason(paper);
    for (const signal of signals) {
      if (signal.paper.slug === paper.slug) continue;
      const overlap = new Set(signal.paper.topics.map(normalize).filter(topic => topics.has(topic))).size;
      const contribution = overlap * signal.weight;
      score += contribution;
      if (!matched.length && contribution > strongest) { strongest = contribution; reason = signal.reason; }
    }
    const completed = preferences.useReadingHistory && state.records[paper.slug]?.status === "completed";
    if (completed) reason = "Already finished · Revisit anytime";
    return { paper, score, reason, completed: Boolean(completed), index };
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || b.score - a.score || a.index - b.index);
}
