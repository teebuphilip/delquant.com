# DelQuant homepage redesign concept

This folder contains a standalone React/Vite version of the proposed DelQuant homepage. [View the live concept](https://delquant-intelligence.oopsyang.chatgpt.site/).

## Run locally

From this folder:

```sh
npm ci
npm run dev
```

To create and preview a production build:

```sh
npm run build
npm run preview
```

The production output is `dist/`.

## Review and adoption

- `src/` contains the page and styles; `public/assets/` contains the generated imagery.
- `design/` contains the visual direction used for the implementation.
- This concept uses illustrative copy, metrics, and imagery. Verify or replace these with approved DelQuant content before publication.
- The existing site is served from the repository root. This folder does not replace the current `index.html`, other pages, or `CNAME`. Publishing it at `delquant.com` requires a separate integration and deployment decision by the site owner.

The concept is intended as a design and source-code handoff for review.
