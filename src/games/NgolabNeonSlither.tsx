import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type Position = { x: number; y: number };
type Snake = {
  id: string;
  name: string;
  segments: Position[];
  angle: number;
  targetAngle: number;
  speed: number;
  color: string;
  eyeColor: string;
  isAI: boolean;
  length: number;
};
type Food = { x: number; y: number; radius: number; color: string; value: number; pulse: number };
type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number };

const ARENA_RADIUS = 1200;
const SEGMENT_SPACING = 14;
const BASE_SPEED = 110;
const BOOST_SPEED = 200;
const AI_NAMES = ['AstroWorm', 'BytePython', 'CyberCobra', 'DeltaDragon', 'EchoViper'];
const COLOR_PALETTE = ['#f43f5e', '#a855f7', '#10b981', '#3b82f6', '#f59e0b', '#06b6d4', '#ec4899'];

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

export default function NgolabNeonSlither({ onGameOver, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const stateRef = useRef({
    state: 'START',
    score: 0,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
    isBoosting: false,
    playerSnake: null as Snake | null,
    aiSnakes: [] as Snake[],
    foods: [] as Food[],
    particles: [] as Particle[],
    lastTime: 0,
    spawnTimer: 0,
    invulnTimer: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('ngolab-slither-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Spawn Foods
    const spawnInitialFood = () => {
      const foods: Food[] = [];
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 40);
        foods.push({
          x: ARENA_RADIUS + Math.cos(angle) * dist,
          y: ARENA_RADIUS + Math.sin(angle) * dist,
          radius: randomBetween(3, 7),
          color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
          value: Math.floor(randomBetween(1, 4)) * 10,
          pulse: Math.random(),
        });
      }
      stateRef.current.foods = foods;
    };

    const createSnake = (id: string, name: string, isAI: boolean, color: string, startX: number, startY: number): Snake => {
      const segments: Position[] = [];
      const len = 12;
      const angle = Math.random() * Math.PI * 2;
      for (let i = 0; i < len; i++) {
        segments.push({
          x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
          y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
        });
      }
      return {
        id,
        name,
        segments,
        angle,
        targetAngle: angle,
        speed: BASE_SPEED,
        color,
        eyeColor: '#ffffff',
        isAI,
        length: len,
      };
    };

    const spawnAISnake = (index: number) => {
      const angle = Math.random() * Math.PI * 2;
      // Spawn AI snakes at a safe distance from player center (at least 350px away)
      const dist = randomBetween(350, ARENA_RADIUS - 100);
      const x = ARENA_RADIUS + Math.cos(angle) * dist;
      const y = ARENA_RADIUS + Math.sin(angle) * dist;
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      const name = AI_NAMES[index % AI_NAMES.length];
      return createSnake(`ai-${Date.now()}-${index}`, name, true, color, x, y);
    };

    const initEntities = () => {
      spawnInitialFood();
      const state = stateRef.current;
      state.playerSnake = createSnake('player', 'Me', false, '#22d3ee', ARENA_RADIUS, ARENA_RADIUS);
      state.aiSnakes = Array.from({ length: 5 }, (_, i) => spawnAISnake(i));
      state.particles = [];
      state.score = 0;
      state.invulnTimer = 2.0; // 2 seconds spawn grace period
    };

    const spawnExplosion = (x: number, y: number, color: string, count: number = 10) => {
      const particles = stateRef.current.particles;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(50, 180);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: randomBetween(2, 5),
          color,
          life: 1.0,
        });
      }
    };

    const handleCollision = (snake: Snake, isPlayer: boolean) => {
      // Explode segments into food
      const foods = stateRef.current.foods;
      snake.segments.forEach((seg, index) => {
        if (index % 2 === 0) {
          foods.push({
            x: seg.x + randomBetween(-10, 10),
            y: seg.y + randomBetween(-10, 10),
            radius: randomBetween(5, 9),
            color: snake.color,
            value: 30,
            pulse: Math.random(),
          });
        }
        spawnExplosion(seg.x, seg.y, snake.color, 4);
      });

      if (isPlayer) {
        const state = stateRef.current;
        state.state = 'GAMEOVER';
        setGameState('GAMEOVER');
        onGameOver(state.score);
        if (state.score > highScore) {
          localStorage.setItem('ngolab-slither-highscore', String(state.score));
          setHighScore(state.score);
        }
      }
    };

    const updateSnake = (snake: Snake, dt: number) => {
      const state = stateRef.current;
      const seconds = dt / 1000;

      // Determine movement angle
      if (snake.isAI) {
        // AI random roaming
        if (Math.random() < 0.03) {
          snake.targetAngle = Math.random() * Math.PI * 2;
        }

        // Steer away from walls
        const distToCenter = getDistance(snake.segments[0].x, snake.segments[0].y, ARENA_RADIUS, ARENA_RADIUS);
        if (distToCenter > ARENA_RADIUS - 150) {
          snake.targetAngle = Math.atan2(ARENA_RADIUS - snake.segments[0].y, ARENA_RADIUS - snake.segments[0].x);
        }

        // Steer away from other snakes
        const head = snake.segments[0];
        let threatX = 0;
        let threatY = 0;
        let threatCount = 0;

        const checkThreat = (other: Snake) => {
          if (other.id === snake.id) return;
          other.segments.forEach((seg) => {
            const d = getDistance(head.x, head.y, seg.x, seg.y);
            if (d < 100) {
              threatX += seg.x;
              threatY += seg.y;
              threatCount++;
            }
          });
        };

        if (state.playerSnake) checkThreat(state.playerSnake);
        state.aiSnakes.forEach(checkThreat);

        if (threatCount > 0) {
          // Steer in the opposite direction of threats
          const avgX = threatX / threatCount;
          const avgY = threatY / threatCount;
          snake.targetAngle = Math.atan2(head.y - avgY, head.x - avgX);
        }
      } else {
        // Player steers towards pointer
        const head = snake.segments[0];
        const screenCenterX = state.width / 2;
        const screenCenterY = state.height / 2;
        snake.targetAngle = Math.atan2(state.pointerY - screenCenterY, state.pointerX - screenCenterX);
      }

      // Smooth angle transition
      let angleDiff = snake.targetAngle - snake.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      snake.angle += angleDiff * 8 * seconds;

      // Adjust speed
      let currentSpeed = BASE_SPEED;
      if (!snake.isAI && state.isBoosting && snake.segments.length > 5) {
        currentSpeed = BOOST_SPEED;
        // Boost penalty: shed tail as food particles
        if (Math.random() < 0.08) {
          const tail = snake.segments[snake.segments.length - 1];
          state.foods.push({
            x: tail.x + randomBetween(-10, 10),
            y: tail.y + randomBetween(-10, 10),
            radius: randomBetween(3, 5),
            color: snake.color,
            value: 10,
            pulse: Math.random(),
          });
          snake.segments.pop();
          snake.length = snake.segments.length;
          if (!snake.isAI) {
            state.score = Math.max(0, state.score - 5);
            setScore(state.score);
          }
        }
      }
      snake.speed = currentSpeed;

      // Move Head
      const head = snake.segments[0];
      const newHeadX = head.x + Math.cos(snake.angle) * snake.speed * seconds;
      const newHeadY = head.y + Math.sin(snake.angle) * snake.speed * seconds;

      // Arena Wall constraints (elastic rebound or crash)
      const dCenter = getDistance(newHeadX, newHeadY, ARENA_RADIUS, ARENA_RADIUS);
      if (dCenter > ARENA_RADIUS) {
        if (!snake.isAI) {
          handleCollision(snake, true);
          return;
        } else {
          // Rebound AI back
          snake.angle += Math.PI;
          return;
        }
      }

      // Shift segments forward
      const prevHead = { x: head.x, y: head.y };
      head.x = newHeadX;
      head.y = newHeadY;

      for (let i = 1; i < snake.segments.length; i++) {
        const seg = snake.segments[i];
        const prevSeg = snake.segments[i - 1];
        const dx = prevSeg.x - seg.x;
        const dy = prevSeg.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > SEGMENT_SPACING) {
          const ratio = SEGMENT_SPACING / dist;
          seg.x = prevSeg.x - dx * ratio;
          seg.y = prevSeg.y - dy * ratio;
        }
      }
    };

    const update = (dt: number) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;

      const seconds = dt / 1000;
      if (state.invulnTimer > 0) {
        state.invulnTimer -= seconds;
      }

      // Update Player
      if (state.playerSnake) {
        updateSnake(state.playerSnake, dt);
      }

      // Update AI
      state.aiSnakes.forEach((ai) => {
        updateSnake(ai, dt);
      });

      // Update Particles
      state.particles.forEach((part) => {
        part.x += part.vx * seconds;
        part.y += part.vy * seconds;
        part.life -= seconds * 1.5;
      });
      state.particles = state.particles.filter((p) => p.life > 0);

      // Check Food Collision
      if (state.playerSnake) {
        const head = state.playerSnake.segments[0];
        state.foods = state.foods.filter((food) => {
          const d = getDistance(head.x, head.y, food.x, food.y);
          if (d < food.radius + 20) {
            // Eat food
            state.score += food.value;
            setScore(state.score);

            // Add segment
            const lastSeg = state.playerSnake!.segments[state.playerSnake!.segments.length - 1];
            state.playerSnake!.segments.push({ x: lastSeg.x, y: lastSeg.y });
            state.playerSnake!.length++;

            // Visual feedback
            spawnExplosion(food.x, food.y, food.color, 3);
            return false;
          }
          return true;
        });

        // Replenish Foods if too low
        if (state.foods.length < 120) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 40);
          state.foods.push({
            x: ARENA_RADIUS + Math.cos(angle) * dist,
            y: ARENA_RADIUS + Math.sin(angle) * dist,
            radius: randomBetween(3, 7),
            color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
            value: Math.floor(randomBetween(1, 4)) * 10,
            pulse: Math.random(),
          });
        }
      }

      // Check AI Eating Food
      state.aiSnakes.forEach((ai) => {
        const head = ai.segments[0];
        state.foods = state.foods.filter((food) => {
          const d = getDistance(head.x, head.y, food.x, food.y);
          if (d < food.radius + 18) {
            const lastSeg = ai.segments[ai.segments.length - 1];
            ai.segments.push({ x: lastSeg.x, y: lastSeg.y });
            ai.length++;
            return false;
          }
          return true;
        });
      });

      // Check Snake to Snake Collisions (Heads vs Bodies)
      if (state.playerSnake) {
        const playerHead = state.playerSnake.segments[0];
        let deadAIs: string[] = [];

        // Player collision checks are only active when not invulnerable
        if (state.invulnTimer <= 0) {
          // Check if player head hits any AI body
          for (const ai of state.aiSnakes) {
            for (let i = 2; i < ai.segments.length; i++) {
              const seg = ai.segments[i];
              const d = getDistance(playerHead.x, playerHead.y, seg.x, seg.y);
              if (d < 22) {
                handleCollision(state.playerSnake, true);
                return;
              }
            }
          }
        }

        // Check AI heads hitting targets
        state.aiSnakes.forEach((ai) => {
          const aiHead = ai.segments[0];

          // Hit player body? (only if player is not invulnerable)
          if (state.invulnTimer <= 0) {
            for (let i = 2; i < state.playerSnake!.segments.length; i++) {
              const seg = state.playerSnake!.segments[i];
              const d = getDistance(aiHead.x, aiHead.y, seg.x, seg.y);
              if (d < 22) {
                deadAIs.push(ai.id);
                handleCollision(ai, false);
                return;
              }
            }
          }

          // Hit other AI body?
          for (const other of state.aiSnakes) {
            if (other.id === ai.id) continue;
            for (let i = 2; i < other.segments.length; i++) {
              const seg = other.segments[i];
              const d = getDistance(aiHead.x, aiHead.y, seg.x, seg.y);
              if (d < 22) {
                deadAIs.push(ai.id);
                handleCollision(ai, false);
                return;
              }
            }
          }
        });

        // Filter out dead AIs and respawn them
        state.aiSnakes = state.aiSnakes.filter((ai) => !deadAIs.includes(ai.id));
        while (state.aiSnakes.length < 5) {
          state.aiSnakes.push(spawnAISnake(state.aiSnakes.length));
        }
      }
    };

    const drawGrid = (cameraX: number, cameraY: number) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 80;

      const startX = Math.floor(cameraX / gridSize) * gridSize;
      const startY = Math.floor(cameraY / gridSize) * gridSize;

      for (let x = startX; x < startX + canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - cameraX, 0);
        ctx.lineTo(x - cameraX, canvas.height);
        ctx.stroke();
      }

      for (let y = startY; y < startY + canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - cameraY);
        ctx.lineTo(canvas.width, y - cameraY);
        ctx.stroke();
      }
    };

    const drawSnake = (snake: Snake, cameraX: number, cameraY: number) => {
      const state = stateRef.current;
      const isPlayerInvuln = !snake.isAI && state.invulnTimer > 0;

      ctx.save();
      if (isPlayerInvuln) {
        // Pulse transparency during invulnerability grace period
        ctx.globalAlpha = 0.35 + Math.sin(Date.now() * 0.015) * 0.2;
      }

      // Draw tail first
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Outer glow/stroke
      ctx.strokeStyle = `${snake.color}22`;
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(snake.segments[0].x - cameraX, snake.segments[0].y - cameraY);
      for (let i = 1; i < snake.segments.length; i++) {
        ctx.lineTo(snake.segments[i].x - cameraX, snake.segments[i].y - cameraY);
      }
      ctx.stroke();

      // Main body line
      ctx.strokeStyle = snake.color;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(snake.segments[0].x - cameraX, snake.segments[0].y - cameraY);
      for (let i = 1; i < snake.segments.length; i++) {
        ctx.lineTo(snake.segments[i].x - cameraX, snake.segments[i].y - cameraY);
      }
      ctx.stroke();

      // Individual segment circles to look like scale links
      ctx.fillStyle = snake.color;
      snake.segments.forEach((seg, idx) => {
        if (idx === 0) return; // Skip head
        const size = Math.max(6, 10 - idx * 0.12);
        ctx.beginPath();
        ctx.arc(seg.x - cameraX, seg.y - cameraY, size, 0, Math.PI * 2);
        ctx.fillStyle = idx % 2 === 0 ? snake.color : '#0f172a';
        ctx.fill();
        ctx.strokeStyle = snake.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Head
      const head = snake.segments[0];
      const hx = head.x - cameraX;
      const hy = head.y - cameraY;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(snake.angle);

      // Head Base
      ctx.fillStyle = snake.color;
      ctx.shadowColor = snake.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Draw Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = snake.eyeColor;
      ctx.beginPath();
      ctx.arc(6, -6, 4, 0, Math.PI * 2);
      ctx.arc(6, 6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (looking forward)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(7.5, -6, 2, 0, Math.PI * 2);
      ctx.arc(7.5, 6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // restores rotated head transform
      ctx.restore(); // restores general snake globalAlpha transform

      // Draw Name tag (only for AIs or player)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(snake.name, hx, hy - 25);
    };

    const drawRadar = (player: Snake) => {
      const radarX = canvas.width - 90;
      const radarY = canvas.height - 90;
      const radarRadius = 65;

      // Draw Radar Background
      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const scale = radarRadius / ARENA_RADIUS;

      // Draw Player Dot
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(radarX + (player.segments[0].x - ARENA_RADIUS) * scale, radarY + (player.segments[0].y - ARENA_RADIUS) * scale, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw AIs Dots
      ctx.fillStyle = '#f43f5e';
      stateRef.current.aiSnakes.forEach((ai) => {
        ctx.beginPath();
        ctx.arc(radarX + (ai.segments[0].x - ARENA_RADIUS) * scale, radarY + (ai.segments[0].y - ARENA_RADIUS) * scale, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const draw = () => {
      const state = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Space
      ctx.fillStyle = '#02050f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!state.playerSnake) return;

      // Camera coordinates centered on the player's head
      const playerHead = state.playerSnake.segments[0];
      const cameraX = playerHead.x - canvas.width / 2;
      const cameraY = playerHead.y - canvas.height / 2;

      // Draw Grid
      drawGrid(cameraX, cameraY);

      // Draw Arena boundary circle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(ARENA_RADIUS - cameraX, ARENA_RADIUS - cameraY, ARENA_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw Food
      state.foods.forEach((food) => {
        const fx = food.x - cameraX;
        const fy = food.y - cameraY;

        // Skip drawing if outside viewport
        if (fx < -20 || fx > canvas.width + 20 || fy < -20 || fy > canvas.height + 20) return;

        ctx.fillStyle = food.color;
        const pulse = Math.sin(Date.now() * 0.005 + food.pulse * 10) * 0.18 + 0.82;
        ctx.beginPath();
        ctx.arc(fx, fy, food.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Small neon glow around food
        ctx.fillStyle = `${food.color}33`;
        ctx.beginPath();
        ctx.arc(fx, fy, food.radius * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Particles
      state.particles.forEach((p) => {
        ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y - cameraY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw AI Snakes
      state.aiSnakes.forEach((ai) => {
        drawSnake(ai, cameraX, cameraY);
      });

      // Draw Player Snake
      drawSnake(state.playerSnake, cameraX, cameraY);

      // Draw Radar Mini-map
      drawRadar(state.playerSnake);
    };

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = timestamp;
      const delta = Math.min(30, timestamp - state.lastTime); // Cap delta to avoid collision skips
      state.lastTime = timestamp;

      update(delta);
      draw();

      if (state.state === 'PLAYING') {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    if (gameState === 'PLAYING') {
      initEntities();
      stateRef.current.lastTime = 0;
      animationRef.current = requestAnimationFrame(loop);
    }

    const handlePointerDown = () => {
      stateRef.current.isBoosting = true;
    };
    const handlePointerUp = () => {
      stateRef.current.isBoosting = false;
    };
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = e.clientX - rect.left;
      stateRef.current.pointerY = e.clientY - rect.top;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, onGameOver, highScore]);

  const startGame = () => {
    stateRef.current.state = 'PLAYING';
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#02050f] text-white font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.1),_transparent_40%)]" />

      {/* Top Header stats during play */}
      {gameState === 'PLAYING' && (
        <div className="absolute left-6 top-6 z-10 rounded-2xl border border-white/5 bg-slate-950/80 p-4 shadow-xl backdrop-blur-md">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Skor Kamu</div>
          <div className="text-3xl font-black text-cyan-300">{score}</div>
          <div className="mt-2 text-[10px] text-slate-500 font-medium">Rekor: {highScore}</div>
        </div>
      )}

      {/* Speed Boost tip */}
      {gameState === 'PLAYING' && (
        <div className="absolute left-6 bottom-6 z-10 hidden sm:block rounded-full border border-white/5 bg-slate-950/70 px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
          💡 <span className="font-bold text-cyan-300">Tahan klik</span> untuk mengaktifkan turbo!
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-6"
          >
            <div className="w-full max-w-md rounded-3xl border border-cyan-500/25 bg-slate-950/90 p-8 text-center shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
              <h1 className="text-3xl font-black tracking-tight text-cyan-300 mb-2 uppercase">Neon Slither</h1>
              <p className="mb-6 text-xs text-slate-400 leading-relaxed">
                Slither di dalam arena digital, kumpulkan bola cahaya untuk bertambah panjang, dan jebak ular lain agar menabrak badan Anda. Jangan menabrak badan ular lain!
              </p>

              {gameState === 'GAMEOVER' && (
                <div className="mb-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-left">
                  <div className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold mb-1">Skor Akhir</div>
                  <div className="text-4xl font-extrabold text-white">{score}</div>
                  <div className="mt-2 text-xs text-slate-500 font-medium">Rekor Terbaik: {Math.max(highScore, score)}</div>
                </div>
              )}

              <button
                onClick={startGame}
                className="mb-3 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-6 py-4 text-base font-bold uppercase text-slate-950 transition-all hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                {gameState === 'START' ? 'Mulai Bermain' : 'Main Lagi'}
              </button>
              <button
                onClick={onExit}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold uppercase text-slate-200 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
