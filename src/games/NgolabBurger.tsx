import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export default function NgolabBurger({ onGameOver, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [lives, setLives] = useState(3);
  const [stacked, setStacked] = useState(0);
  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // References for mutable game state inside animation loop
  const stateRef = useRef({
    state: 'START',
    score: 0,
    time: 60,
    lives: 3,
    stack: [] as any[],
    movingIngredient: null as any,
    fallingIngredient: null as any,
    cameraOffsetY: 0,
    particles: [] as any[],
    lastTime: 0,
  });

  // Sync state upward when needed
  const syncState = () => {
    setScore(stateRef.current.score);
    setTime(stateRef.current.time);
    setLives(stateRef.current.lives);
    setGameState(stateRef.current.state as 'START' | 'PLAYING' | 'GAMEOVER');
    if (stateRef.current.stack.length > 0) {
      setStacked(stateRef.current.stack.length - 1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timerInterval: NodeJS.Timeout;

    const INGREDIENTS = ['🥩', '🧀', '🍅', '🥬', '🧅'];
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    window.addEventListener('resize', resize);
    resize();

    const spawnMovingIngredient = () => {
      const type = INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)];
      const EMOJI_SIZE = canvas.width < 600 ? 55 : 75;
      const BASE_SPEED = canvas.width * 0.35; 
      stateRef.current.movingIngredient = {
          emoji: type, x: EMOJI_SIZE, y: EMOJI_SIZE * 1.8,
          direction: 1, speed: BASE_SPEED + (stateRef.current.score * 6), scale: 0
      };
    };

    const gameOver = () => {
      stateRef.current.state = 'GAMEOVER';
      syncState();
      onGameOver(stateRef.current.score);
    };

    const createParticles = (x: number, y: number, color: string) => {
      for(let i=0; i<10; i++){
          stateRef.current.particles.push({
              x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
              life: 1, color
          });
      }
    };

    const update = (deltaTime: number) => {
      if (stateRef.current.state !== 'PLAYING') return;
      
      const s = stateRef.current;
      const dt = deltaTime / 1000;
      const EMOJI_SIZE = canvas.width < 600 ? 55 : 75;
      const FALL_SPEED = window.innerHeight * 1.5;

      if (s.movingIngredient) {
          if (s.movingIngredient.scale < 1) s.movingIngredient.scale += 5 * dt; 
          if (s.movingIngredient.scale > 1) s.movingIngredient.scale = 1;

          s.movingIngredient.x += s.movingIngredient.speed * s.movingIngredient.direction * dt;
          if (s.movingIngredient.x > canvas.width - EMOJI_SIZE / 2) {
              s.movingIngredient.x = canvas.width - EMOJI_SIZE / 2; s.movingIngredient.direction = -1;
          } else if (s.movingIngredient.x < EMOJI_SIZE / 2) {
              s.movingIngredient.x = EMOJI_SIZE / 2; s.movingIngredient.direction = 1;
          }
      }

      if (s.fallingIngredient) {
          s.fallingIngredient.y += FALL_SPEED * dt;
          const topPiece = s.stack[s.stack.length - 1];
          const targetY = topPiece.y - EMOJI_SIZE * 0.45;

          if (s.fallingIngredient.y >= targetY && !s.fallingIngredient.missed) {
              const dist = Math.abs(s.fallingIngredient.x - topPiece.x);
              if (dist < EMOJI_SIZE * 0.8) {
                  s.score += 10;
                  syncState();

                  s.fallingIngredient.y = targetY;
                  s.fallingIngredient.glow = true;
                  s.stack.push(s.fallingIngredient);
                  
                  createParticles(s.fallingIngredient.x, s.fallingIngredient.y + s.cameraOffsetY, '#00FFFF');
                  
                  const idealTopEdge = canvas.height * 0.6;
                  if (s.fallingIngredient.y + s.cameraOffsetY < idealTopEdge) {
                      s.cameraOffsetY += (idealTopEdge - (s.fallingIngredient.y + s.cameraOffsetY));
                  }
                  
                  setTimeout(() => { if (s.stack[s.stack.length-1]) s.stack[s.stack.length-1].glow = false; }, 300);

                  s.fallingIngredient = null;
                  spawnMovingIngredient();
              } else s.fallingIngredient.missed = true;
          }
          
          if (s.fallingIngredient && s.fallingIngredient.y > canvas.height) {
              s.lives--;
              syncState();
              s.fallingIngredient = null;
              
              if (s.lives <= 0) gameOver(); else spawnMovingIngredient();
          }
      }

      for(let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx; p.y += p.vy; p.life -= 0.05;
          if(p.life <= 0) s.particles.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const EMOJI_SIZE = canvas.width < 600 ? 55 : 75;
      const s = stateRef.current;
      
      // Draw Stack
      for (let i = 0; i < s.stack.length; i++) {
          const piece = s.stack[i];
          ctx.font = `${EMOJI_SIZE}px sans-serif`;
          if (piece.glow) {
              ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 20;
          } else {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
          }
          ctx.fillText(piece.emoji, piece.x, piece.y + s.cameraOffsetY);
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      }

      // Draw moving
      if (s.movingIngredient) {
          ctx.font = `${EMOJI_SIZE * s.movingIngredient.scale}px sans-serif`;
          ctx.shadowColor = 'rgba(255, 0, 255, 0.5)'; ctx.shadowBlur = 15;
          ctx.fillText(s.movingIngredient.emoji, s.movingIngredient.x, s.movingIngredient.y);
          ctx.shadowBlur = 0;
      }

      // Draw falling
      if (s.fallingIngredient) {
          ctx.font = `${EMOJI_SIZE}px sans-serif`;
          const fallYForRendering = s.fallingIngredient.missed ? s.fallingIngredient.y : (s.fallingIngredient.y + s.cameraOffsetY);
          ctx.fillText(s.fallingIngredient.emoji, s.fallingIngredient.x, fallYForRendering);
      }

      // Draw Particles
      for(const p of s.particles) {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    };

    const gameLoop = (timestamp: number) => {
        const deltaTime = timestamp - stateRef.current.lastTime;
        stateRef.current.lastTime = timestamp;
        if (deltaTime < 100) { update(deltaTime); draw(); }
        if (stateRef.current.state === 'PLAYING') {
          animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
    };
    gameLoopRef.current = gameLoop;

    stateRef.current.lastTime = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    const handleTimer = () => {
      if (stateRef.current.state === 'PLAYING') {
        stateRef.current.time--;
        syncState();
        if (stateRef.current.time <= 0) {
          gameOver();
        }
      }
    };

    timerInterval = setInterval(handleTimer, 1000);
    timerRef.current = timerInterval;

    const handlePointerUp = (e: PointerEvent) => {
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') e.preventDefault();
      if (stateRef.current.state === 'PLAYING' && !stateRef.current.fallingIngredient && stateRef.current.movingIngredient) {
          canvas.setPointerCapture(e.pointerId);
          stateRef.current.fallingIngredient = { 
            emoji: stateRef.current.movingIngredient.emoji, 
            x: stateRef.current.movingIngredient.x, 
            y: stateRef.current.movingIngredient.y, 
            missed: false 
          };
          stateRef.current.movingIngredient = null;
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('resize', resize);
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
    if (!canvasRef.current) return;
    const EMOJI_SIZE = (canvasRef.current?.width || window.innerWidth) < 600 ? 55 : 75;
    stateRef.current = {
      ...stateRef.current,
      state: 'PLAYING',
      score: 0,
      time: 60,
      lives: 3,
      stack: [{ emoji: '🍞', x: canvasRef.current.width / 2, y: canvasRef.current.height - EMOJI_SIZE - 20, glow: false }],
      cameraOffsetY: 0,
      particles: [],
      fallingIngredient: null,
      movingIngredient: null,
      lastTime: performance.now(),
    };
    syncState();
    
    // Trigger spawn
    const INGREDIENTS = ['🥩', '🧀', '🍅', '🥬', '🧅'];
    const type = INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)];
    const BASE_SPEED = (canvasRef.current?.width || window.innerWidth) * 0.35; 
    stateRef.current.movingIngredient = {
        emoji: type, x: EMOJI_SIZE, y: EMOJI_SIZE * 1.8,
        direction: 1, speed: BASE_SPEED + (stateRef.current.score * 6), scale: 0
    };
    
    if (gameLoopRef.current) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(gameLoopRef.current);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#1a0b2e] to-[#0a0a2a] overflow-hidden text-white font-[PressStart2P]">
      {/* Neon bg lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 neon-lines-bg"
      />
      
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full block touch-none" />

      {/* HUD */}
      <div className="absolute top-0 w-full z-20 flex justify-between p-4 px-6 md:px-12 text-xs font-bold font-mono">
        <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff]">WAKTU: {time}</div>
        <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff]">NYAWA: {lives}</div>
        <div className="bg-black/60 border border-cyan-400 p-2 px-4 rounded shadow-[0_0_10px_#0ff]">SKOR: {score}</div>
      </div>

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-center"
          >
            <div className="bg-gray-900 border-2 border-cyan-400 p-8 rounded-xl flex flex-col items-center">
              <h1 className="text-2xl text-fuchsia-500 font-black mb-4">BURGER RUSH</h1>
              
              {gameState === 'START' && (
                <p className="text-sm mb-6 text-gray-300">Ketuk di mana saja untuk menjatuhkan.<br/>Susun burger setinggi mungkin!<br/>Jangan sampai meleset!</p>
              )}
              {gameState === 'GAMEOVER' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-300 mb-2">SKOR:</p>
                  <p className="text-3xl text-cyan-400 font-bold mb-4">{score}</p>
                  <p className="text-sm text-gray-300">TERTUMPUK: {stacked}</p>
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
                className="bg-gray-800 text-fuchsia-400 border border-fuchsia-500 px-6 py-3 rounded font-bold uppercase w-full"
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
