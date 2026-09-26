import type { Enrichment } from "../types";

export async function findGithubRepository(title: string): Promise<Enrichment> {
  if (!process.env.GITHUB_TOKEN) return {};
  const query = encodeURIComponent(`\"${title.slice(0, 100)}\" in:name,description,readme`);
  const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=3`, {
    signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const data = await response.json();
  const repository = data.items?.[0];
  if (!repository) return {};
  return { githubUrl: repository.html_url, githubStars: repository.stargazers_count, githubLicense: repository.license?.spdx_id, githubUpdatedAt: repository.updated_at };
}
