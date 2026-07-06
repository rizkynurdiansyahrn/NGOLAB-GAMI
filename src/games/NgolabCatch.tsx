import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
    player: { x: 0, y: 0, width: 100, height: 20, color: '#00FFFF', emoji: '🛒', scale: 1 },
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
      s.player.y = canvas.height - Math.max(100, canvas.height * 0.15);
    };
    window.addEventListener('resize', resize);
    resize();

    const goodItems = ['🍔', '🍟', '🥤', '🍕', '🍩', '🍗', '🌭'];
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

      // Render Player Cart
      ctx.shadowColor = s.player.color; ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.strokeStyle = s.player.color; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(s.player.x, s.player.y, s.player.width, s.player.height, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;

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

      ctx.font = `${50 * s.player.scale}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.player.emoji, s.player.x + s.player.width / 2, s.player.y - 15);

      // Render Items
      for (const item of s.items) {
        ctx.save();
        ctx.translate(item.x, item.y); ctx.rotate(item.rotation);
        ctx.font = `${item.size}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (item.isBad) {
          ctx.shadowColor = 'red'; ctx.shadowBlur = 15;
        } else {
          ctx.shadowColor = 'yellow'; ctx.shadowBlur = 10;
        }
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

  useEffect(() => {
    // Auto-start game on mount for Katalon testing
    const autoStartTimer = setTimeout(() => {
      if (stateRef.current.state === 'START') {
        startGame();
      }
    }, 500);
    return () => clearTimeout(autoStartTimer);
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
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#0a0a2a] to-[#1a0b2e] overflow-hidden text-white font-[PressStart2P]">
      {/* Cyber grid background */}
      <div
        className="absolute w-[200%] h-full bottom-[-50%] left-[-50%] pointer-events-none opacity-40 z-0 cyber-grid-bg"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#0a0a2a] z-0 pointer-events-none" />

      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full block touch-none cursor-grab" />

      {gameState === 'PLAYING' && (
        <div className="pointer-events-none absolute left-1/2 bottom-24 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full border border-cyan-400/30 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
          <span>{isDragging ? 'MENYERET...' : 'SERET KERANJANG'}</span>
          <span className="animate-pulse">⟵ ⟶</span>
        </div>
      )}

      {/* HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-0 w-full z-20 flex justify-between p-4 px-6 md:px-12 text-xs font-bold font-mono">
          <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff] text-cyan-400">WAKTU <span className="text-white">{hudData.time}</span></div>
          <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff] text-cyan-400">NYAWA <span className="text-white">{hudData.lives}</span></div>
          <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff] text-cyan-400">SKOR <span className="text-white">{hudData.score}</span></div>
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            id={gameState === 'GAMEOVER' ? 'popup_game_over' : undefined}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-center"
          >
            <div className="bg-gray-900 border-2 border-cyan-400 p-8 rounded-xl flex flex-col items-center">
              <h1 className="text-2xl text-cyan-400 font-black mb-4 uppercase">
                {gameState === 'START' ? 'CATCH RUSH' : gameOverReason}
              </h1>

              {gameState === 'START' && (
                <p className="text-sm mb-6 text-gray-300">Tangkap makanan (🍔,🍟,🥤) untuk poin.<br /><br />Hindari bahaya (🗑️,💣) untuk bertahan.<br /><br />Seret keranjang untuk bergerak!</p>
              )}
              {gameState === 'GAMEOVER' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-300 mb-2">SKOR AKHIR:</p>
                  <p className="text-4xl text-cyan-400 font-bold mb-4">{hudData.score}</p>
                </div>
              )}

              <button
                onClick={startGame}
                className="bg-cyan-500 text-black px-6 py-3 rounded font-bold uppercase w-full mb-3 shadow-[0_0_10px_#0ff]"
              >
                {gameState === 'START' ? 'MULAI GAME' : 'MAIN LAGI'}
              </button>

              <button
                onClick={onExit}
                className="bg-gray-800 text-cyan-400 border border-cyan-500 px-6 py-3 rounded font-bold uppercase w-full"
              >
                KEMBALI KE MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
