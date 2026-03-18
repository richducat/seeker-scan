Original prompt: sweet and app connectivyy works. Seeker token released. What this hould be is a live airdrop and opportunity tracker for seeker exlusives! Can you add a fun game the user can earn crypto playing. Make it a temple run style game.

- Initialized web-game implementation pass.
- Plan: add Seeker opportunities section, add Temple Dash game tab, wire reward accounting + claim UX, then run Playwright action loop and inspect screenshots/state/errors.

- Added new `src/TempleDashGame.jsx` canvas game component with lane-runner mechanics, collectible coins, collision/game-over logic, fullscreen toggle, and deterministic testing hooks (`window.render_game_to_text`, `window.advanceTime`).
- Reworked `src/App.jsx` into a Seeker-exclusive live tracker: updated asset feed, added live opportunities section, integrated game rewards vault and claim flow, and embedded Temple Dash on desktop plus mobile game tab.
- Verified `npm run build` succeeds after integrating the game and tracker updates.
- Ran Playwright game loop (`web_game_playwright_client.js`) against `http://127.0.0.1:4173` with multi-action bursts; generated screenshots/states in `output/web-game-pass1`.
- Verified no console/page errors artifacts were generated; inspected screenshot frames and state JSON showing movement, jump, coin pickup, and obstacle progression.
- Ran passive-collision scenario in `output/web-game-pass2` and confirmed deterministic game-over state and overlay.
- Ran restart scenario in `output/web-game-pass3`; confirmed Enter restarts run and returns to active running mode.
- Re-validated production build targets: `npm run build` and `npm run build:pages` both pass.
- Added last-claim history line to rewards vault and re-ran `npm run build` (passes).

- New direction: convert the app into an all-in-one Seeker hub for exclusive access, perks navigation, and Solana Mobile launch readiness, with Tech Kombat as the in-app arcade experience.
- Replaced the old tracker-first shell in `src/App.jsx` with a Seeker HQ layout:
  - Seeker-first hero and module navigation
  - access rail with wallet + optional Genesis allowlist checks
  - Solana Mobile launch rail
  - embedded Tech Kombat rewards vault
  - ecosystem radar retained as a side capability instead of the main product
- Added `src/TechKombatArcade.jsx` to host the game as a same-origin iframe and poll `render_game_to_text()` for live cabinet state.
- Imported the actual Tech Kombat build into `public/tech-kombat/` and renamed visible labels from `Tech Fighter II` to `Tech Kombat`.
- Updated the visual system in `src/index.css` for a more intentional Seeker/Mobile look and swapped the app identity to `Seeker HQ` in `src/main.jsx`.
- Updated the PWA manifest in `vite.config.js` to match the new product name and Solana Mobile positioning.
- Rewrote `README.md` with new env vars and launch notes, including `VITE_SEEKER_GENESIS_MINTS` and `VITE_SOLANA_DAPP_PACKAGE`.
- Validation:
  - `npm run build` passes after the redesign.
  - Ran `$HOME/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js` against `http://127.0.0.1:4173/tech-kombat/index.html`; screenshots/state saved to `output/tech-kombat-hub-check`.
  - Inspected Tech Kombat screenshots and confirmed gameplay, KO state, and renamed branding.
  - Captured desktop/mobile shell screenshots in `output/app-shell-check`; no console/page errors in `errors.json`.
  - Found and fixed a mobile header issue where the stock wallet button overflowed; replaced it with a compact mobile wallet trigger.
  - Verified end-to-end reward sync by running the embedded iframe inside the main app until `match_over`; the parent Seeker vault updated to `0.030 SKR`.

- TODO / next agent suggestions:
  - If this is moving from PWA to full Seeker APK, add the wrapper project/package id and wire `VITE_SOLANA_DAPP_PACKAGE`.
  - Move Seeker verification from the current client-side mint allowlist to SIWS + backend SGT verification before real gated claims go live.
  - Consider lazy-loading wallet/game-heavy modules to reduce the ~984 kB main JS chunk reported by Vite.
