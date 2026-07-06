import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
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

export default function NgolabSkySwipe({ onGameOver, onExit }: GameProps) {
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
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    width: 0,
    height: 0,
  });

  const spawnTarget = () => {
    const state = stateRef.current;
    const type = Math.random() < 0.15 ? 'lightning' : Math.random() < 0.45 ? 'star' : 'cloud';
    const radius = type === 'lightning' ? 22 : type === 'star' ? 16 : 24;
    state.targets.push({
      id: `target-${Date.now()}-${Math.random()}`,
      x: Math.random() * (state.width - 120) + 60,
      y: -60,
      radius,
      type,
      speed: Math.random() * 80 + 120,
      opacity: 0.75,
    });
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
      state.spawnTimer += dt;
      if (state.spawnTimer > 650) {
        spawnTarget();
        state.spawnTimer = 0;
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
        const dx = target.x - state.pointerX;
        const dy = target.y - state.pointerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < target.radius + 24) {
          if (target.type === 'lightning') {
            state.lives -= 1;
            setLives(state.lives);
            setHint('Aduh! Hindari petir itu.');
          } else {
            state.score += target.type === 'star' ? 25 : 15;
            setScore(state.score);
            setHint(target.type === 'star' ? 'Bintang ditangkap!' : 'Awan disapu!');
          }
          target.y = state.height + 300;
        }
      }

      if (state.lives <= 0) {
        state.state = 'GAMEOVER';
        setGameState('GAMEOVER');
        onGameOver(state.score);
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

      for (let i = 0; i < 120; i += 1) {
        const x = (i * 73) % canvas.width;
        const y = ((i * 47) % canvas.height) * 0.6;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      state.trail.forEach((point) => {
        ctx.globalAlpha = point.life * 0.7;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 20 * point.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      state.targets.forEach((target) => {
        ctx.save();
        ctx.globalAlpha = target.opacity;
        ctx.fillStyle = colors[target.type];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (target.type === 'lightning') {
          ctx.moveTo(target.x - 12, target.y - 18);
          ctx.lineTo(target.x + 2, target.y - 2);
          ctx.lineTo(target.x - 4, target.y - 2);
          ctx.lineTo(target.x + 10, target.y + 18);
          ctx.lineTo(target.x - 6, target.y + 4);
          ctx.lineTo(target.x, target.y + 4);
        } else {
          ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        if (target.type !== 'lightning') {
          ctx.stroke();
        }
        ctx.restore();
      });

      // HUD text rendering in canvas removed in favor of beautiful HTML floating HUD
      // ctx.fillStyle = '#ffffff';
      // ctx.font = '600 16px Inter, sans-serif';
      // ctx.fillText(`Skor: ${state.score}`, 24, 30);
      // ctx.fillText(`Nyawa: ${state.lives}`, 24, 56);
      // ctx.fillText(`Waktu: ${state.time}s`, 24, 82);
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
      const rect = canvas.getBoundingClientRect();
      const state = stateRef.current;
      state.pointerActive = true;
      state.pointerX = event.clientX - rect.left;
      state.pointerY = event.clientY - rect.top;
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

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
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
      pointerActive: false,
      pointerX: 0,
      pointerY: 0,
    } as typeof stateRef.current;
    setScore(0);
    setTimeLeft(45);
    setLives(3);
    setHint('Geser/sapu awan dan bintang, hindari sambaran petir.');
    setGameState('PLAYING');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#020617] via-[#05142f] to-[#02060c] text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_22%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block touch-none" />

      {/* Floating HUD during gameplay */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => {
              stateRef.current.state = 'GAMEOVER';
              setGameState('GAMEOVER');
              onGameOver(stateRef.current.score);
            }}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg"
            title="Keluar Game"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="pointer-events-auto flex items-center gap-6 bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-3 text-xs font-bold font-mono tracking-wider shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⭐</span>
              <span>SKOR <span className="text-yellow-400">{score}</span></span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-red-400">❤️</span>
              <span>NYAWA <span className="text-red-400">{lives}</span></span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">⏱️</span>
              <span>WAKTU <span className="text-cyan-400">{timeLeft}s</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Overlays for START and GAMEOVER */}
      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-[32px] border border-sky-500/20 bg-slate-900/90 p-8 text-center shadow-2xl shadow-sky-500/20">
              <span className="inline-flex rounded-full bg-sky-500/10 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-sky-300 mb-4">
                Sky Swipe
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">
                {gameState === 'START' ? 'Mulai Terbang?' : 'Sky Swipe Selesai'}
              </h1>
              
              <p className="text-sm leading-7 text-slate-300 mb-8">
                {gameState === 'START'
                  ? 'Tarik garis melewati elemen langit yang jatuh untuk mengumpulkan awan dan bintang sambil menghindari petir berbahaya.'
                  : `Anda mengumpulkan ${score} poin langit.`}
              </p>

              {gameState === 'GAMEOVER' && (
                <div className="mb-6 text-left rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Skor Akhir</p>
                  <p className="text-4xl font-bold text-white">{score}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-sky-500 py-4 text-sm font-bold uppercase text-slate-950 transition hover:bg-sky-400 shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  {gameState === 'START' ? 'Mulai Bermain' : 'Main Lagi'}
                </button>
                <button
                  onClick={onExit}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-semibold uppercase text-slate-200 transition hover:bg-white/10 active:scale-95"
                >
                  Kembali ke Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
