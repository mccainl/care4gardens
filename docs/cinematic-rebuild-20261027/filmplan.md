# Care4Gardens — Meer tijd buiten

**A newly filmed 30-second introduction in the original visual style.**

Status: script, shot prompts and website integration prepared. No new video or narration has been generated. This is the production plan, not a finished film.

The viewer should understand what Care4Gardens offers: aluminium and Douglas overkappingen, glazen schuifwanden, and personal help from advice and measurement through installation. The film opens automatically in the first hero of the website.

## The film, shot by shot

| Time | What actually moves on screen | Exact Dutch narration |
|---|---|---|
| 00–06 | A smooth lateral camera move reveals the aluminium veranda. A person walks naturally along the patio into the open seating area. Garden plants move in the breeze. | Meer genieten van uw tuin. Met een overkapping in aluminium. |
| 06–12 | A person places a coffee cup on the table beneath the Douglas pavilion. A short forward dolly reveals the timber, roof and sheltered dining area. | Of de warme uitstraling van Douglas, passend bij uw tuin. |
| 12–18 | A locked view shows a person guiding **one** glass leaf along its guide. Its neighbours stay fixed and separate. The garden remains visible through the glass. | Glazen schuifwanden geven beschutting, terwijl uw uitzicht blijft. |
| 18–24 | An adviser measures beside the veranda while the homeowner watches. Small editable captions identify the service: **Persoonlijk advies · Inmeten · Montage**. | Van persoonlijk advies en inmeten tot vakkundige montage. |
| 24–30 | A couple enjoys coffee in the sheltered garden room. A slow backward move reveals the space. The scene continues moving while the brand line finishes, followed by approximately 2.5 seconds of breathing room. | Care4Gardens maakt buitenleven mooier. |

These are planning windows. The final cut follows the recorded voice and the complete actions. If a shot or phrase needs more time, the edit becomes slightly longer; the voice will not be rushed and the action will not be cut short.

## The visual direction

Warm Dutch gardens, natural late-afternoon light, anthracite aluminium, a red-brick house, Douglas timber and an inviting interior looking out over lawn and hydrangeas. These are the recognisable elements of the original film.

Every shot is continuous footage with a visible human or product action. A camera move must reveal real depth. All footage will be newly generated; none of the rejected near-static ranges will be repackaged. Straight cuts on natural breaths connect the scenes. No photo pans, artificial construction morphs, frozen closing frame or large green caption band in the video.

The existing reference images establish the intended architecture and styling. They are illustrative concept assets, not documentary evidence of an installation:

- [Aluminium veranda reference](https://mccainl.github.io/care4gardens/assets/01_aluminium_before.webp)
- [Douglas pavilion reference](https://mccainl.github.io/care4gardens/assets/02_douglas_before.webp)
- [Closed glass reference](https://mccainl.github.io/care4gardens/assets/03_glass_sliding_wall_after.webp)
- [Open interior and closing reference](https://mccainl.github.io/care4gardens/assets/03_glass_sliding_wall_before.webp)

## Narration and sound

> Meer genieten van uw tuin. Met een overkapping in aluminium.
>
> Of de warme uitstraling van Douglas, passend bij uw tuin.
>
> Glazen schuifwanden geven beschutting, terwijl uw uitzicht blijft.
>
> Van persoonlijk advies en inmeten tot vakkundige montage.
>
> Care4Gardens maakt buitenleven mooier.

Warm, clear Dutch delivery, with a relaxed pace and a small pause between thoughts. The voice must pronounce the products and brand naturally. Select an actual supported voice before quoting or generating the narration. Align cuts and fresh captions to its real waveform. Keep the final brand line intact; leave room for the closing image to breathe. No paid music job or unlicensed commercial music is included in this plan.

## The opening website experience

- The **complete introduction** occupies the original opening hero and starts at **00:00 on entry**. There is no second introductory player farther down the page.
- The picture starts immediately when loading and browser policy permit. Audible autoplay is attempted. If blocked, the film continues muted with captions and a direct **Geluid aan** control. Its first activation starts the full explanation from the beginning.
- Play/pause, sound, captions and optional expansion stay in the hero. The heading recedes on desktop after the opening moment so the action is visible; the enquiry link remains available.
- On mobile, the complete landscape film sits above the hero text so glass, people and important action are not cropped out.
- Scrolling away pauses the film; returning resumes it. Deliberate pauses remain paused. The narration does not loop. The final garden frame remains until the visitor chooses replay. Reduced-motion visitors choose when to play.

The hero controller is implemented on the `cinematic-rebuild-20261027` branch. The existing rejected film is only a development fixture. New footage, final browser review and deployment are still pending.

## Production order and acceptance

1. Confirm the new credit ceiling and select the narration voice; obtain its exact quote before spending.
2. Render the glass shot first in **Kling 4.0 at 720p**. Inspect the entire movement: rigid leaves, separate paths, fixed structure, credible hands, and a complete start and stop. Matching start/end images alone cannot pass this check.
3. Only after that passes, render the remaining four shots. Each is an eight-second candidate with room for natural edit handles.
4. Record the narration and assemble the film around actual speech and action. Add editable captions and exact brand graphics in editing, not in generated pixels.
5. Review the full film with audio at normal speed, check every join and the complete ending, then verify the desktop and mobile hero. Verify source bytes, a strict full-file decode and the deployed media version separately from creative review.

Reject sliding panes that merge or disappear, bending posts, extra fingers, changing people, static-photo results, crops that hide the action, narration that refers to another scene, and an ending that rushes or cuts off speech. At most one additional video attempt is reserved. If the mechanism fails again, change the production technique instead of repeatedly buying the same failed shot.

## Cost and current readiness

| Item | Credits | Status |
|---|---:|---|
| Five new eight-second Kling 4.0 clips, 720p, 16:9 | 20 | Exact quotes obtained: 4 per shot |
| One replacement clip, only if needed | 4 | Proposed reserve; re-quote the exact replacement before submission |
| Dutch narration | Up to 5 | Reserve only; voice and exact quote pending |
| **Proposed maximum new spend** | **29** | **Awaiting a new authorised ceiling** |

No credits have been spent on this rebuild. The previous 21-credit allowance was used by the earlier production. There is no new generation job, final film, continuous-playback approval or deployment for this revision yet.

Technical preparation: the site build, existing media checks, experience/configurator tests and the new hero playback state tests pass. These tests do not establish the quality of a video that has not yet been generated. Real browser and physical-device review remain part of the final release work.

The detailed prompts, frame plan, budget state and release gates are in [production.json](production.json). Exact provider requests and returned prices are in [quotes.json](quotes.json).

Business statements are grounded in Care4Gardens' [overkappingen overview](https://care4gardens.nl/collections/terrasoverkapping) and [montage information](https://care4gardens.nl/pages/montage-van-een-terrasoverkapping). Browser sound behaviour follows the [MDN autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
