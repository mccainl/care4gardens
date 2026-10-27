# Care4Gardens | MCC

Premium Dutch reference concept, intended for GitHub Pages on the MCC `mccainl` account.

## Experience

The 21-second introduction combines three reviewed Kling 4.0 shots: veranda, screens and roller shutters, retaining the existing narration. The hero and product films use forward-and-return loops to avoid abrupt endpoint resets. A small transparent hero pause control and the full-film button keep the layout quiet. Reduced-motion, offscreen pause, page visibility and exclusive audio playback remain active. Film URLs retain their build content versions when opened in the dialog.

The lazy-loaded WebGL studio adds a full dimensional veranda with orbit controls, camera presets, keyboard rotation and zoom, animated sliding glass, two illustrative frame finishes, and continuously transitioning day/evening lighting. Glass remains in the model when opened, stacking along its real tracks. The studio choices flow into the garden brief. These are illustrative design preferences, not engineered dimensions or a claim that a specific finish is available for a given SKU. Source is in `src/studio.js`, bundled with Three.js and its MIT license notice.

Browsers without WebGL receive an interactive photographic studio with matched open/closed images and day/evening mood controls. The cloud QA browser has WebGL disabled, so its tests verify this fallback; the WebGL renderer still needs visual confirmation on a GPU-enabled device.

The 100-product catalogue retains the public Care4Gardens variant snapshot from 25 October 2026. Products lead to a browser-local demo basket and checkout. The selected variant in the original shop remains available as a secondary link. The local garden planner downloads a text brief or opens a draft in the visitor’s email app. Nothing is silently submitted. Product prices, availability and illustrative studio preferences need confirmation by the business.

## Development and publishing

Install FFmpeg and the Python dependencies in `requirements.txt`, then run `npm ci`, `npm run build`, and `npm test`.

Build restores integrity-checked media from `media/` to `site/assets/`, bundles the 3D studio, and copies the static site into `_site/`. GitHub Actions deploys only `_site/` to Pages. Source, tests, media archive parts and package files are not in the published artifact. In GitHub repository Settings, Pages, set the source to GitHub Actions.

The ten approved concept images, introduction film, real catalogue images and licensed fonts are packaged with the project. Generated lifestyle images are visibly described as concept images, not evidence of installed customer projects. The site is marked noindex for client review.

## Homepage films and image repair

The homepage uses the new veranda atmosphere loop, narrated introduction, screen film and roller-shutter film. The installation and older glass/transformation films remain withdrawn. Inline films play silently while visible and pause when collapsed or offscreen. Expanded introduction playback pauses inline players and resumes visible players on close. Data loads shortly before each player enters view.

The original screens WebP in the base media archive was empty. `motion-manifest.json` restores a valid replacement from the approved original, plus a separately named JPEG used by the page so browsers do not reuse the broken cached asset. Supplemental films and captions are stored in the same checked archive. Tests fully decode every raster image and every H.264 video, including media below the initial viewport, and reject empty or incomplete media files. Video URLs receive content hashes during the build so repaired files are not confused with cached versions.

Image creation uses OpenAI. Higgsfield is reserved for video and audio.

## Storefront and demo checkout

Photo category navigation and larger product images use each product's original Shopify CDN source at responsive resolutions, with the checked local files as fallbacks. Canopies have a second-angle hover preview. Every item has an image; the legacy handle listing without a photograph uses a clearly labelled reference from the same product family. Source imagery is not replaced by invented SKU photography.

`shop.js` stores only product IDs, variant IDs and quantities in the local demo basket. Prices and availability are resolved from the catalogue, not trusted from browser storage. `catalogue.js` connects variant selection to the basket. `checkout.html` uses fictional prefilled details, validates the demonstration flow and shows a local confirmation. It has no payment integration, order endpoint, email send or contact-data persistence. Completion clears the demo basket. The checkout remains visibly labelled as a demo throughout.

The test suite covers exact variant totals, quantities, removal, persistence, invalid baskets, form validation, input escaping, demo completion and the absence of order/payment transmission. Desktop and mobile live checks verify the published journey.

## Client-approved calculator and reviews (26 October 2026)

The homepage now includes the existing public DirectSamenstellen/Reuzenpanda configurator, ID `8a87f60b-3112-4e43-8906-a4fce59cdc14`, loaded only when the visitor chooses to start. It is a real quote form, labelled as such, separate from the local demo checkout and garden brief. The original Care4Gardens quote page remains a permanent fallback. No enquiries were submitted during development.

WebwinkelKeur shop `1210516` supplies a prominent live review widget and a direct all-reviews link. Scores and review counts are not hard-coded.

The production Reuzenpanda snippet is account `8033525a-bd3f-4519-a5fa-5c3f00dfbc14`; its host-specific response lists the configurator for care4gardens.nl but not mccainl.github.io. The preview uses the public embedded configurator route. Before a production Shopify theme change, retain the original account snippet on the actual domain and verify attribution, consent, mobile rendering and receipt of an agreed test lead in the client's CRM. Public inspection cannot identify or verify the private CRM destination. Do not deploy this concept over the client's live shop without its access and final review.

The screens and roller-shutter films are now included in the replacement production described below.

## Client feedback and replacement films (27 October 2026)

The before/after comparison now sits immediately after the hero benefit strip, before the introductory text. The faulty glass-motion hero, old transformation films and installation film are withdrawn from the public build. Original customer Instagram embeds, live reviews, WhatsApp and the existing CRM configurator remain.

New product films are illustrative footage, not documentation of actual installations or certified mechanism specifications. The film archive is restored through `media/film-manifest.json`. Rebuild it with `python3 scripts/package-films.py SOURCE_DIRECTORY --audio EXISTING_NARRATION.m4a` after reviewing all input footage. The package step fully decodes input and output, preserves aspect ratio, verifies durations and writes integrity-checked archive parts. Generation records live in `docs/video-production-2026-10-27.json`.
