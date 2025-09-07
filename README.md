# NoDaysIdle (NDI) E-commerce Demo

Quick start

Requirements: Python 3 (for simple static server) or Node.js (optional http-server).

Run local server (PowerShell):

```powershell
# from repository root
python -m http.server 5555
# open http://localhost:5555/ in your browser
```

What to test

- Visit `index.html`:
  - Currency selector in header (EUR default). Switching to USD will fetch a cached EUR→USD rate and reformat prices.
  - Export Analytics (footer) downloads `ndi-analytics.json`.
  - Clear Analytics prompts for confirmation and clears client-side analytics.
- Visit `carousel.html`:
  - Keyboard: focus the carousel and use left/right arrows.
  - Prev/Next buttons and dots are usable and announce slide changes to screen readers.
- Visit `pricing.html` to see formatted prices and the same analytics controls.

Notes

- Exchange rates are fetched from exchangerate.host and cached in localStorage for 12 hours.
-- Analytics are purely client-side and kept in localStorage under the key `ndi-analytics`.
- The site uses a neobrutalist theme applied in `style.css` and `carousel.css`.

Next steps (optional):

- Replace placeholder images with production assets.
- Add a small server-side component to proxy/caching exchange rates for reliability.
- Add CI checks (lint/tests) if this repo becomes a production project.
