import preparedGuides from "./learning/reviewed/library-guides.json";
import milestonePapers from "./curation/milestone-papers.json";
import publicationDates from "./curation/publication-dates.json";
import recentPapers from "./curation/recent-papers.json";
import readingPapers from "./curation/reading-papers.json";
import citationSnapshot from "./curation/citations.json";
import { libraryConfig } from "./library-config";

export type Paper = {
  roadmapPaths?: string[];
  sourceUrl?: string;
  pdfUrl?: string;
  publishedAt?: string;
  metadataVerifiedAt?: string;
  citationCount?: number;
  citationUrl?: string;
  citationRetrievedAt?: string;
  slug: string;
  arxivId: string;
  title: string;
  shortTitle: string;
  authors: string;
  institution: string;
  year: number;
  summary: string;
  why: string;
  topics: string[];
  accent: string;
  architecture: string;
  task: string;
  embodiments: string;
  modalities: string;
  dataset: string;
  openSource: boolean;
  contributions: string[];
  limitations: string[];
  lineage: string[];
};

const examplePapers: Paper[] = [
  {
    slug: "pi-zero-vision-language-action-flow-model",
    arxivId: "2410.24164",
    title: "π₀: A Vision-Language-Action Flow Model for General Robot Control",
    shortTitle: "π₀",
    authors: "Kevin Black et al.", institution: "Physical Intelligence", year: 2024,
    summary: "A generalist robot policy that turns images and language into continuous actions across several robot types.",
    why: "It offers a practical recipe for transferring internet-scale vision-language knowledge into dexterous physical behavior.",
    topics: ["VLA", "Foundation Models", "Cross-Embodiment"], accent: "rust",
    architecture: "Flow matching transformer", task: "General manipulation", embodiments: "Single-arm, dual-arm, mobile", modalities: "RGB, language, proprioception", dataset: "Open X-Embodiment + proprietary", openSource: false,
    contributions: ["Introduces flow matching for high-frequency robot action generation.", "Trains one policy across diverse embodiments and tasks.", "Demonstrates dexterous, language-conditioned manipulation."],
    limitations: ["Training data and compute are not fully public.", "Long-horizon reliability remains below human performance.", "Evaluation is concentrated in controlled environments."],
    lineage: ["RT-1", "RT-2", "OpenVLA", "π₀"]
  },
  {
    slug: "openvla-open-source-vision-language-action-model",
    arxivId: "2406.09246",
    title: "OpenVLA: An Open-Source Vision-Language-Action Model",
    shortTitle: "OpenVLA",
    authors: "Moo Jin Kim et al.", institution: "Stanford · UC Berkeley", year: 2024,
    summary: "An open seven-billion-parameter model that predicts robot actions from camera observations and natural-language instructions.",
    why: "OpenVLA gives researchers a strong, inspectable base model instead of requiring a closed robotics stack.",
    topics: ["VLA", "Open Source", "Robot Data"], accent: "olive",
    architecture: "Prismatic VLM", task: "Language-conditioned manipulation", embodiments: "Multiple robot arms", modalities: "RGB, language, action tokens", dataset: "Open X-Embodiment", openSource: true,
    contributions: ["Releases model weights and training code.", "Adapts a pretrained vision-language backbone to robot actions.", "Outperforms larger closed baselines on several tasks."],
    limitations: ["Discrete action tokenization can lose precision.", "Inference is demanding on edge hardware.", "Performance varies across unseen embodiments."],
    lineage: ["RT-1", "RT-2", "Octo", "OpenVLA"]
  },
  {
    slug: "rt-2-vision-language-action-models",
    arxivId: "2307.15818",
    title: "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
    shortTitle: "RT-2",
    authors: "Anthony Brohan et al.", institution: "Google DeepMind", year: 2023,
    summary: "Treats robot actions as another language, allowing a vision-language model to reason about and execute robot tasks.",
    why: "It established the VLA paradigm and showed that web knowledge can improve robotic generalization.",
    topics: ["VLA", "Foundation Models"], accent: "burgundy",
    architecture: "Transformer VLM", task: "Tabletop manipulation", embodiments: "Everyday Robots arm", modalities: "RGB, language, action tokens", dataset: "RT-1 robot data + web data", openSource: false,
    contributions: ["Co-fine-tunes web and robotics data.", "Represents actions as text tokens.", "Shows emergent semantic reasoning in robot control."],
    limitations: ["Model and training data are closed.", "Action frequency is relatively low.", "Physical evaluation uses a narrow hardware setup."],
    lineage: ["PaLM-E", "RT-1", "RT-2"]
  },
  {
    slug: "diffusion-policy-visuomotor-policy-learning",
    arxivId: "2303.04137",
    title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion",
    shortTitle: "Diffusion Policy",
    authors: "Cheng Chi et al.", institution: "Columbia University", year: 2023,
    summary: "Uses denoising diffusion to generate smooth chunks of robot actions for precise manipulation.",
    why: "It became a remarkably strong and reusable baseline for imitation learning and contact-rich control.",
    topics: ["Diffusion Policies", "Manipulation"], accent: "blue",
    architecture: "Conditional diffusion", task: "Visuomotor manipulation", embodiments: "Robot arms", modalities: "RGB, proprioception, actions", dataset: "Robomimic + real demonstrations", openSource: true,
    contributions: ["Models multimodal action distributions.", "Uses receding-horizon action prediction.", "Achieves strong results on benchmark and real tasks."],
    limitations: ["Iterative inference adds latency.", "Requires quality demonstrations.", "Long-horizon planning is implicit rather than explicit."],
    lineage: ["Behavior Cloning", "DDPM", "Diffusion Policy"]
  },
  {
    slug: "open-x-embodiment-robotic-learning-datasets",
    arxivId: "2310.08864",
    title: "Open X-Embodiment: Robotic Learning Datasets and RT-X Models",
    shortTitle: "Open X-Embodiment",
    authors: "Open X-Embodiment Collaboration", institution: "34 research labs", year: 2023,
    summary: "Combines data from many institutions and robot types into the largest open cross-embodiment robotics dataset of its time.",
    why: "It made data sharing across incompatible robots concrete and unlocked a generation of generalist policies.",
    topics: ["Robot Data", "Cross-Embodiment", "Datasets"], accent: "gold",
    architecture: "RT-X transformer", task: "General manipulation", embodiments: "22 robot embodiments", modalities: "RGB, language, proprioception, actions", dataset: "Open X-Embodiment", openSource: true,
    contributions: ["Standardizes data from dozens of robot platforms.", "Demonstrates positive transfer across embodiments.", "Releases data and supporting tools."],
    limitations: ["Dataset quality and labels vary by source.", "Action spaces require lossy normalization.", "Long-tail tasks remain unevenly represented."],
    lineage: ["BridgeData", "RT-1", "Open X-Embodiment"]
  },
  {
    slug: "octo-generalist-robot-policy",
    arxivId: "2405.12213",
    title: "Octo: An Open-Source Generalist Robot Policy",
    shortTitle: "Octo",
    authors: "Octo Model Team", institution: "UC Berkeley · Stanford", year: 2024,
    summary: "A transformer policy designed to be fine-tuned efficiently for new observations, actions, robots, and tasks.",
    why: "Octo makes generalist robot policy research accessible and emphasizes adaptation rather than one fixed deployment.",
    topics: ["Foundation Models", "Open Source", "Cross-Embodiment"], accent: "violet",
    architecture: "Transformer", task: "General manipulation", embodiments: "Multiple robot arms", modalities: "RGB, language, proprioception", dataset: "Open X-Embodiment", openSource: true,
    contributions: ["Provides a flexible pretrained policy.", "Supports varied observation and action spaces.", "Fine-tunes efficiently on small target datasets."],
    limitations: ["Broad pretraining does not guarantee task mastery.", "Still depends on embodiment-specific fine-tuning.", "Complex scenes expose generalization gaps."],
    lineage: ["Gato", "RT-1", "Open X-Embodiment", "Octo"]
  },
  {
    slug: "mobile-aloha-bimanual-mobile-manipulation",
    arxivId: "2401.02117",
    title: "Mobile ALOHA: Learning Bimanual Mobile Manipulation with Low-Cost Whole-Body Teleoperation",
    shortTitle: "Mobile ALOHA",
    authors: "Zipeng Fu et al.", institution: "Stanford University", year: 2024,
    summary: "A low-cost whole-body teleoperation system for collecting bimanual mobile manipulation demonstrations.",
    why: "It shows that capable household robotics can emerge from clever hardware, data collection, and imitation learning.",
    topics: ["Teleoperation", "Humanoids", "Robot Data"], accent: "teal",
    architecture: "ACT transformer", task: "Bimanual mobile manipulation", embodiments: "Mobile dual-arm robot", modalities: "Multi-view RGB, joints, actions", dataset: "50 demonstrations per task", openSource: true,
    contributions: ["Introduces affordable whole-body teleoperation.", "Uses co-training with static ALOHA data.", "Demonstrates long-horizon household tasks."],
    limitations: ["Requires carefully collected demonstrations.", "Hardware has limited payload and reach.", "Recovery from major errors is limited."],
    lineage: ["ALOHA", "ACT", "Mobile ALOHA"]
  },
  {
    slug: "genie-generative-interactive-environments",
    arxivId: "2402.15391",
    title: "Genie: Generative Interactive Environments",
    shortTitle: "Genie",
    authors: "Jake Bruce et al.", institution: "Google DeepMind", year: 2024,
    summary: "Learns playable, action-controllable worlds from unlabeled internet videos.",
    why: "It points toward world models that can turn abundant passive video into interactive training environments.",
    topics: ["World Models", "Simulation"], accent: "coral",
    architecture: "Latent action video model", task: "Interactive environment generation", embodiments: "Virtual agents", modalities: "Video, latent actions", dataset: "Internet platformer videos", openSource: false,
    contributions: ["Infers latent actions without labels.", "Generates controllable video environments.", "Scales world modeling to diverse internet data."],
    limitations: ["Generated environments are low resolution.", "Learned controls can be inconsistent.", "Direct robotics transfer is not demonstrated."],
    lineage: ["VideoGPT", "Phenaki", "Genie"]
  }
];

export const guidedPaperSlugs = [...new Set([...examplePapers, ...readingPapers].map(paper => paper.slug).concat(Object.keys(preparedGuides)))];
const citations: Record<string, { count: number; url: string; retrievedAt: string }> = citationSnapshot;
export const papers: Paper[] = libraryConfig.includeExamplePapers ? [...examplePapers, ...readingPapers, ...recentPapers, ...milestonePapers].map(paper => {
  const citation = citations[paper.arxivId];
  return { ...paper, publishedAt: (publicationDates as Record<string, string>)[paper.arxivId] ?? ("publishedAt" in paper ? paper.publishedAt : undefined), ...(citation ? { citationCount: citation.count, citationUrl: citation.url, citationRetrievedAt: citation.retrievedAt } : {}) };
}) : [];

const exampleTopicNames = ["Vision-Language-Action Models", "Robot Foundation Models", "Robot Data", "World Models", "Diffusion Policies", "Cross-Embodiment Learning", "Dexterous Manipulation", "Humanoids", "Simulation", "Evaluation", "Teleoperation", "Autonomous Systems"];

export const topicNames = libraryConfig.topics.length ? libraryConfig.topics : exampleTopicNames;

const collectionDefinitions = [
  { slug: "modern-physical-ai", title: "A path into modern Physical AI", curator: "Library editors", description: "From robot-learning fundamentals to VLAs, world models, and generalist policies.", paperSlugs: papers.map(paper => paper.slug) },
  { slug: "robot-data-infrastructure", title: "Robot Data Infrastructure", curator: "Library editors", description: "How researchers collect, align, and share experience across machines.", paperSlugs: papers.filter(paper => paper.topics.some(topic => ["Robot Data", "Cross-Embodiment"].includes(topic))).map(paper => paper.slug) },
  { slug: "world-models", title: "Learning to Imagine", curator: "Library editors", description: "World models and simulated environments as a foundation for acting.", paperSlugs: papers.filter(paper => paper.topics.includes("World Models")).map(paper => paper.slug) },
  { slug: "open-robot-learning", title: "Open Robot Learning", curator: "Library editors", description: "A starting shelf of papers with public implementations.", paperSlugs: papers.filter(paper => paper.openSource).map(paper => paper.slug) }
];
export const collections = libraryConfig.includeExamplePapers ? collectionDefinitions.map(collection => ({ ...collection, count: collection.paperSlugs.length })) : [];

export function findPaper(slug: string) { return papers.find((paper) => paper.slug === slug); }
