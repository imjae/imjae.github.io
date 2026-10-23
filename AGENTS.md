# Blog authoring and maintenance

This repository is imjae's public game development notebook at https://imjae.github.io.

- When continuing in a new chat, read [docs/HANDOFF.md](docs/HANDOFF.md) for the current structure, completed work and verification limits. Follow the dedicated editorial and writing documents it links to.
- Use Korean for prose and completion reports. Keep established code identifiers in English.
- Before writing or editing any reader-facing copy, read and follow [docs/EDITORIAL.md](docs/EDITORIAL.md). Keep the user's wording preferences in that single source when they ask to add or revise them.
- Author Markdown under `content/articles/<topic>/`. Metadata is validated by `src/content.config.ts`.
- New posts start with `draft: true`. Publish only content the user authorized. Production routes, search, RSS and sitemap must exclude drafts.
- Keep explicit slugs stable. Before changing an existing address, add a static redirect and verify its exact path.
- Preserve the original files and complete bodies of both 2024 posts in `legacy/jekyll/`. Published copies may be edited at the user's request, but keep their original dates and slugs. Their old public URLs must continue to resolve.
- `/editor/` on GitHub Pages is a login entry. Management pages and inline Edit are built separately and served only behind the Cloudflare Worker's GitHub identity check. Never publish `.authoring-dist/` to GitHub Pages or add a client-side authentication bypass. GitHub access tokens stay transiently on the Worker for `/user` identity checks; never send them to the browser or store them. Include only published posts; link to GitHub for drafts. Keep deletion safe for portfolio, series and old-URL links.
- Distinguish original assets, reused assets and AI assistance. Do not invent screenshots, results, benchmarks or completed gameplay verification.
- DCB source is private. Publish only the requested explanations and approved media; do not copy whole source files, private logs, local paths or personal save data.
- Use existing categories: `gameplay`, `graphics`, `tools`, `ai`, `notes`, `math`, `reading`. Use `series` to connect posts instead of duplicating them.
- Validate with `npm run verify`, then inspect home, a long article and mobile search in the browser for site changes.
- Only `main` deploys. GitHub Pages uses Actions. No API tokens or credentials belong in files, command arguments or output.
- Do not change DCB, Deluge or another repository as part of blog maintenance unless the user asks.
