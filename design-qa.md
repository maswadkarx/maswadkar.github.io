# Design QA — Living Dossier Portfolio (Design 1)

## Source of truth

- Selected direction: `docs/design/option-1-source.png`, the ivory-and-ultramarine “Living Dossier” concept.
- Exact reference: `/Users/admin/.codex/generated_images/019f5fb5-6880-7ac3-9330-ac264487c13e/exec-711101ff-ae88-4311-bac0-2ca5aec73955.png`
- Final implementation capture: `docs/design/qa/design-1-home-desktop.png`
- Full-view comparison: `docs/design/qa/comparison-design1-full.png`
- Focused hero comparison: `docs/design/qa/comparison-design1-hero.png`
- Mobile capture: `docs/design/qa/design-1-home-mobile.png`
- Mobile navigation capture: `docs/design/qa/design-1-mobile-menu.png`
- Desktop viewport/state: 1440 × 1000, homepage at rest, stitched from artifact-free browser captures at exact scroll positions.
- Mobile viewport/state: 390 × 844, homepage at rest and navigation open/closed.

## Comparison history

### Pass 1

- P1: The hero image initially respected its HTML height instead of the editorial slot, producing a page-height distortion.
- P1: The geometric hero was square while the reference used a portrait print.
- P1: The handwritten “Systems over spin” note sat between the columns instead of in the left margin.
- P1: Full-resolution editorial assets kept simulated mobile Lighthouse performance below the required threshold.
- P2: Forced desktop line breaks created awkward mobile wrapping.
- P2: Capturing a sticky page in one pass introduced false seams in the QA evidence.

### Pass 2 fixes

- Added proportional image sizing globally and matched the hero’s 4:5 portrait slot.
- Moved the left marginal note to the page edge and retained the lower-right handwritten counterpoint.
- Preserved the exact desktop title rhythm while giving the 390 px layout a clean five-line composition.
- Generated and delivered WebP variants sized for their actual slots; the three project covers are now roughly 32–36 KB each and the hero is roughly 132 KB.
- Preloaded the body font and inlined the small display face to eliminate layout shift and protect the typographic first paint.
- Recaptured the implementation in stable overlapping browser slices and rebuilt the comparisons without content seams.

## Final visual assessment

- Ivory paper, ultramarine blue, black ink, fine rules, high-contrast serif display type, compact sans-serif labels, and handwritten marginal notes closely track Design 1.
- The desktop hierarchy matches the reference: living-dossier hero, portrait geometric print, current focus, three project rows, writing rail, public profiles, working principle, and a personal closing chapter.
- Generated imagery is presented as abstract/editorial artwork; no portrait or generated event is represented as real.
- Tablet layouts simplify cleanly and the mobile experience becomes a single-column editorial story with a full-screen numbered menu.
- Longer verified project and essay names create a modest content-driven increase in page length without changing the reference’s visual grammar.
- No unresolved P0, P1, or P2 visual differences remain within the truthful-content scope.

## Functional and accessibility QA

| Check | Result |
| --- | --- |
| Astro type/content validation | Passed: 0 errors, 0 warnings, 0 hints |
| Static build | Passed: 20 generated HTML pages, RSS, and sitemap |
| Production route crawl | Passed: all 19 public HTML routes and RSS returned 200; the dedicated missing route returned 404 |
| Work journey | Passed: homepage → work archive → Krishi AI case study |
| Contact journey | Passed: mobile navigation → contact → verified public channels |
| Résumé | Passed: complete accessible HTML résumé; PDF action remains hidden until a verified PDF is supplied |
| Mobile menu | Passed: open/close labels, scroll lock, focus visibility, and Escape dismissal |
| Horizontal overflow | None at 1440, 1024, 768, or 390 px |
| Browser console | No errors |
| Keyboard focus | Visible ultramarine focus outline present |
| Reduced motion | Reveal transitions and smooth scrolling disabled through `prefers-reduced-motion` and runtime detection |
| Draft filtering | Draft/template content produced no public routes |
| Optional data | Email, booking link, résumé PDF, and unverified personal claims remain hidden |

## Lighthouse

| Profile | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 98 | 100 | 96 | 100 |
| Desktop | 100 | 100 | 96 | 100 |

Reports: `docs/design/qa/lighthouse-mobile.json` and `docs/design/qa/lighthouse-desktop.json`.

final result: passed
