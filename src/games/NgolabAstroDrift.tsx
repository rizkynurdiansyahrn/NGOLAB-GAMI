import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type Star = { x: number; y: number; z: number; speed: number };
type Rock = { x: number; y: number; radius: number; speed: number; rotation: number; type: 'asteroid' | 'mine' };
type Orb = { x: number; y: number; radius: number; speed: number; glow: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function NgolabAstroDrift({ onGameOver, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(50);
  const [message, setMessage] = useState('Ketuk/geser untuk mengemudi, kumpulkan bola energi, dan hindari asteroid!');

  const stateRef = useRef({
    state: 'START',
    score: 0,
    lives: 3,
    time: 50,
    message: 'Ketuk/geser untuk mengemudi, kumpulkan bola energi, dan hindari asteroid!',
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
      canvas.width = width;
      canvas.height = height;
      const state = stateRef.current;
      state.width = width;
      state.height = height;
      state.playerX = width / 2;
      state.playerY = height * 0.82;
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
        rock.y += rock.speed * seconds;
        rock.rotation += seconds * 2;
        if (rock.y > state.height + 80) return false;

        const dist = getDistance(rock.x, rock.y, state.playerX, state.playerY);
        if (dist < rock.radius + 24) {
          state.lives -= 1;
          setLives(state.lives);
          state.shake = 8;
          createParticles(state.playerX, state.playerY, '#ff4d6d');
          return false;
        }
        return true;
      });

      state.orbs = state.orbs.filter((orb) => {
        orb.y += orb.speed * seconds;
        orb.glow = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        if (orb.y > state.height + 60) return false;

        const dist = getDistance(orb.x, orb.y, state.playerX, state.playerY);
        if (dist < orb.radius + 24) {
          state.score += 25;
          setScore(state.score);
          createParticles(orb.x, orb.y, '#60a5fa');
          return false;
        }
        return true;
      });

      if (state.lives <= 0) {
        state.state = 'GAMEOVER';
        state.message = 'Mesin warp gagal!';
        setGameState('GAMEOVER');
        onGameOver(state.score);
      }
    };

    const draw = () => {
      const state = stateRef.current;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#040816');
      gradient.addColorStop(0.45, '#0f1b3d');
      gradient.addColorStop(1, '#02070f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const shakeX = randomBetween(-state.shake, state.shake);
      const shakeY = randomBetween(-state.shake, state.shake);
      ctx.translate(shakeX, shakeY);

      state.stars.forEach((star) => {
        ctx.fillStyle = `rgba(160, 220, 255, ${0.2 + star.z / state.width / 2})`;
        const size = 1 + star.z / state.width * 2;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      state.orbs.forEach((orb) => {
        ctx.save();
        ctx.strokeStyle = `rgba(96, 165, 250, 0.9)`;
        ctx.fillStyle = `rgba(96, 165, 250, 0.15)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = orb.glow;
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
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
        ctx.beginPath();
        ctx.moveTo(-rock.radius * 0.8, -rock.radius);
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const radius = rock.radius * (0.7 + Math.sin(i * 1.5) * 0.18);
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.translate(state.playerX, state.playerY);
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

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 16px Inter, sans-serif';
      ctx.fillText(`Skor: ${state.score}`, 24, 30);
      ctx.fillText(`Nyawa: ${state.lives}`, 24, 56);
      ctx.fillText(`Waktu: ${state.time}s`, 24, 82);
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
        setMessage('Bahan bakar habis!');
        onGameOver(state.score);
      }
    }, 1000);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      state.playerX = clamp(event.clientX - rect.left, 40, state.width - 40);
    };

    canvas.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
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
    setMessage('Ketuk/geser untuk mengemudi, kumpulkan bola energi, dan hindari asteroid!');
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-[#020617] via-[#06122d] to-[#02050e] text-white font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_38%)]" />
      {gameState === 'START' && (
        <div className="absolute left-0 top-0 p-4 text-sm font-semibold text-slate-100">
          <div>Astro Drift</div>
          <div className="text-xs text-slate-400">Pelari galaksi dengan bola energi, asteroid, dan visual neon.</div>
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6"
          >
            <div className="max-w-md rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-8 text-center shadow-2xl shadow-cyan-500/20">
              <h1 className="text-4xl font-black text-cyan-300 mb-4">ASTRO DRIFT</h1>
              <p className="mb-6 text-sm leading-7 text-slate-300">{gameState === 'START' ? message : 'Misi selesai! Ayo mulai petualangan baru.'}</p>
              {gameState === 'GAMEOVER' && (
                <div className="mb-5 text-left rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-slate-100">
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Skor Akhir</p>
                  <p className="text-5xl font-bold text-white">{score}</p>
                </div>
              )}
              <button
                onClick={startGame}
                className="mb-3 inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-lg font-bold uppercase text-slate-950 transition hover:bg-cyan-400"
              >
                {gameState === 'START' ? 'Luncurkan Kapal' : 'Ulangi Misi'}
              </button>
              <button
                onClick={onExit}
                className="inline-flex w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold uppercase text-slate-200 transition hover:bg-white/10"
              >
                Kembali ke Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
