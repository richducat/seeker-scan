import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Coins,
  Download,
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  Lock,
  Radar,
  RefreshCw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Swords,
  Trophy,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';

import TechKombatArcade from './TechKombatArcade.jsx';
import '@solana/wallet-adapter-react-ui/styles.css';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const GAME_STATS_STORAGE_KEY = 'seeker-tech-kombat-stats-v1';
const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta').toLowerCase();
const SEEKER_GENESIS_MINTS = (import.meta.env.VITE_SEEKER_GENESIS_MINTS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const SOLANA_DAPP_PACKAGE = (import.meta.env.VITE_SOLANA_DAPP_PACKAGE || '').trim();

const MARKET_ASSETS = [
  {
    id: 'skr',
    name: 'Seeker',
    ticker: 'SKR',
    description: 'Core Seeker ecosystem signal.',
    query: import.meta.env.VITE_SKR_QUERY || 'Seeker SKR Solana',
    price: 0,
    change: 0,
    value: 'Loading...',
  },
  {
    id: 'sol',
    name: 'Solana',
    ticker: 'SOL',
    description: 'Base-layer liquidity and mobile demand.',
    query: 'SOL Solana',
    price: 0,
    change: 0,
    value: 'Loading...',
  },
  {
    id: 'bonk',
    name: 'Bonk',
    ticker: 'BONK',
    description: 'Community velocity proxy.',
    query: 'BONK',
    price: 0,
    change: 0,
    value: 'Loading...',
  },
  {
    id: 'pengu',
    name: 'Pudgy Penguins',
    ticker: 'PENGU',
    description: 'Culture and consumer momentum.',
    query: 'PENGU',
    price: 0,
    change: 0,
    value: 'Loading...',
  },
];

const EXCLUSIVE_MODULES = [
  {
    id: 'claim-room',
    title: 'Claim Room',
    detail: 'Collect drops, merch unlocks, whitelist proofs, and partner rewards without sending Seeker users across a dozen tabs.',
    cta: 'Open access rail',
    section: 'access',
    tab: 'access',
    tone: 'live',
    icon: Coins,
  },
  {
    id: 'dispatch-feed',
    title: 'Dispatch Feed',
    detail: 'Package launch notes, curated exclusives, and high-signal updates into one Seeker-native briefing surface.',
    cta: 'View hub board',
    section: 'hub',
    tab: 'hub',
    tone: 'ready',
    icon: Sparkles,
  },
  {
    id: 'partner-passes',
    title: 'Partner Passes',
    detail: 'Reserve space for ecosystem teams to plug in gated offers, beta codes, and mobile-only activations.',
    cta: 'Route perks',
    section: 'access',
    tab: 'access',
    tone: 'build',
    icon: BadgeCheck,
  },
  {
    id: 'tech-kombat',
    title: 'Tech Kombat',
    detail: 'Keep the cabinet inside the product so quests, tournaments, and retention loops all happen in one session.',
    cta: 'Launch cabinet',
    section: 'arcade',
    tab: 'arcade',
    tone: 'live',
    icon: Swords,
  },
  {
    id: 'mobile-launch',
    title: 'Solana Mobile Launch Rail',
    detail: 'Track install flow, package id, dApp Store listing, and release readiness from a single control room.',
    cta: 'Open launch rail',
    section: 'launch',
    tab: 'access',
    tone: 'launch',
    icon: Rocket,
  },
  {
    id: 'ecosystem-radar',
    title: 'Ecosystem Radar',
    detail: 'Keep live SKR and Solana-adjacent market context nearby without letting the price feed dominate the product.',
    cta: 'Open radar',
    section: 'radar',
    tab: 'hub',
    tone: 'data',
    icon: Radar,
  },
];

const HUB_TRACKS = [
  {
    id: 'verified-access',
    title: 'Verified access architecture',
    detail: 'Wallet connection is live now, and the Genesis allowlist rail is ready for a production SIWS + backend verification pass.',
  },
  {
    id: 'exclusive-routing',
    title: 'Exclusive routing',
    detail: 'The shell is now organized around gated claims, partner unlocks, mobile launch status, and community dispatch instead of a generic token dashboard.',
  },
  {
    id: 'arcade-sync',
    title: 'Arcade sync',
    detail: 'Tech Kombat is embedded as the in-app cabinet and round results feed the Seeker rewards vault automatically.',
  },
  {
    id: 'launch-path',
    title: 'Solana Mobile release path',
    detail: 'This ships today as a mobile-first PWA and includes the package-id hook you will use once the wrapped Android build is ready for the dApp Store.',
  },
];

const LAUNCH_PLAYBOOK = [
  {
    id: 'install',
    title: 'Install-ready shell',
    detail: 'The app keeps PWA install prompts front-and-center so Seeker users can add it immediately while the wrapped mobile build is prepared.',
    icon: Download,
  },
  {
    id: 'wallet',
    title: 'Wallet-native experience',
    detail: 'Solana wallet adapters stay inside the shell so gated perks and reward claims feel like one connected product.',
    icon: WalletIcon,
  },
  {
    id: 'verification',
    title: 'Genesis verification rail',
    detail: 'Use the env allowlist for quick checks now, then graduate the final gate to backend SIWS + SGT verification for production security.',
    icon: ShieldCheck,
  },
  {
    id: 'listing',
    title: 'dApp Store launch hook',
    detail: 'Once a wrapped package id exists, the store deep-link button opens the exact listing page from inside the app.',
    icon: Store,
  },
];

const DEFAULT_KOMBAT_STATS = {
  matches: 0,
  wins: 0,
  roundsWon: 0,
  perfectRounds: 0,
  claimableSkr: 0,
  lastClaim: null,
  lastResult: null,
  fighterPicks: {},
};

const formatCurrency = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '---';
  }

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })}`;
};

const formatWallet = (value) => {
  if (!value) {
    return 'Not connected';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const buildSignalData = (asset) => {
  const currentPrice = asset.price || 0;
  const changePercent = asset.change || 0;
  const base = 1 + changePercent / 100;
  const startPrice = currentPrice > 0 ? currentPrice / (base === 0 ? 1 : base) : 0;
  const pointsCount = 36;
  const points = [];

  for (let index = 0; index < pointsCount; index += 1) {
    const progress = index / (pointsCount - 1);
    const linearValue = startPrice + (currentPrice - startPrice) * progress;
    const variance = (Math.random() - 0.5) * Math.max(Math.abs(currentPrice - startPrice) * 0.18, currentPrice * 0.03);
    const value = index === pointsCount - 1 ? currentPrice : linearValue + variance;
    points.push({ index, value: Math.max(0, value) });
  }

  return points;
};

const getFavoriteFighter = (fighterPicks) => {
  const entries = Object.entries(fighterPicks || {});
  if (!entries.length) {
    return 'ELON';
  }

  entries.sort((left, right) => right[1] - left[1]);
  return entries[0][0];
};

const getPillClasses = (tone) => {
  if (tone === 'pass') {
    return 'bg-[#0f221a] text-[#88ffbf] border-[#1d5f3d]';
  }
  if (tone === 'warning') {
    return 'bg-[#28170f] text-[#ffcf70] border-[#5f401c]';
  }
  if (tone === 'alert') {
    return 'bg-[#2a1214] text-[#ff9788] border-[#6a2d32]';
  }
  return 'bg-[#111e37] text-[#7bd7ff] border-[#1f3d69]';
};

const SectionHeading = ({ kicker, title, body }) => {
  return (
    <div className="mb-5">
      <div className="section-kicker">{kicker}</div>
      <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a6b6d6] md:text-[0.96rem]">{body}</p>
    </div>
  );
};

const Header = ({ hasStorePackage, isInstalled, onInstall, onNavigate, onOpenStore, publicKey }) => {
  const { setVisible } = useWalletModal();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[rgba(3,8,21,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => onNavigate('hub', 'hub')} className="flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7bd7ff_0%,#2454ff_100%)] text-sm font-bold text-[#05101e] shadow-[0_12px_40px_rgba(49,178,255,0.3)]">
            SQ
          </span>
          <span>
            <span className="block text-[0.72rem] uppercase tracking-[0.32em] text-[#7bd7ff]">Seeker HQ</span>
            <span className="block text-sm font-semibold text-white">Mobile command center</span>
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => onNavigate('hub', 'hub')}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#c8d6ef] transition hover:bg-white/10 hover:text-white"
          >
            Hub
          </button>
          <button
            type="button"
            onClick={() => onNavigate('access', 'access')}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#c8d6ef] transition hover:bg-white/10 hover:text-white"
          >
            Access
          </button>
          <button
            type="button"
            onClick={() => onNavigate('arcade', 'arcade')}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#c8d6ef] transition hover:bg-white/10 hover:text-white"
          >
            Tech Kombat
          </button>
        </div>

        <div className="flex items-center gap-3">
          {hasStorePackage ? (
            <button
              type="button"
              onClick={onOpenStore}
              className="hidden items-center gap-2 rounded-full border border-[#1f3d69] bg-[#111e37] px-3 py-2 text-sm font-medium text-[#7bd7ff] transition hover:bg-[#172a4a] sm:inline-flex"
            >
              <Store className="h-4 w-4" />
              Open Store
            </button>
          ) : null}

          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Download className="h-4 w-4 text-[#7bd7ff]" />
            {isInstalled ? 'Installed' : 'Install'}
          </button>

          <button
            type="button"
            onClick={() => setVisible(true)}
            className="inline-flex items-center rounded-full bg-[#5e31c5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6b3de0] sm:hidden"
          >
            {publicKey ? formatWallet(publicKey.toBase58()) : 'Wallet'}
          </button>

          <div className="hidden sm:block wallet-adapter-wrapper">
            <WalletMultiButton className="!h-10 !rounded-full !bg-[#f4f7ff] !px-5 !text-sm !font-semibold !text-[#08111f] hover:!bg-white" />
          </div>
        </div>
      </div>
    </nav>
  );
};

const SignalChart = ({ asset }) => {
  const data = useMemo(() => buildSignalData(asset), [asset]);
  const positive = asset.change >= 0;
  const stroke = positive ? '#88ffbf' : '#ff9788';

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis hide dataKey="index" />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#08111f',
              borderColor: '#20314f',
              borderRadius: '14px',
              color: '#ffffff',
            }}
            formatter={(value) => [formatCurrency(Number(value)), asset.ticker]}
            labelFormatter={() => ''}
          />
          <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.4} fill="url(#signalFill)" fillOpacity={1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const HeroPanel = ({ accessTier, claimableSkr, favoriteFighter, hasStorePackage, onNavigate }) => {
  return (
    <section id="hub" className="glass-panel relative overflow-hidden rounded-[36px] p-6 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,215,255,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,207,112,0.14),transparent_30%)]" />
      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <div>
          <div className="section-kicker">Seeker-first product shell</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            One app for Seeker exclusives, with Tech Kombat built straight into the experience.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#b7c5de] md:text-lg">
            The app now behaves like a Seeker control room instead of a generic tracker. Users can connect a wallet, pass gated access checks,
            monitor ecosystem context, and jump directly into Tech Kombat without leaving the product.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${getPillClasses(accessTier === 'Verified' ? 'pass' : accessTier === 'Connected' ? 'warning' : 'info')}`}>
              <ShieldCheck className="h-4 w-4" />
              {accessTier} access tier
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${getPillClasses('info')}`}>
              <Gamepad2 className="h-4 w-4" />
              Tech Kombat live in-app
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${getPillClasses(hasStorePackage ? 'pass' : 'warning')}`}>
              <Store className="h-4 w-4" />
              {hasStorePackage ? 'dApp Store package ready' : 'Wrapper package pending'}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('arcade', 'arcade')}
              className="inline-flex items-center gap-2 rounded-full bg-[#7bd7ff] px-5 py-3 text-sm font-semibold text-[#06101d] transition hover:bg-[#9fe8ff]"
            >
              Launch Tech Kombat
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('access', 'access')}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open access rail
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,14,28,0.72)] p-5">
            <div className="section-kicker">Mission board</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7d90b6]">Claimable rewards</div>
                <div className="mt-2 text-2xl font-semibold text-[#ffcf70]">{claimableSkr.toFixed(3)} SKR</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7d90b6]">Favorite fighter</div>
                <div className="mt-2 text-2xl font-semibold text-white">{favoriteFighter}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#7d90b6]">Launch stance</div>
                <div className="mt-2 text-base font-semibold text-white">Solana Mobile ready</div>
                <p className="mt-2 text-sm leading-6 text-[#9fb0cf]">PWA today, wrapped Seeker dApp next, same product spine.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ModulesPanel = ({ onNavigate }) => {
  return (
    <section className="glass-panel rounded-[32px] p-5 md:p-7">
      <SectionHeading
        kicker="Exclusive Navigation"
        title="The app is organized around Seeker jobs instead of generic pages."
        body="Each module below is framed as part of the Seeker member experience: access, perks, launch readiness, and in-app play."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXCLUSIVE_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onNavigate(module.section, module.tab)}
              className="group rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#274c80] hover:bg-[rgba(255,255,255,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f1d38] text-[#7bd7ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses(module.tone === 'live' ? 'pass' : module.tone === 'launch' ? 'warning' : 'info')}`}>
                  {module.tone}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#a7b7d5]">{module.detail}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7bd7ff]">
                {module.cta}
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const HubTrackPanel = () => {
  return (
    <section className="glass-panel rounded-[32px] p-5 md:p-7">
      <SectionHeading
        kicker="Launch Board"
        title="The new structure is already aimed at Solana Mobile launch."
        body="These are the product tracks the app now covers natively, so the Seeker experience feels like a single destination instead of a list of disconnected links."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {HUB_TRACKS.map((track, index) => (
          <div key={track.id} className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
            <div className="section-kicker">{`Track 0${index + 1}`}</div>
            <h3 className="mt-3 text-xl font-semibold text-white">{track.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#a7b7d5]">{track.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const AccessPanel = ({
  accessTier,
  accessCheck,
  deviceLabel,
  hasStorePackage,
  isInstalled,
  onInstall,
  onOpenStore,
  publicKey,
}) => {
  const rows = [
    {
      id: 'wallet',
      label: 'Wallet rail',
      value: publicKey ? formatWallet(publicKey.toBase58()) : 'Connect wallet',
      tone: publicKey ? 'pass' : 'info',
      icon: WalletIcon,
    },
    {
      id: 'genesis',
      label: 'Genesis allowlist',
      value: accessCheck.loading
        ? 'Checking wallet mints'
        : accessCheck.matchedMint
          ? `${accessCheck.matchedMint.slice(0, 4)}...${accessCheck.matchedMint.slice(-4)} matched`
          : SEEKER_GENESIS_MINTS.length
            ? publicKey
              ? 'No matching mint found'
              : 'Connect wallet to verify'
            : 'Set VITE_SEEKER_GENESIS_MINTS',
      tone: accessCheck.matchedMint ? 'pass' : SEEKER_GENESIS_MINTS.length ? (publicKey ? 'warning' : 'info') : 'warning',
      icon: accessCheck.matchedMint ? ShieldCheck : ShieldAlert,
    },
    {
      id: 'install',
      label: 'Mobile footprint',
      value: isInstalled ? 'Installed on device' : deviceLabel,
      tone: isInstalled ? 'pass' : 'info',
      icon: Smartphone,
    },
    {
      id: 'listing',
      label: 'dApp Store package',
      value: hasStorePackage ? SOLANA_DAPP_PACKAGE : 'Pending wrapped package id',
      tone: hasStorePackage ? 'pass' : 'warning',
      icon: Store,
    },
  ];

  return (
    <section id="access" className="glass-panel rounded-[32px] p-5 md:p-6">
      <SectionHeading
        kicker="Access Rail"
        title="Seeker gating is now part of the product shell."
        body="The app can handle wallet connection, install state, optional Genesis allowlist checks, and eventually a dApp Store listing entrypoint from one place."
      />

      <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="section-kicker">Current tier</div>
            <div className="mt-2 text-2xl font-semibold text-white">{accessTier}</div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses(accessTier === 'Verified' ? 'pass' : accessTier === 'Connected' ? 'warning' : 'info')}`}>
            {accessTier}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#091124] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#11213e] text-[#7bd7ff]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{row.label}</div>
                    <div className="mt-1 text-xs text-[#8fa5cb]">{row.value}</div>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses(row.tone)}`}>
                  {row.tone}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center gap-2 rounded-full bg-[#7bd7ff] px-4 py-2 text-sm font-semibold text-[#06101d] transition hover:bg-[#9fe8ff]"
          >
            <Download className="h-4 w-4" />
            Install hub
          </button>
          <button
            type="button"
            onClick={onOpenStore}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Store className="h-4 w-4" />
            {hasStorePackage ? 'Open dApp listing' : 'Open publish portal'}
          </button>
        </div>

        <p className="mt-4 text-xs leading-6 text-[#90a4c8]">
          Production note: final Seeker-only gates should move to Sign-In With Solana plus backend verification of the Seeker Genesis token, not just a
          client-side wallet scan.
        </p>
      </div>
    </section>
  );
};

const LaunchRail = ({ hasStorePackage, onOpenStore }) => {
  return (
    <section id="launch" className="glass-panel rounded-[32px] p-5 md:p-6">
      <SectionHeading
        kicker="Launch Rail"
        title="The Solana Mobile release path is built into the app."
        body="This gives you a clear place to manage install behavior today and dApp Store navigation once the wrapped Android package is ready."
      />

      <div className="grid gap-3">
        {LAUNCH_PLAYBOOK.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#11213e] text-[#7bd7ff]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-[#9fb0cf]">{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenStore}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        <ExternalLink className="h-4 w-4 text-[#7bd7ff]" />
        {hasStorePackage ? 'Jump to Solana dApp Store listing' : 'Open Solana Mobile publish portal'}
      </button>
    </section>
  );
};

const RadarPanel = ({ activeAsset, loading, marketError, onRefresh, setActiveAsset, tokens }) => {
  return (
    <section id="radar" className="glass-panel rounded-[32px] p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="section-kicker">Ecosystem Radar</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Market context without leaving the hub</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-60"
          aria-label="Refresh market data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#7d90b6]">{activeAsset.ticker}</div>
            <div className="mt-2 text-3xl font-semibold text-white">{formatCurrency(activeAsset.price)}</div>
            <div className={`mt-2 text-sm font-semibold ${activeAsset.change >= 0 ? 'text-[#88ffbf]' : 'text-[#ff9788]'}`}>
              {activeAsset.change >= 0 ? '+' : ''}
              {activeAsset.change.toFixed(2)}%
            </div>
          </div>
          <div className="max-w-[180px] text-right text-xs leading-6 text-[#9fb0cf]">{activeAsset.description}</div>
        </div>

        <div className="mt-4">
          <SignalChart asset={activeAsset} />
        </div>

        {marketError ? <p className="mt-3 text-xs text-[#ff9788]">{marketError}</p> : null}
      </div>

      <div className="mt-4 grid gap-3">
        {tokens.map((token) => (
          <button
            key={token.id}
            type="button"
            onClick={() => setActiveAsset(token)}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              activeAsset.id === token.id
                ? 'border-[#305388] bg-[#101b31]'
                : 'border-white/10 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)]'
            }`}
          >
            <div>
              <div className="text-sm font-semibold text-white">{token.name}</div>
              <div className="mt-1 text-xs text-[#8ea5ca]">{token.ticker}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{token.value}</div>
              <div className={`mt-1 text-xs font-semibold ${token.change >= 0 ? 'text-[#88ffbf]' : 'text-[#ff9788]'}`}>
                {token.change >= 0 ? '+' : ''}
                {token.change.toFixed(2)}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

const RewardsVault = ({ claimFeedback, claimingRewards, favoriteFighter, gameStats, onClaimRewards }) => {
  return (
    <section id="rewards" className="glass-panel rounded-[32px] p-5 md:p-6">
      <SectionHeading
        kicker="Rewards Vault"
        title="Tech Kombat feeds the Seeker reward loop."
        body="Rounds and matches bank claimable rewards into the same app shell, so the game feels like an exclusive feature rather than a disconnected side project."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
          <div className="section-kicker !text-[0.56rem]">Matches</div>
          <div className="mt-2 text-xl font-semibold text-white">{gameStats.matches}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
          <div className="section-kicker !text-[0.56rem]">Wins</div>
          <div className="mt-2 text-xl font-semibold text-[#88ffbf]">{gameStats.wins}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
          <div className="section-kicker !text-[0.56rem]">Rounds won</div>
          <div className="mt-2 text-xl font-semibold text-white">{gameStats.roundsWon}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
          <div className="section-kicker !text-[0.56rem]">Claimable</div>
          <div className="mt-2 text-xl font-semibold text-[#ffcf70]">{gameStats.claimableSkr.toFixed(3)} SKR</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses('pass')}`}>
          <Trophy className="mr-1 inline h-3.5 w-3.5" />
          Favorite fighter: {favoriteFighter}
        </span>
        <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses('info')}`}>
          <Zap className="mr-1 inline h-3.5 w-3.5" />
          Perfect rounds: {gameStats.perfectRounds}
        </span>
        <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${getPillClasses('warning')}`}>
          <Lock className="mr-1 inline h-3.5 w-3.5" />
          Signed proof claim rail
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onClaimRewards}
          disabled={claimingRewards || gameStats.claimableSkr <= 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#7bd7ff] px-4 py-2 text-sm font-semibold text-[#06101d] transition hover:bg-[#9fe8ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Coins className="h-4 w-4" />
          {claimingRewards ? 'Claiming...' : 'Claim to wallet'}
        </button>
        <div className="text-sm text-[#a5b5d4]">{claimFeedback}</div>
      </div>

      {gameStats.lastResult ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#091124] p-4 text-sm text-[#9fb0cf]">
          Latest result: <span className="font-semibold text-white">{gameStats.lastResult.headline}</span>
          <div className="mt-1 text-xs text-[#7f93bb]">{gameStats.lastResult.detail}</div>
        </div>
      ) : null}

      {gameStats.lastClaim ? (
        <div className="mt-3 text-xs text-[#7f93bb]">
          Last claim: {Number(gameStats.lastClaim.amount).toFixed(3)} SKR at {new Date(gameStats.lastClaim.claimedAt).toLocaleString()}
        </div>
      ) : null}
    </section>
  );
};

const BottomNav = ({ activeTab, onChange }) => {
  const items = [
    { id: 'hub', label: 'Hub', icon: LayoutDashboard },
    { id: 'access', label: 'Access', icon: ShieldCheck },
    { id: 'arcade', label: 'Arcade', icon: Swords },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[rgba(4,8,18,0.92)] pb-safe backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[0.7rem] font-medium ${
                active ? 'text-[#7bd7ff]' : 'text-[#9eb0d0]'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function AppContent() {
  const { connection } = useConnection();
  const { publicKey, signMessage } = useWallet();

  const [tokens, setTokens] = useState(MARKET_ASSETS);
  const [activeAsset, setActiveAsset] = useState(MARKET_ASSETS[0]);
  const [loading, setLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [activeTab, setActiveTab] = useState('hub');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [installMessage, setInstallMessage] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState('Connect a wallet and run Tech Kombat to bank Seeker rewards.');
  const [accessCheck, setAccessCheck] = useState({
    loading: false,
    matchedMint: '',
    walletMintsCount: 0,
  });
  const [latestKombatSnapshot, setLatestKombatSnapshot] = useState(null);
  const [kombatStats, setKombatStats] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_KOMBAT_STATS;
    }

    try {
      const saved = window.localStorage.getItem(GAME_STATS_STORAGE_KEY);
      if (!saved) {
        return DEFAULT_KOMBAT_STATS;
      }
      return { ...DEFAULT_KOMBAT_STATS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_KOMBAT_STATS;
    }
  });

  const assetsRef = useRef(MARKET_ASSETS);
  const marketRequestInFlight = useRef(false);
  const lastRoundFingerprintRef = useRef('');
  const lastMatchFingerprintRef = useRef('');
  const lastSnapshotFingerprintRef = useRef('');

  useEffect(() => {
    assetsRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GAME_STATS_STORAGE_KEY, JSON.stringify(kombatStats));
    }
  }, [kombatStats]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
      setInstallMessage('Seeker HQ was installed to the device.');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standaloneMode) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!installMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setInstallMessage(''), 6000);
    return () => window.clearTimeout(timer);
  }, [installMessage]);

  useEffect(() => {
    let cancelled = false;

    if (!publicKey) {
      setAccessCheck({ loading: false, matchedMint: '', walletMintsCount: 0 });
      return undefined;
    }

    const loadAccess = async () => {
      setAccessCheck((current) => ({ ...current, loading: SEEKER_GENESIS_MINTS.length > 0 }));

      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        if (cancelled) {
          return;
        }

        const walletMints = new Set(
          accounts.value
            .map((account) => account.account.data.parsed?.info?.mint)
            .filter(Boolean)
        );
        const matchedMint = SEEKER_GENESIS_MINTS.find((mint) => walletMints.has(mint)) || '';

        setAccessCheck({
          loading: false,
          matchedMint,
          walletMintsCount: walletMints.size,
        });
      } catch {
        if (!cancelled) {
          setAccessCheck({
            loading: false,
            matchedMint: '',
            walletMintsCount: 0,
          });
        }
      }
    };

    void loadAccess();

    return () => {
      cancelled = true;
    };
  }, [connection, publicKey]);

  const fetchMarketData = useCallback(async ({ silent = false } = {}) => {
    if (marketRequestInFlight.current) {
      return;
    }

    marketRequestInFlight.current = true;
    if (!silent) {
      setLoading(true);
    }

    try {
      const updatedTokens = await Promise.all(
        assetsRef.current.map(async (token) => {
          if (!token.query) {
            return token;
          }

          try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${token.query}`);
            if (!response.ok) {
              throw new Error(`DexScreener returned ${response.status}`);
            }

            const data = await response.json();
            const pair = data.pairs?.find((entry) => entry.chainId === 'solana') || data.pairs?.[0];
            const price = Number.parseFloat(pair?.priceUsd);
            const change = Number.parseFloat(pair?.priceChange?.h24 ?? '0');

            if (!Number.isFinite(price)) {
              return token;
            }

            return {
              ...token,
              price,
              change: Number.isFinite(change) ? change : 0,
              value: formatCurrency(price),
            };
          } catch {
            return token;
          }
        })
      );

      const hasLivePrice = updatedTokens.some((token) => token.price > 0);
      setMarketError(hasLivePrice ? '' : 'Live pricing is temporarily unavailable.');
      assetsRef.current = updatedTokens;
      setTokens(updatedTokens);
      setActiveAsset((current) => updatedTokens.find((token) => token.id === current.id) || updatedTokens[0]);
    } finally {
      marketRequestInFlight.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchMarketData();

    const interval = window.setInterval(() => {
      void fetchMarketData({ silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchMarketData]);

  const accessTier = accessCheck.matchedMint
    ? 'Verified'
    : publicKey
      ? 'Connected'
      : 'Guest';

  const favoriteFighter = useMemo(() => getFavoriteFighter(kombatStats.fighterPicks), [kombatStats.fighterPicks]);

  const deviceLabel = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return 'Browser session';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      return 'Android mobile browser';
    }
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'iOS browser session';
    }
    return 'Desktop browser session';
  }, []);

  const jumpTo = useCallback((sectionId, tab = 'hub') => {
    setActiveTab(tab);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallMessage('Install accepted. Seeker HQ is ready for home screen launch.');
        setDeferredInstallPrompt(null);
      } else {
        setInstallMessage('Install dismissed. You can trigger it again anytime.');
      }
      return;
    }

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setInstallMessage('On iOS Safari, use Share then Add to Home Screen.');
      return;
    }

    setInstallMessage('Use your browser menu and choose Install app.');
  }, [deferredInstallPrompt]);

  const handleOpenStore = useCallback(() => {
    if (SOLANA_DAPP_PACKAGE) {
      window.location.href = `solanadappstore://details?id=${SOLANA_DAPP_PACKAGE}`;
      return;
    }

    window.open('https://publish.solanamobile.com/', '_blank', 'noopener,noreferrer');
  }, []);

  const handleKombatSnapshot = useCallback((snapshot) => {
    const snapshotFingerprint = JSON.stringify({
      mode: snapshot.mode,
      round: snapshot.round,
      message: snapshot.message,
      playerHp: snapshot.player?.hp,
      enemyHp: snapshot.enemy?.hp,
      playerRounds: snapshot.player?.rounds,
      enemyRounds: snapshot.enemy?.rounds,
      selectedPlayer: snapshot.roster?.selectedPlayer,
    });

    if (snapshotFingerprint !== lastSnapshotFingerprintRef.current) {
      lastSnapshotFingerprintRef.current = snapshotFingerprint;
      setLatestKombatSnapshot(snapshot);
    }

    if (snapshot.mode === 'round_over') {
      const roundFingerprint = `${snapshot.round}:${snapshot.player?.rounds}:${snapshot.enemy?.rounds}:${snapshot.message}`;
      if (roundFingerprint !== lastRoundFingerprintRef.current) {
        lastRoundFingerprintRef.current = roundFingerprint;

        if (snapshot.message === 'PLAYER WINS') {
          const perfectRound = Number(snapshot.player?.hp ?? 0) >= 92;
          const reward = 0.06 + (perfectRound ? 0.02 : 0);

          setKombatStats((previous) => ({
            ...previous,
            roundsWon: previous.roundsWon + 1,
            perfectRounds: previous.perfectRounds + (perfectRound ? 1 : 0),
            claimableSkr: Number((previous.claimableSkr + reward).toFixed(6)),
            lastResult: {
              headline: `${snapshot.player?.name || 'Player'} took round ${snapshot.round}`,
              detail: `${perfectRound ? 'Perfect round bonus secured. ' : ''}+${reward.toFixed(3)} SKR banked from the cabinet.`,
            },
          }));

          setClaimFeedback(`Round won with ${snapshot.player?.name || 'your fighter'}: +${reward.toFixed(3)} SKR queued.`);
        }
      }
    }

    if (snapshot.mode === 'match_over') {
      const matchFingerprint = `${snapshot.round}:${snapshot.player?.rounds}:${snapshot.enemy?.rounds}:${snapshot.message}`;
      if (matchFingerprint !== lastMatchFingerprintRef.current) {
        lastMatchFingerprintRef.current = matchFingerprint;

        const playerWon = snapshot.message === 'PLAYER VICTORY';
        const reward = playerWon ? 0.18 : 0.03;
        const playerName = snapshot.player?.name || 'Unknown';

        setKombatStats((previous) => ({
          ...previous,
          matches: previous.matches + 1,
          wins: previous.wins + (playerWon ? 1 : 0),
          claimableSkr: Number((previous.claimableSkr + reward).toFixed(6)),
          fighterPicks: {
            ...previous.fighterPicks,
            [playerName]: (previous.fighterPicks[playerName] || 0) + 1,
          },
          lastResult: {
            headline: playerWon ? `${playerName} won the match` : `${playerName} logged a match`,
            detail: playerWon
              ? `Full match bonus secured. +${reward.toFixed(3)} SKR added to the vault.`
              : `Participation credit queued. +${reward.toFixed(3)} SKR added to the vault.`,
          },
        }));

        setClaimFeedback(
          playerWon
            ? `Match victory with ${playerName}: +${reward.toFixed(3)} SKR bonus banked.`
            : `Match logged with ${playerName}: +${reward.toFixed(3)} SKR participation credit banked.`
        );
      }
    }
  }, []);

  const handleClaimRewards = useCallback(async () => {
    if (!publicKey) {
      setClaimFeedback('Connect a wallet first to claim rewards.');
      return;
    }

    if (kombatStats.claimableSkr <= 0) {
      setClaimFeedback('No rewards to claim yet. Play Tech Kombat first.');
      return;
    }

    setClaimingRewards(true);
    const claimAmount = Number(kombatStats.claimableSkr.toFixed(6));

    try {
      let proof = 'queued-no-signature';

      if (signMessage) {
        const payload = new TextEncoder().encode(
          `Seeker HQ Reward Claim\nWallet:${publicKey.toBase58()}\nAmount:${claimAmount}\nNetwork:${SOLANA_NETWORK}\nFavorite:${favoriteFighter}\nTime:${new Date().toISOString()}`
        );
        const signature = await signMessage(payload);
        proof = Array.from(signature.slice(0, 16))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
      }

      setKombatStats((previous) => ({
        ...previous,
        claimableSkr: 0,
        lastClaim: {
          amount: claimAmount,
          wallet: publicKey.toBase58(),
          proof,
          claimedAt: new Date().toISOString(),
        },
      }));

      setClaimFeedback(`Claim submitted for ${claimAmount.toFixed(3)} SKR. Proof: ${proof}`);
    } catch (error) {
      setClaimFeedback(error instanceof Error ? error.message : 'Claim failed.');
    } finally {
      setClaimingRewards(false);
    }
  }, [favoriteFighter, kombatStats.claimableSkr, publicKey, signMessage]);

  const hubContent = (
    <div className="space-y-6">
      <HeroPanel
        accessTier={accessTier}
        claimableSkr={kombatStats.claimableSkr}
        favoriteFighter={favoriteFighter}
        hasStorePackage={Boolean(SOLANA_DAPP_PACKAGE)}
        onNavigate={jumpTo}
      />
      <ModulesPanel onNavigate={jumpTo} />
      <HubTrackPanel />
      <div className="lg:hidden">
        <RadarPanel
          activeAsset={activeAsset}
          loading={loading}
          marketError={marketError}
          onRefresh={() => void fetchMarketData()}
          setActiveAsset={setActiveAsset}
          tokens={tokens}
        />
      </div>
    </div>
  );

  const accessContent = (
    <div className="space-y-6">
      <AccessPanel
        accessTier={accessTier}
        accessCheck={accessCheck}
        deviceLabel={deviceLabel}
        hasStorePackage={Boolean(SOLANA_DAPP_PACKAGE)}
        isInstalled={isInstalled}
        onInstall={handleInstall}
        onOpenStore={handleOpenStore}
        publicKey={publicKey}
      />
      <LaunchRail hasStorePackage={Boolean(SOLANA_DAPP_PACKAGE)} onOpenStore={handleOpenStore} />
      <RewardsVault
        claimFeedback={claimFeedback}
        claimingRewards={claimingRewards}
        favoriteFighter={favoriteFighter}
        gameStats={kombatStats}
        onClaimRewards={handleClaimRewards}
      />
    </div>
  );

  const arcadeContent = (
    <div className="space-y-6">
      <TechKombatArcade
        latestSnapshot={latestKombatSnapshot}
        onSnapshot={handleKombatSnapshot}
        stats={kombatStats}
        favoriteFighter={favoriteFighter}
      />
      <div className="lg:hidden">
        <RewardsVault
          claimFeedback={claimFeedback}
          claimingRewards={claimingRewards}
          favoriteFighter={favoriteFighter}
          gameStats={kombatStats}
          onClaimRewards={handleClaimRewards}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 pt-safe text-white md:pb-10">
      <Header
        hasStorePackage={Boolean(SOLANA_DAPP_PACKAGE)}
        isInstalled={isInstalled}
        onInstall={handleInstall}
        onNavigate={jumpTo}
        onOpenStore={handleOpenStore}
        publicKey={publicKey}
      />

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {installMessage ? (
          <div className="glass-panel mb-4 rounded-2xl px-4 py-3 text-sm text-[#b7c5de]">{installMessage}</div>
        ) : null}

        <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="space-y-6">
            {hubContent}
            {arcadeContent}
          </div>

          <div className="space-y-6">
            {accessContent}
            <RadarPanel
              activeAsset={activeAsset}
              loading={loading}
              marketError={marketError}
              onRefresh={() => void fetchMarketData()}
              setActiveAsset={setActiveAsset}
              tokens={tokens}
            />
          </div>
        </div>

        <div className="space-y-6 lg:hidden">
          {activeTab === 'hub' ? hubContent : null}
          {activeTab === 'access' ? accessContent : null}
          {activeTab === 'arcade' ? arcadeContent : null}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
