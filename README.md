# Physical AI Library

A personal reading room for physical AI research. Import arXiv papers, explore source-linked learning guides, save highlights and notes, and discover papers based on your interests.

![Physical AI Library reading room](docs/reading-room.png)

## Run locally

Requires **Node.js 22.18 or newer** and npm.

```sh
git clone https://github.com/rencin08/physical-ai-library.git
cd physical-ai-library
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000 (or the port printed by Next.js). The example library works without accounts, API keys, or a database. Keep the server bound to localhost for personal use.

## What you can do

- Browse 41 example papers with five-chapter reading guides.
- Add a paper by pasting an arXiv link or identifier into **Add paper**.
- Save papers, highlights, notes, and your reading position.
- Choose interests and request fresh arXiv recommendations. Ranking uses topics from your interests and library activity; it does not observe your browsing on arXiv.
- Optionally prepare an AI-assisted illustrated guide, inspect the draft, and accept it after review.

DROID and FAST include attributed original figures. Other example guides provide source PDF links and supporting teaching diagrams. Their original figures are not bundled because redistribution terms have not been verified. To extract a particular example paper's figures locally, install the Python dependencies below and run:

```sh
python3 scripts/import-example-figures.py --slug pi-07-steerable-generalist
```

This downloads the exact linked source and verifies its SHA-256 before extracting images. It makes no paid AI request. Extraction can require manual review; source changes are rejected. Extracted images retain the original authors' rights and are ignored by Git. See [figure attribution](public/paper-figures/ATTRIBUTION.md).

## Optional guide generation

Requires Python 3.10+ and PyMuPDF:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
```

Set your own `OPENAI_API_KEY` and `OPENAI_GUIDE_MODEL` in `.env.local`, and launch the app from the activated environment. Choose a model available to your account that supports image inputs, structured output, and medium reasoning through the [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create). The existing guides were prepared with `gpt-6-sol`; no model is selected automatically for new installations. Generation is optional and is not exercised by automated tests. Adding a paper itself does not trigger a paid request. **Prepare illustrated guide** sends paper text and extracted figures to the configured API and can incur charges. Inspect the figures and explanations before choosing **Use reviewed guide**. Complex PDFs may require manual preparation.

## Storage and privacy

- Bookmarks, highlights, notes, and progress live in browser local storage. Changing the host, port, or browser changes that storage context. Use the journal export/backup controls before clearing browser data.
- Imported papers and discovery preferences live in `.library/` on the server's disk.
- Source PDFs, generated drafts, and worker logs live in `.guide-drafts/`.
- These folders, `.env.local`, and local backups are excluded from Git.
- arXiv search and discovery require internet access. API credentials belong to each installation.

This release is a **local, single-user application**. It has no account system or cross-device synchronization. Its guide worker writes files and spawns processes; shared hosting requires authentication, isolated storage, and a job worker. GitHub Pages cannot run this backend. Restart/rebuild a production server after integrating new static guides.

## Optional database and scheduling

Supabase is optional for the ingestion/review queue. Configure your own project using `supabase/migrations/` and the Supabase fields in `.env.example`. The service-role key stays server-side. Do not connect a public deployment to a personal database without reviewing access controls.

`npm run discovery:run` runs discovery against a running local server. On macOS, `npm run discovery:schedule` installs a user LaunchAgent; inspect `scripts/install-discovery-agent.mjs` before enabling it. Scheduling requires the computer and local server to be running.

Edit `library.config.json` to customize the library's name, topics, and example-paper visibility.

## Development

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests use synthetic fixtures and isolated personal storage; they do not require your credentials or paid generation. See [CONTRIBUTING.md](CONTRIBUTING.md) and [READING_GUIDE_STANDARD.md](READING_GUIDE_STANDARD.md).

Built with Next.js, React, TypeScript, and optional Supabase. Software is [MIT licensed](LICENSE). Research papers and third-party figures retain their own licenses. Guides are editorial learning aids; consult the original papers for evidence and limitations.
