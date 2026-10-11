import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock3, Cloud, Heart, MousePointer2, Sparkles, Star, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

type Target = {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'cloud' | 'star' | 'lightning';
  speed: number;
  opacity: number;
};

type TrailPoint = { x: number; y: number; life: number };

const colors = {
  cloud: '#38bdf8',
  star: '#fcd34d',
  lightning: '#f97316',
};

const distanceFromPointToSegment = (x: number, y: number, startX: number, startY: number, endX: number, endY: number) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSquared));
  const nearestX = startX + projection * dx;
  const nearestY = startY + projection * dy;
  return Math.hypot(x - nearestX, y - nearestY);
};

export default function NgolabSkySwipe({ onGameOver, onExit, onScoreChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [lives, setLives] = useState(3);
  const [hint, setHint] = useState('Geser/sapu awan dan bintang, hindari sambaran petir.');
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef({
    state: 'START',
    score: 0,
    time: 45,
    lives: 3,
    targets: [] as Target[],
    trail: [] as TrailPoint[],
    lastTime: 0,
    spawnTimer: 0,
    elapsed: 0,
    timeAccumulator: 0,
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    pointerPrevX: 0,
    pointerPrevY: 0,
    width: 0,
    height: 0,
  });

  const spawnTarget = () => {
    const state = stateRef.current;
    const difficulty = Math.min(1, state.elapsed / 35);
    const roll = Math.random();
    const hazardChance = 0.18 + difficulty * 0.12;
    const type = roll < hazardChance ? 'lightning' : roll < hazardChance + 0.28 ? 'star' : 'cloud';
    const radius = type === 'lightning' ? 22 : type === 'star' ? 16 : 24;
    state.targets.push({
      id: `target-${Date.now()}-${Math.random()}`,
      x: Math.max(40, Math.random() * (state.width - 80) + 40),
      y: -60,
      radius,
      type,
      speed: Math.max(300, state.height) * (0.42 + Math.random() * 0.13) * (1 + difficulty * 0.7),
      opacity: 0.75,
    });
  };

  const finishGame = (reason?: string) => {
    const state = stateRef.current;
    if (state.state !== 'PLAYING') return;
    state.state = 'GAMEOVER';
    if (reason) setHint(reason);
    setGameState('GAMEOVER');
    onGameOver(state.score);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const state = stateRef.current;
      state.width = canvas.width;
      state.height = canvas.height;
    };

    window.addEventListener('resize', resize);
    resize();

    const update = (dt: number) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      const seconds = dt / 1000;
      state.elapsed += seconds;
      state.timeAccumulator += seconds;
      if (state.timeAccumulator >= 1) {
        const elapsedSeconds = Math.floor(state.timeAccumulator);
        state.timeAccumulator -= elapsedSeconds;
        state.time = Math.max(0, state.time - elapsedSeconds);
        setTimeLeft(state.time);
        if (state.time === 0) {
          finishGame('Waktu habis!');
          return;
        }
      }

      state.spawnTimer += dt;
      const spawnInterval = Math.max(340, 650 - state.elapsed * 8.5);
      if (state.spawnTimer > spawnInterval) {
        spawnTarget();
        state.spawnTimer %= spawnInterval;
      }

      state.targets = state.targets.filter((target) => {
        target.y += target.speed * seconds;
        target.opacity = Math.min(0.95, target.opacity + seconds * 0.6);
        if (target.y - target.radius > state.height + 60) return false;
        return true;
      });

      if (state.pointerActive) {
        state.trail.push({ x: state.pointerX, y: state.pointerY, life: 1 });
      }
      state.trail.forEach((point) => { point.life -= seconds * 1.8; });
      state.trail = state.trail.filter((point) => point.life > 0);

      for (const target of state.targets) {
        if (!state.pointerActive) break;
        const distance = distanceFromPointToSegment(
          target.x,
          target.y,
          state.pointerPrevX,
          state.pointerPrevY,
          state.pointerX,
          state.pointerY,
        );
        if (distance < target.radius + 18) {
          if (target.type === 'lightning') {
            state.lives -= 1;
            setLives(state.lives);
            setHint('Petir tersapu! Sisa nyawa berkurang.');
          } else {
            state.score += target.type === 'star' ? 25 : 15;
            setScore(state.score);
            onScoreChange?.(state.score);
            setHint(target.type === 'star' ? 'Bintang ditangkap!' : 'Awan disapu!');
          }
          target.y = state.height + target.radius + 80;
        }
      }
      state.pointerPrevX = state.pointerX;
      state.pointerPrevY = state.pointerY;

      if (state.lives <= 0) {
        finishGame('Nyawa habis!');
      }
    };

    const draw = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#020617');
      gradient.addColorStop(0.5, '#0e1b35');
      gradient.addColorStop(1, '#020912');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 90; i += 1) {
        const x = (i * 73) % canvas.width;
        const y = ((i * 47) % canvas.height) * 0.6;
        ctx.fillStyle = `rgba(219, 234, 254, ${0.08 + (Math.sin(state.elapsed * 1.8 + i) + 1) * 0.06})`;
        ctx.beginPath();
        ctx.arc(x, y, i % 9 === 0 ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 1; i < state.trail.length; i += 1) {
        const previous = state.trail[i - 1];
        const point = state.trail[i];
        const strength = Math.min(point.life, previous.life);
        ctx.globalAlpha = strength * 0.8;
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 4 + strength * 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      state.targets.forEach((target) => {
        ctx.save();
        ctx.globalAlpha = target.opacity;
        ctx.fillStyle = colors[target.type];
        ctx.strokeStyle = 'rgba(255,255,255,0.82)';
        ctx.lineWidth = 2;
        ctx.shadowColor = colors[target.type];
        ctx.shadowBlur = target.type === 'lightning' ? 24 : 18;
        ctx.beginPath();
        if (target.type === 'lightning') {
          ctx.moveTo(target.x + target.radius * 0.22, target.y - target.radius);
          ctx.lineTo(target.x - target.radius * 0.5, target.y + target.radius * 0.08);
          ctx.lineTo(target.x - target.radius * 0.04, target.y + target.radius * 0.08);
          ctx.lineTo(target.x - target.radius * 0.26, target.y + target.radius);
          ctx.lineTo(target.x + target.radius * 0.56, target.y - target.radius * 0.12);
          ctx.lineTo(target.x + target.radius * 0.12, target.y - target.radius * 0.12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (target.type === 'star') {
          for (let point = 0; point < 10; point += 1) {
            const angle = -Math.PI / 2 + point * Math.PI / 5;
            const radius = point % 2 === 0 ? target.radius : target.radius * 0.46;
            const x = target.x + Math.cos(angle) * radius;
            const y = target.y + Math.sin(angle) * radius;
            if (point === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          const r = target.radius;
          ctx.moveTo(target.x - r, target.y + r * 0.42);
          ctx.lineTo(target.x - r, target.y + r * 0.12);
          ctx.quadraticCurveTo(target.x - r, target.y - r * 0.35, target.x - r * 0.5, target.y - r * 0.35);
          ctx.quadraticCurveTo(target.x - r * 0.2, target.y - r * 1.05, target.x + r * 0.28, target.y - r * 0.7);
          ctx.quadraticCurveTo(target.x + r * 0.76, target.y - r * 0.68, target.x + r * 0.78, target.y - r * 0.12);
          ctx.quadraticCurveTo(target.x + r, target.y - r * 0.02, target.x + r, target.y + r * 0.25);
          ctx.quadraticCurveTo(target.x + r, target.y + r * 0.58, target.x + r * 0.55, target.y + r * 0.58);
          ctx.lineTo(target.x - r * 0.58, target.y + r * 0.58);
          ctx.quadraticCurveTo(target.x - r, target.y + r * 0.58, target.x - r, target.y + r * 0.42);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

    };

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = timestamp;
      const delta = timestamp - state.lastTime;
      state.lastTime = timestamp;
      update(delta);
      draw();
      if (state.state === 'PLAYING') {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    if (gameState === 'PLAYING') {
      stateRef.current.lastTime = 0;
      stateRef.current.spawnTimer = 0;
      animationRef.current = requestAnimationFrame(loop);
    }

    const handlePointerDown = (event: PointerEvent) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      const rect = canvas.getBoundingClientRect();
      event.preventDefault();
      state.pointerActive = true;
      state.pointerX = event.clientX - rect.left;
      state.pointerY = event.clientY - rect.top;
      state.pointerPrevX = state.pointerX;
      state.pointerPrevY = state.pointerY;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const state = stateRef.current;
      if (!state.pointerActive) return;
      state.pointerX = event.clientX - rect.left;
      state.pointerY = event.clientY - rect.top;
    };

    const handlePointerUp = () => {
      stateRef.current.pointerActive = false;
    };

    const handleWindowBlur = () => {
      stateRef.current.pointerActive = false;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handleWindowBlur);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, onGameOver]);

  const startGame = () => {
    stateRef.current = {
      ...stateRef.current,
      state: 'PLAYING',
      score: 0,
      time: 45,
      lives: 3,
      targets: [],
      trail: [],
      lastTime: 0,
      spawnTimer: 0,
      elapsed: 0,
      timeAccumulator: 0,
      pointerActive: false,
      pointerX: 0,
      pointerY: 0,
      pointerPrevX: 0,
      pointerPrevY: 0,
    } as typeof stateRef.current;
    setScore(0);
    setTimeLeft(45);
    setLives(3);
    setHint('Sapu awan dan bintang, hindari petir yang makin sering.');
    setGameState('PLAYING');
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#06101f] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_16%_10%,rgba(56,189,248,0.2),transparent_32%),radial-gradient(ellipse_at_88%_85%,rgba(249,115,22,0.13),transparent_34%),linear-gradient(180deg,#091a32_0%,#06101f_68%,#07111d_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'linear-gradient(rgba(186, 230, 253, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(186, 230, 253, 0.18) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />
      <canvas
        ref={canvasRef}
        aria-label="Area permainan Sky Swipe. Tekan dan geser untuk menyapu awan dan bintang, hindari petir."
        className="absolute inset-0 z-0 block h-full w-full touch-none"
      />

      {gameState === 'PLAYING' && (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-30 sm:inset-x-5 sm:top-4">
            <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5 sm:gap-2">
              <div className="rounded-2xl border border-amber-200/15 bg-[#111b2b]/85 px-2 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-3 sm:py-2.5">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-amber-100/65 sm:text-[9px]">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden="true" /> Skor
                </div>
                <div className="mt-0.5 truncate text-base font-black tabular-nums text-amber-100 sm:text-lg">{score}</div>
              </div>
              <div className="rounded-2xl border border-rose-200/15 bg-[#111b2b]/85 px-2 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-3 sm:py-2.5">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-rose-100/65 sm:text-[9px]">
                  <Heart className="h-3 w-3 fill-rose-400 text-rose-300" aria-hidden="true" /> Nyawa
                </div>
                <div className="mt-1 flex h-5 items-center gap-1" aria-label={lives + ' nyawa tersisa'}>
                  {[1, 2, 3].map((life) => (
                    <Heart key={life} className={'h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ' + (life <= lives ? 'fill-rose-400 text-rose-300' : 'fill-transparent text-slate-600')} aria-hidden="true" />
                  ))}
                </div>
              </div>
              <div className={'relative overflow-hidden rounded-2xl border px-2 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-3 sm:py-2.5 ' + (timeLeft <= 10 ? 'border-rose-200/25 bg-rose-950/75' : 'border-cyan-200/15 bg-[#111b2b]/85')}>
                <div className={'flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ' + (timeLeft <= 10 ? 'text-rose-200' : 'text-cyan-100/65')}>
                  <Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu
                </div>
                <div className={'mt-0.5 text-base font-black tabular-nums sm:text-lg ' + (timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-cyan-100')}>{timeLeft}<span className="ml-0.5 text-[8px] font-bold text-slate-400">dtk</span></div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-sky-500 transition-[width] duration-500" style={{ width: ((timeLeft / 45) * 100) + '%' }} />
                </div>
              </div>
              <button
                type="button"
                aria-label="Akhiri permainan"
                title="Akhiri permainan"
                onClick={() => finishGame('Permainan diakhiri.')}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center self-center rounded-2xl border border-white/10 bg-[#111b2b]/90 text-[8px] font-black uppercase tracking-wide text-slate-200 shadow-lg backdrop-blur-xl transition hover:bg-white/10 active:scale-95 sm:h-12 sm:w-12 sm:rounded-[20px] sm:text-[9px]"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-sky-100/15 bg-[#071526]/80 px-3.5 py-2 text-[9px] font-bold text-sky-100/85 shadow-lg backdrop-blur-xl sm:bottom-5 sm:px-5 sm:py-2.5 sm:text-[10px]">
            <MousePointer2 className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            <span className="truncate">{hint}</span>
          </div>
        </>
      )}

      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#030b16]/72 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#101c2e]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.58)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-sky-100/20 bg-gradient-to-br from-sky-200 to-cyan-400 text-[#082b3d] shadow-[0_12px_32px_rgba(56,189,248,0.22)]">
                  <Cloud className="h-9 w-9 fill-white/25" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-100/10 bg-sky-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Sky Swipe</h1>
                <p className="mx-auto mt-2 max-w-[350px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  Sapu awan dan bintang yang jatuh. Hindari petir dan raih skor setinggi mungkin sebelum waktu habis.
                </p>

                <div className="my-5 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Clock3 className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                    <div className="text-[11px] font-black text-cyan-100 sm:text-xs">45 DETIK</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Satu ronde</div>
                  </div>
                  <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Heart className="mx-auto mb-1.5 h-5 w-5 fill-rose-400 text-rose-300" aria-hidden="true" />
                    <div className="text-[11px] font-black text-rose-100 sm:text-xs">3 NYAWA</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Jangan kena petir</div>
                  </div>
                  <div className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Star className="mx-auto mb-1.5 h-5 w-5 fill-amber-300 text-amber-300" aria-hidden="true" />
                    <div className="text-[11px] font-black text-amber-100 sm:text-xs">15-25 POIN</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Per tangkapan</div>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left">
                  <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-white">
                    <MousePointer2 className="h-4 w-4 text-sky-200" aria-hidden="true" /> Cara bermain
                  </div>
                  <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5">
                    Tekan dan geser jari atau mouse melewati awan dan bintang untuk menyapunya. Hindari petir: setiap sambaran mengurangi satu nyawa.
                  </p>
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-300/[0.07] p-2.5 text-[10px] font-semibold leading-4 text-orange-100/85">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-300" aria-hidden="true" />
                    <span>Tantangan meningkat: target bergerak lebih cepat dan petir muncul lebih sering.</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-200 to-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#082b3d] shadow-[0_10px_26px_rgba(56,189,248,0.2)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Mulai terbang <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                  Kembali ke menu
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#030b16]/78 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[420px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#101c2e]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.58)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-amber-100/20 bg-gradient-to-br from-amber-200/25 to-orange-400/10 text-amber-200 shadow-[0_12px_32px_rgba(251,191,36,0.16)]">
                  <Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" />
                </div>
                <div className="mb-2 inline-flex rounded-full border border-amber-100/10 bg-amber-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-amber-200">Ronde selesai</div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Sky Swipe selesai!</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">{hint === 'Waktu habis!' ? 'Waktunya habis.' : lives === 0 ? 'Petir menghabiskan seluruh nyawamu.' : 'Permainan diakhiri.'} Kumpulkan lebih banyak bintang di ronde berikutnya.</p>

                <div className="my-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.06] px-3 py-4">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-100/60">Skor akhir</div>
                    <div className="mt-1 text-3xl font-black tabular-nums text-amber-100">{score}</div>
                  </div>
                  <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.06] px-3 py-4">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-rose-100/60">Nyawa sisa</div>
                    <div className="mt-1 text-3xl font-black tabular-nums text-rose-100">{lives}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-200 to-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#082b3d] shadow-[0_10px_26px_rgba(56,189,248,0.2)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Main lagi <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                  Kembali ke menu
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
