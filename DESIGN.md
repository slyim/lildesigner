---
name: Liliana cybernetic portfolio
colors:
  page: "#0808ef"
  card: "#08083d"
  control: "#0c0c51"
  accent: "#88edff"
  text: "#f4f8ff"
  body: "#dbe7ff"
  muted: "#b9cbf5"
  border: "#626ec5"
typography:
  body:
    fontFamily: "Lexend, system-ui, sans-serif"
    lineHeight: 1.55
rounded:
  control: "4px"
  portrait: "8px"
spacing:
  small: "8px"
  medium: "16px"
---

## Overview

An intimate personal portfolio with cybernetic framing. Keep the existing profile, about, comments, gallery, legal views, and music player. The portrait and existing content lead; decorative effects recede.

## Colors

The page stays saturated blue across OS color schemes. Cards and controls use opaque deep blue. Cyan defines focus, active controls, and corner brackets. Use the tokens in `src/styles/cybernetics.css`; do not restore translucent glass surfaces.

## Typography

Keep Lexend for interface and content. Monospace belongs to background code and the entry action. Preserve identity copy, social destinations, and factual content.

## Layout

Keep the centered 560px profile composition. Desktop navigation sits above it; at 600px and below, navigation moves to the bottom with safe-area spacing. Reserve space around fixed controls. Social targets remain at least 44px; narrow phones arrange them into three columns.

## Elevation & Depth

Opaque panels, fine borders, and small cyan corner brackets replace liquid highlights. No backdrop blur or fullscreen white beat flashes. Preserve the existing entrance choreography for visitors who allow motion.

## Shapes

Mostly square corners with a 4px radius; portrait frame uses 8–10px corners. Keep status visibly framed and expose its text alternative.

## Components

Use `CodeBackdrop.astro` for decorative, low contrast code drift. Hide it from assistive technology, pause it in background tabs, and freeze it for reduced motion. Active navigation gets a cyan underline and explicit current state. Retain keyboard entry, music labels, modal focus management, and visible focus rings. Reduced motion skips the creation sequence and continuous effects.

## Do's and Don'ts

- Preserve existing content and features; this is a visual treatment, not a product expansion.
- Use the supplied Goddess artwork (`public/avatar-goddess.webp`, optimized from the user attachment).
- Keep code behind content and noninteractive.
- Avoid liquid cursor blobs, translucent cards, and automatic light-theme replacement of the blue page.
