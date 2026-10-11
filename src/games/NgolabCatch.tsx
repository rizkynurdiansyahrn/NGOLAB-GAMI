import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock3, Heart, MousePointer2, ShoppingBasket, Sparkles, Trophy } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export default function NgolabCatch({ onGameOver, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [gameOverReason, setGameOverReason] = useState("WAKTU HABIS!");
  const [isDragging, setIsDragging] = useState(false);

  const stateRef = useRef({
    state: 'START',
    score: 0,
    time: 10,
    lives: 3,
    items: [] as any[],
    particles: [] as any[],
    player: { x: 0, y: 0, width: 100, height: 20, color: '#67e8f9', emoji: '🧺', scale: 1 },
    lastTime: 0,
    itemSpawnTimer: 0
  });

  const [hudData, setHudData] = useState({ score: 0, time: 10, lives: 3 });
  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timerInterval: NodeJS.Timeout;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const s = stateRef.current;
      if (s.state !== 'PLAYING' && s.player.y === 0) {
        s.player.x = canvas.width / 2 - s.player.width / 2;
      }
      s.player.x = Math.min(Math.max(s.player.x, 0), Math.max(0, canvas.width - s.player.width));
      s.player.y = canvas.height - Math.max(100, canvas.height * 0.15);
    };
    window.addEventListener('resize', resize);
    resize();

    const goodItems = ['🍔', '🍟', '🥤', '🍕', '🍩', '🌭', '🌮'];
    const badItems = ['🗑️', '💣', '🧪'];

    const spawnItem = () => {
      const isBad = Math.random() < 0.25;
      const emojiList = isBad ? badItems : goodItems;
      const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
      const size = (canvas.width < 600) ? 60 : 70;
      const x = Math.random() * (canvas.width - size * 1.5) + size * 0.75;
      const speedMultiplier = ((60 - stateRef.current.time) * 0.08) + 4;

      stateRef.current.items.push({
        x, y: -size, size, emoji, isBad,
        speedY: Math.random() * 3 + speedMultiplier,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15
      });
    };

    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 15; i++) {
        stateRef.current.particles.push({
          x, y, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
          life: 1, color
        });
      }
    };

    const syncHud = () => {
      setHudData({
        score: stateRef.current.score,
        time: stateRef.current.time,
        lives: stateRef.current.lives
      });
    };

    const endGame = (reason: string) => {
      stateRef.current.state = 'GAMEOVER';
      setGameState('GAMEOVER');
      setGameOverReason(reason);
      syncHud();
      onGameOver(stateRef.current.score);
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.state !== 'PLAYING') return;

      if (s.player.scale > 1) s.player.scale -= 0.05;

      s.itemSpawnTimer += dt;
      const spawnRate = Math.max(300, 900 - ((60 - s.time) * 12));
      if (s.itemSpawnTimer > spawnRate) { spawnItem(); s.itemSpawnTimer = 0; }

      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += item.speedY; item.rotation += item.rotationSpeed;

        const hitZoneSize = item.size * 0.5;
        const catchMargin = 14;
        if (item.y + hitZoneSize > s.player.y && item.y - hitZoneSize < s.player.y + s.player.height &&
          item.x + hitZoneSize + catchMargin > s.player.x && item.x - hitZoneSize - catchMargin < s.player.x + s.player.width) {

          if (item.isBad) {
            s.lives--;
            syncHud();
            createParticles(item.x, item.y, '#FF0055');
            if (s.lives <= 0) {
              endGame("NYAWA HABIS!");
            }
          } else {
            s.score += 10;
            syncHud();
            createParticles(item.x, item.y, '#00FFFF');
            s.player.scale = 1.2;
          }
          s.items.splice(i, 1); continue;
        }
        if (item.y > canvas.height + 100) s.items.splice(i, 1);
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if (p.life <= 0) s.particles.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = stateRef.current;
      if (s.state !== 'PLAYING' && s.items.length === 0) return;

      // Render the basket with a bright tray and soft glow.
      ctx.save();
      ctx.shadowColor = s.player.color;
      ctx.shadowBlur = 22;
      const basketGradient = ctx.createLinearGradient(s.player.x, s.player.y, s.player.x + s.player.width, s.player.y + s.player.height);
      basketGradient.addColorStop(0, 'rgba(45, 212, 191, 0.34)');
      basketGradient.addColorStop(1, 'rgba(34, 211, 238, 0.16)');
      ctx.fillStyle = basketGradient;
      ctx.strokeStyle = s.player.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(s.player.x, s.player.y, s.player.width, s.player.height, 10);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(207, 250, 254, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.player.x + 15, s.player.y + 5);
      ctx.lineTo(s.player.x + s.player.width - 15, s.player.y + 5);
      ctx.stroke();
      ctx.restore();

      if (pointerState.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,255,0.75)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        const centerX = s.player.x + s.player.width / 2;
        const centerY = s.player.y + s.player.height / 2;
        const radius = Math.max(s.player.width, s.player.height) * 1.3;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = `${46 * s.player.scale}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(34, 211, 238, 0.7)';
      ctx.shadowBlur = 16;
      ctx.fillText(s.player.emoji, s.player.x + s.player.width / 2, s.player.y - 13);
      ctx.shadowBlur = 0;

      // Render Items
      for (const item of s.items) {
        ctx.save();
        ctx.translate(item.x, item.y); ctx.rotate(item.rotation);
        const itemRadius = item.size * 0.56;
        const itemGradient = ctx.createRadialGradient(-itemRadius * 0.3, -itemRadius * 0.35, 2, 0, 0, itemRadius);
        if (item.isBad) {
          itemGradient.addColorStop(0, 'rgba(251, 113, 133, 0.25)');
          itemGradient.addColorStop(1, 'rgba(190, 24, 93, 0.08)');
          ctx.shadowColor = 'rgba(251, 113, 133, 0.8)';
        } else {
          itemGradient.addColorStop(0, 'rgba(253, 230, 138, 0.24)');
          itemGradient.addColorStop(1, 'rgba(249, 115, 22, 0.07)');
          ctx.shadowColor = 'rgba(251, 191, 36, 0.75)';
        }
        ctx.fillStyle = itemGradient;
        ctx.strokeStyle = item.isBad ? 'rgba(251, 113, 133, 0.28)' : 'rgba(253, 230, 138, 0.26)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, itemRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = `${item.size * 0.72}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = item.isBad ? 'rgba(251, 113, 133, 0.9)' : 'rgba(253, 230, 138, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();
      }

      // Render Particles
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    };

    const gameLoop = (timestamp: number) => {
      const dt = timestamp - stateRef.current.lastTime;
      stateRef.current.lastTime = timestamp;
      if (dt < 100) { update(dt); draw(); }
      if (stateRef.current.state === 'PLAYING') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };
    gameLoopRef.current = gameLoop;
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    timerInterval = setInterval(() => {
      if (stateRef.current.state === 'PLAYING') {
        stateRef.current.time--;
        syncHud();
        if (stateRef.current.time <= 0) {
          endGame("WAKTU HABIS!");
        }
      }
    }, 1000);
    timerRef.current = timerInterval;

    const pointerState = { active: false, offsetX: 0 };

    const handleMove = (clientX: number) => {
      if (stateRef.current.state !== 'PLAYING') return;
      const rect = canvas.getBoundingClientRect();
      const p = stateRef.current.player;
      const targetX = clientX - rect.left - pointerState.offsetX;
      p.x = Math.min(Math.max(targetX, 0), canvas.width - p.width);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerState.active) return;
      handleMove(e.clientX);
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerState.active = true;
      setIsDragging(true);
      const rect = canvas.getBoundingClientRect();
      pointerState.offsetX = e.clientX - rect.left - stateRef.current.player.x;
      canvas.setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointerState.active = false;
      setIsDragging(false);
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    stateRef.current = {
      ...stateRef.current,
      state: 'PLAYING',
      score: 0,
      time: 10,
      lives: 3,
      items: [],
      particles: [],
      itemSpawnTimer: 0,
      lastTime: performance.now(),
    };
    setIsDragging(false);
    setHudData({ score: 0, time: 10, lives: 3 });
    setGameState('PLAYING');

    if (gameLoopRef.current) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(gameLoopRef.current);
    }
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#07111f] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_10%,rgba(13,148,136,0.22),transparent_32%),radial-gradient(ellipse_at_85%_82%,rgba(249,115,22,0.18),transparent_34%),linear-gradient(180deg,#0a1628_0%,#07111f_72%,#091421_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'linear-gradient(rgba(148, 205, 218, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 205, 218, 0.18) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />
      <div className="pointer-events-none absolute -left-28 top-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-orange-400/10 blur-[100px]" />

      <canvas
        ref={canvasRef}
        aria-label="Area permainan Ngolab Catch. Geser ke kiri atau kanan untuk menangkap makanan."
        className="absolute inset-0 z-10 block h-full w-full touch-none cursor-grab active:cursor-grabbing"
      />

      {gameState === 'PLAYING' && (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-20 sm:inset-x-5 sm:top-4">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1b2d]/80 px-3 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl md:min-w-[220px] md:rounded-[22px] md:px-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-teal-200 to-cyan-400 text-[#07303a] shadow-[0_6px_18px_rgba(45,212,191,0.22)]">
                  <ShoppingBasket className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-teal-200/80">Ngolab Arcade</div>
                  <div className="mt-0.5 text-sm font-black tracking-wide text-white sm:text-base">CATCH RUSH</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:min-w-[420px] md:max-w-[510px] md:flex-1">
                <div className="rounded-2xl border border-orange-200/15 bg-[#171c2c]/85 px-3 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-4 sm:py-2.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em] text-orange-200/70 sm:text-[9px]">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Waktu
                  </div>
                  <div className={`mt-0.5 text-lg font-black tabular-nums sm:text-xl ${hudData.time <= 3 ? 'text-rose-300' : 'text-white'}`}>
                    {hudData.time}<span className="ml-1 text-[9px] font-bold text-slate-400">dtk</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full transition-[width] duration-300 ${hudData.time <= 3 ? 'bg-rose-400' : 'bg-gradient-to-r from-amber-300 to-orange-400'}`} style={{ width: `${Math.max(0, (hudData.time / 10) * 100)}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200/15 bg-[#171c2c]/85 px-3 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-4 sm:py-2.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em] text-rose-200/70 sm:text-[9px]">
                    <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Nyawa
                  </div>
                  <div className="mt-2 flex h-5 items-center gap-1.5" aria-label={`${hudData.lives} nyawa tersisa`}>
                    {[1, 2, 3].map((life) => (
                      <Heart key={life} className={`h-4 w-4 transition-colors ${life <= hudData.lives ? 'fill-rose-400 text-rose-300' : 'fill-transparent text-slate-600'}`} aria-hidden="true" />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-200/15 bg-[#171c2c]/85 px-3 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-4 sm:py-2.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em] text-cyan-200/70 sm:text-[9px]">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Skor
                  </div>
                  <div className="mt-0.5 text-lg font-black tabular-nums text-cyan-100 sm:text-xl">{hudData.score.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
            <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-cyan-100/15 bg-[#071522]/75 px-3.5 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-[10px]">
              <MousePointer2 className="h-4 w-4 text-teal-200" aria-hidden="true" />
              <span>{isDragging ? 'Keranjang bergerak' : 'Geser keranjang ke kiri / kanan'}</span>
              <span className="animate-pulse text-teal-200" aria-hidden="true">↔</span>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            id={gameState === 'GAMEOVER' ? 'popup_game_over' : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030916]/75 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#0d1b2d]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />

              {gameState === 'START' ? (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-teal-100/20 bg-gradient-to-br from-teal-200 to-cyan-400 text-[#07303a] shadow-[0_12px_32px_rgba(45,212,191,0.22)]">
                    <ShoppingBasket className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-100/10 bg-teal-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-teal-200">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Catch Rush</h1>
                  <p className="mx-auto mt-2 max-w-[340px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                    Tangkap makanan sebanyak mungkin sebelum waktu habis. Jaga keranjangmu dari benda berbahaya!
                  </p>

                  <div className="my-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-orange-200/10 bg-orange-300/[0.07] px-2 py-3">
                      <Clock3 className="mx-auto mb-1.5 h-5 w-5 text-orange-200" aria-hidden="true" />
                      <div className="text-xs font-black text-orange-100">10 DETIK</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Satu ronde</div>
                    </div>
                    <div className="rounded-2xl border border-rose-200/10 bg-rose-300/[0.06] px-2 py-3">
                      <Heart className="mx-auto mb-1.5 h-5 w-5 fill-rose-400 text-rose-300" aria-hidden="true" />
                      <div className="text-xs font-black text-rose-100">3 NYAWA</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Hindari bahaya</div>
                    </div>
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-2 py-3">
                      <Sparkles className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                      <div className="text-xs font-black text-cyan-100">+10 POIN</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Setiap tangkapan</div>
                    </div>
                  </div>

                  <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left">
                    <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-white">
                      <MousePointer2 className="h-4 w-4 text-teal-200" aria-hidden="true" /> Cara bermain
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] leading-4">
                      <div className="rounded-xl bg-emerald-300/[0.06] p-2.5 text-slate-300">
                        <span className="mr-1.5">🍔</span> Tangkap makanan untuk poin.
                      </div>
                      <div className="rounded-xl bg-rose-300/[0.06] p-2.5 text-slate-300">
                        <span className="mr-1.5">💣</span> Hindari bom, sampah, dan bahan kimia.
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] leading-4 text-slate-500">Seret keranjang ke kiri dan kanan. Sentuhan dan mouse sama-sama bisa digunakan.</p>
                  </div>

                  <button
                    type="button"
                    onClick={startGame}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-200 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#072a32] shadow-[0_10px_26px_rgba(45,212,191,0.18)] transition hover:brightness-105 active:scale-[0.98]"
                  >
                    Mulai menangkap <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                    Kembali ke menu
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-amber-100/20 bg-gradient-to-br from-amber-200/25 to-orange-400/10 text-amber-200 shadow-[0_12px_32px_rgba(251,146,60,0.18)]">
                    <Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" />
                  </div>
                  <div className="mb-2 inline-flex rounded-full border border-amber-100/10 bg-amber-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-amber-200">Ronde selesai</div>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{gameOverReason}</h1>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Keranjang berhenti bergerak. Coba lagi dan kumpulkan lebih banyak makanan.</p>

                  <div className="my-5 rounded-[24px] border border-cyan-200/10 bg-gradient-to-br from-cyan-300/[0.09] to-blue-400/[0.04] px-5 py-5">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-100/60">Skor akhir</div>
                    <div className="mt-1 text-5xl font-black tabular-nums tracking-tight text-cyan-100">{hudData.score.toLocaleString()}</div>
                    <div className="mt-2 text-[10px] font-semibold text-slate-400">Nyawa tersisa: {hudData.lives}</div>
                  </div>

                  <button
                    type="button"
                    onClick={startGame}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-200 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#072a32] shadow-[0_10px_26px_rgba(45,212,191,0.18)] transition hover:brightness-105 active:scale-[0.98]"
                  >
                    Main lagi <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                    Kembali ke menu
                  </button>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
