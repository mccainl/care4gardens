# Care4Gardens | MCC

Premium Dutch reference concept, intended for GitHub Pages on the MCC `mccainl` account.

## Experience

The complete introduction film starts muted on entry, with an explicit sound control that restarts Arthur’s narration from the beginning. SVG controls replace text symbols and all calls to action, cards, fields and media panels use rounded surfaces. Both video presentations loop and have no visible pause button or native transport controls. Autoplay fallback, offscreen pause, page visibility, reduced motion and exclusive audio playback are handled explicitly.

The lazy-loaded WebGL studio adds a full dimensional veranda with orbit controls, camera presets, keyboard rotation and zoom, animated sliding glass, two illustrative frame finishes, and continuously transitioning day/evening lighting. Glass remains in the model when opened, stacking along its real tracks. The studio choices flow into the garden brief. These are illustrative design preferences, not engineered dimensions or a claim that a specific finish is available for a given SKU. Source is in `src/studio.js`, bundled with Three.js and its MIT license notice.

Browsers without WebGL receive an interactive photographic studio with matched open/closed images and day/evening mood controls. The cloud QA browser has WebGL disabled, so its tests verify this fallback; the WebGL renderer still needs visual confirmation on a GPU-enabled device.

The 100-product catalogue retains the public Care4Gardens variant snapshot from 25 October 2026. Purchases link to the selected variant in the original shop. The local garden planner downloads a text brief or opens a draft in the visitor’s email app. Nothing is silently submitted. Product prices, availability and illustrative studio preferences need confirmation by the business.

## Development and publishing

`npm ci`, `npm test`, `npm run build`.

Build restores integrity-checked media from `media/` to `site/assets/`, bundles the 3D studio, and copies the static site into `_site/`. GitHub Actions deploys only `_site/` to Pages. Source, tests, media archive parts and package files are not in the published artifact. In GitHub repository Settings, Pages, set the source to GitHub Actions.

The ten approved concept images, introduction film, real catalogue images and licensed fonts are packaged with the project. Generated lifestyle images are visibly described as concept images, not evidence of installed customer projects. The site is marked noindex for client review.
