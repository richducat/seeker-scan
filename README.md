# SeekerScan

SeekerScan is a Solana wallet-enabled PWA optimized for mobile users and Solana dApp distribution.

## Features

- Wallet Adapter integration (Phantom, Solflare, Torus, Solana Mobile Wallet Adapter)
- Mainnet/devnet configurable RPC setup
- Real signed mint flow (0.1 SOL transfer to treasury)
- DexScreener-powered live token prices
- Mobile-first install UX (PWA install prompt + iOS fallback instructions)

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file if you need custom network settings:

```bash
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_ENDPOINT=
VITE_BASE_PATH=/
```

- `VITE_SOLANA_NETWORK`: `mainnet-beta`, `devnet`, or `testnet`
- `VITE_SOLANA_RPC_ENDPOINT`: optional custom RPC URL
- `VITE_BASE_PATH`: optional base path for non-root hosting

## Builds

```bash
npm run build
```

GitHub Pages build (used by CI):

```bash
npm run build:pages
```

## Notes

The current mint flow confirms an on-chain SOL transfer to the treasury wallet and stores the confirmed signature per wallet in local storage.
