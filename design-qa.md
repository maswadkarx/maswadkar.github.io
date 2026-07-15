# Design QA — Living Dossier Portfolio (Design 1) + Evidence-First Media

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

## Evidence-first media refresh

- Implementation date: 15 July 2026.
- Desktop implementation capture: `docs/design/qa/media-refresh-home-desktop.png`.
- Reference/implementation comparison: `docs/design/qa/media-refresh-home-comparison.webp`.
- Representative route contact sheet: `docs/design/qa/media-refresh-contact-sheet.webp`.
- Documentary project evidence: `docs/design/qa/media-refresh-krishi.png`.
- Approved portrait treatment: `docs/design/qa/media-refresh-about.png`.
- The refresh preserves the selected Design 1 typography, spacing, palette, navigation, and geometric homepage hero.
- Projects now lead with product evidence, source-grounded diagrams, or disclosed synthetic demonstrations. DigitalMandi uses a disclosed editorial archival cover.
- Every published project and essay has a unique cover and a unique 1200 × 630 social image. Generated and synthetic work is disclosed in the visible caption and typed provenance.
- The Android Studio QA folder remains unpublished. No annotated captures, failed-ad states, placeholder location data, or unverified product photographs were copied into the site.

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
- Detail-page covers are contained 16:9 figures rather than full-viewport backdrops, with descriptive alt text, captions, credits, and links to their source or full-resolution asset.
- Work, writing, About, Now, and media pages now have distinct, content-specific imagery without turning the archives into a generic card grid.
- Real Chrome visual QA covered the homepage plus Work, Krishi AI, DigitalMandi, Agentic Test Case Generator, Snowflake Cost Dashboard, representative writing, About, Now, Media, and talk-detail routes. No failed images, horizontal overflow, console errors, or pre-play video iframes were found.
- The unchanged responsive navigation retains the previously recorded 390 px mobile evidence. Responsive image candidates and layout rules were revalidated at the 1024, 768, and 390 px breakpoints; Lighthouse additionally exercised the worst image at 390 px with DPR 3.

## Functional and accessibility QA

| Check | Result |
| --- | --- |
| Astro type/content validation | Passed: 0 errors, 0 warnings, 0 hints |
| Static build | Passed: 23 generated HTML pages, RSS, sitemap index, page sitemap, and `llms.txt` |
| Production route crawl | Passed: all 22 indexable HTML routes and discovery files returned 200; unknown routes returned 404 |
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
| Media contracts | Passed: unique cover/social assets, valid kinds and provenance, required editorial/synthetic disclosure, and non-empty detail-page alt text |
| Image delivery | Passed: Astro AVIF/WebP responsive sources, intrinsic dimensions, lazy loading below the first meaningful hero, and focal-point control |
| Project evidence | Passed: real Krishi, Agentic, and Snowflake captures; source-grounded diagrams; disclosed DigitalMandi illustration |
| Personal media | Passed: approved portrait on About and Person schema; verified public-talk and Krishi artifacts on Now |
| Video privacy | Passed: local poster and zero iframe or third-party image request before Play; YouTube loads from `youtube-nocookie.com` after activation |
| Search and sharing | Passed: page-specific ImageObject/primaryImage, Open Graph/X image metadata, image/video sitemap entries, and Media RSS content |
| Metadata privacy | Passed: no EXIF or GPS metadata detected in published media |
| Media budgets | Passed: largest 1600 px hero 213,782 bytes; worst 390 px/DPR 3 selection 119,385 bytes; largest social image 220,334 bytes |

## Lighthouse

| Profile | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Fresh reports in `docs/design/qa/` were recorded with Google Chrome 150 and Lighthouse 13.4.0 against the final production build. Mobile homepage LCP was 2.11 s with CLS 0; desktop LCP was 0.55 s with CLS 0.049. A separate 390 × 844, DPR 3 audit of the heaviest Bat & Ball essay cover recorded performance 99, LCP 2.10 s, CLS 0, and selected the 119,385-byte AVIF candidate.

final result: passed
