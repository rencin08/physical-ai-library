# Contributing

Small, focused improvements are welcome. Describe the behavior you are changing and how you checked it.

1. Install dependencies with `npm ci` and start the example library with `npm run dev`.
2. Keep the reading-room design usable on desktop and mobile, including keyboard navigation.
3. Run `npm run typecheck`, `npm test`, and `npm run build`. For changes to the reading flow, also run `npm run test:e2e` after installing Chromium with `npx playwright install chromium`.
4. Use your own database for discovery changes. Never commit credentials, database exports, or personal journals.

Paper guides should cite the original work and distinguish reported results from illustrative explanations. Add collection membership using paper slugs in `lib/data.ts`. Do not bundle third-party PDFs or assets without appropriate permission.

The first release stores personal records locally. Preserve the versioned backup format and add migration handling before changing it. A storage or import failure must not silently erase a reader’s notes.
