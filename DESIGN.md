---
version: alpha
name: Disa GardenOS
description: A garden operations desk for Pretoria office teams and mobile crews.
colors:
  primary: "#183D2D"
  pine: "#102A20"
  sage: "#9AAF98"
  lime: "#D6E7A5"
  background: "#F7F8F3"
  surface: "#FFFFFF"
  border: "#E7EAE4"
  text: "#202722"
  secondary: "#626D64"
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
