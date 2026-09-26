export function canonicalArxivId(value: string) {
  const id = value.replace(/^https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf)\//, '').replace(/\.pdf$/, '').replace(/v\d+$/, '');
  if (!/^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})$/.test(id)) throw new Error('Invalid arXiv identifier');
  return id;
}

export function mergeEnrichmentResults(results: PromiseSettledResult<Record<string, unknown>>[]) {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') Object.assign(values, result.value);
    else errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  }
  return { values, errors };
}

export function ingestionOptions(body: unknown) {
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const bounded = (value: unknown, fallback: number, max: number, min = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
  return { maxResults: bounded(input.maxResults, 50, 100, 1), enrichLimit: bounded(input.enrichLimit, 12, 25), includeFeeds: input.includeFeeds !== false };
}
