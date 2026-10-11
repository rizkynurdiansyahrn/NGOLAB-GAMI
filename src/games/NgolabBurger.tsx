import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChefHat, Clock3, Heart, Layers3, Sparkles, Trophy } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

type GamePhase = 'START' | 'PLAYING' | 'GAMEOVER';
type IngredientType = 'patty' | 'cheese' | 'lettuce' | 'tomato' | 'onion' | 'pickle';

interface BurgerLayer {
  type: IngredientType | 'bun';
  x: number;
  y: number;
  glow?: boolean;
}

interface MovingIngredient extends BurgerLayer {
  type: IngredientType;
  direction: 1 | -1;
  speed: number;
}

interface FallingIngredient extends BurgerLayer {
  type: IngredientType;
  missed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface FloatingLabel {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface RuntimeState {
  state: GamePhase;
  score: number;
  time: number;
  lives: number;
  streak: number;
  stack: BurgerLayer[];
  movingIngredient: MovingIngredient | null;
  fallingIngredient: FallingIngredient | null;
  cameraOffsetY: number;
  particles: Particle[];
  labels: FloatingLabel[];
  lastTime: number;
}

const ROUND_LENGTH = 60;
const LAYERS_PER_ORDER = 5;
const LAYER_WIDTH = 88;
const LAYER_HEIGHT = 20;
const INGREDIENTS: IngredientType[] = ['patty', 'cheese', 'lettuce', 'tomato', 'onion', 'pickle'];

const createMovingIngredient = (width: number, score: number): MovingIngredient => {
  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  const speed = Math.min(width * 0.72, width * 0.32 + Math.floor(score / 20) * 5);
  return {
    type: INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)],
    x: direction === 1 ? LAYER_WIDTH / 2 : width - LAYER_WIDTH / 2,
    y: 154,
    direction,
    speed,
  };
};

const drawIngredient = (ctx: CanvasRenderingContext2D, layer: BurgerLayer, glow = false) => {
  const { x, y, type } = layer;
  ctx.save();
  ctx.translate(x, y);

  // A soft shadow keeps the individual fillings readable as the burger grows.
  ctx.fillStyle = 'rgba(92, 43, 18, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 9, type === 'bun' ? 48 : 43, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (glow || layer.glow) {
    ctx.shadowColor = '#fff4a6';
    ctx.shadowBlur = 22;
  }

  if (type === 'bun') {
    ctx.fillStyle = '#d98737';
    ctx.beginPath();
    ctx.roundRect(-48, -12, 96, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#f6c06a';
    ctx.beginPath();
    ctx.roundRect(-46, -14, 92, 18, 10);
    ctx.fill();
    ctx.fillStyle = '#fff0bd';
    [-23, -7, 10, 27].forEach((seedX) => {
      ctx.beginPath();
      ctx.ellipse(seedX, -8, 2.3, 1.1, -0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'patty') {
    ctx.fillStyle = '#693720';
    ctx.beginPath();
    ctx.roundRect(-44, -9, 88, 18, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 159, 85, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-31, -3); ctx.lineTo(-13, -3);
    ctx.moveTo(1, 3); ctx.lineTo(26, 3);
    ctx.stroke();
  } else if (type === 'cheese') {
    ctx.fillStyle = '#ffcc4e';
    ctx.beginPath();
    ctx.moveTo(-44, -8); ctx.quadraticCurveTo(-44, -12, -38, -12);
    ctx.lineTo(42, -12); ctx.quadraticCurveTo(46, -12, 45, -6);
    ctx.lineTo(33, -2); ctx.lineTo(26, 8); ctx.lineTo(17, 1);
    ctx.lineTo(-38, 9); ctx.quadraticCurveTo(-45, 8, -44, -8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(208, 125, 27, 0.38)'; ctx.lineWidth = 2; ctx.stroke();
  } else if (type === 'lettuce') {
    ctx.fillStyle = '#57a944';
    ctx.beginPath();
    ctx.moveTo(-44, 1);
    for (let point = -44; point <= 44; point += 11) {
      ctx.quadraticCurveTo(point + 5, point % 2 ? -12 : 12, point + 11, 1);
    }
    ctx.lineTo(42, 8); ctx.quadraticCurveTo(0, 12, -42, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a1d66d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-31, 3); ctx.quadraticCurveTo(0, 9, 30, 2); ctx.stroke();
  } else if (type === 'tomato') {
    ctx.fillStyle = '#e65743';
    ctx.beginPath(); ctx.roundRect(-43, -9, 86, 18, 8); ctx.fill();
    ctx.fillStyle = '#ffad80';
    [-24, 0, 24].forEach((sliceX) => {
      ctx.beginPath(); ctx.ellipse(sliceX, -1, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    });
  } else if (type === 'onion') {
    ctx.fillStyle = '#e4aad8';
    ctx.beginPath(); ctx.roundRect(-43, -8, 86, 16, 8); ctx.fill();
    ctx.strokeStyle = '#a956a0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-31, 0); ctx.quadraticCurveTo(-14, -9, 0, 0);
    ctx.quadraticCurveTo(15, 9, 31, 0); ctx.stroke();
  } else {
    ctx.fillStyle = '#438a47';
    ctx.beginPath(); ctx.roundRect(-43, -8, 86, 16, 8); ctx.fill();
    ctx.fillStyle = '#9dcf62';
    [-25, -9, 9, 25].forEach((spotX) => {
      ctx.beginPath(); ctx.ellipse(spotX, -2, 3, 1.5, -0.2, 0, Math.PI * 2); ctx.fill();
    });
  }

  ctx.restore();
};

export default function NgolabBurger({ onGameOver, onExit, onScoreChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const onGameOverRef = useRef(onGameOver);
  const [gameState, setGameState] = useState<GamePhase>('START');
  const [endReason, setEndReason] = useState('');
  const [hud, setHud] = useState({ score: 0, time: ROUND_LENGTH, lives: 3, streak: 0, layers: 0 });
  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<RuntimeState>({
    state: 'START', score: 0, time: ROUND_LENGTH, lives: 3, streak: 0,
    stack: [], movingIngredient: null, fallingIngredient: null, cameraOffsetY: 0,
    particles: [], labels: [], lastTime: 0,
  });

  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const syncHud = useCallback(() => {
    const current = stateRef.current;
    onScoreChange?.(current.score);
    setHud({
      score: current.score,
      time: current.time,
      lives: current.lives,
      streak: current.streak,
      layers: Math.max(0, current.stack.length - 1),
    });
  }, [onScoreChange]);

  const dropIngredient = useCallback(() => {
    const current = stateRef.current;
    if (current.state !== 'PLAYING' || !current.movingIngredient || current.fallingIngredient) return;
    const { type, x, y } = current.movingIngredient;
    // Convert from screen space into the burger's scrolling world space.
    current.fallingIngredient = { type, x, y: y - current.cameraOffsetY, missed: false };
    current.movingIngredient = null;
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = sizeRef.current;
    const safeWidth = width || canvas.clientWidth || window.innerWidth;
    const safeHeight = height || canvas.clientHeight || window.innerHeight;
    stateRef.current = {
      state: 'PLAYING',
      score: 0,
      time: ROUND_LENGTH,
      lives: 3,
      streak: 0,
      stack: [{ type: 'bun', x: safeWidth / 2, y: safeHeight - 116 }],
      movingIngredient: createMovingIngredient(safeWidth, 0),
      fallingIngredient: null,
      cameraOffsetY: 0,
      particles: [],
      labels: [],
      lastTime: performance.now(),
    };
    setEndReason('');
    setGameState('PLAYING');
    syncHud();

    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    if (gameLoopRef.current) animationFrameRef.current = requestAnimationFrame(gameLoopRef.current);
  }, [syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const oldSize = sizeRef.current;
      const width = rect.width;
      const height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height };

      if (oldSize.width && oldSize.height && stateRef.current.state === 'PLAYING') {
        const deltaX = (width - oldSize.width) / 2;
        const deltaY = height - oldSize.height;
        stateRef.current.stack.forEach((piece) => { piece.x += deltaX; piece.y += deltaY; });
        if (stateRef.current.movingIngredient) stateRef.current.movingIngredient.x += deltaX;
        if (stateRef.current.fallingIngredient) {
          stateRef.current.fallingIngredient.x += deltaX;
          stateRef.current.fallingIngredient.y += deltaY;
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const makeParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 18; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 150;
        stateRef.current.particles.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35,
          life: 0.75 + Math.random() * 0.45, color,
        });
      }
    };

    const addLabel = (x: number, y: number, text: string, color: string) => {
      stateRef.current.labels.push({ x, y, text, color, life: 1.15 });
    };

    const endGame = (reason: string) => {
      const current = stateRef.current;
      if (current.state !== 'PLAYING') return;
      current.state = 'GAMEOVER';
      setEndReason(reason);
      setGameState('GAMEOVER');
      syncHud();
      onGameOverRef.current(current.score);
    };

    const update = (deltaMs: number) => {
      const current = stateRef.current;
      if (current.state !== 'PLAYING') return;
      const dt = Math.min(deltaMs / 1000, 0.05);
      const { width, height } = sizeRef.current;
      const moving = current.movingIngredient;

      if (moving) {
        moving.x += moving.speed * moving.direction * dt;
        if (moving.x >= width - LAYER_WIDTH / 2) {
          moving.x = width - LAYER_WIDTH / 2;
          moving.direction = -1;
        } else if (moving.x <= LAYER_WIDTH / 2) {
          moving.x = LAYER_WIDTH / 2;
          moving.direction = 1;
        }
      }

      const falling = current.fallingIngredient;
      if (falling) {
        falling.y += height * 1.18 * dt;
        const topLayer = current.stack[current.stack.length - 1];
        if (topLayer && falling.y >= topLayer.y - LAYER_HEIGHT && !falling.missed) {
          const distance = Math.abs(falling.x - topLayer.x);
          if (distance < LAYER_WIDTH * 0.39) {
            const perfect = distance < 11;
            current.streak += 1;
            const layerNumber = current.stack.length;
            const streakBonus = current.streak >= 3 ? Math.min(20, (current.streak - 2) * 5) : 0;
            const perfectBonus = perfect ? 10 : 0;
            const orderBonus = layerNumber % LAYERS_PER_ORDER === 0 ? 50 : 0;
            const gained = 10 + perfectBonus + streakBonus + orderBonus;
            const landedLayer: BurgerLayer = {
              type: falling.type,
              x: falling.x,
              y: topLayer.y - LAYER_HEIGHT,
              glow: perfect || orderBonus > 0,
            };
            current.stack.push(landedLayer);

            const idealTopY = height * 0.49;
            if (landedLayer.y + current.cameraOffsetY < idealTopY) {
              current.cameraOffsetY += idealTopY - (landedLayer.y + current.cameraOffsetY);
            }
            const screenY = landedLayer.y + current.cameraOffsetY;
            current.score += gained;
            makeParticles(landedLayer.x, screenY, perfect ? '#fff1a8' : '#fb9753');
            addLabel(landedLayer.x, screenY - 26, orderBonus > 0 ? '+50 PESANAN!' : perfect ? `+${gained} SEMPURNA!` : `+${gained}`, orderBonus > 0 ? '#e74b3c' : perfect ? '#d98b00' : '#67371f');

            if (current.streak >= 3 && orderBonus === 0 && !perfect) {
              addLabel(landedLayer.x, screenY - 49, `${current.streak} BERUNTUN!`, '#4b8d45');
            }
            current.fallingIngredient = null;
            current.movingIngredient = createMovingIngredient(width, current.score);
            syncHud();
          } else {
            falling.missed = true;
            current.streak = 0;
            addLabel(falling.x, falling.y + current.cameraOffsetY, 'MELSET!', '#c94836');
            syncHud();
          }
        }

        if (current.fallingIngredient && falling.y + current.cameraOffsetY > height + 45) {
          current.lives -= 1;
          current.fallingIngredient = null;
          makeParticles(falling.x, height - 70, '#e9634a');
          if (current.lives <= 0) {
            syncHud();
            endGame('NYAWA HABIS');
          } else {
            current.movingIngredient = createMovingIngredient(width, current.score);
            syncHud();
          }
        }
      }

      for (let i = current.particles.length - 1; i >= 0; i -= 1) {
        const particle = current.particles[i];
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 180 * dt;
        particle.life -= dt;
        if (particle.life <= 0) current.particles.splice(i, 1);
      }
      for (let i = current.labels.length - 1; i >= 0; i -= 1) {
        const label = current.labels[i];
        label.y -= 30 * dt;
        label.life -= dt;
        if (label.life <= 0) current.labels.splice(i, 1);
      }
    };

    const drawBackground = (width: number, height: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#fff3d8');
      gradient.addColorStop(0.7, '#ffd995');
      gradient.addColorStop(1, '#f4b65f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.3, Math.min(width, height) * 0.27, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(150, 85, 44, 0.075)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 112); ctx.lineTo(x, height - 72); ctx.stroke();
      }
      for (let y = 132; y < height - 72; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // The warm diner counter gives the stack a clear landing point.
      ctx.fillStyle = '#b94e3d';
      ctx.fillRect(0, height - 57, width, 57);
      ctx.fillStyle = '#e88557';
      ctx.fillRect(0, height - 57, width, 8);
      for (let x = -16; x < width + 24; x += 42) {
        ctx.fillStyle = Math.floor((x + 16) / 42) % 2 ? '#f6c17b' : '#fff0c8';
        ctx.beginPath();
        ctx.moveTo(x, height - 49); ctx.lineTo(x + 28, height - 49);
        ctx.lineTo(x + 14, height - 28); ctx.lineTo(x - 14, height - 28);
        ctx.closePath(); ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 82, Math.min(width * 0.33, 146), 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 146, 72, 0.52)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 82, Math.min(width * 0.31, 136), 15, 0, 0, Math.PI * 2);
      ctx.stroke();
    };

    const draw = (timestamp: number) => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const current = stateRef.current;
      ctx.clearRect(0, 0, width, height);
      drawBackground(width, height);

      // A dotted guide marks the horizontal timing lane.
      ctx.save();
      ctx.setLineDash([5, 9]);
      ctx.strokeStyle = 'rgba(151, 90, 48, 0.24)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(24, 154); ctx.lineTo(width - 24, 154); ctx.stroke();
      ctx.restore();

      for (const layer of current.stack) {
        drawIngredient(ctx, { ...layer, y: layer.y + current.cameraOffsetY });
      }

      if (current.movingIngredient) {
        const bob = Math.sin(timestamp / 150) * 3;
        drawIngredient(ctx, { ...current.movingIngredient, y: current.movingIngredient.y + bob }, true);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.arc(current.movingIngredient.x + 30, current.movingIngredient.y - 17 + bob, 3, 0, Math.PI * 2); ctx.fill();
      }

      if (current.fallingIngredient) {
        const fall = current.fallingIngredient;
        drawIngredient(ctx, {
          type: fall.type,
          x: fall.x,
          y: fall.y + current.cameraOffsetY,
        });
      }

      for (const particle of current.particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, particle.life * 1.6));
        ctx.fillStyle = particle.color;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, Math.max(1.5, 4.5 * particle.life), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const label of current.labels) {
        ctx.globalAlpha = Math.max(0, Math.min(1, label.life * 1.5));
        ctx.font = '800 14px ui-rounded, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255, 249, 232, 0.94)';
        ctx.strokeText(label.text, label.x, label.y);
        ctx.fillStyle = label.color; ctx.fillText(label.text, label.x, label.y);
      }
      ctx.globalAlpha = 1;
    };

    const gameLoop = (timestamp: number) => {
      const delta = timestamp - stateRef.current.lastTime;
      stateRef.current.lastTime = timestamp;
      update(delta);
      draw(timestamp);
      if (stateRef.current.state === 'PLAYING') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };
    gameLoopRef.current = gameLoop;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') event.preventDefault();
      dropIngredient();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.code === 'Space' || event.code === 'Enter') && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        dropIngredient();
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    timerRef.current = window.setInterval(() => {
      const current = stateRef.current;
      if (current.state !== 'PLAYING') return;
      current.time = Math.max(0, current.time - 1);
      syncHud();
      if (current.time <= 0) endGame('WAKTU HABIS');
    }, 1000);

    return () => {
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [dropIngredient, syncHud]);

  const layersInOrder = hud.layers % LAYERS_PER_ORDER;
  const formattedTime = `${String(Math.floor(hud.time / 60)).padStart(2, '0')}:${String(hud.time % 60).padStart(2, '0')}`;

  return (
    <div className="relative h-full min-h-[520px] w-full overflow-hidden bg-[#fff0cc] font-sans text-[#48271e] select-none">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block h-full w-full touch-none" aria-label="Area permainan menyusun burger" />

      {/* Live game HUD */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-2xl items-stretch justify-between gap-2 sm:inset-x-5 sm:top-4 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/75 bg-[#fffaf0]/95 px-2 py-2 shadow-[0_8px_22px_rgba(103,55,31,0.12)] sm:gap-3 sm:px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f8d883] text-lg shadow-inner sm:h-9 sm:w-9 sm:text-xl">🍔</div>
          <div className="hidden min-w-0 sm:block">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a0643b]">NGOLAB</div>
            <div className="truncate text-xs font-extrabold">Burger Builder</div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/75 bg-[#fffaf0]/95 px-2 py-2 shadow-[0_8px_22px_rgba(103,55,31,0.12)] sm:gap-2 sm:px-3">
          <Clock3 className="h-3.5 w-3.5 text-[#d16a43] sm:h-4 sm:w-4" aria-hidden="true" />
          <div>
            <div className="hidden text-[8px] font-extrabold uppercase tracking-wider text-[#a0643b] sm:block">WAKTU</div>
            <div className={`text-xs font-black tabular-nums sm:text-sm ${hud.time <= 10 ? 'text-[#d64d3c]' : ''}`}>{formattedTime}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/75 bg-[#fffaf0]/95 px-2 py-2 shadow-[0_8px_22px_rgba(103,55,31,0.12)] sm:gap-2 sm:px-3">
          <Trophy className="h-3.5 w-3.5 text-[#d99328] sm:h-4 sm:w-4" aria-hidden="true" />
          <div>
            <div className="hidden text-[8px] font-extrabold uppercase tracking-wider text-[#a0643b] sm:block">SKOR</div>
            <div className="text-xs font-black tabular-nums sm:text-sm">{hud.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/75 bg-[#fffaf0]/95 px-2 py-2 shadow-[0_8px_22px_rgba(103,55,31,0.12)] sm:gap-2 sm:px-3">
          <div className="flex gap-0.5" aria-label={`${hud.lives} nyawa tersisa`}>
            {[0, 1, 2].map((life) => (
              <Heart key={life} className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${life < hud.lives ? 'fill-[#e45b50] text-[#e45b50]' : 'text-[#d8c6b3]'}`} aria-hidden="true" />
            ))}
          </div>
          <div className="hidden sm:block">
            <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#a0643b]">NYAWA</div>
            <div className="text-sm font-black tabular-nums">{hud.lives}/3</div>
          </div>
        </div>
      </div>

      {/* Order progress and combo */}
      <div className="pointer-events-none absolute left-1/2 top-[76px] z-20 flex w-[min(88%,340px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/75 bg-[#fffaf0]/90 px-3 py-2 shadow-[0_6px_16px_rgba(103,55,31,0.10)] sm:top-[84px]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e9f0ce] text-[#56814c]"><Layers3 className="h-4 w-4" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[#885538]">
            <span>PESANAN BERIKUTNYA</span>
            <span>{layersInOrder}/{LAYERS_PER_ORDER}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eadbc4]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#f0a642] to-[#e76548]" animate={{ width: `${(layersInOrder / LAYERS_PER_ORDER) * 100}%` }} transition={{ type: 'spring', stiffness: 180, damping: 22 }} />
          </div>
        </div>
        {hud.streak >= 3 && (
          <motion.div initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff0bf] px-2 py-1 text-[9px] font-black text-[#a76418]">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> x{hud.streak}
          </motion.div>
        )}
      </div>

      {gameState === 'PLAYING' && (
        <div className="pointer-events-none absolute bottom-[82px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-[#fffaf0]/85 px-3.5 py-1.5 text-[10px] font-bold text-[#78503b] shadow-sm sm:bottom-[86px] sm:text-xs">
          Cocokkan lapisan, lalu lepas tepat di atasnya
        </div>
      )}

      {gameState === 'PLAYING' && (
        <button
          type="button"
          onClick={dropIngredient}
          className="absolute bottom-3 left-1/2 z-30 flex h-[58px] w-[min(88%,340px)] -translate-x-1/2 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#b94c32] bg-gradient-to-b from-[#ef7952] to-[#df5c40] px-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_9px_20px_rgba(128,52,36,0.25)] transition active:translate-y-1 active:border-b-0 active:shadow-sm sm:bottom-4"
        >
          <ChefHat className="h-5 w-5" aria-hidden="true" />
          Lepas Lapisan
        </button>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#44261e]/45 p-4 backdrop-blur-[3px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
              className="relative w-full max-w-[390px] overflow-hidden rounded-[30px] border border-white/80 bg-[#fffaf0] p-6 text-center shadow-[0_24px_80px_rgba(66,33,23,0.3)] sm:p-8"
            >
              <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#ffe2a2]/70" />
              <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-[#f8d9bf]/70" />
              <div className="relative z-10">
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }} animate={{ rotate: [0, -5, 4, 0], scale: 1 }} transition={{ duration: 0.6 }}
                  className="mx-auto mb-3 flex h-[78px] w-[78px] items-center justify-center rounded-[26px] bg-gradient-to-br from-[#ffe69b] to-[#f5b45d] text-[42px] shadow-[inset_0_2px_7px_rgba(255,255,255,0.75),0_9px_18px_rgba(182,103,38,0.19)]"
                >🍔</motion.div>

                {gameState === 'START' ? (
                  <>
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#edf1d4] px-3 py-1 text-[9px] font-black uppercase tracking-[0.17em] text-[#58804c]">
                      <ChefHat className="h-3 w-3" aria-hidden="true" /> SIAPKAN PESANAN
                    </div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[#48271e] sm:text-4xl">Burger Builder</h1>
                    <p className="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-[#866451]">Bangun burger tertinggi sebelum waktu habis. Presisi dan kombo bikin skormu makin mantap!</p>

                    <div className="my-5 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-[#fff0d4] px-2 py-3">
                        <Clock3 className="mx-auto mb-1 h-4 w-4 text-[#d16a43]" aria-hidden="true" />
                        <div className="text-xs font-black">60 DETIK</div>
                        <div className="mt-0.5 text-[9px] font-semibold text-[#9b765b]">Waktu bermain</div>
                      </div>
                      <div className="rounded-2xl bg-[#f8eadb] px-2 py-3">
                        <span className="mb-1 block text-base leading-4">🎯</span>
                        <div className="text-xs font-black">TEPAT</div>
                        <div className="mt-0.5 text-[9px] font-semibold text-[#9b765b]">Bonus poin</div>
                      </div>
                      <div className="rounded-2xl bg-[#edf1d4] px-2 py-3">
                        <Sparkles className="mx-auto mb-1 h-4 w-4 text-[#639354]" aria-hidden="true" />
                        <div className="text-xs font-black">5 LAPIS</div>
                        <div className="mt-0.5 text-[9px] font-semibold text-[#9b765b]">Bonus pesanan</div>
                      </div>
                    </div>
                    <div className="mb-5 rounded-2xl border border-[#f2dfc4] bg-white/80 px-4 py-3 text-left text-xs leading-5 text-[#785c48]">
                      <span className="font-extrabold text-[#583b2b]">Cara main:</span> tekan tombol atau ketuk layar saat bahan sejajar dengan burger. Kamu punya 3 kesempatan!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#fff0bf] px-3 py-1 text-[9px] font-black uppercase tracking-[0.17em] text-[#a76418]">
                      <Trophy className="h-3 w-3" aria-hidden="true" /> {endReason}
                    </div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[#48271e]">Kerja Bagus!</h1>
                    <p className="mt-1 text-sm text-[#866451]">Burger buatanmu sudah siap disajikan.</p>
                    <div className="my-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#fff0d4] px-3 py-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#9b765b]">SKOR AKHIR</div>
                        <div className="mt-1 text-3xl font-black tabular-nums text-[#d45d40]">{hud.score}</div>
                      </div>
                      <div className="rounded-2xl bg-[#edf1d4] px-3 py-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#79895b]">LAPISAN TERSUSUN</div>
                        <div className="mt-1 text-3xl font-black tabular-nums text-[#547a49]">{hud.layers}</div>
                      </div>
                    </div>
                    <p className="mb-5 text-xs text-[#8e7059]">{hud.score >= 250 ? 'Chef andalan! Dapur ini bangga padamu.' : 'Coba lagi untuk membuat menara burger yang lebih tinggi.'}</p>
                  </>
                )}

                <button
                  type="button" onClick={startGame}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-[#b94c32] bg-gradient-to-b from-[#ef7952] to-[#df5c40] text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_7px_15px_rgba(128,52,36,0.18)] transition active:translate-y-1 active:border-b-0"
                >
                  <ChefHat className="h-4 w-4" aria-hidden="true" />
                  {gameState === 'START' ? 'Mulai Masak' : 'Main Lagi'}
                </button>
                <button type="button" onClick={onExit} className="mt-2 h-11 w-full rounded-2xl text-xs font-bold text-[#936e56] transition hover:bg-[#f4eadc] hover:text-[#583b2b]">
                  Kembali ke menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
