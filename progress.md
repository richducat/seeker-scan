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
