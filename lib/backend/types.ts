export type SourceKind = "arxiv" | "github" | "semantic_scholar" | "rss" | "x" | "manual";
export type ContentKind = "paper" | "news" | "insight" | "social";

export type DiscoveredPaper = {
  externalId: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  updatedAt?: string;
  url: string;
  pdfUrl?: string;
  categories: string[];
  source: SourceKind;
  raw: unknown;
};

export type FeedItem = {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt?: string;
  sourceName: string;
  contentKind: Exclude<ContentKind, "paper" | "social">;
  raw: unknown;
};

export type Enrichment = {
  citationCount?: number;
  influentialCitationCount?: number;
  referenceCount?: number;
  semanticScholarId?: string;
  githubUrl?: string;
  githubStars?: number;
  githubLicense?: string;
  githubUpdatedAt?: string;
  openAccessPdf?: string;
};
