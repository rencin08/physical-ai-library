import type { Paper } from "./data";

export const structureSource = "https://github.com/keon/awesome-physical-ai";
export type LearningPath = { id: string; title: string; question: string; before: string; ids: string[]; sourceAnchor: string };
export const learningPaths: LearningPath[] = [
  { id: "start", title: "Start here", question: "How do perception, data, and actions fit together?", before: "New to the field? Read the introductions and figures first, then follow this order.", ids: ["2312.08782", "2103.00020", "2212.06817", "2303.04137", "2310.08864", "2406.09246"], sourceAnchor: "surveys" },
  { id: "foundations", title: "Foundations", question: "How does a robot turn images and language into useful representations?", before: "Helpful background: neural networks and pretraining.", ids: ["2103.00020", "2304.07193"], sourceAnchor: "foundations" },
  { id: "vla", title: "VLA Architectures", question: "How do vision and language become robot actions?", before: "Start with Foundations, then compare robot-only training with vision-language transfer.", ids: ["2212.06817", "2307.15818", "2406.09246", "2410.24164"], sourceAnchor: "vla-architectures" },
  { id: "actions", title: "Action Representation", question: "Should a robot predict tokens, chunks, or continuous trajectories?", before: "Helpful background: imitation learning and probability distributions.", ids: ["2304.13705", "2303.04137", "2501.09747", "2410.24164"], sourceAnchor: "action-representation" },
  { id: "world-models", title: "World Models", question: "Can an agent learn by predicting what happens next?", before: "Helpful background: reinforcement learning and latent representations.", ids: ["2301.04104", "2402.15391"], sourceAnchor: "world-models" },
  { id: "planning", title: "Reasoning & Planning", question: "How do high-level instructions become feasible steps?", before: "Read the VLA path to compare integrated policies with separate planners.", ids: ["2204.01691", "2307.15818"], sourceAnchor: "reasoning--planning" },
  { id: "learning", title: "Learning Paradigms", question: "What changes when robots learn from demonstrations versus rewards?", before: "Compare imitation learning in ACT and Diffusion Policy with model-based RL in DreamerV3.", ids: ["2304.13705", "2303.04137", "2301.04104"], sourceAnchor: "learning-paradigms" },
  { id: "scaling", title: "Scaling & Generalization", question: "What transfers across tasks, scenes, and robot bodies?", before: "Read one policy paper first, then examine its data assumptions.", ids: ["2310.08864", "2403.12945", "2405.12213"], sourceAnchor: "scaling--generalization" },
  { id: "deployment", title: "Deployment", question: "What makes a policy practical to run on a robot?", before: "Begin with Action Representation; FAST is an entry point, not a complete deployment guide.", ids: ["2501.09747"], sourceAnchor: "deployment" },
  { id: "safety", title: "Safety & Alignment", question: "How do we evaluate and constrain physical-world failures?", before: "This category is available in the source reading list; local selections are still being curated.", ids: [], sourceAnchor: "safety--alignment" },
  { id: "lifelong", title: "Lifelong Learning", question: "How can a robot keep learning after deployment?", before: "This category is available in the source reading list; local selections are still being curated.", ids: [], sourceAnchor: "lifelong-learning" },
  { id: "applications", title: "Applications", question: "What does learned manipulation look like on real hardware?", before: "Begin with ACT, then see how Mobile ALOHA adds mobility to two-arm manipulation.", ids: ["2304.13705", "2401.02117"], sourceAnchor: "applications" },
  { id: "sim-to-real", title: "Sim-to-Real Transfer", question: "Why do policies trained in simulation fail in the real world?", before: "Start with visual domain randomization as one approach to the reality gap.", ids: ["1703.06907"], sourceAnchor: "sim-to-real-transfer" },
  { id: "surveys", title: "Surveys", question: "Where can I get the big picture before choosing a specialty?", before: "Use the taxonomy as a map; you do not need to read every technical section at once.", ids: ["2312.08782"], sourceAnchor: "surveys" },
  { id: "resources", title: "Datasets & Benchmarks", question: "What experience trains these models, and how diverse is it?", before: "Start with cross-embodiment data, then look at scene diversity in DROID.", ids: ["2310.08864", "2403.12945"], sourceAnchor: "resources" },
];
const starterIds = learningPaths[0].ids;
export function learningPriority(paper: Paper) {
  const index = starterIds.indexOf(paper.arxivId);
  return index < 0 ? 0 : (starterIds.length - index) * 0.5 + 1;
}
export function learningReason(paper: Paper) {
  const index = starterIds.indexOf(paper.arxivId);
  return index < 0 ? "Explore a different part of the field" : `Suggested first reads · Step ${index + 1} of ${starterIds.length}`;
}
export function selectForYou<T extends { paper: Paper; completed: boolean }>(ranked: T[], limit = 6): T[] {
  const unread = ranked.filter(item => !item.completed);
  // A short list, with at most two papers sharing the same primary topic.
  const selected: T[] = [];
  const counts = new Map<string, number>();
  // Keep the strongest starting recommendation and make room for current work.
  const current = unread.filter(item => item.paper.year >= new Date().getFullYear()).slice(0, 2);
  const candidates = [...unread.slice(0, 1), ...current, ...unread];
  for (const item of candidates) {
    if (selected.some(previous => previous.paper.slug === item.paper.slug)) continue;
    const topic = item.paper.topics[0] ?? item.paper.slug;
    if ((counts.get(topic) ?? 0) >= 2) continue;
    selected.push(item); counts.set(topic, (counts.get(topic) ?? 0) + 1);
    if (selected.length === limit) break;
  }
  return selected;
}
export function sortByCitations(papers: Paper[]) {
  return [...papers].sort((a, b) => (b.citationCount ?? -1) - (a.citationCount ?? -1));
}

export type RoadmapOrder = "chronological" | "newest" | "suggested";
const pathTopics: Record<string, string[]> = {
  foundations: ["Foundations"], vla: ["VLA"], "world-models": ["World Models"],
  planning: ["Planning"], learning: ["Reinforcement Learning", "Imitation Learning"],
  scaling: ["Cross-Embodiment"], safety: ["Safety"], lifelong: ["Lifelong Learning"],
  applications: ["Manipulation"], "sim-to-real": ["Simulation"], surveys: ["Surveys"], resources: ["Robot Data"],
};
export function roadmapPapers(catalog: Paper[], path: LearningPath, order: RoadmapOrder = "chronological"): Paper[] {
  const matches = catalog.filter(paper => path.ids.includes(paper.arxivId) || paper.roadmapPaths?.includes(path.id) || paper.topics.some(topic => pathTopics[path.id]?.includes(topic)));
  const date = (paper: Paper) => paper.publishedAt ?? `${paper.year}-01-01`;
  return [...matches].sort((a,b) => {
    if (order === "suggested") {
      const aIndex=path.ids.indexOf(a.arxivId), bIndex=path.ids.indexOf(b.arxivId);
      const rank=(aIndex < 0 ? path.ids.length : aIndex)-(bIndex < 0 ? path.ids.length : bIndex);
      if(rank) return rank;
    }
    const chronological=date(a).localeCompare(date(b)) || a.title.localeCompare(b.title);
    return order === "newest" ? -chronological : chronological;
  });
}
