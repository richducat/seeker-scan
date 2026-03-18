import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, ExternalLink, RefreshCw, Swords, Trophy } from 'lucide-react';

const GAME_URL = `${import.meta.env.BASE_URL}tech-kombat/index.html`;

function TechKombatArcade({ latestSnapshot, onSnapshot, stats, favoriteFighter }) {
  const iframeRef = useRef(null);
  const [cabinetKey, setCabinetKey] = useState(0);
  const [snapshot, setSnapshot] = useState(latestSnapshot ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (latestSnapshot) {
      setSnapshot(latestSnapshot);
    }
  }, [latestSnapshot]);

  useEffect(() => {
    const poll = window.setInterval(() => {
      const gameWindow = iframeRef.current?.contentWindow;
      if (!gameWindow || typeof gameWindow.render_game_to_text !== 'function') {
        return;
      }

      try {
        const nextSnapshot = JSON.parse(gameWindow.render_game_to_text());
        setSnapshot(nextSnapshot);
        setReady(true);
        if (onSnapshot) {
          onSnapshot(nextSnapshot);
        }
      } catch {
        // Ignore parse errors while the cabinet is still booting.
      }
    }, 700);

    return () => window.clearInterval(poll);
  }, [cabinetKey, onSnapshot]);

  const heroLine = useMemo(() => {
    if (!snapshot?.player || !snapshot?.enemy) {
      return 'Cabinet booting. Pick a fighter and press Start.';
    }

    return `${snapshot.player.name} vs ${snapshot.enemy.name}`;
  }, [snapshot]);

  const handleReload = () => {
    setReady(false);
    setSnapshot(null);
    setCabinetKey((current) => current + 1);
  };

  const handleFocus = () => {
    iframeRef.current?.focus();
    iframeRef.current?.contentWindow?.focus();
  };

  const handleOpenCabinet = () => {
    window.open(GAME_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="arcade" className="glass-panel relative overflow-hidden rounded-[32px] p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,215,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,207,112,0.14),transparent_22%)]" />

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="section-kicker">Arcade Rail</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#13264f] text-[#7bd7ff] shadow-[0_0_30px_rgba(49,178,255,0.2)]">
                <Swords className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white md:text-3xl">Tech Kombat</h2>
                <p className="text-sm text-[#a6b6d6]">{heroLine}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="section-kicker !text-[0.58rem]">Matches</div>
              <div className="mt-2 text-xl font-semibold text-white">{stats.matches}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="section-kicker !text-[0.58rem]">Wins</div>
              <div className="mt-2 text-xl font-semibold text-[#88ffbf]">{stats.wins}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="section-kicker !text-[0.58rem]">Claimable</div>
              <div className="mt-2 text-xl font-semibold text-[#ffcf70]">{stats.claimableSkr.toFixed(3)} SKR</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="section-kicker !text-[0.58rem]">Favorite</div>
              <div className="mt-2 text-xl font-semibold text-white">{favoriteFighter}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[28px] border border-white/10 bg-[#050815] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2 text-xs text-[#9db2dd]">
                <span className={`h-2.5 w-2.5 rounded-full ${ready ? 'bg-[#88ffbf]' : 'bg-[#ffcf70]'}`} />
                {ready ? 'Cabinet synced to Seeker HQ' : 'Syncing cabinet state'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleFocus}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Focus controls
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restart cabinet
                </button>
                <button
                  type="button"
                  onClick={handleOpenCabinet}
                  className="inline-flex items-center gap-2 rounded-full bg-[#7bd7ff] px-3 py-2 text-xs font-semibold text-[#07111f] transition hover:bg-[#9fe8ff]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open full combat
                </button>
              </div>
            </div>

            <iframe
              key={cabinetKey}
              ref={iframeRef}
              title="Tech Kombat cabinet"
              src={GAME_URL}
              className="h-[980px] w-full rounded-[24px] border-0 bg-[#050815] md:h-[760px]"
              sandbox="allow-scripts allow-same-origin allow-popups allow-pointer-lock"
            />
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="section-kicker">Live Cabinet State</div>
              <div className="mt-3 space-y-4 text-sm text-[#c2d0eb]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">Mode</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {snapshot?.mode ? snapshot.mode.replace(/_/g, ' ') : 'booting'}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">Round</div>
                  <div className="mt-1 text-lg font-semibold text-white">{snapshot?.round ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">Timer</div>
                  <div className="mt-1 text-lg font-semibold text-white">{snapshot?.timer ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">Announcer</div>
                  <div className="mt-1 text-sm font-medium text-white">{snapshot?.announcer?.text || 'Standing by'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="section-kicker">Combat Snapshot</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[#0a1328] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">Player</div>
                      <div className="mt-1 text-lg font-semibold text-white">{snapshot?.player?.name || 'Waiting'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">HP</div>
                      <div className="mt-1 text-lg font-semibold text-[#88ffbf]">{snapshot?.player?.hp ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0a1328] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">CPU</div>
                      <div className="mt-1 text-lg font-semibold text-white">{snapshot?.enemy?.name || 'Waiting'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#7d90b6]">HP</div>
                      <div className="mt-1 text-lg font-semibold text-[#ffcf70]">{snapshot?.enemy?.hp ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0a1328] p-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="mt-0.5 h-4 w-4 text-[#7bd7ff]" />
                    <div className="text-sm text-[#a6b6d6]">
                      Match rewards sync into the Seeker vault automatically whenever a round or full match closes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TechKombatArcade;
