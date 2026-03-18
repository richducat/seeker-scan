# Seeker HQ

Seeker HQ is a Solana wallet-enabled PWA that reframes this project as an all-in-one Seeker hub:

- Gated access rail for Seeker users
- Solana Mobile launch rail
- Embedded Tech Kombat cabinet
- Live ecosystem radar for SKR and adjacent assets
- Signed reward-claim flow for in-app arcade rewards

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

GitHub Pages build:

```bash
npm run build:pages
```

## Environment variables

Create a `.env` file when you want to tune network or Seeker-specific gating:

```bash
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_ENDPOINT=
VITE_BASE_PATH=/
VITE_SKR_QUERY=Seeker SKR Solana
VITE_SEEKER_GENESIS_MINTS=
VITE_SOLANA_DAPP_PACKAGE=
```

- `VITE_SOLANA_NETWORK`: `mainnet-beta`, `devnet`, or `testnet`
- `VITE_SOLANA_RPC_ENDPOINT`: optional custom RPC URL
- `VITE_BASE_PATH`: optional base path for non-root hosting
- `VITE_SKR_QUERY`: DexScreener query override for the Seeker token
- `VITE_SEEKER_GENESIS_MINTS`: comma-separated mint allowlist for fast client-side Seeker checks
- `VITE_SOLANA_DAPP_PACKAGE`: Android package id used for Solana dApp Store deep links

## Solana Mobile notes

- The app is installable as a PWA today.
- The launch rail is ready for a wrapped Android build and Solana dApp Store listing once a package id exists.
- Client-side wallet mint checks are useful for quick UI gating, but production Seeker-only access should move to SIWS plus backend verification of Seeker Genesis ownership.

## Tech Kombat

The in-app cabinet is served from [`public/tech-kombat/index.html`](/Users/richardducat/GITHUB/seeker-scan/public/tech-kombat/index.html) and [`public/tech-kombat/game.js`](/Users/richardducat/GITHUB/seeker-scan/public/tech-kombat/game.js).

Reward sync is handled in the React shell:

- Round wins bank vault rewards
- Match completion adds a bonus or participation credit
- Claims can be signed with the connected wallet

## Deployment

GitHub Pages deployment is configured in [`deploy.yml`](/Users/richardducat/GITHUB/seeker-scan/.github/workflows/deploy.yml) and publishes on pushes to `main`.
