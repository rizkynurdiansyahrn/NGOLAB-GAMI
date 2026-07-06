import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Level {
  id: number;
  name: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetRadius: number;
  obstacles: Obstacle[];
  trampolines?: Obstacle[];
}

const levels: Level[] = [
  {
    id: 1,
    name: "Latihan Menggambar",
    startX: 80,
    startY: 380,
    targetX: 720,
    targetY: 380,
    targetRadius: 26,
    obstacles: [],
  },
  {
    id: 2,
    name: "Jembatan Melengkung",
    startX: 80,
    startY: 380,
    targetX: 720,
    targetY: 380,
    targetRadius: 26,
    obstacles: [
      { x: 360, y: 220, w: 80, h: 280 }, // Tall block in the center
    ],
    trampolines: [
      { x: 220, y: 440, w: 70, h: 15 },
    ],
  },
  {
    id: 3,
    name: "Lembah & Langit",
    startX: 80,
    startY: 420,
    targetX: 720,
    targetY: 200,
    targetRadius: 26,
    obstacles: [
      { x: 280, y: 0, w: 60, h: 240 },   // Ceiling blocker (more headroom: h=240 instead of 280)
      { x: 480, y: 260, w: 60, h: 240 }, // Ground blocker (more headroom: y=260 instead of 220)
    ],
    trampolines: [
      { x: 380, y: 450, w: 70, h: 15 },
    ],
  },
  {
    id: 4,
    name: "Zig-Zag Sempit",
    startX: 80,
    startY: 250,
    targetX: 720,
    targetY: 420,
    targetRadius: 26,
    obstacles: [
      { x: 220, y: 280, w: 50, h: 220 }, // Ground blocker
      { x: 380, y: 0, w: 50, h: 220 },   // Ceiling blocker
      { x: 540, y: 280, w: 50, h: 220 }, // Ground blocker
    ],
    trampolines: [
      { x: 300, y: 450, w: 60, h: 15 },
      { x: 460, y: 450, w: 60, h: 15 },
    ],
  },
  {
    id: 5,
    name: "Momentum Ekstrim",
    startX: 80,
    startY: 430,
    targetX: 720,
    targetY: 140,
    targetRadius: 26,
    obstacles: [
      { x: 300, y: 150, w: 140, h: 100 }, // Central block
      { x: 180, y: 0, w: 50, h: 220 },    // Ceiling block
      { x: 580, y: 290, w: 50, h: 210 },   // Ground block
    ],
    trampolines: [
      { x: 240, y: 460, w: 50, h: 15 },
      { x: 480, y: 460, w: 50, h: 15 },
    ],
  },
];

const V_WIDTH = 800;
const V_HEIGHT = 500;

export default function NgolabDoodleRoad({ onGameOver, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameState, setGameState] = useState<'START' | 'DRAWING' | 'DRIVING' | 'SUCCESS' | 'FAILED' | 'GAMEOVER'>('START');
  const [levelScore, setLevelScore] = useState(500);
  const [totalScore, setTotalScore] = useState(0);
  const [instruction, setInstruction] = useState('Gunakan mouse/sentuhan untuk menggambar jalan dari mobil ke bendera finish!');

  const stateRef = useRef({
    gameState: 'START',
    currentLevelIdx: 0,
    points: [] as { x: number; y: number }[],
    isDrawing: false,
    carX: 80,
    carY: 380,
    vx: 0,
    vy: 0,
    carAngle: 0,
    onGround: true,
    score: 500,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[],
  });

  const level = levels[currentLevelIdx];

  // Sound Synth via Web Audio API
  const playSound = (type: 'draw' | 'start' | 'crash' | 'win' | 'click' | 'bounce') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'start') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'bounce') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Audio Context block", e);
    }
  };

  const spawnBounceParticles = (x: number, y: number) => {
    const state = stateRef.current;
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    for (let i = 0; i < 20; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 200 - 100, // burst upwards
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        alpha: 1,
      });
    }
  };

  const startLevel = () => {
    playSound('start');
    const state = stateRef.current;
    state.points = [{ x: level.startX, y: level.startY }];
    state.carX = level.startX;
    state.carY = level.startY;
    state.vx = 0;
    state.vy = 0;
    state.carAngle = 0;
    state.onGround = true;
    state.isDrawing = false;
    state.score = 500;
    state.particles = [];
    setLevelScore(500);
    setInstruction('Gambarkan lintasan neon. Hindari rintangan merah!');
    setGameState('DRAWING');
    state.gameState = 'DRAWING';
  };

  const getVirtualCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = V_WIDTH / rect.width;
    const scaleY = V_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (state.gameState !== 'DRAWING') return;
    const coords = getVirtualCoords(e);
    if (!coords) return;

    // Pastikan titik awal gambar dekat dengan posisi mobil (maks 75px)
    const dx = coords.x - level.startX;
    const dy = coords.y - level.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 75) {
      setInstruction('Mulai menggambar dari dalam lingkaran biru dekat mobil!');
      return;
    }

    state.points = [{ x: level.startX, y: level.startY }, coords];
    state.isDrawing = true;
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (state.gameState !== 'DRAWING' || !state.isDrawing) return;
    const coords = getVirtualCoords(e);
    if (!coords) return;

    const lastPt = state.points[state.points.length - 1];
    const dx = coords.x - lastPt.x;
    const dy = coords.y - lastPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6) {
      state.points.push(coords);
    }
  };

  const handleDrawEnd = () => {
    const state = stateRef.current;
    if (state.gameState !== 'DRAWING' || !state.isDrawing) return;
    state.isDrawing = false;

    if (state.points.length < 3) {
      setInstruction('Garis terlalu pendek! Rancang lintasan yang lebih panjang.');
      return;
    }

    // Initial vehicle states
    state.carX = level.startX;
    state.carY = level.startY;
    state.vx = 0;
    state.vy = 0;
    state.carAngle = 0;
    state.onGround = true;

    setInstruction('Meluncur! Kecepatan mobil menyesuaikan kemiringan dan kelokan jalan.');
    setGameState('DRIVING');
    state.gameState = 'DRIVING';
  };

  // Find the closest road segment to the car coordinates (cx, cy)
  const getClosestRoadSegment = (cx: number, cy: number) => {
    const pts = stateRef.current.points;
    if (pts.length < 2) return null;

    let minD2 = Infinity;
    let bestSegment = null;

    for (let i = 0; i < pts.length - 1; i += 1) {
      const p1 = pts[i];
      const p2 = pts[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len2 = dx * dx + dy * dy;

      if (len2 === 0) continue;

      let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));

      const xc = p1.x + t * dx;
      const yc = p1.y + t * dy;

      const dcx = cx - xc;
      const dcy = cy - yc;
      const d2 = dcx * dcx + dcy * dcy;

      if (d2 < minD2) {
        minD2 = d2;
        const angle = Math.atan2(dy, dx);
        bestSegment = { xc, yc, angle, distance: Math.sqrt(d2) };
      }
    }

    return bestSegment;
  };

  const checkCollision = (cx: number, cy: number, r: number, rect: Obstacle) => {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
  };

  const spawnWinParticles = (x: number, y: number) => {
    const state = stateRef.current;
    const colors = ['#22d3ee', '#34d399', '#f472b6', '#fbbf24'];
    for (let i = 0; i < 40; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 350,
        vy: (Math.random() - 0.5) * 350,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 3,
        alpha: 1,
      });
    }
  };

  const spawnCrashParticles = (x: number, y: number) => {
    const state = stateRef.current;
    const colors = ['#ef4444', '#f97316', '#eab308', '#78716c'];
    for (let i = 0; i < 45; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 450,
        vy: (Math.random() - 0.5) * 450,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        alpha: 1,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap delta time for physics stability
      lastTime = timestamp;

      const state = stateRef.current;

      // Update score ticking down in drawing phase
      if (state.gameState === 'DRAWING' && state.score > 60) {
        state.score = Math.max(60, state.score - dt * 25);
        setLevelScore(Math.floor(state.score));
      }

      // Update particles
      state.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt; // gravity force
        p.alpha = Math.max(0, p.alpha - dt * 1.6);
      });
      state.particles = state.particles.filter((p) => p.alpha > 0);

      // Driving physics update
      if (state.gameState === 'DRIVING') {
        const info = getClosestRoadSegment(state.carX, state.carY);
        let ax = 0;
        let ay = 340; // constant gravity pulling down

        if (info) {
          const slopeAngle = info.angle;
          const carHeightOffset = 8;

          // Normal vector pointing "up" from the road surface
          const normalX = Math.sin(slopeAngle);
          const normalY = -Math.cos(slopeAngle);

          // Dot product to check which side of the road the car is on
          // and how far it is from the road surface along the normal.
          const proj = (state.carX - info.xc) * normalX + (state.carY - info.yc) * normalY;

          // If car is on or below the ground line (within tolerance)
          if (proj <= carHeightOffset + 5 && proj >= -15) {
            state.onGround = true;

            // Snap car to be exactly carHeightOffset pixels above the road surface
            state.carX = info.xc + carHeightOffset * normalX;
            state.carY = info.yc + carHeightOffset * normalY;

             // Engine force pushes the car forward along the slope
             const enginePower = 580;
             ax += Math.cos(slopeAngle) * enginePower;
             ay += Math.sin(slopeAngle) * enginePower;
 
             // Preserve speed magnitude to avoid losing momentum on sharp turns
             const currentSpeed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
             const speedDirection = (state.vx * Math.cos(slopeAngle) + state.vy * Math.sin(slopeAngle) >= 0) ? 1 : -1;
             state.vx = speedDirection * currentSpeed * Math.cos(slopeAngle);
             state.vy = speedDirection * currentSpeed * Math.sin(slopeAngle);
 
             // Match rotation to slope
             state.carAngle = slopeAngle;

            // Friction drag along the ground
            state.vx *= (1 - 0.7 * dt);
            state.vy *= (1 - 0.7 * dt);
          } else {
            // Car is in the air (flew off a ramp or cliff)
            state.onGround = false;
            // Aerodynamic nose tilt towards velocity direction
            const airAngle = Math.atan2(state.vy, state.vx);
            state.carAngle += (airAngle - state.carAngle) * 0.18;
          }
        } else {
          state.onGround = false;
          state.carAngle = Math.atan2(state.vy, state.vx);
        }

        // Apply acceleration forces
        state.vx += ax * dt;
        state.vy += ay * dt;

        // Terminal velocity cap
        const currentSpeed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        const maxSpeed = 420;
        if (currentSpeed > maxSpeed) {
          state.vx = (state.vx / currentSpeed) * maxSpeed;
          state.vy = (state.vy / currentSpeed) * maxSpeed;
        }

        // Move vehicle coordinates
        state.carX += state.vx * dt;
        state.carY += state.vy * dt;

        // Verify bounds & collisions
        const distToTarget = Math.sqrt((state.carX - level.targetX) ** 2 + (state.carY - level.targetY) ** 2);
        
        if (distToTarget <= level.targetRadius + 18) {
          // Success!
          playSound('win');
          spawnWinParticles(state.carX, state.carY);
          state.gameState = 'SUCCESS';
          setGameState('SUCCESS');
          setTotalScore((prev) => prev + Math.floor(state.score));
          setInstruction('Hebat! Mobil mendarat di garis finish dengan sukses.');
        } 
        else if (state.carY > V_HEIGHT + 80) {
          // Fell off screen
          playSound('crash');
          state.gameState = 'FAILED';
          setGameState('FAILED');
          setInstruction('Mobil jatuh ke dalam jurang! Coba buat jembatan penghubung.');
        }
        else if (state.carX > V_WIDTH + 60 || (state.carX < level.startX - 50 && state.vx < -10)) {
          // Went out of bounds sideways without finish
          playSound('crash');
          state.gameState = 'FAILED';
          setGameState('FAILED');
          setInstruction('Mobil keluar dari arena! Ulangi level.');
        }
        else {
          // Check collision with trampolines
          let bounced = false;
          if (level.trampolines) {
            for (const tramp of level.trampolines) {
              if (checkCollision(state.carX, state.carY, 12, tramp)) {
                playSound('bounce');
                state.vy = -420; // Strong upward launch
                state.vx += 100; // Boost forward slightly
                state.onGround = false;
                spawnBounceParticles(state.carX, state.carY);
                setInstruction('Wosh! Mobil terpental tinggi oleh trampolin!');
                bounced = true;
                break;
              }
            }
          }

          if (!bounced) {
            // Check collision with solid barriers (radius 10 for tighter fit)
            const carCollisionRadius = 10;
            for (const obs of level.obstacles) {
              if (checkCollision(state.carX, state.carY, carCollisionRadius, obs)) {
                playSound('crash');
                spawnCrashParticles(state.carX, state.carY);
                state.gameState = 'FAILED';
                setGameState('FAILED');
                setInstruction('Mobil menabrak rintangan! Gambar jalan berkelok untuk menghindarinya.');
                break;
              }
            }
          }
        }
      }

      // Start Drawing Frame
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // Deep cyber background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Cyber Grid Lines (low opacity)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < V_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, V_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < V_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(V_WIDTH, y);
        ctx.stroke();
      }

      // Draw start launch zone
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(level.startX, level.startY, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();

      // Draw finish target zone
      ctx.save();
      const targetPulse = 26 + Math.sin(Date.now() * 0.01) * 2.5;
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(level.targetX, level.targetY, targetPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      // Draw Checkered Flag Graphic inside portal
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(level.targetX - 8, level.targetY - 10, 6, 6);
      ctx.fillRect(level.targetX - 2, level.targetY - 4, 6, 6);
      ctx.fillRect(level.targetX - 8, level.targetY + 2, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(level.targetX - 2, level.targetY - 10, 6, 6);
      ctx.fillRect(level.targetX - 8, level.targetY - 4, 6, 6);
      ctx.fillRect(level.targetX - 2, level.targetY + 2, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(level.targetX - 10, level.targetY - 12, 2, 22); // flag pole
      ctx.restore();

      // Draw Solid Obstacles (cyber bricks style)
      level.obstacles.forEach((obs) => {
        ctx.save();
        ctx.fillStyle = '#111326';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

        // Neon outline
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        ctx.restore();
      });

      // Draw Trampolines (neon green spring pads)
      if (level.trampolines) {
        level.trampolines.forEach((tramp) => {
          ctx.save();
          // Dark background for pad
          ctx.fillStyle = '#0a1e15';
          ctx.fillRect(tramp.x, tramp.y, tramp.w, tramp.h);

          // Glowing neon green outline
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
          ctx.strokeRect(tramp.x, tramp.y, tramp.w, tramp.h);

          // Draw animated spring coil lines inside
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          const springCount = Math.floor(tramp.w / 15);
          const stepX = tramp.w / (springCount + 1);
          ctx.beginPath();
          for (let i = 1; i <= springCount; i++) {
            const sx = tramp.x + i * stepX;
            // Pegas memantul kecil berdasarkan sinusoidal waktu
            const bounceOffset = Math.sin(Date.now() * 0.015 + i) * 3;
            ctx.moveTo(sx, tramp.y + tramp.h - 2);
            ctx.lineTo(sx, tramp.y + 2 + bounceOffset);
          }
          ctx.stroke();
          ctx.restore();
        });
      }

      // Draw drawn doodle road path
      if (state.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        ctx.moveTo(state.points[0].x, state.points[0].y);
        for (let i = 1; i < state.points.length; i += 1) {
          ctx.lineTo(state.points[i].x, state.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw visual particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw cyber vehicle
      if (state.gameState !== 'START') {
        const shouldDrawVehicle = state.gameState !== 'FAILED' && state.gameState !== 'SUCCESS';
        if (shouldDrawVehicle || state.particles.length > 0) {
          ctx.save();
          ctx.translate(state.carX, state.carY);
          ctx.rotate(state.carAngle);

          // Glowing tail light trail (thrust)
          if (state.gameState === 'DRIVING' && state.onGround) {
            ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-16, -3);
            ctx.lineTo(-26, 0);
            ctx.lineTo(-16, 3);
            ctx.closePath();
            ctx.fill();
          }

          // Chassis body (neon red/crimson)
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(-16, -6);
          ctx.lineTo(12, -6);
          ctx.lineTo(16, 0);
          ctx.lineTo(12, 6);
          ctx.lineTo(-16, 6);
          ctx.closePath();
          ctx.fill();

          // Windshield (cyan glow)
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(4, -3, 3, 6);

          // Wheels
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(-8, -7, 4, 0, Math.PI * 2);
          ctx.arc(8, -7, 4, 0, Math.PI * 2);
          ctx.arc(-8, 7, 4, 0, Math.PI * 2);
          ctx.arc(8, 7, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentLevelIdx]);

  const handleNextLevel = () => {
    playSound('click');
    const nextIdx = currentLevelIdx + 1;
    if (nextIdx < levels.length) {
      setCurrentLevelIdx(nextIdx);
      setGameState('START');
      stateRef.current.gameState = 'START';
      stateRef.current.currentLevelIdx = nextIdx;
      setInstruction('Gunakan mouse/sentuhan untuk menggambar jalan dari mobil ke bendera finish!');
    } else {
      playSound('win');
      setGameState('GAMEOVER');
      stateRef.current.gameState = 'GAMEOVER';
      onGameOver(totalScore);
    }
  };

  const handleReset = () => {
    playSound('click');
    startLevel();
  };

  const handleStartGame = () => {
    playSound('click');
    setTotalScore(0);
    setCurrentLevelIdx(0);
    stateRef.current.currentLevelIdx = 0;
    startLevel();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040612] text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(244,63,94,0.08),_transparent_28%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-6">
        {/* Header Dashboard info */}
        <div className="w-full max-w-3xl rounded-3xl border border-white/5 bg-slate-950/70 p-4 shadow-xl shadow-slate-950/50 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-yellow-400 via-amber-400 to-rose-400 bg-clip-text text-transparent font-mono">DOODLE PHYSICS ROAD</h1>
              <p className="mt-1 text-xs text-slate-400">Gambar lintasan dan lewati rintangan. Gravitasi & tanjakan mempengaruhi kecepatan mobil!</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-300">
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                Level: <span className="text-yellow-400 font-extrabold">{level.id} / 5</span>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                Bonus Skor: <span className="text-pink-400 font-extrabold">{levelScore}</span>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                Total Skor: <span className="text-cyan-400 font-extrabold">{totalScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Name badge */}
        <div className="my-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 px-4 py-1 text-xs font-black uppercase tracking-widest text-yellow-300">
          Level {level.id}: {level.name}
        </div>

        {/* Canvas Arena */}
        <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-yellow-500/10 bg-slate-950/90 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={V_WIDTH}
            height={V_HEIGHT}
            onMouseDown={handleDrawStart}
            onMouseMove={handleDrawMove}
            onMouseUp={handleDrawEnd}
            onTouchStart={handleDrawStart}
            onTouchMove={handleDrawMove}
            onTouchEnd={handleDrawEnd}
            className="w-full aspect-[8/5] block touch-none cursor-crosshair"
          />

          {/* Initial draw overlay info */}
          {gameState === 'DRAWING' && stateRef.current.points.length <= 1 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center bg-slate-950/80 p-5 rounded-2xl border border-white/10 max-w-sm">
              <p className="text-sm font-bold text-yellow-300 animate-pulse uppercase tracking-wider">Mulai Menggambar</p>
              <p className="text-xs text-slate-400 mt-1">Sentuh & seret layar mulai dari zona lingkaran biru untuk menggambar lintasan jalan menuju bendera.</p>
            </div>
          )}
        </div>

        {/* Instruction notification bar */}
        <p className="mt-4 text-center text-xs font-semibold text-slate-400 max-w-md">{instruction}</p>

        {/* Buttons tray */}
        <div className="mt-4 flex w-full max-w-3xl flex-row gap-3 justify-center">
          {gameState === 'DRAWING' && (
            <button
              onClick={handleReset}
              className="rounded-2xl border border-white/10 bg-white/5 py-3 px-6 text-sm font-semibold uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Kosongkan Jalur
            </button>
          )}

          {gameState === 'SUCCESS' && (
            <button
              onClick={handleNextLevel}
              className="rounded-2xl bg-emerald-500 py-3 px-8 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              {currentLevelIdx < levels.length - 1 ? 'Level Berikutnya' : 'Lihat Skor Akhir'}
            </button>
          )}

          {gameState === 'FAILED' && (
            <button
              onClick={handleReset}
              className="rounded-2xl bg-yellow-500 py-3 px-8 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/20"
            >
              Coba Lagi
            </button>
          )}

          <button
            onClick={onExit}
            className="rounded-2xl border border-white/10 bg-white/5 py-3 px-6 text-sm font-semibold uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            Keluar ke Menu
          </button>
        </div>
      </div>

      {/* Start screen & game completed modals */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-[32px] border border-yellow-500/20 bg-slate-950 p-6 text-center shadow-2xl shadow-yellow-500/20">
              <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 text-yellow-400 text-3xl">
                🚗
              </div>
              <h2 className="text-3xl font-black text-yellow-400 tracking-wider font-mono">DOODLE PHYSICS</h2>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                Rancang jalan untuk mobil neon. Tanjakan mengurangi kecepatan, turunan mempercepat laju mobil. Gambar dengan kelengkungan yang pas agar tidak menabrak laser cyber atau kehabisan momentum!
              </p>
              <button
                onClick={startLevel}
                className="mt-6 w-full rounded-2xl bg-yellow-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-yellow-400"
              >
                Mulai Bermain
              </button>
              <button
                onClick={onExit}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-white/10"
              >
                Kembali ke Menu
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-[32px] border border-yellow-500/20 bg-slate-950 p-6 text-center shadow-2xl shadow-yellow-500/20">
              <div className="h-16 w-16 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 text-4xl">
                🏆
              </div>
              <h2 className="text-3xl font-black text-yellow-400 tracking-wider">MISI SELESAI</h2>
              <p className="mt-2 text-xs text-slate-400 font-medium">Selamat! Kamu berhasil menaklukkan seluruh rintangan lintasan.</p>
              
              <div className="my-6 rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">Skor Akhir</p>
                <p className="text-5xl font-black text-white mt-1">{totalScore}</p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStartGame}
                  className="w-full rounded-2xl bg-yellow-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-yellow-400"
                >
                  Main Lagi
                </button>
                <button
                  onClick={onExit}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-white/10"
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
