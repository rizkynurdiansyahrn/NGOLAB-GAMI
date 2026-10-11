import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, Clock3, Gamepad2, Heart, Keyboard, MousePointer2, Orbit, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

type Star = { x: number; y: number; z: number; speed: number };
type Rock = { x: number; y: number; radius: number; speed: number; rotation: number; type: 'asteroid' | 'mine' };
type Orb = { x: number; y: number; radius: number; speed: number; glow: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function NgolabAstroDrift({ onGameOver, onExit, onScoreChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(50);
  const [message, setMessage] = useState('Geser kapal untuk mengambil inti energi dan menghindari rintangan.');

  const stateRef = useRef({
    state: 'START',
    score: 0,
    lives: 3,
    time: 50,
    message: 'Geser kapal untuk mengambil inti energi dan menghindari rintangan.',
    playerX: 0,
    playerY: 0,
    width: 0,
    height: 0,
    nextRock: 0,
    nextOrb: 0,
    stars: [] as Star[],
    rocks: [] as Rock[],
    orbs: [] as Orb[],
    particles: [] as Particle[],
    lastTime: 0,
    isShielded: false,
    shake: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      const state = stateRef.current;
      state.width = width;
      state.height = height;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      state.playerX = width / 2;
      state.playerY = height * 0.77;
      state.stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * width,
        speed: randomBetween(0.5, 2.5),
      }));
    };

    window.addEventListener('resize', resize);
    resize();

    const spawnRock = () => {
      const state = stateRef.current;
      state.rocks.push({
        x: randomBetween(40, state.width - 40),
        y: -80,
        radius: randomBetween(18, 42),
        speed: randomBetween(180, 280),
        rotation: Math.random() * Math.PI * 2,
        type: Math.random() < 0.75 ? 'asteroid' : 'mine',
      });
    };

    const spawnOrb = () => {
      const state = stateRef.current;
      state.orbs.push({
        x: randomBetween(60, state.width - 60),
        y: -60,
        radius: 18,
        speed: randomBetween(120, 210),
        glow: 1,
      });
    };

    const createParticles = (x: number, y: number, color: string) => {
      const particles = stateRef.current.particles;
      for (let i = 0; i < 10; i += 1) {
        particles.push({
          x,
          y,
          vx: randomBetween(-120, 120),
          vy: randomBetween(-90, 90),
          life: 1,
          color,
        });
      }
    };

    const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const update = (dt: number) => {
      const state = stateRef.current;
      const seconds = dt / 1000;

      // Always update stars and particles for visual feedback
      state.stars.forEach((star) => {
        star.y += star.speed * seconds * 0.6;
        star.x += Math.sin(star.y * 0.002) * 0.3;
        if (star.y > state.height) {
          star.y = 0;
          star.x = Math.random() * state.width;
          star.z = Math.random() * state.width;
          star.speed = randomBetween(0.5, 2.5);
        }
      });

      state.particles = state.particles.filter((particle) => {
        particle.x += particle.vx * seconds;
        particle.y += particle.vy * seconds;
        particle.life -= seconds * 1.4;
        return particle.life > 0;
      });

      if (state.shake > 0) {
        state.shake = Math.max(0, state.shake - dt * 0.06);
      }

      if (state.state !== 'PLAYING') return;

      state.nextRock -= dt;
      state.nextOrb -= dt;
      if (state.nextRock <= 0) {
        spawnRock();
        state.nextRock = randomBetween(550, 900);
      }
      if (state.nextOrb <= 0) {
        spawnOrb();
        state.nextOrb = randomBetween(900, 1400);
      }

      state.rocks = state.rocks.filter((rock) => {
        if (state.state !== 'PLAYING') return true;
        rock.y += rock.speed * seconds;
        rock.rotation += seconds * 2;
        if (rock.y > state.height + 80) return false;

        const dist = getDistance(rock.x, rock.y, state.playerX, state.playerY);
        if (dist < rock.radius + 24) {
          state.lives -= 1;
          setLives(state.lives);
          state.shake = 8;
          createParticles(state.playerX, state.playerY, '#ff4d6d');
          if (state.lives <= 0) {
            state.state = 'GAMEOVER';
            state.message = 'Kapal terkena terlalu banyak rintangan.';
            setMessage(state.message);
            setGameState('GAMEOVER');
            onGameOver(state.score);
          }
          return false;
        }
        return true;
      });

      if (state.state !== 'PLAYING') return;

      state.orbs = state.orbs.filter((orb) => {
        orb.y += orb.speed * seconds;
        orb.glow = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        if (orb.y > state.height + 60) return false;

        const dist = getDistance(orb.x, orb.y, state.playerX, state.playerY);
        if (dist < orb.radius + 24) {
          state.score += 25;
          setScore(state.score);
          onScoreChange?.(state.score);
          createParticles(orb.x, orb.y, '#60a5fa');
          return false;
        }
        return true;
      });

    };

    const draw = () => {
      const state = stateRef.current;
      ctx.save();
      ctx.clearRect(0, 0, state.width, state.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
      gradient.addColorStop(0, '#040816');
      gradient.addColorStop(0.45, '#0f1b3d');
      gradient.addColorStop(1, '#02070f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, state.width, state.height);

      const shakeX = randomBetween(-state.shake, state.shake);
      const shakeY = randomBetween(-state.shake, state.shake);
      ctx.translate(shakeX, shakeY);

      state.stars.forEach((star) => {
        ctx.fillStyle = `rgba(160, 220, 255, ${0.2 + star.z / state.width / 2})`;
        const size = 1 + star.z / state.width * 2;
        if (size > 2.2) {
          ctx.strokeStyle = `rgba(125, 211, 252, ${0.12 + star.z / state.width / 4})`;
          ctx.lineWidth = size * 0.65;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - size * 2.4);
          ctx.lineTo(star.x, star.y + size * 2.4);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      state.orbs.forEach((orb) => {
        ctx.save();
        ctx.strokeStyle = `rgba(96, 165, 250, 0.9)`;
        ctx.fillStyle = `rgba(96, 165, 250, 0.15)`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = orb.glow;
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#60a5fa';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      state.rocks.forEach((rock) => {
        const gradientRock = ctx.createRadialGradient(rock.x, rock.y, rock.radius * 0.2, rock.x, rock.y, rock.radius);
        gradientRock.addColorStop(0, rock.type === 'asteroid' ? '#fbbf24' : '#e11d48');
        gradientRock.addColorStop(1, '#111827');
        ctx.fillStyle = gradientRock;
        ctx.save();
        ctx.translate(rock.x, rock.y);
        ctx.rotate(rock.rotation);
        ctx.shadowColor = rock.type === 'asteroid' ? '#f59e0b' : '#fb7185';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(-rock.radius * 0.8, -rock.radius);
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const radius = rock.radius * (0.7 + Math.sin(i * 1.5) * 0.18);
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        if (rock.type === 'mine') {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'rgba(255, 220, 230, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, rock.radius * 0.38, 0, Math.PI * 2);
          ctx.stroke();
          for (let spike = 0; spike < 8; spike += 1) {
            const angle = (Math.PI * 2 * spike) / 8;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * rock.radius * 0.58, Math.sin(angle) * rock.radius * 0.58);
            ctx.lineTo(Math.cos(angle) * rock.radius * 1.12, Math.sin(angle) * rock.radius * 1.12);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      ctx.save();
      ctx.translate(state.playerX, state.playerY);
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(-7, 15);
      ctx.lineTo(0, 34 + Math.sin(Date.now() * 0.025) * 5);
      ctx.lineTo(7, 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(20, 24);
      ctx.lineTo(8, 18);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-20, 24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();

    };

    const loop = (timestamp: number) => {
      const current = stateRef.current;
      if (!current.lastTime) current.lastTime = timestamp;
      const delta = timestamp - current.lastTime;
      current.lastTime = timestamp;
      update(delta);
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    const timer = setInterval(() => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      state.time -= 1;
      setTimeLeft(state.time);
      if (state.time <= 0) {
        state.state = 'GAMEOVER';
        setGameState('GAMEOVER');
        state.message = 'Kamu berhasil bertahan sampai akhir misi!';
        setMessage(state.message);
        onGameOver(state.score);
      }
    }, 1000);

    const movePlayer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      state.playerX = clamp(event.clientX - rect.left, 40, state.width - 40);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      const key = event.key.toLowerCase();
      if (!['arrowleft', 'arrowright', 'a', 'd'].includes(key)) return;
      event.preventDefault();
      const direction = key === 'arrowleft' || key === 'a' ? -1 : 1;
      state.playerX = clamp(state.playerX + direction * Math.max(28, state.width * 0.075), 40, state.width - 40);
    };

    canvas.addEventListener('pointerdown', movePlayer);
    canvas.addEventListener('pointermove', movePlayer);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', movePlayer);
      canvas.removeEventListener('pointermove', movePlayer);
      window.removeEventListener('keydown', handleKeyDown);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      clearInterval(timer);
    };
  }, [onGameOver]);

  const startGame = () => {
    const state = stateRef.current;
    state.state = 'PLAYING';
    state.score = 0;
    state.lives = 3;
    state.time = 50;
    state.nextRock = 0;
    state.nextOrb = 300;
    state.rocks = [];
    state.orbs = [];
    state.particles = [];
    setScore(0);
    setLives(3);
    setTimeLeft(50);
    setMessage('Geser kapal untuk mengambil inti energi dan menghindari rintangan.');
    state.message = 'Geser kapal untuk mengambil inti energi dan menghindari rintangan.';
    setGameState('PLAYING');
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#030817] font-sans text-white">
      <canvas
        ref={canvasRef}
        aria-label="Area permainan Astro Drift. Geser kapal ke kiri dan kanan untuk mengambil energi dan menghindari rintangan."
        className="absolute inset-0 h-full w-full touch-none"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.16),transparent_48%),linear-gradient(180deg,rgba(4,9,27,0.18),transparent_40%,rgba(3,8,23,0.28))]" />

      {gameState === 'PLAYING' && (
        <>
          <header className="pointer-events-none absolute inset-x-3 top-3 z-10 mx-auto max-w-6xl rounded-[22px] border border-cyan-100/15 bg-[#071426]/75 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:inset-x-5 sm:top-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-5 sm:py-3">
            <div className="mb-3 flex min-w-0 items-center gap-3 sm:mb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-100/20 bg-gradient-to-br from-cyan-200 to-blue-500 text-[#061326] shadow-[0_0_26px_rgba(34,211,238,0.28)]">
                <Orbit className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/75">Misi antariksa · 50 detik</div>
                <div className="truncate text-sm font-black tracking-wide text-white sm:text-base">ASTRO DRIFT</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[390px] sm:max-w-[510px] sm:flex-1">
              <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.06] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/65 sm:text-[9px]"><Sparkles className="h-3 w-3" aria-hidden="true" /> Skor</div>
                <div className="mt-0.5 text-base font-black tabular-nums text-cyan-100 sm:text-lg">{score}</div>
              </div>
              <div className={'rounded-xl border px-2.5 py-2 sm:rounded-2xl sm:px-3 ' + (timeLeft <= 10 ? 'border-rose-200/25 bg-rose-300/[0.08]' : 'border-blue-200/10 bg-blue-300/[0.06]')}>
                <div className={'flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ' + (timeLeft <= 10 ? 'text-rose-200/75' : 'text-blue-100/65')}><Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu</div>
                <div className={'mt-0.5 text-base font-black tabular-nums sm:text-lg ' + (timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-blue-100')}>{timeLeft}<span className="ml-1 text-[8px] font-bold text-slate-400">dtk</span></div>
              </div>
              <div className="rounded-xl border border-rose-200/10 bg-rose-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-rose-100/65 sm:text-[9px]"><Heart className="h-3 w-3" aria-hidden="true" /> Nyawa</div>
                <div className="mt-1 flex h-[22px] items-center gap-1.5" aria-label={lives + ' dari 3 nyawa tersisa'}>
                  {[0, 1, 2].map((life) => <Heart key={life} className={'h-4 w-4 transition-colors ' + (life < lives ? 'fill-rose-400 text-rose-300' : 'text-slate-600')} aria-hidden="true" />)}
                </div>
              </div>
            </div>
          </header>

          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 mx-auto flex max-w-6xl flex-col gap-2 sm:inset-x-5 sm:bottom-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#071426]/75 px-3 py-2 text-[10px] font-bold text-slate-200 shadow-lg backdrop-blur-xl sm:px-4 sm:py-2.5 sm:text-xs">
              <MousePointer2 className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
              <span>Geser untuk mengemudi</span>
              <span className="hidden h-4 w-px bg-white/15 sm:block" />
              <Keyboard className="hidden h-4 w-4 shrink-0 text-cyan-200 sm:block" aria-hidden="true" />
              <span className="hidden sm:inline">← → atau A / D</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold sm:justify-end sm:text-[10px]">
              <span className="flex items-center gap-1.5 rounded-xl border border-blue-200/15 bg-blue-950/70 px-2.5 py-2 text-blue-100"><span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" /> ENERGI +25</span>
              <span className="flex items-center gap-1.5 rounded-xl border border-amber-200/15 bg-amber-950/60 px-2.5 py-2 text-amber-100"><span className="h-2.5 w-2.5 rotate-45 rounded-sm bg-amber-300" /> ASTEROID −1 NYAWA</span>
              <span className="flex items-center gap-1.5 rounded-xl border border-rose-200/15 bg-rose-950/60 px-2.5 py-2 text-rose-100"><span className="h-2.5 w-2.5 rounded-full border-2 border-rose-300" /> RANJAU −1 NYAWA</span>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#020611]/70 p-3 backdrop-blur-[3px] sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-[28px] border border-cyan-100/15 bg-[#091528]/95 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.62)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

              {gameState === 'START' ? (
                <div className="relative text-center">
                  <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border border-cyan-100/20 bg-gradient-to-br from-cyan-200 to-blue-500 text-[#061326] shadow-[0_12px_34px_rgba(34,211,238,0.25)]">
                    <Orbit className="h-9 w-9" strokeWidth={2.4} aria-hidden="true" />
                  </div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade</div>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Astro Drift</h1>
                  <p className="mx-auto mt-2 max-w-[390px] text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">Kendalikan kapal di tengah hujan asteroid. Kumpulkan inti energi dan bertahan selama 50 detik.</p>

                  <div className="my-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-blue-200/10 bg-blue-300/[0.06] px-2 py-3"><Clock3 className="mx-auto mb-1.5 h-5 w-5 text-blue-200" aria-hidden="true" /><div className="text-[11px] font-black text-blue-100 sm:text-xs">50 DETIK</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Bertahan hidup</div></div>
                    <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.06] px-2 py-3"><Heart className="mx-auto mb-1.5 h-5 w-5 fill-rose-300 text-rose-300" aria-hidden="true" /><div className="text-[11px] font-black text-rose-100 sm:text-xs">3 NYAWA</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Hindari tabrakan</div></div>
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-2 py-3"><Zap className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" /><div className="text-[11px] font-black text-cyan-100 sm:text-xs">+25 POIN</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Tiap energi</div></div>
                  </div>

                  <div className="mb-4 grid gap-2 text-left sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><MousePointer2 className="h-4 w-4" aria-hidden="true" /></div>
                      <div><div className="text-[10px] font-black uppercase tracking-wide text-white">Cara mengemudi</div><p className="mt-0.5 text-[10px] leading-4 text-slate-400">Geser jari atau mouse ke kiri dan kanan.</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200"><Keyboard className="h-4 w-4" aria-hidden="true" /></div>
                      <div><div className="text-[10px] font-black uppercase tracking-wide text-white">Kontrol keyboard</div><p className="mt-0.5 text-[10px] leading-4 text-slate-400">Gunakan tombol ← → atau A / D.</p></div>
                    </div>
                  </div>

                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.045] p-3 text-left">
                    <ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
                    <p className="text-[10px] leading-4 text-slate-300"><span className="font-extrabold text-cyan-100">Bola biru = +25 skor.</span> Asteroid dan ranjau mengurangi satu nyawa. Misi selesai jika kamu bertahan sampai waktu habis.</p>
                  </div>

                  <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-blue-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#041326] shadow-[0_10px_26px_rgba(34,211,238,0.2)] transition hover:brightness-105 active:scale-[0.98]">
                    <Gamepad2 className="h-5 w-5" aria-hidden="true" /> Luncurkan kapal
                  </button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                </div>
              ) : (
                <div className="relative text-center">
                  <div className={'mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border text-white shadow-[0_12px_34px_rgba(34,211,238,0.18)] ' + (timeLeft === 0 ? 'border-cyan-100/20 bg-gradient-to-br from-cyan-200 to-blue-500 text-[#061326]' : 'border-rose-100/20 bg-gradient-to-br from-rose-300 to-orange-500')}>
                    {timeLeft === 0 ? <Trophy className="h-9 w-9" aria-hidden="true" /> : <Orbit className="h-9 w-9" aria-hidden="true" />}
                  </div>
                  <div className="mb-2 inline-flex rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-cyan-200">Misi selesai</div>
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{timeLeft === 0 ? 'Kamu berhasil bertahan!' : 'Kapal kehilangan tenaga'}</h2>
                  <p className="mx-auto mt-2 max-w-[360px] text-xs leading-5 text-slate-400">{message}</p>

                  <div className="my-5 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/60">Skor akhir</div><div className="mt-1 text-3xl font-black tabular-nums text-cyan-100">{score}</div></div>
                    <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-rose-100/60">Nyawa tersisa</div><div className="mt-1 flex justify-center gap-1.5">{[0, 1, 2].map((life) => <Heart key={life} className={'h-7 w-7 ' + (life < lives ? 'fill-rose-300 text-rose-300' : 'text-slate-600')} aria-hidden="true" />)}</div></div>
                  </div>

                  <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-blue-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#041326] shadow-[0_10px_26px_rgba(34,211,238,0.2)] transition hover:brightness-105 active:scale-[0.98]">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" /> Ulangi misi
                  </button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
