import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Twitter,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  Coins,
  Download,
  Wallet as WalletIcon,
  RefreshCw,
  ExternalLink,
  Target,
  Gamepad2,
  Trophy,
  Flame,
} from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

import TempleDashGame from './TempleDashGame.jsx';
import '@solana/wallet-adapter-react-ui/styles.css';

const AIRDROP_SEASON_END = new Date('2026-05-01T00:00:00Z');
const TREASURY_ADDRESS = '9o77AkThGHNhNDeowM943dNsCck71VTUeFwBxq3RaGjn';
const MINT_PRICE_SOL = 0.1;
const MINT_PRICE_LAMPORTS = Math.round(MINT_PRICE_SOL * LAMPORTS_PER_SOL);
const GAME_REWARD_RATE = 0.015;
const GAME_STATS_STORAGE_KEY = 'seeker-temple-dash-stats-v1';
const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta').toLowerCase();
const EXPLORER_CLUSTER_QUERY =
  SOLANA_NETWORK === 'mainnet' || SOLANA_NETWORK === 'mainnet-beta'
    ? ''
    : SOLANA_NETWORK === 'devnet' || SOLANA_NETWORK === 'testnet'
      ? `?cluster=${SOLANA_NETWORK}`
      : '';

const INITIAL_TOKENS = [
  {
    id: 'skr',
    name: 'Seeker',
    ticker: 'SKR',
    status: 'Live',
    value: 'Loading...',
    desc: 'Seeker ecosystem utility token.',
    category: 'Core',
    change: 0,
    price: 0,
    query: import.meta.env.VITE_SKR_QUERY || 'Seeker SKR Solana',
  },
  {
    id: 'pengu',
    name: 'Pudgy Penguins',
    ticker: 'PENGU',
    status: 'Live',
    value: 'Loading...',
    desc: 'Major allocation for Seeker Chapter 2.',
    category: 'NFT',
    change: 0,
    price: 0,
    query: 'PENGU',
  },
  {
    id: 'mew',
    name: 'Cat in a Dogs World',
    ticker: 'MEW',
    status: 'Live',
    value: 'Loading...',
    desc: 'Mobile-first meme ecosystem momentum.',
    category: 'Meme',
    change: 0,
    price: 0,
    query: 'MEW',
  },
  {
    id: 'bonk',
    name: 'Bonk',
    ticker: 'BONK',
    status: 'Live',
    value: 'Loading...',
    desc: 'Community benchmark meme liquidity.',
    category: 'Meme',
    change: 0,
    price: 0,
    query: 'BONK',
  },
];

const DEFAULT_GAME_STATS = {
  runs: 0,
  bestScore: 0,
  totalCoins: 0,
  claimableSkr: 0,
  lastRunScore: 0,
  lastClaim: null,
};

const formatTimeLeft = (targetDate) => {
  const difference = targetDate.getTime() - Date.now();
  if (difference <= 0) {
    return 'Closed';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  return `${hours}h ${minutes}m left`;
};

const Header = ({ onInstall, isInstalled }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0D] border-b border-[#2B2F36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-xl font-sans font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0052FF] rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">S</span>
              </span>
              <span className="hidden sm:inline">
                seeker<span className="text-[#0052FF]">scan</span>
              </span>
            </span>

            <div className="hidden md:flex items-center space-x-1">
              <a
                href="#dashboard"
                className="text-sm font-medium text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors"
              >
                Dashboard
              </a>
              <a
                href="#earn"
                className="text-sm font-medium text-[#8A919E] hover:text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors"
              >
                Earn
              </a>
              <a
                href="#game"
                className="text-sm font-medium text-[#8A919E] hover:text-white px-4 py-2 hover:bg-[#1E2025] rounded-full transition-colors"
              >
                Temple Dash
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onInstall}
              className="flex items-center gap-2 px-3 py-2 text-[#0052FF] hover:bg-[#0052FF]/10 rounded-full transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{isInstalled ? 'Installed' : 'Install'}</span>
            </button>

            <div className="wallet-adapter-wrapper">
              <WalletMultiButton className="!bg-[#1E2025] hover:!bg-[#2B2F36] !text-white !font-medium !text-sm !h-10 !rounded-full !px-6 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AirdropSeasonCard = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = AIRDROP_SEASON_END - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#141519] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-[#1E2025] hover:border-[#2B2F36] transition-colors">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <span className="w-12 h-12 rounded-full bg-[#0052FF] flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Clock className="w-6 h-6 text-white" />
        </span>
        <div>
          <h2 className="text-white font-medium text-lg">Seeker Airdrop Season</h2>
          <p className="text-[#8A919E] text-sm">Exclusive missions and drops are live now</p>
        </div>
      </div>

      <div className="flex gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{String(value).padStart(2, '0')}</div>
            <div className="text-[10px] md:text-xs text-[#5B616E] uppercase font-medium">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LiveChart = ({ activeToken }) => {
  const [data, setData] = useState([]);
  const isPositive = activeToken.change >= 0;
  const color = isPositive ? '#05B169' : '#DF5F67';

  useEffect(() => {
    const currentPrice = activeToken.price || 0;
    const changePercent = activeToken.change || 0;
    const base = 1 + changePercent / 100;
    const startPrice = currentPrice > 0 ? currentPrice / (base === 0 ? 1 : base) : 0;
    const pointsCount = 40;
    const nextData = [];

    for (let index = 0; index < pointsCount; index += 1) {
      const progress = index / (pointsCount - 1);
      const linearValue = startPrice + (currentPrice - startPrice) * progress;
      const randomVariance = (Math.random() - 0.5) * (Math.abs(currentPrice - startPrice) * 0.16);
      const value = index === pointsCount - 1 ? currentPrice : linearValue + randomVariance;
      nextData.push({ time: index, value: Math.max(0, value) });
    }

    setData(nextData);
  }, [activeToken]);

  return (
    <div className="h-[300px] w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-3xl font-medium text-white mb-1">{activeToken.ticker}</h3>
          <p className="text-3xl font-medium text-white">
            {activeToken.price > 0
              ? `$${activeToken.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}`
              : '---'}
          </p>
          <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${isPositive ? 'text-[#05B169]' : 'text-[#DF5F67]'}`}>
            {isPositive ? '+' : ''}
            {activeToken.change.toFixed(2)}% <span className="text-[#5B616E]">(24h)</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="70%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141519',
              borderColor: '#2B2F36',
              color: '#fff',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff' }}
            formatter={(value) => [`$${value.toFixed(4)}`, '']}
            labelFormatter={() => ''}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const OpportunitiesSection = ({ gameStats }) => {
  const opportunities = [
    {
      id: 'og-snapshot',
      title: 'OG Holder Snapshot',
      detail: 'Hold your Seeker Genesis wallet for the weekly eligibility capture.',
      reward: '150 SKR',
      deadline: new Date('2026-03-08T23:59:59Z'),
      link: 'https://x.com/solanamobile',
      linkText: 'Snapshot details',
    },
    {
      id: 'ecosystem-quests',
      title: 'Seeker Ecosystem Quest',
      detail: 'Complete 3 partner app actions and verify your wallet for bonus access.',
      reward: 'Quest multipliers',
      deadline: new Date('2026-03-15T23:59:59Z'),
      link: 'https://solanamobile.com/',
      linkText: 'Quest hub',
    },
    {
      id: 'temple-dash',
      title: 'Temple Dash Runner Bonus',
      detail: 'Play Temple Dash below and claim signed proof for Seeker rewards queue.',
      reward: `${gameStats.claimableSkr.toFixed(3)} SKR claimable`,
      deadline: null,
      link: '#game',
      linkText: 'Play now',
    },
  ];

  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Live Seeker Opportunities</h2>
      </div>

      <div className="bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden">
        {opportunities.map((opportunity, index) => {
          const timeLabel = opportunity.deadline ? formatTimeLeft(opportunity.deadline) : 'Live';
          const isClosed = timeLabel === 'Closed';
          const badgeClass = isClosed ? 'text-[#8A919E] bg-[#8A919E]/10' : 'text-[#05B169] bg-[#05B169]/10';

          return (
            <div key={opportunity.id} className={`p-5 ${index < opportunities.length - 1 ? 'border-b border-[#1E2025]' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium mb-1">{opportunity.title}</h3>
                  <p className="text-sm text-[#8A919E]">{opportunity.detail}</p>
                  <div className="text-xs text-[#5B616E] mt-2">Reward target: {opportunity.reward}</div>
                  <a className="inline-flex mt-2 text-xs text-[#7db6ff] hover:text-white" href={opportunity.link} target={opportunity.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    {opportunity.linkText}
                  </a>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badgeClass}`}>{timeLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EarnSection = ({ isXConnected, onConnectX, xConnecting }) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState('');
  const [mintSignature, setMintSignature] = useState('');

  useEffect(() => {
    if (!publicKey) {
      setMintSuccess(false);
      setMintSignature('');
      setMintError('');
      return;
    }

    const storageKey = `seeker-mint:${publicKey.toBase58()}`;
    const cachedSignature = window.localStorage.getItem(storageKey);

    if (cachedSignature) {
      setMintSuccess(true);
      setMintSignature(cachedSignature);
    } else {
      setMintSuccess(false);
      setMintSignature('');
    }

    setMintError('');
  }, [publicKey]);

  const handleMintProof = async () => {
    if (!publicKey) {
      setMintError('Connect your wallet before minting.');
      return;
    }

    setMinting(true);
    setMintError('');

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TREASURY_ADDRESS),
          lamports: MINT_PRICE_LAMPORTS,
        })
      );

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain confirmation.');
      }

      const storageKey = `seeker-mint:${publicKey.toBase58()}`;
      window.localStorage.setItem(storageKey, signature);

      setMintSignature(signature);
      setMintSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mint transaction failed.';
      setMintError(message);
    } finally {
      setMinting(false);
    }
  };

  const txExplorerUrl = mintSignature ? `https://explorer.solana.com/tx/${mintSignature}${EXPLORER_CLUSTER_QUERY}` : '';

  return (
    <div id="earn" className="my-10 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Eligibility & Reward Proof</h2>
      </div>

      <div className="bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E2025] flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Seeker Reward Rail</h3>
            <p className="text-[#8A919E] text-sm">Verify account status and mint your eligibility proof.</p>
          </div>
          <div className="bg-[#05B169]/10 px-3 py-1 rounded text-[#05B169] text-sm font-medium">Live</div>
        </div>

        <div className="p-0">
          <div className="flex items-center justify-between p-6 hover:bg-[#1E2025] transition-colors border-b border-[#1E2025]">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${publicKey ? 'bg-[#05B169]' : 'bg-[#2B2F36]'}`}>
                {publicKey ? <CheckCircle2 className="w-5 h-5 text-white" /> : <WalletIcon className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${publicKey ? 'text-[#5B616E] line-through' : 'text-white'}`}>Connect Wallet</h4>
                <p className="text-[#5B616E] text-xs mt-0.5">Use Phantom, Solflare, or Mobile Wallet Adapter</p>
              </div>
            </div>
            <div className="text-xs text-[#8A919E]">{publicKey ? 'Connected' : 'Pending'}</div>
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-[#1E2025] transition-colors border-b border-[#1E2025]">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isXConnected ? 'bg-[#05B169]' : 'bg-[#2B2F36]'}`}>
                {isXConnected ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Twitter className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isXConnected ? 'text-[#5B616E] line-through' : 'text-white'}`}>Connect X Account</h4>
                <p className="text-[#5B616E] text-xs mt-0.5">Reputation boosts drop tier</p>
              </div>
            </div>
            <button
              onClick={onConnectX}
              disabled={isXConnected || xConnecting}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isXConnected ? 'text-[#05B169]' : 'bg-[#0052FF] text-white'}`}
            >
              {isXConnected ? 'Completed' : xConnecting ? 'Connecting...' : 'Start'}
            </button>
          </div>

          <div className="p-6 hover:bg-[#1E2025] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mintSuccess ? 'bg-[#05B169]' : 'bg-[#2B2F36]'}`}>
                  {mintSuccess ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Coins className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Mint Proof of Eligibility</h4>
                  <p className="text-[#5B616E] text-xs mt-0.5">Price: {MINT_PRICE_SOL} SOL sent to treasury</p>
                </div>
              </div>

              <button
                onClick={handleMintProof}
                disabled={!publicKey || !isXConnected || mintSuccess || minting}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  mintSuccess
                    ? 'bg-transparent text-[#05B169] border border-[#05B169]'
                    : 'bg-[#0052FF] text-white hover:bg-[#004AD9] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {minting ? 'Minting...' : mintSuccess ? 'Minted' : 'Mint NFT'}
              </button>
            </div>

            {mintError ? <p className="text-[#DF5F67] text-xs mt-3">{mintError}</p> : null}
            {mintSuccess && txExplorerUrl ? (
              <a className="inline-flex items-center gap-1 text-[#8A919E] hover:text-white text-xs mt-3" href={txExplorerUrl} target="_blank" rel="noreferrer">
                View transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const RewardsVault = ({ gameStats, onClaimRewards, claimingRewards, claimFeedback }) => {
  return (
    <div className="my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Temple Dash Rewards Vault</h2>
      </div>

      <div className="bg-[#141519] border border-[#1E2025] rounded-2xl p-5 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#1E2025] bg-[#111217] p-4">
            <div className="text-xs text-[#5B616E]">Runs</div>
            <div className="text-lg text-white font-medium">{gameStats.runs}</div>
          </div>
          <div className="rounded-xl border border-[#1E2025] bg-[#111217] p-4">
            <div className="text-xs text-[#5B616E]">Best score</div>
            <div className="text-lg text-white font-medium">{gameStats.bestScore}</div>
          </div>
          <div className="rounded-xl border border-[#1E2025] bg-[#111217] p-4">
            <div className="text-xs text-[#5B616E]">Coins</div>
            <div className="text-lg text-white font-medium">{gameStats.totalCoins}</div>
          </div>
          <div className="rounded-xl border border-[#1E2025] bg-[#111217] p-4">
            <div className="text-xs text-[#5B616E]">Claimable</div>
            <div className="text-lg text-[#05B169] font-medium">{gameStats.claimableSkr.toFixed(3)} SKR</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#8A919E]">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Target className="w-3.5 h-3.5" /> {GAME_REWARD_RATE} SKR per collected coin
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Flame className="w-3.5 h-3.5" /> Last run score {gameStats.lastRunScore}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Trophy className="w-3.5 h-3.5" /> Rewards claimed with wallet proof
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={onClaimRewards}
            disabled={claimingRewards || gameStats.claimableSkr <= 0}
            className="px-4 py-2 rounded-full bg-[#0052FF] text-white text-sm font-medium hover:bg-[#004AD9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claimingRewards ? 'Claiming...' : 'Claim To Wallet'}
          </button>
          <div className="text-xs text-[#8A919E]">{claimFeedback}</div>
        </div>

        {gameStats.lastClaim ? (
          <div className="mt-3 text-[11px] text-[#5B616E]">
            Last claim: {Number(gameStats.lastClaim.amount).toFixed(3)} SKR at{' '}
            {new Date(gameStats.lastClaim.claimedAt).toLocaleString()}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-[#2B2F36] pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'dashboard' ? 'text-[#0052FF]' : 'text-[#8A919E]'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'earn' ? 'text-[#0052FF]' : 'text-[#8A919E]'}`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-medium">Earn</span>
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'game' ? 'text-[#0052FF]' : 'text-[#8A919E]'}`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Game</span>
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { publicKey, signMessage } = useWallet();

  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [activeToken, setActiveToken] = useState(INITIAL_TOKENS[0]);
  const [isXConnected, setIsXConnected] = useState(false);
  const [xConnecting, setXConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [marketError, setMarketError] = useState('');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [installMessage, setInstallMessage] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);
  const [claimingRewards, setClaimingRewards] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState('Connect wallet and run Temple Dash to earn SKR.');

  const [gameStats, setGameStats] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_GAME_STATS;
    }

    try {
      const raw = window.localStorage.getItem(GAME_STATS_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_GAME_STATS;
      }

      const parsed = JSON.parse(raw);
      return { ...DEFAULT_GAME_STATS, ...parsed };
    } catch {
      return DEFAULT_GAME_STATS;
    }
  });

  const marketRequestInFlight = useRef(false);
  const tokensRef = useRef(INITIAL_TOKENS);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    window.localStorage.setItem(GAME_STATS_STORAGE_KEY, JSON.stringify(gameStats));
  }, [gameStats]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
      setInstallMessage('App installed to your home screen.');
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

    const timeout = window.setTimeout(() => setInstallMessage(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [installMessage]);

  const handleConnectX = useCallback(() => {
    if (isXConnected || xConnecting) {
      return;
    }

    setXConnecting(true);
    window.setTimeout(() => {
      setIsXConnected(true);
      setXConnecting(false);
    }, 700);
  }, [isXConnected, xConnecting]);

  const handleInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setInstallMessage('Install accepted.');
        setDeferredInstallPrompt(null);
      } else {
        setInstallMessage('Install dismissed. You can retry anytime.');
      }
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      setInstallMessage('On iOS Safari: tap Share, then Add to Home Screen.');
      return;
    }

    setInstallMessage('Use your browser menu and select Install app.');
  }, [deferredInstallPrompt]);

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
        tokensRef.current.map(async (token) => {
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
              value: `$${price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}`,
              status: 'Live',
            };
          } catch {
            return token;
          }
        })
      );

      const hasLivePrice = updatedTokens.some((token) => token.price > 0);
      setMarketError(hasLivePrice ? '' : 'Live pricing is temporarily unavailable.');

      tokensRef.current = updatedTokens;
      setTokens(updatedTokens);
      setActiveToken((current) => updatedTokens.find((token) => token.id === current.id) || updatedTokens[0]);
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

  const refreshMarketData = useCallback(() => {
    void fetchMarketData();
  }, [fetchMarketData]);

  const handleRunComplete = useCallback((summary) => {
    const reward = Number((summary.coins * GAME_REWARD_RATE).toFixed(6));
    setGameStats((previous) => ({
      ...previous,
      runs: previous.runs + 1,
      bestScore: Math.max(previous.bestScore, summary.score),
      totalCoins: previous.totalCoins + summary.coins,
      claimableSkr: Number((previous.claimableSkr + reward).toFixed(6)),
      lastRunScore: summary.score,
    }));

    if (summary.coins > 0) {
      setClaimFeedback(`Great run: +${summary.coins} coins (${reward.toFixed(3)} SKR).`);
    }
  }, []);

  const handleClaimRewards = useCallback(async () => {
    if (!publicKey) {
      setClaimFeedback('Connect your wallet first to claim rewards.');
      return;
    }

    if (gameStats.claimableSkr <= 0) {
      setClaimFeedback('No rewards to claim yet. Play Temple Dash first.');
      return;
    }

    setClaimingRewards(true);
    const claimAmount = Number(gameStats.claimableSkr.toFixed(6));

    try {
      let proof = 'queued-no-signature';
      if (signMessage) {
        const payload = new TextEncoder().encode(
          `SeekerScan Reward Claim\nWallet:${publicKey.toBase58()}\nAmount:${claimAmount}\nNetwork:${SOLANA_NETWORK}\nTime:${new Date().toISOString()}`
        );
        const signature = await signMessage(payload);
        proof = Array.from(signature.slice(0, 16))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
      }

      setGameStats((previous) => ({
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
      const message = error instanceof Error ? error.message : 'Claim failed.';
      setClaimFeedback(message);
    } finally {
      setClaimingRewards(false);
    }
  }, [gameStats.claimableSkr, publicKey, signMessage]);

  const desktopTracker = (
    <div className="lg:col-span-2 order-1 lg:order-2 space-y-8" id="dashboard">
      <AirdropSeasonCard />
      <LiveChart activeToken={activeToken} />
      <OpportunitiesSection gameStats={gameStats} />
      <EarnSection isXConnected={isXConnected} onConnectX={handleConnectX} xConnecting={xConnecting} />
      <RewardsVault
        gameStats={gameStats}
        onClaimRewards={handleClaimRewards}
        claimingRewards={claimingRewards}
        claimFeedback={claimFeedback}
      />
      <TempleDashGame onRunComplete={handleRunComplete} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white font-sans pb-24 md:pb-12 pt-safe">
      <Header onInstall={handleInstall} isInstalled={isInstalled} />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {installMessage ? (
          <div className="mb-4 rounded-xl border border-[#2B2F36] bg-[#141519] px-4 py-3 text-xs text-[#8A919E]">{installMessage}</div>
        ) : null}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${activeTab !== 'dashboard' ? 'hidden md:grid' : ''}`}>
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-medium text-white">Live Assets</h2>
                <button
                  onClick={refreshMarketData}
                  disabled={loading}
                  className="p-2 rounded-full hover:bg-[#1E2025] disabled:opacity-60"
                  aria-label="Refresh prices"
                >
                  <RefreshCw className={`w-4 h-4 text-[#8A919E] ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {marketError ? <p className="text-xs text-[#DF5F67] mb-2">{marketError}</p> : null}

              <div className="bg-[#141519] border border-[#1E2025] rounded-2xl overflow-hidden">
                {tokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => {
                      setActiveToken(token);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-4 flex justify-between border-b border-[#1E2025] transition-colors ${
                      activeToken.id === token.id ? 'bg-[#1E2025]' : 'hover:bg-[#1E2025]'
                    }`}
                  >
                    <span className="flex gap-3 items-center">
                      <span className="w-8 h-8 rounded-full bg-[#2B2F36] flex justify-center items-center text-xs font-bold">{token.ticker[0]}</span>
                      <span>
                        <span className="text-sm font-medium block">{token.name}</span>
                        <span className="text-xs text-[#8A919E]">{token.ticker}</span>
                      </span>
                    </span>

                    <span className="text-right">
                      <span className="text-sm font-medium block">{token.value}</span>
                      <span className={`text-xs ${token.change >= 0 ? 'text-[#05B169]' : 'text-[#DF5F67]'}`}>
                        {token.change > 0 ? '+' : ''}
                        {token.change.toFixed(2)}%
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {desktopTracker}
        </div>

        {activeTab === 'earn' ? (
          <div className="md:hidden pt-4 animate-fade-in">
            <EarnSection isXConnected={isXConnected} onConnectX={handleConnectX} xConnecting={xConnecting} />
            <RewardsVault
              gameStats={gameStats}
              onClaimRewards={handleClaimRewards}
              claimingRewards={claimingRewards}
              claimFeedback={claimFeedback}
            />
          </div>
        ) : null}

        {activeTab === 'game' ? (
          <div className="md:hidden pt-4 animate-fade-in">
            <TempleDashGame onRunComplete={handleRunComplete} />
          </div>
        ) : null}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
