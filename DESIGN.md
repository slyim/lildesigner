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
  control: "0px"
  portrait: "0px"
spacing:
  small: "8px"
  medium: "16px"
---

## Overview

An intimate personal portfolio with cybernetic framing. Keep the existing profile, about, comments, gallery, legal views, and music player. The portrait and existing content lead; decorative effects recede.

## Colors

The page stays saturated blue across OS color schemes. Cards and controls use opaque deep blue. Cyan defines focus, active controls, and beveled frames. Use the tokens in `src/styles/cybernetics.css`; do not restore translucent glass surfaces.

## Typography

Keep Lexend for interface and content. Monospace belongs to background code and the entry action. Preserve identity copy, social destinations, and factual content.

## Layout

Keep the centered 560px profile composition. Desktop navigation sits above it; at 600px and below, navigation moves to the bottom with safe-area spacing. Reserve space around fixed controls. Social targets remain at least 44px; narrow phones arrange them into three columns.

The profile starts with the portrait and has no banner. The gallery shows only the current Goddess portrait at its full square aspect ratio. The favicon uses Phosphor's code-bold glyph in cyan on the portfolio blue, with matching SVG and ICO assets.

## Elevation & Depth

Opaque panels and cyan diagonal frames replace liquid glass. Retain hover beams, pointer-following glow, tilt, particles, name glow, music reactivity, cursor trails, click ripples, and entrance choreography. No backdrop blur or fullscreen white beat flashes. A subtle CRT scanline layer and slow sweep sit above the interface without intercepting input.

## Shapes

Cut the top-left and bottom-right corners: 16px on panels, 7px on controls, and 12px on the portrait frame. Draw panel borders with stacked clipped layers so diagonal edges and hover beams remain visible. Keep the avatar status outside the clipping mask. Use inset keyboard focus outlines on clipped controls.

## Components

Use `CodeBackdrop.astro` for decorative code drift at 0.24 opacity. Hide it from assistive technology and pause it in background tabs. Per the user's explicit request, presentation effects run independently of the OS reduced-motion preference; do not reintroduce reduced-motion gates. Active navigation gets a cyan underline and explicit current state. Retain keyboard entry, music labels, modal focus management, and visible focus rings.

## Do's and Don'ts

- Preserve existing content and features; this is a visual treatment, not a product expansion.
- Use the supplied Goddess artwork (`public/avatar-goddess.webp`, optimized from the user attachment).
- Keep code behind content and noninteractive.
- Avoid liquid cursor blobs, translucent cards, and automatic light-theme replacement of the blue page.
