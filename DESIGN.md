---
version: alpha
name: Disa GardenOS
description: A garden operations desk for Pretoria office teams and mobile crews.
colors:
  primary: "#3456DB"
  pine: "#171A29"
  sage: "#A9B6F5"
  lime: "#DCE4FF"
  background: "#F4F5F9"
  surface: "#FFFFFF"
  border: "#E3E5EF"
  text: "#222535"
  secondary: "#687087"
typography:
  sans:
    fontFamily: "Jakarta, Arial, sans-serif"
  mono:
    fontFamily: "ui-monospace, monospace"
rounded:
  DEFAULT: "10px"
  sm: "6px"
  lg: "16px"
spacing:
  page: "32px"
  gap: "20px"
components:
  button: {}
  card: {}
  dialog: {}
---

# Disa GardenOS design system

## Overview

A working garden operations desk, with the clarity of a printed crew roster and the warmth of a maintained Pretoria garden. Product register throughout. The user brief is the business source: an independent paceIT concept for Disa Tuine, English, South Africa, ZAR, Africa/Johannesburg. No official rates or live weather claims.

Landscape Pro is the requested composition reference and MHDev the connected-workflow reference. Both reference pages were blocked by network policy; use the supplied principles, never claim inspected imagery. Original signature: a crew-by-day roster with fine grid lines and compact visit slips. Quiet tables and predictable forms support that signature. Avoid farming analytics, glass effects, neon, decorative metrics, or oversized rounded tiles.

## Colors

Runtime owner: src/client/tokens.css. This document mirrors that source; update both together. Forest navigation and primary actions, pine footer, lime selected navigation, sage scheduled chart bars, ivory workspace, white content, stone dividers. Secondary text darkened from the brief's #788078 for legibility. Status combines text and color. Light theme is intentional; forced colors use system colors.

## Typography

Locally hosted Plus Jakarta Sans (Jakarta) for headings and body; Arial fallback. Headings 28–32px with restrained negative tracking, body 13–14px, controls 13px, utility captions 11px. Tabular numerals on money and schedules. No decorative serif or marketing hero.

## Layout

Desktop navigation 236px; workspace padding 32px, 20px panel gaps. A slim header sits above natural document scrolling. At 900px navigation becomes a compact horizontal menu and panels stack; at 600px cards and forms become one column. Tables own horizontal overflow; the planner retains its grid and scrolls. Touch targets at least 44px on mobile.

## Elevation & Depth

Fine borders on working panels. Subtle shadow only on floating dialogs and header separation. Never elevate every table row.

## Shapes

10px panels, 6px controls, 16px large feature panel. Pills reserved for status and crew labels.

## Components

Buttons use forest solid for commit, outlined neutral for secondary, explicit danger for destructive confirmation. Busy controls disable duplicate activation. Native select/date/time controls retain platform popup ownership. Dialog is the shared native HTML dialog wrapper with showModal, Escape and focus restoration. Errors remain inline; shared toast announces confirmed success. Lucide icons 16–20px accompany visible labels. Charts expose textual totals and tooltips. Motion 160–240ms, entry fade only; reduced motion disables it. Scrollbars are global, visible, tokenized, and system-owned in forced colors. Forms keep labels, errors and values; textarea resizing is disabled.

## Do's and Don'ts

- Do calculate every metric from persisted records.
- Do preserve original record identifiers and API relationships.
- Don't imply synchronization, weather, travel optimization, payments processing, or sign-off integrations.
- Don't remove inventory, equipment, offline reads or existing CRUD access.

## Studio direction — revised user brief

The user rejected the original green sidebar/dashboard composition. The current direction uses ink navigation across the top, cobalt primary actions, pale periwinkle working surfaces, apricot quotation accents and violet dispatch accents. The signature is the asymmetric command deck and completion ring, with today’s crew strip above metrics. Jakarta remains the heading/body family; compact uppercase utility captions structure the canvas. Motion uses 550ms staggered section reveals, chart growth and a single ring entrance; reduced-motion disables every animation. Runtime tokens live in tokens.css; studio.css implements the approved shell and composition. Tremor’s GitHub README was reviewed for dashboard/data-display references; motion.dev examples could not be reached. No third-party template code was copied. Browser-only fictional data is the default; changes persist locally, no database is required.

## Glass refinement — user image reference

The latest supplied reference replaces the expressive cobalt presentation with a restrained dark-glass header and translucent pale cards. Remove ornamental slogans, dotted backdrops, repeated arrows and metric icons. Use fine white borders, subtle inner highlights, bounded backdrop blur and soft shadows. Preserve functional icons, status labels and explicit actions. Operational text remains darker than decorative chrome for readability. No emoji assets are used. Motion stays brief and respects reduced motion. studio.css owns this refinement over the existing shared runtime tokens.

## Startup motion

Once per page load, a restrained ink wordmark dissolves while navigation, the command deck and KPI cards reveal in a short stagger. App/data initialization happens underneath; the reveal never blocks pointer input or waits on a timer to load data. A 950ms fallback removes the decorative layer if animation events are unavailable. Reduced-motion skips the intro entirely; changing that preference during the reveal dismisses it. Route changes and ordinary refreshes do not replay the startup sequence.

## Navigation and route motion

The navigation is a slim glass dock with a measured active-tab indicator that slides between links. A ResizeObserver and font-ready measurement keep its position correct as geometry changes. Mobile tabs retain horizontal scrolling and a 44px target. Each keyed route owns its entry: headings fade up, cards stagger by up to 225ms, numerical values reveal without changing their real values, and progress bars grow from their recorded values. No fabricated counting or artificial data delay is introduced. Reduced-motion disables the indicator transition and route animations.

## Actual data interpolation

Shared CountUp, GrowingBar and CompletionRing components now interpolate displayed values from zero to the recorded target over 1.5 seconds with cubic ease-out. IntersectionObserver starts them only when visible, and requestAnimationFrame waits for the startup veil to leave so the animation is not hidden behind the intro. The final value remains the accessible label; no live announcements fire every frame. Reduced motion shows final values immediately and changing that preference mid-animation finishes immediately. Effects cancel animation frames and observers on unmount. Route remounts replay them; no source data is modified.

## Disa Tuine demo scope

The user-provided website text is now the business-content source: established 1988, weekly residential garden maintenance in Magalieskruin, Wonderboom, Annlin and Doornpoort, and free on-site quote consultations. Core services are weekly garden service, lawn mowing/edging, flower bed maintenance, basic pruning and debris removal. Do not invent official pricing or operational processes. Main navigation is Overview, Weekly Schedule, Crews, Properties, Enquiries & Quotes, Services and Settings. The overview uses four KPIs and one today-crew summary. Billing, reports, inventory and equipment are not promoted as confirmed requirements. Retained implementation can be evaluated later; the demo remains browser-only and fictional. Preserve the glass styling and visibility-aware count-up animations.

Animation visibility correction: bars observe the chart/progress container because their initial zero-height box cannot trigger visibility detection. Count-up duration is 2.2 seconds with ease-in/out. Replay animations explicitly opts into route motion for the current browser session, including when OS reduced motion is set; default behavior continues to respect the OS preference.

Live-site correction: no replay or motion-testing controls appear in the product. Count-up and chart growth run automatically on initial visibility and keyed route entry; default OS reduced-motion preferences are respected. The temporary explicit replay override has been removed.

Animation reliability: short, non-spatial number updates now remain visible with reduced-motion settings; chart movement still resolves immediately in that mode. Normal motion uses a 2.4-second numeric transition. Animations pause their clock while the document is hidden, restart on return to a visible tab, and restart after persisted browser-back restoration. IntersectionObserver is optional, with an immediate-start fallback. No user-facing replay or diagnostic controls are added.
