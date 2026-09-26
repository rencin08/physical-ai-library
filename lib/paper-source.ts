import type { Paper } from "./data";

function webUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return undefined;
    return url.href;
  } catch { return undefined; }
}

export function paperSource(paper: Pick<Paper, "arxivId" | "pdfUrl" | "sourceUrl">, guideSource?: string) {
  const id = paper.arxivId.trim();
  const validId = /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/.test(id);
  const guide = webUrl(guideSource);
  const guidePdf = guide && /^https:\/\/arxiv\.org\/(?:abs|html|pdf)\/.+/.test(guide)
    ? guide.replace(/\/(?:html|abs)\//, "/pdf/") : undefined;
  const pdfUrl = webUrl(paper.pdfUrl) || guidePdf || (validId ? `https://arxiv.org/pdf/${id}` : undefined);
  const sourceUrl = webUrl(paper.sourceUrl) || (validId ? `https://arxiv.org/abs/${id}` : undefined) || guide || pdfUrl;
  return { pdfUrl, sourceUrl, arxivId: validId ? id : undefined };
}
