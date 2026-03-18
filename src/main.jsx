import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';

const NETWORK_BY_ENV = {
  mainnet: WalletAdapterNetwork.Mainnet,
  'mainnet-beta': WalletAdapterNetwork.Mainnet,
  devnet: WalletAdapterNetwork.Devnet,
  testnet: WalletAdapterNetwork.Testnet,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

function AppProviders({ children }) {
  const configuredNetwork = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta').toLowerCase();
  const network = NETWORK_BY_ENV[configuredNetwork] || WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(
    () => (import.meta.env.VITE_SOLANA_RPC_ENDPOINT || '').trim() || clusterApiUrl(network),
    [network]
  );
  const appIdentity = useMemo(
    () => ({
      name: 'Seeker HQ',
      uri: typeof window === 'undefined' ? '' : window.location.origin,
      icon: typeof window === 'undefined' ? '' : new URL('/pwa-icon-192.png', window.location.origin).toString(),
    }),
    []
  );
  const isMobileBrowser =
    typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const wallets = useMemo(
    () => {
      const configuredWallets = [];
      const addWallet = (label, factory) => {
        try {
          const wallet = factory();
          if (wallet) {
            configuredWallets.push(wallet);
          }
        } catch (error) {
          console.warn(`Wallet adapter "${label}" failed to initialize`, error);
        }
      };

      addWallet('SolanaMobile', () => new SolanaMobileWalletAdapter({ appIdentity }));
      addWallet('Phantom', () => new PhantomWalletAdapter());
      addWallet('Solflare', () => new SolflareWalletAdapter());
      addWallet('Torus', () => new TorusWalletAdapter());
      if (!isMobileBrowser) {
        addWallet('Ledger', () => new LedgerWalletAdapter());
      }

      return configuredWallets;
    },
    [appIdentity, isMobileBrowser]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
