---
name: Headliner
description: A recording-console channel strip for checking a live-show deal; money on a meter, affinity on a meter, the verdict on a lamp.
colors:
  panel: "#8a97a5"
  panel-raised: "#e6ebf0"
  panel-deep: "#4f5f70"
  panel-deep-ink: "#f1f4f7"
  rail: "#6f7d8b"
  rail-line: "rgba(21, 24, 27, 0.14)"
  glass: "#f3e9d2"
  glass-edge: "#cbbfa3"
  ink: "#15181b"
  legend: "#3f4a55"
  legend-ground: "#15181b"
  legend-on-glass: "#4a4335"
  placeholder: "#5e5848"
  lamp-red: "#b3202f"
  lamp-green: "#176a3c"
  lamp-amber: "#8a5a00"
  lamp-blue: "#2d5aa6"
  cap-red: "#d7263d"
  cap-green: "#2e9e5b"
  cap-amber: "#e0a526"
  cap-blue: "#3a6fd8"
  action: "#e0a526"
  action-ink: "#15181b"
  focus: "#2d5aa6"
  engrave-highlight: "rgba(255, 255, 255, 0.35)"
  screw-highlight: "rgba(255, 255, 255, 0.5)"
typography:
  headline:
    fontFamily: "Bricolage Grotesque, Hanken Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "-0.01em"
  reading:
    fontFamily: "Bricolage Grotesque, Hanken Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  title:
    fontFamily: "Bricolage Grotesque, Hanken Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  legend:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.005em"
  control:
    fontFamily: "Bricolage Grotesque, Hanken Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.05em"
  entry:
    fontFamily: "Bricolage Grotesque, Hanken Grotesk, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: "1.75rem"
    letterSpacing: "normal"
rounded:
  plate: "6px"
  control: "0.375rem"
  focus: "2px"
  lamp: "50%"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "1.5rem"
  3xl: "2rem"
  4xl: "2.5rem"
  5xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary-compact:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.75rem"
  button-plate:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "0 1rem"
    height: "2.75rem"
  input-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.plate}"
    padding: "0 0.75rem"
    height: "2.75rem"
  entry-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    typography: "{typography.entry}"
    rounded: "{rounded.plate}"
    padding: "0.75rem 1rem"
  plate:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "1.25rem"
  plate-compact:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "1rem"
  meter-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "1rem 1.25rem 1.25rem"
  nav-header:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.panel-deep-ink}"
    typography: "{typography.body}"
    padding: "0.75rem 1rem"
  legend-engraved:
    textColor: "{colors.legend}"
    typography: "{typography.legend}"
  legend-on-glass:
    textColor: "{colors.legend-on-glass}"
    typography: "{typography.legend}"
---

# Design System: Headliner

<!-- Recorded 2026-10-17 from the built code (src/app/globals.css, src/components/console.tsx and siblings), not from the direction contract. Updated the same day after the finish review's second round: rem values are recorded at the build's 15px root, the stencil lost its box, patch points gained screws. Where code and contract disagree, the build is recorded and the gap is named. -->

## Overview

**Creative North Star: "The Console"**

Headliner's interface is one channel strip on a recording console, read at night under a desk lamp. The offer line is the scribble strip across the top; money and cultural affinity each read on a cream-glass VU meter; the verdict is a lamp cap that lights green, amber, red or blue; the fixes sit in a patch bay beneath; the things no signal can establish are stencilled straight onto the panel; the API trace folds away as the back panel. The contract's thesis, that the desk refuses the KPI-tile dashboard, survived the build: there is no tile grid, no sparkline row, no type ladder of big numbers. Hierarchy comes from needle deflection and lit lamps, not from font size. One line of the contract did not land as written: "money rides the fader". The build has no fader; money reads on a meter like affinity does, and the refusal is the red zone of that meter plus the red lamp.

The materials are literal and consistent. The ground is a marine-grey panel with a visible 96px rail grid; modules are raised plates bolted on with four screws; readings sit on cream glass with an inner vignette and one specular sweep; labels are engraved condensed legends, uppercase and tracked, at one size everywhere. There is one body size (15px Barlow, and the root is 15px, so every rem in this file is 15/16 of the Tailwind default) and the condensed face carries every label, reading, heading and control. Colour is reserved for state: the four lamp tones map one-to-one onto the four verdict statuses in `src/lib/enums.ts`, and the single warm action colour is the amber cap of the lamp in the wordmark. Nothing is coloured for decoration.

The dark scene is defined but dormant: every token is redefined under `:root[data-theme="dark"]`, the panel goes to charcoal and the lamp tones brighten, the glass stays cream and its ink stays dark, because a meter face does not change colour when the house lights come down. Nothing in the build sets `data-theme`; there is no switch, and the OS preference is deliberately not read. Motion is limited to the two things a console actually does: a needle swinging to its value and a lamp warming up. Both stop under `prefers-reduced-motion`.

**Key Characteristics:**
- Marine-grey panel ground with a visible 96px rail grid and screw holes at every module corner.
- Cream meter glass (`glass`) whose ink is always dark, in both scenes.
- One label voice: the engraved condensed legend (0.75rem, 0.12em tracking, uppercase, light text-shadow).
- One body size (15px, Barlow 400); Barlow Condensed 500/600 for everything that is not running text.
- Four lamp tones bound to the four verdict statuses; amber is also the only action colour.
- Depth by material (plate on rail, glass in plate), not by elevation levels.
- Two authored motions: needle settle (700ms) and lamp warm-up (450ms), both respecting reduced motion.
- Every colour pair in `scripts/contrast.mjs` passes AA; lowest measured pair 4.63:1.

## Colors

A grey panel, a cream glass, a black ink, and four lamp tones; the warm amber cap doubles as the only action colour.

### Primary
- **Amber Cap** (`action`, `cap-amber`): the primary button and the one lit lamp in the header wordmark. Also the amber zone on both meter scales and the `fix_required` verdict lamp. Ink on it (`action-ink`) measures 8.13:1. Used on at most one control per screen: the primary action of that screen.
- **Amber Lamp** (`lamp-amber`): the text-weight amber, used for amber-tone text on plates (4.94:1 on the current plate; the script still measures it against the older `#dfe4e9` plate at 4.63:1) and for the "sample evidence" banner legend. Never used for text on bare ground (1.99:1 there; see Named Rules).

### Secondary
- **Blue Lamp** (`lamp-blue`, `cap-blue`): the `abstained` status, inline links, the caret and `accent-color`, the focus ring (`focus` is the same value), the opener patch point, and the fill of the affinity marks in candidate lists. Blue is the calm tone: it means "no signal" or "elsewhere", never "error". 5.60:1 on a plate; 2.26:1 on bare ground, so it does not go on bare ground.
- **Green Lamp** (`lamp-green`, `cap-green`): `cleared`, "live" evidence mode, a 2xx trace row, a candidate the model and Qloo both found, the market patch point.
- **Red Lamp** (`lamp-red`, `cap-red`): `refused`, a rule violation, a failed trace row, an inline error. Also the thin red hairline down the centre of every needle.

### Neutral
- **Marine Panel** (`panel`): the page ground in the light scene. Text placed directly on it must be `ink` (5.98:1); the `.on-ground` class enforces this for legends.
- **Raised Plate** (`panel-raised`): every module face: plates, patch points, the back panel, OAuth buttons. Ink on it is 14.86:1; legend grey on it is 7.54:1; the four lamp tones measure 4.94 to 5.60:1 on it.
- **Deep Panel** (`panel-deep`) and **Deep Panel Ink** (`panel-deep-ink`): the site header only, and the dark pivot ring on every lamp. 5.94:1.
- **Rail** (`rail`): module borders, table row dividers, the footer rule, the unlit lamp cap, the scrollbar thumb. **Rail Line** (`rail-line`): the 1px rail-grid lines, at 14% ink.
- **Meter Glass** (`glass`) and **Glass Edge** (`glass-edge`): meter faces, the offer textarea, all text inputs, the loading skeleton. Ink on glass 14.76:1. Glass keeps its cream value in the dark scene (`#e9dfc8`), and its ink stays `#15181b` by a literal declaration in `.glass`, not via `ink`.
- **Ink** (`ink`): body text and the dark pivot of every meter.
- **Legend** (`legend`): the engraved label grey and all secondary text on plates (`text-legend`). 7.54:1 on a plate; only 3.04:1 on bare ground.
- **Legend on Ground** (`legend-ground`): what a legend becomes inside `.on-ground`; identical to `ink` in both scenes.
- **Legend on Glass** (`legend-on-glass`): warm dark brown for legends, tick labels and the scale arc on cream glass. 8.11:1. Same value in both scenes.
- **Placeholder** (`placeholder`): textarea and input placeholders on glass, 4.79:1.

### Dark scene
Every token above is redefined under `:root[data-theme="dark"]` (values in `.impeccable/design.json`, `colorMeta.*.darkScene`). Panel becomes `#1b2026`, plate `#232a31`, deep panel `#0f1317`, ink `#eef0f2`, legend `#b7c0c9`, lamp tones lift to `#ff7b86` / `#6ed19a` / `#f2c35c` / `#8fb4f0`, focus follows blue. `action`, `action-ink`, `legend-on-glass`, `placeholder` and the four cap colours do not change. Lowest dark pair the script measures: red on dark panel 6.58:1; red on the dark plate measures 5.83:1. One dark pair is below AA and the script does not measure it: `placeholder` on dark glass is 4.36:1. The scene is dormant, so nothing ships with it; it is recorded here as a defect to fix before a switch exists, not as an accepted value.

### Named Rules
**The Four Lamps Rule.** The lamp tones are bound to the verdict statuses in `STATUS_TONE` (`src/lib/enums.ts`): cleared is green, fix_required is amber, refused is red, abstained is blue. No other mapping exists, no fifth tone is introduced, and the status is always written in text beside the lamp.

**The One Amber Rule.** `action` is the primary button, the header lamp, and nothing else. One primary action per screen; secondary actions are plates or underlined links.

**The Ground Is Ink Rule.** Text placed directly on the bare panel is `ink`. Legend grey (3.04:1) and the lamp tones (1.99 to 2.26:1) only pass AA on a plate or on glass. The build's `.on-ground` class exists to enforce this for `.legend`; apply it to every element that sits on the panel outside a plate.

**The Cream Glass Rule.** Glass is cream and its ink is dark in both scenes. Readings, tick labels and scale arcs on a meter use `#15181b` and `legend-on-glass`, never `ink` or `legend`, which invert in the dark scene.

## Typography

**Display Font:** none; the system has no display size.
**Body Font:** Barlow 400/500/600 (with system-ui, sans-serif), via `next/font/google`, variable `--font-barlow`.
**Label/Condensed Font:** Barlow Condensed 500/600 (with Barlow, sans-serif), variable `--font-barlow-condensed`, exposed as `font-condensed`. Only 500 and 600 are loaded, so condensed text that inherits body weight 400 (legends, table cells, the offer entry) renders in the 500 face; there is no light condensed.

**Character:** one industrial grotesque in two widths. Barlow runs the body at a single 15px size; Barlow Condensed does everything that would be engraved, printed on a meter face, or silk-screened on a button: legends, readings, headings, controls, table cells with numbers. Tabular numerals are on globally (`font-variant-numeric: tabular-nums`), so every figure aligns in a column. The root is 15px, so 1rem is 15px throughout this file.

### Hierarchy
- **Headline** (600, 1.5rem / 22.5px, line-height 1.333, 0.025em, uppercase, condensed): page titles (`h1` on suite, auth, account, legal pages) and the verdict status beside its 32px lamp. The largest type in the system; it appears once per screen.
- **Reading** (600, 1.5rem, line-height 1, condensed, `#15181b`): the figure printed under a meter pivot (`42 / 300`, `0.71`). Same size as the headline; distinguished by being on glass, not by being bigger.
- **Title** (600, 1rem / 15px, line-height 1.5, 0.025em, uppercase, condensed): patch-point titles and legal-page section headings. Section heads on legal pages take `legend` colour; patch-point titles take `ink`.
- **Body** (400, 15px, line-height 1.5, Barlow): all running text, reasons, abstentions, rows, table cells. The verdict headline is body at 500. Readable measure is 65ch (suite intro) to 72ch (legal pages).
- **Legend** (500 as rendered, 0.75rem / 11.25px, 0.12em, uppercase, condensed): the `.legend` class. Plate titles (`Plate legend=`), meter captions, form labels, the "or" divider, sample numbering, table heads, the rules-version line, the evidence-mode banner, the back-panel summary. Carries an engraved text-shadow (`--engrave`) on plates and ground, none on glass.
- **Control** (600, 1rem, 0.05em, uppercase, condensed): button labels. The header wordmark is the same voice at 1.125rem with 0.18em tracking, used once.
- **Entry** (500 as rendered, 1.125rem / 16.9px, line-height 1.75rem, condensed): the offer textarea only; the scribble strip reads larger than body so the typed offer line is the loudest text on the first viewport.

### Named Rules
**The One Body Size Rule.** Running text is 15px. No `text-sm`, `text-xs` or `text-xl` exists anywhere in `src`; de-emphasis is done with `legend` colour, not a smaller size. Secondary rows in the money table are body size in `legend` grey.

**The Condensed Numbers Rule.** Any figure that is a reading, a row value, a latency, a count or a version is set in Barlow Condensed with tabular numerals. Barlow (body) never carries a standalone number.

## Layout

The page is a `rail-grid` ground: `repeating-linear-gradient` lines every 96px in both axes, 1px of `rail-line`, centred at the top. The app container is 80rem (1200px at the 15px root) wide with 1rem gutters, 2rem from the `md` breakpoint (`px-4 md:px-8`); vertical page padding is 1.5rem / 2rem from `md` on the desk and suite, 2.5rem on auth, account, contact and legal pages. Read-mode pages narrow to a 72ch plate (`Prose`); auth forms to 28rem; the contact form to 36rem; the account page to 42rem.

The first viewport is the contract's channel strip and the build honours its order: the scribble-strip plate (offer line left, primary action right at `md:grid-cols-[1fr_auto]`, stacked on phones), then the meter bridge at `md:grid-cols-[1fr_minmax(240px,0.9fr)_1fr]` (money meter, verdict plate, signal meter), then the patch bay and stencil at `md:grid-cols-[2fr_1fr]`, then the money table, the evidence rack at four columns, the optional baseline plate at three, and the trace folded in a `details` plate. On phones every grid collapses to one column in that order. The loading skeleton uses a near copy of the bridge grid (`minmax(220px,0.8fr)`) so the three glass blocks land where the meters will.

One breakpoint: `md` (48rem, 768px; media queries use the 16px initial size, not the 15px root). Nothing changes between 768px and the 80rem container.

Spacing rhythm is Tailwind's 0.25rem step, which is 3.75px here. The steps in use: plates pad 1.25rem (1.5rem from `md`), patch points 1.25rem with no `md` bump, the back panel 1rem, the suite table plate 0.75rem, the prose article 1.5rem (2rem from `md`); module grids gap 1rem, the verdict stack 1.25rem, the desk stack 1.5rem; legends sit 0.75rem above their content (`mb-3`); the footer stands 3rem below the last module with 1.5rem of its own padding. Modules are `position: relative` so the four screws can sit 0.5rem (7.5px) in from each corner.

## Elevation & Depth

Depth is material, not elevation. A plate is raised off the rail by a 1px highlight at its top edge and a short, soft drop (`--shadow`: `0 1px 0 rgba(255,255,255,0.55) inset, 0 2px 6px rgba(21,24,27,0.14)`); glass sits *into* a plate with an inset top highlight and an inset bottom vignette plus a hairline drop; a screw is a 6px radial gradient from plate to deep panel with a 1px highlight beneath. Legends are engraved by a 1px white text-shadow below the glyphs in the light scene and a 1px black shadow above them in the dark scene (`--engrave`). The meter face adds, in SVG, a radial vignette to 18% warm brown at the edges and one specular sweep from the top-left at 32% white to nothing, both clipped to the 6px face. There are no hover shadows, no elevation ramp, no layered z-levels; a plate inside a plate (patch points inside the patch bay) uses the identical shadow.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 1px 0 rgba(255,255,255,0.55) inset, 0 2px 6px rgba(21,24,27,0.14)`, dark: `0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 8px rgba(0,0,0,0.45)`): every raised module and the primary button (`shadow-panel`).
- **Glass** (`inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 6px rgba(74,67,53,0.12), 0 1px 2px rgba(21,24,27,0.18)`): meter faces and text inputs. Not redefined for the dark scene; the glass stays lit the same way.
- **Screw** (`0 1px 0 rgba(255,255,255,0.5)`): the highlight under each screw hole.
- **Engrave** (`text-shadow: 0 1px 0 rgba(255,255,255,0.6)`, dark: `0 -1px 0 rgba(0,0,0,0.5)`): legends on plates and ground; legends on ground use a 35% variant.

### Named Rules
**The Same Screws Rule.** A module either has all four screws or none: `Screws` at 0.5rem from each corner on every `Plate`, every `Meter`, every `PatchPoint`, the offer form, the prose article and the suite table. The back panel (`details.plate`) and the OAuth plate buttons have none; a module that gets screws gets four, never two.

**The Flat Button Rule.** Buttons do not gain shadow on hover; the desk's primary button lifts 1px (`translateY(-1px)`, 150ms) and settles on press. The auth and suite primaries and all plate buttons do not move.

## Shapes

Gently radiused rectangles, almost square. Plates and glass are 6px; buttons and the skeleton use Tailwind's `rounded-md` (0.375rem, which is 5.6px at the 15px root), close enough to read as the same corner but technically a second value; the focus ring is 2px; lamps, screws and affinity marks are circles. Every module has a 1px border: `rail` on plates, `glass-edge` on glass. The stencil is the one element with no box at all: no border, no plate, no padding beyond 0.5rem vertical; its legend and items are engraved straight on the ground. Meter scales are 120° arcs (from -60° to +60°) with a 5px zone band inset 7px from the 1.5px scale line; needles are a 2px ink line with a 0.8px red hairline on top and a 7px ink pivot with a 3px cream centre. Candidate affinity is a filled blue circle whose radius grows from 2px to 7px with the score; the stencil's item marker is a 12px, 1px `legend` dash. Nothing is pill-shaped; nothing is clipped diagonally; the only gradients are the glass vignette and sweep inside the meter SVG and the screw and lamp highlights.

## Components

### Buttons
- **Shape:** gently radiused (0.375rem), 3rem tall (45px) on the desk, 2.75rem (41.25px) on auth and suite; horizontal padding 1.25rem (desk, suite) or 1rem (auth).
- **Primary:** Amber Cap on dark ink, condensed 600 uppercase 0.05em, plate shadow, a lucide icon at 16px / stroke 2.25 leading (`Play`, `Mail`). On the desk, hover lifts 1px over 150ms and active returns; elsewhere no hover treatment. Disabled is 50% opacity and `not-allowed` on the desk. One per screen.
- **Plate (secondary):** the `.plate` class as a button: raised plate, rail border, body 500 weight, 2.75rem tall (sign-out is 2.5rem), 1rem side padding, an 18px brand mark leading. Used for Google and Apple sign-in and sign-out. No screws, no hover treatment.
- **Link:** inline text in `lamp-blue` with `underline-offset-4` and underline on hover; `ink`-coloured where the surrounding text is ink (sample offers, footer, header nav). The samples disclosure is a `summary` styled as a blue link with a 14px `ChevronDown` at lucide's default stroke (2) that rotates 180° when open.

### Legend
- **Style:** `.legend`: Barlow Condensed 0.75rem, 0.12em, uppercase, `legend` grey, engraved shadow. On glass, `legend-glass`: warm brown, no shadow. Inside `.on-ground`: ink with a 35% engrave. A Tailwind colour utility on a `.legend` (`text-lamp-green` on the suite banner) wins only outside `.on-ground`.
- **Use:** every plate title (`Plate legend=`), meter caption, form label, table head, divider word, status banner and back-panel summary. It is the world's native label, used as the heading element (`h1`/`h2`) of modules; it is not a kicker above a larger title.

### Lamp
- **Style:** authored SVG, 16-unit viewBox: a `panel-deep` ring (r 7.5), a cap of the tone colour (r 5.5), and when lit a 55% white specular dot. Unlit caps are `rail`. Tones: `cap-green` / `cap-amber` / `cap-red` / `cap-blue`.
- **State:** `lit` runs `lamp-warm` once (450ms, brightness 0.6 to 1, scale 0.94 to 1). `VerdictLamp` resolves the tone from `STATUS_TONE`. Sizes in use: 10 (coverage list, suite table), 12 (evidence banner, patch point), 14 (header wordmark, `Lamp` default), 32 (verdict headline). `VerdictLamp` defaults to 18 but is only ever rendered at 32.

### Meter (signature)
- **Style:** a `glass` figure with screws, a `legend-glass` caption, a 240x150 SVG: 120° scale arc in `legend-on-glass`, 5px zone band (green/amber/red caps at 90%), 1.5px ink ticks with 9px condensed tick labels, the needle, a 7px ink pivot with cream centre, then the clipped vignette and sweep on top. The reading prints below the pivot in Reading type; a sub-caption sits right in `legend-glass`.
- **State:** `value` 0 to 1 rotates the needle from -60° to +60° over 700ms with `--ease-out`; `null`/`muted` removes the needle, dims the scale to 30 to 40%, and prints `mutedText` (the muted channel of the contract: "no signal"). Money meter zones come from the rulebook thresholds (warn 65%, refuse 85%) scaled onto a 0 to 120% arc, with the needle clamped at 120%; the signal meter uses fixed thirds labelled low / mid / strong.

### Plates / Containers
- **Corner Style:** 6px.
- **Background:** `panel-raised`, 1px `rail` border, plate shadow, four screws.
- **Internal Padding:** 1.25rem, 1.5rem from `md`; patch points 1.25rem flat; back panel 1rem; table plate 0.75rem; prose article 1.5rem / 2rem.
- **Variants:** `Plate` (section with optional legend `h2`), `PatchPoint` (plate with screws, a 12px lamp and a Title), `details.plate` (the back panel: a `legend` summary, no screws), the prose article (72ch plate with screws).

### Stencil
- **Style:** no plate, no border: an `.on-ground` section with 0.5rem vertical padding, a legend `h2`, and body items led by a 12px, 1px `legend` dash. Its legend and text read in ink straight off the panel. It lists what cannot be established; it never carries a number, a needle or a lamp.

### Inputs / Fields
- **Style:** `.glass`: cream face, `glass-edge` border, 6px, glass inset shadow, dark ink, `placeholder` brown. Single-line inputs are 2.75rem with 0.75rem side padding; the offer textarea is Entry type at 0.75rem / 1rem padding, two rows, vertically resizable.
- **Focus:** the global ring: 2px solid `focus` (blue) at 2px offset, 2px radius. Inputs set `outline-none` and rely on `:focus-visible`.
- **Error / Status:** error text in `lamp-red` with `role="alert"`; success in `lamp-green` with `role="status"`; both are body size below the control. No red borders.
- **Checkbox:** native, tinted by `accent-color: lamp-blue`, label in `legend` grey.

### Navigation
- **Header:** a full-width `panel-deep` strip with `panel-deep-ink` text; 80rem inner container, 0.75rem vertical / 1rem (2rem at `md`) horizontal padding. Wordmark: a 14px amber lamp plus the name in condensed 600 1.125rem uppercase 0.18em. Links: body text with a 16px lucide icon at stroke 1.75, underline on hover, 1.25rem gap. No active-state treatment, no mobile menu; the nav is two or three links and fits.
- **Footer:** 3rem above, 1px `rail` top rule, `legend`-coloured operator line and five legal links, stacked on phones, one row from `md`.
- **Back panel:** a `details.plate` whose `summary` is a legend; trace rows are a three-column grid (status in green/red, latency in legend, the GET line in ink).

### Tables
- **Style:** inside a 0.75rem plate, full width, `legend` head row, 1px `rail` row rules, 0.75rem / 0.5rem cell padding, condensed cells for endpoint, latency and counts, a 10px lamp with its status code beside it, `legend` grey for params. Horizontal scroll on overflow.

### Skeleton
- **Style:** three `glass` blocks 14rem tall at 60% opacity with `animate-pulse`, in a near copy of the meter-bridge grid, `aria-busy` and `aria-live="polite"`. The desk shows "queued" / "running" on the primary button meanwhile.

## Do's and Don'ts

### Do:
- **Do** put every module on a plate or on glass, with four screws at 0.5rem from the corners, and let the rail grid show between modules.
- **Do** convey state with a lamp *and* the word beside it; `VerdictLamp` takes the tone from `STATUS_TONE` and never from a local mapping.
- **Do** set every figure in Barlow Condensed with tabular numerals, and keep readings on cream glass in `#15181b` / `legend-on-glass` so they survive the dark scene.
- **Do** use `.on-ground` on anything that sits on the bare panel outside a plate, so its legends and text read in ink (5.98:1).
- **Do** keep one primary amber action per screen; secondary actions are plate buttons or underlined links.
- **Do** mute a meter (no needle, dimmed scale, a printed "no signal") when the evidence is missing; a muted channel is the abstention, and the blue lamp says so.
- **Do** keep motion to the needle settle (700ms `--ease-out`) and the lamp warm-up (450ms), and let `prefers-reduced-motion` turn both off.
- **Do** measure any new colour pair with `node scripts/contrast.mjs` before it ships, and add the pair to the script; the dark placeholder pair (4.36:1) is the one known failure to fix before a theme switch exists.

### Don't:
- **Don't** build a KPI tile, a stat card or a big-number ladder; a number that matters is a meter reading or a row, and it is the same size as the headline, never larger.
- **Don't** add a type size for emphasis; running text is 15px and de-emphasis is `legend` grey, not `text-sm`.
- **Don't** put `legend` grey, `lamp-blue` or any lamp tone as *text* on the bare panel; those pairs measure 1.99 to 3.04:1 there. Plate or glass first.
- **Don't** invert the glass in the dark scene or colour its ink with `ink`; the glass is cream and its ink is dark under any lighting.
- **Don't** introduce a fifth lamp tone, a gradient fill on a button, a pill radius, a hover shadow, a dashed border or a diagonal clip; the console's only gradients are the glass vignette, the sweep, and the screw and lamp highlights.
- **Don't** use a lucide icon at a stroke other than 1.75 (navigation), 2 (disclosure chevron, the library default) or 2.25 (button leading icon), and don't draw a meter or a lamp with an icon; those are authored SVG.
- **Don't** set colour on a `.legend` inside `.on-ground` with a Tailwind utility; the unlayered `.on-ground .legend` rule wins and the utility silently does nothing.
- **Don't** record a pixel value from the Tailwind default scale; the root is 15px, so `h-12` is 45px and `p-5` is 18.75px. Write the rem.

## Provenance and known gaps

- **Direction seed:** the world was assigned by impeccable's direction roll, key `36cafb75` (scope direction, mode operate, assigned index 3 of the builder's ranked list). The roll output was printed to the terminal during the build session and the script does not persist it; the only records are the CONTRACT constant in `src/app/layout.tsx` and the `seed` block the builder added to `.impeccable/direction-payload.json` after the fact. Nothing independent of the build corroborates the key. Treat it as a stated, not proven, provenance.
- **Highlight values outside the palette:** `engrave-highlight` (`rgba(255, 255, 255, 0.35)`, the engrave text-shadow for legends on bare ground) and `screw-highlight` (`rgba(255, 255, 255, 0.5)`, the screw's top highlight) are intentional parts of the engraving system. The dark scene swaps the engrave for a black shadow (`0 -1px 0 rgba(0, 0, 0, 0.5)`).
- **Placeholder on dark glass:** the documenter measured the original `#6b655a` at 4.36:1 on dark glass; it is now `#5e5848` (5.35:1 dark, 5.87:1 light), recorded in `scripts/contrast.mjs`.
- **Finish review:** two fix rounds on 2026-10-17; every visual finding scored resolved on the recaptures in `.impeccable/review/`. The verdict covers the scored fixes, not a fresh hunt of the whole surface.

## Typography revision, 2026-10-18

Carson rejected the condensed tracked-uppercase voice ("the fonts suck"). The system now runs two faces and no uppercase:

- **Hanken Grotesk** for body, labels and controls (400/500/600, 15px root, tabular numerals). Labels (`.legend`) are 0.8125rem, weight 500, sentence case, letter-spacing 0.005em.
- **Bricolage Grotesque** for headings, readings and the wordmark (`.font-display`, 500/600/700, letter-spacing -0.01em; wordmark -0.02em at 1.25rem bold).
- Decorative icons were removed from navigation, buttons and the story; the only icons left are functional marks: the meter logo (`src/components/logo.tsx`, `public/brand/mark.svg`, `src/app/icon.svg`), lamps, and the Google and Apple sign-in marks.
- Product terms replaced console jargon in the UI: Check a deal, Offers, API status, Settings; Deal economics, Audience evidence, Outside this check, Suggested fixes, API calls. The console vocabulary stays in this document and in component names only.
