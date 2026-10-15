# The Weeknd — Cinematic Interactive Experience

A high-performance, scroll-driven interactive web experience inspired by the dark, atmospheric visual universe of The Weeknd's musical eras, leading up to *Hurry Up Tomorrow*.

Built entirely with standard modern web technologies—**Vanilla HTML5, CSS3, and JavaScript**—without heavy frameworks, 3D runtime libraries, or animation dependencies.

---

## Overview

The experience guides the visitor through six distinct cinematic chapters:

1. **Chapter 01: Hero / Hurry Up Tomorrow** — Multi-plane depth stage with Abel's portrait, atmospheric smoke, and album metadata.
2. **Chapter 02: Ascension** — Monumental fire arena with rising embers, floor reflections, and layered foreground staging.
3. **Chapter 03: The Transformation / Rebirth** — Dark congregational ritual featuring eclipsing red horizons and perspective grid framing.
4. **Chapter 04: Legacy** — Signature left-aligned throne composition bathed in crimson hazes and candlelit procession silhouettes.
5. **Chapter 05: Afterlife** — Centered ritual composition with cathedral portal framing and ethereal mist columns.
6. **Chapter 06: Finale** — Minimal cosmic void featuring the glowing XO mark, planetary orbital light rings, and replay controls.

---

## Technology Stack

* **Structure**: Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
* **Styling**: Vanilla CSS3 with hardware-accelerated transforms, modern viewport units (`100svh`), CSS clamp typography, and dark mode tokens.
* **Logic**: Vanilla JavaScript (ES6+) utilizing `requestAnimationFrame`, passive scroll tracking, multi-signal capability detection, and debounced layout observers.
* **Assets**: Next-generation AVIF and WebP image formats with responsive `<picture>` tags, explicit layout dimensions, and high-DPR scaling.

---

## Performance Architecture

The site includes an automatic hardware-tiering engine that adapts visual fidelity to client capabilities:

* **Normal Mode (Desktop / High-End)**: 60 FPS compositor execution, full mouse-parallax depth tracking, multi-layer blur filters, and dynamic lighting effects.
* **Low Mode (Mid-Range)**: Preserves full visual composition while replacing intensive mouse tracking and heavy blend filters with lightweight CSS transforms.
* **Ultra Mode (Low-End / Battery Saver)**: Maximum throughput mode with simplified single-layer composites and minimal DOM mutations for ultra-smooth scrolling on low-power mobile devices.
* **Static Mode**: Clean baseline rendering for testing and accessibility readers.

### Testing Overrides
Performance modes can be manually inspected via URL parameters:
* `?performance=normal`
* `?performance=low`
* `?performance=ultra`
* `?performance=static`
* `?debug=1` (Activates lightweight on-screen mode switcher and diagnostic logging)

---

## Responsive Design & Accessibility

* **Tested Viewports**: Fully verified across 20 standard viewports from 1920×1080 desktops down to 320×568 mobile devices, including landscape phones and iPad/Android tablets.
* **Keyboard Navigable**: Tab, Shift+Tab, Enter, Space, and Escape controls are fully functional across the skip link, header navigation, mobile drawer, chapter rails, and CTAs.
* **Focus States**: High-contrast dual-ring focus styling visible across dark and red chapter environments.
* **Reduced Motion**: Full support for `prefers-reduced-motion: reduce`, halting particle jitter and continuous parallax without hiding editorial content.
* **Safe-Area Support**: Responsive fixed header and navigation controls adapt cleanly to phone notches and gesture home indicators using `env(safe-area-inset-*)`.

---

## Local Development

To run the project locally without cross-origin asset restrictions:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx serve)
npx serve .
```

Then visit `http://localhost:8000` in any modern web browser.

---

## Production Deployment

This project consists of static files with no build step required.

### Vercel
1. Import the repository in the Vercel dashboard.
2. Leave the Build Command and Output Directory empty.
3. Deploy directly from the root directory.

### GitHub Pages
1. Go to **Settings** > **Pages** in the repository.
2. Set the Source branch to `main` (or deployment branch) and folder to `/ (root)`.
3. Save to publish.

### Live Production Deployment
* **Live URL**: [https://the-weeknd-iota.vercel.app/](https://the-weeknd-iota.vercel.app/)

---

## Disclaimer & Copyright Notice

This is an **unofficial fan-made interactive experience** created strictly for **educational and portfolio purposes**. 

*Note: The waveform visualizer on this website is an interactive visual animation effect only. This website contains no audio or music playback.*

All artist imagery, music album art, trademarks, and branding (including "The Weeknd" and "XO") are the intellectual property of Abel Tesfaye, XO, Republic Records, and their respective copyright holders. This project is not affiliated with, endorsed by, or sponsored by The Weeknd or XO Records.
