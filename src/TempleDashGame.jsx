import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Trophy, Coins, Maximize2, RotateCcw } from 'lucide-react';

const LANE_VALUES = [-1, 0, 1];
const DRAW_DISTANCE = 46;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const createInitialGameState = () => ({
  mode: 'start',
  playerLane: 0,
  targetLane: 0,
  playerY: 0,
  playerVy: 0,
  speed: 14,
  distance: 0,
  score: 0,
  coins: 0,
  obstacles: [],
  collectibles: [],
  obstacleSpawnCooldown: 0.7,
  collectibleSpawnCooldown: 0.9,
  nextEntityId: 1,
  statusMessage: 'Press Start or Enter to run',
  uiTicker: 0,
  runReported: false,
  gameOverReason: '',
});

function TempleDashGame({ onRunComplete }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const gameStateRef = useRef(createInitialGameState());

  const [hud, setHud] = useState({
    mode: 'start',
    score: 0,
    coins: 0,
    speed: 14,
    distance: 0,
    statusMessage: 'Press Start or Enter to run',
    gameOverReason: '',
  });

  const syncHud = useCallback((force = false) => {
    const state = gameStateRef.current;

    if (!force) {
      state.uiTicker += 1;
      if (state.uiTicker < 4) {
        return;
      }
      state.uiTicker = 0;
    }

    setHud({
      mode: state.mode,
      score: Math.floor(state.score),
      coins: state.coins,
      speed: Number(state.speed.toFixed(1)),
      distance: Math.floor(state.distance),
      statusMessage: state.statusMessage,
      gameOverReason: state.gameOverReason,
    });
  }, []);

  const startRun = useCallback(() => {
    const nextState = createInitialGameState();
    nextState.mode = 'running';
    nextState.statusMessage = 'Arrow Left and Right to dodge, Space to jump';
    gameStateRef.current = nextState;
    syncHud(true);
  }, [syncHud]);

  const endRun = useCallback(
    (reason) => {
      const state = gameStateRef.current;
      if (state.mode === 'gameover') {
        return;
      }

      state.mode = 'gameover';
      state.gameOverReason = reason;
      state.statusMessage = 'Run over. Press Enter or Restart.';
      syncHud(true);

      if (!state.runReported) {
        state.runReported = true;
        onRunComplete({
          score: Math.floor(state.score),
          coins: state.coins,
          distance: Math.floor(state.distance),
        });
      }
    },
    [onRunComplete, syncHud]
  );

  const spawnObstacle = useCallback(() => {
    const state = gameStateRef.current;
    const kind = Math.random() < 0.72 ? 'wall' : 'fire';

    state.obstacles.push({
      id: `ob-${state.nextEntityId}`,
      lane: LANE_VALUES[Math.floor(Math.random() * LANE_VALUES.length)],
      z: DRAW_DISTANCE,
      kind,
      requiredJumpHeight: kind === 'fire' ? 0.55 : 1.1,
    });
    state.nextEntityId += 1;
  }, []);

  const spawnCollectibles = useCallback(() => {
    const state = gameStateRef.current;
    const lane = LANE_VALUES[Math.floor(Math.random() * LANE_VALUES.length)];
    const startZ = DRAW_DISTANCE - randomBetween(6, 10);
    const count = 2 + Math.floor(Math.random() * 3);

    for (let index = 0; index < count; index += 1) {
      state.collectibles.push({
        id: `coin-${state.nextEntityId}`,
        lane,
        z: startZ + index * 2.2,
        lift: index % 2 === 0 ? 0 : 0.4,
      });
      state.nextEntityId += 1;
    }
  }, []);

  const updateGame = useCallback(
    (dt) => {
      const state = gameStateRef.current;
      if (state.mode !== 'running') {
        return;
      }

      state.speed = Math.min(31, state.speed + dt * 1.6);
      state.distance += state.speed * dt;
      state.score += dt * 40 + state.speed * 0.6;

      state.playerLane += (state.targetLane - state.playerLane) * Math.min(1, dt * 14);

      state.playerVy -= 24 * dt;
      state.playerY += state.playerVy * dt;
      if (state.playerY <= 0) {
        state.playerY = 0;
        state.playerVy = 0;
      }

      state.obstacleSpawnCooldown -= dt;
      if (state.obstacleSpawnCooldown <= 0) {
        spawnObstacle();
        state.obstacleSpawnCooldown = randomBetween(0.55, 1.15);
      }

      state.collectibleSpawnCooldown -= dt;
      if (state.collectibleSpawnCooldown <= 0) {
        spawnCollectibles();
        state.collectibleSpawnCooldown = randomBetween(0.75, 1.25);
      }

      const travel = state.speed * dt;
      state.obstacles.forEach((obstacle) => {
        obstacle.z -= travel;
      });
      state.collectibles.forEach((collectible) => {
        collectible.z -= travel;
      });

      const playerLane = state.playerLane;
      state.collectibles = state.collectibles.filter((collectible) => {
        const inRange = collectible.z <= 1 && collectible.z >= -0.6;
        const sameLane = Math.abs(playerLane - collectible.lane) < 0.34;
        const jumpAligned = Math.abs(state.playerY - collectible.lift) < 0.9;

        if (inRange && sameLane && jumpAligned) {
          state.coins += 1;
          state.score += 55;
          return false;
        }
        return collectible.z > -2;
      });

      for (const obstacle of state.obstacles) {
        const inRange = obstacle.z <= 1.05 && obstacle.z >= -0.35;
        const sameLane = Math.abs(playerLane - obstacle.lane) < 0.34;
        const jumped = state.playerY > obstacle.requiredJumpHeight;

        if (inRange && sameLane && !jumped) {
          endRun(obstacle.kind === 'fire' ? 'Fire trap hit' : 'Temple wall collision');
          return;
        }
      }

      state.obstacles = state.obstacles.filter((obstacle) => obstacle.z > -2.5);
      syncHud(false);
    },
    [endRun, spawnCollectibles, spawnObstacle, syncHud]
  );

  const projectToTrack = useCallback((canvas, lane, z, lift = 0) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const nearY = height * 0.89;
    const farY = height * 0.26;
    const normalized = Math.max(0, Math.min(1, z / DRAW_DISTANCE));
    const laneSpacing = width * (0.26 - normalized * 0.19);
    const y = nearY - (nearY - farY) * normalized - lift * 58;
    const x = centerX + lane * laneSpacing;
    const scale = 1.28 - normalized * 1.06;

    return { x, y, scale, normalized, nearY, farY, centerX, laneSpacing };
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const state = gameStateRef.current;
    const width = canvas.width;
    const height = canvas.height;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#1f3a54');
    sky.addColorStop(0.5, '#0f1d2d');
    sky.addColorStop(1, '#2e2217');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.25;
    const nearY = height * 0.89;
    const centerX = width / 2;

    const trackGradient = ctx.createLinearGradient(0, horizonY, 0, nearY);
    trackGradient.addColorStop(0, '#4d3e32');
    trackGradient.addColorStop(1, '#201913');

    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.13, horizonY);
    ctx.lineTo(centerX + width * 0.13, horizonY);
    ctx.lineTo(centerX + width * 0.42, nearY);
    ctx.lineTo(centerX - width * 0.42, nearY);
    ctx.closePath();
    ctx.fillStyle = trackGradient;
    ctx.fill();

    const lineCount = 8;
    for (let index = 1; index < lineCount; index += 1) {
      const ratio = index / lineCount;
      const y = horizonY + (nearY - horizonY) * ratio;
      const spread = width * (0.13 + ratio * 0.3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = Math.max(1, height * 0.0018);
      ctx.beginPath();
      ctx.moveTo(centerX - spread, y);
      ctx.lineTo(centerX + spread, y);
      ctx.stroke();
    }

    [-0.5, 0.5].forEach((laneMarker) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = Math.max(1, width * 0.0022);
      ctx.beginPath();
      ctx.moveTo(centerX + laneMarker * width * 0.13, horizonY);
      ctx.lineTo(centerX + laneMarker * width * 0.42, nearY);
      ctx.stroke();
    });

    const entities = [
      ...state.obstacles.map((obstacle) => ({ ...obstacle, type: 'obstacle' })),
      ...state.collectibles.map((collectible) => ({ ...collectible, type: 'collectible' })),
    ].sort((a, b) => b.z - a.z);

    entities.forEach((entity) => {
      const point = projectToTrack(canvas, entity.lane, entity.z, entity.lift || 0);
      if (entity.type === 'obstacle') {
        const obstacleWidth = Math.max(8, 54 * point.scale);
        const obstacleHeight = Math.max(8, 72 * point.scale);

        if (entity.kind === 'fire') {
          ctx.fillStyle = '#ff8333';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y - obstacleHeight * 0.7);
          ctx.lineTo(point.x - obstacleWidth * 0.48, point.y + obstacleHeight * 0.35);
          ctx.lineTo(point.x + obstacleWidth * 0.48, point.y + obstacleHeight * 0.35);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#6c5b49';
          ctx.fillRect(
            point.x - obstacleWidth / 2,
            point.y - obstacleHeight,
            obstacleWidth,
            obstacleHeight
          );

          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.fillRect(
            point.x - obstacleWidth / 2,
            point.y - obstacleHeight,
            obstacleWidth,
            obstacleHeight * 0.22
          );
        }
      } else {
        const radius = Math.max(3, 10 * point.scale);
        ctx.fillStyle = '#f3ca52';
        ctx.beginPath();
        ctx.arc(point.x, point.y - radius * 0.4, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = Math.max(1, radius * 0.18);
        ctx.stroke();
      }
    });

    const playerPoint = projectToTrack(canvas, state.playerLane, 0, state.playerY);
    const shadowWidth = 70;
    const shadowHeight = 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(playerPoint.x, nearY + 6, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyHeight = 104;
    const bodyWidth = 52;

    ctx.fillStyle = '#16b2ff';
    ctx.fillRect(playerPoint.x - bodyWidth / 2, playerPoint.y - bodyHeight, bodyWidth, bodyHeight);

    ctx.fillStyle = '#f4d9bc';
    ctx.beginPath();
    ctx.arc(playerPoint.x, playerPoint.y - bodyHeight - 18, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10263a';
    ctx.fillRect(playerPoint.x - 16, playerPoint.y - bodyHeight + 14, 32, 36);

    if (state.mode !== 'running') {
      ctx.fillStyle = 'rgba(5, 10, 15, 0.62)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `${Math.round(height * 0.06)}px sans-serif`;
      ctx.fillText('Temple Dash', width / 2, height * 0.3);

      ctx.fillStyle = '#b7c5d6';
      ctx.font = `${Math.round(height * 0.032)}px sans-serif`;
      ctx.fillText(
        state.mode === 'gameover' ? state.gameOverReason : 'Dodge traps and collect Seeker coins',
        width / 2,
        height * 0.4
      );

      ctx.fillStyle = '#dbe8f7';
      ctx.font = `${Math.round(height * 0.028)}px sans-serif`;
      ctx.fillText('Left and Right to strafe, Space to jump, F fullscreen', width / 2, height * 0.49);
    }
  }, [projectToTrack]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) {
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    const displayWidth = Math.max(320, Math.min(940, rect.width));
    const displayHeight = Math.max(260, Math.min(460, displayWidth * 0.57));
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    drawScene();
  }, [drawScene]);

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      await wrapperRef.current.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  }, []);

  useEffect(() => {
    const loop = (timestamp) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const delta = Math.min(0.04, (timestamp - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = timestamp;

      updateGame(delta);
      drawScene();
      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [drawScene, updateGame]);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    const onFullscreenChange = () => resizeCanvas();

    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const state = gameStateRef.current;
      const key = event.key.toLowerCase();

      if (key === 'f') {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }

      if (state.mode === 'start' || state.mode === 'gameover') {
        if (key === 'enter' || key === ' ') {
          event.preventDefault();
          startRun();
        }
        return;
      }

      if (state.mode !== 'running') {
        return;
      }

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        const nextLaneIndex = Math.max(0, LANE_VALUES.indexOf(state.targetLane) - 1);
        state.targetLane = LANE_VALUES[nextLaneIndex];
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        const nextLaneIndex = Math.min(LANE_VALUES.length - 1, LANE_VALUES.indexOf(state.targetLane) + 1);
        state.targetLane = LANE_VALUES[nextLaneIndex];
      }

      if (key === 'arrowup' || key === 'w' || key === ' ') {
        event.preventDefault();
        if (state.playerY === 0) {
          state.playerVy = 10.5;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startRun, toggleFullscreen]);

  useEffect(() => {
    const renderGameToText = () => {
      const state = gameStateRef.current;
      const payload = {
        coordinate_system:
          'lane:-1(left),0(center),1(right); z=0 at player and increases into distance; playerY is jump height above track',
        mode: state.mode,
        player: {
          lane: Number(state.playerLane.toFixed(3)),
          targetLane: state.targetLane,
          y: Number(state.playerY.toFixed(3)),
          vy: Number(state.playerVy.toFixed(3)),
          speed: Number(state.speed.toFixed(3)),
        },
        score: Math.floor(state.score),
        coins: state.coins,
        distance: Math.floor(state.distance),
        obstacles: state.obstacles.map((obstacle) => ({
          lane: obstacle.lane,
          z: Number(obstacle.z.toFixed(3)),
          kind: obstacle.kind,
        })),
        collectibles: state.collectibles.map((collectible) => ({
          lane: collectible.lane,
          z: Number(collectible.z.toFixed(3)),
          lift: collectible.lift,
        })),
      };

      return JSON.stringify(payload, null, 2);
    };

    const advanceTime = async (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let step = 0; step < steps; step += 1) {
        updateGame(1 / 60);
      }
      drawScene();
      return Promise.resolve();
    };

    window.render_game_to_text = renderGameToText;
    window.advanceTime = advanceTime;

    return () => {
      if (window.render_game_to_text === renderGameToText) {
        window.render_game_to_text = undefined;
      }
      if (window.advanceTime === advanceTime) {
        window.advanceTime = undefined;
      }
    };
  }, [drawScene, updateGame]);

  const rewardPreview = useMemo(() => (hud.coins * 0.015).toFixed(3), [hud.coins]);

  return (
    <section id="game" className="my-10 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Temple Dash: Play to Earn</h2>
        <div className="text-xs text-[#8A919E]">Temple runner mini game</div>
      </div>

      <div className="bg-[#141519] border border-[#1E2025] rounded-2xl p-5 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-[#0f1116] border border-[#222831] rounded-xl p-3">
            <div className="text-[11px] text-[#5B616E]">Mode</div>
            <div className="text-sm text-white font-medium capitalize">{hud.mode}</div>
          </div>
          <div className="bg-[#0f1116] border border-[#222831] rounded-xl p-3">
            <div className="text-[11px] text-[#5B616E]">Score</div>
            <div className="text-sm text-white font-medium">{hud.score}</div>
          </div>
          <div className="bg-[#0f1116] border border-[#222831] rounded-xl p-3">
            <div className="text-[11px] text-[#5B616E]">Coins</div>
            <div className="text-sm text-white font-medium">{hud.coins}</div>
          </div>
          <div className="bg-[#0f1116] border border-[#222831] rounded-xl p-3">
            <div className="text-[11px] text-[#5B616E]">Meters</div>
            <div className="text-sm text-white font-medium">{hud.distance}</div>
          </div>
          <div className="bg-[#0f1116] border border-[#222831] rounded-xl p-3 col-span-2 md:col-span-1">
            <div className="text-[11px] text-[#5B616E]">Run Reward</div>
            <div className="text-sm text-[#05B169] font-medium">{rewardPreview} SKR</div>
          </div>
        </div>

        <div ref={wrapperRef} className="relative w-full overflow-hidden rounded-xl border border-[#253041] bg-[#0c1621]">
          <canvas ref={canvasRef} className="block mx-auto" />

          {(hud.mode === 'start' || hud.mode === 'gameover') && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <button
                id="temple-start-btn"
                onClick={startRun}
                className="px-4 py-2 rounded-full bg-[#0052FF] text-white text-sm font-medium hover:bg-[#0047d6]"
              >
                {hud.mode === 'gameover' ? 'Restart Run' : 'Start Run'}
              </button>
              <div className="text-xs text-[#c3d6eb]">{hud.statusMessage}</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#8A919E]">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36] hover:border-[#466189] hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
          </button>
          <button
            type="button"
            onClick={startRun}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36] hover:border-[#466189] hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> New run
          </button>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Flame className="w-3.5 h-3.5" /> Speed {hud.speed}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Trophy className="w-3.5 h-3.5" /> {hud.gameOverReason || hud.statusMessage}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2B2F36]">
            <Coins className="w-3.5 h-3.5" /> Left/right move, Space jump
          </span>
        </div>
      </div>
    </section>
  );
}

export default TempleDashGame;
