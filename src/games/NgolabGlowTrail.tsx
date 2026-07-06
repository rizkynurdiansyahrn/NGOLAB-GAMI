import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type NodeData = { id: number; x: number; y: number; label: string; positionClass: string };
const nodePositions = [
  { x: 18, y: 18, positionClass: 'left-[18%] top-[18%]' },
  { x: 50, y: 12, positionClass: 'left-[50%] top-[12%]' },
  { x: 82, y: 18, positionClass: 'left-[82%] top-[18%]' },
  { x: 18, y: 45, positionClass: 'left-[18%] top-[45%]' },
  { x: 50, y: 50, positionClass: 'left-[50%] top-[50%]' },
  { x: 82, y: 45, positionClass: 'left-[82%] top-[45%]' },
  { x: 18, y: 82, positionClass: 'left-[18%] top-[82%]' },
  { x: 50, y: 88, positionClass: 'left-[50%] top-[88%]' },
  { x: 82, y: 82, positionClass: 'left-[82%] top-[82%]' },
];

export default function NgolabGlowTrail({ onGameOver, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'SHOW' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [progress, setProgress] = useState(0);
  const [targetOrder, setTargetOrder] = useState<NodeData[]>([]);
  const [message, setMessage] = useState('Ingat jalur bercahaya, lalu ketuk sesuai urutan.');

  const sequence = useMemo(() => {
    return nodePositions.map((pos, index) => ({ id: index + 1, x: pos.x, y: pos.y, label: String(index + 1), positionClass: pos.positionClass }));
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('GAMEOVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER') {
      onGameOver(score);
    }
  }, [gameState, onGameOver, score]);

  const shuffleSequence = () => {
    const shuffled = [...sequence].sort(() => Math.random() - 0.5);
    return shuffled.map((item, idx) => ({ ...item, label: String(idx + 1) }));
  };

  const startGame = () => {
    const shuffled = shuffleSequence();
    setTargetOrder(shuffled);
    setProgress(0);
    setScore(0);
    setTimeLeft(40);
    setMessage('Hafalkan jalur, lalu ketuk sesuai urutan yang benar.');
    setGameState('SHOW');
    setTimeout(() => {
      setGameState('PLAYING');
      setMessage('Sekarang ketuk titik-titik sesuai urutan!');
    }, 2800);
  };

  const handleNodeTap = (id: number) => {
    if (gameState !== 'PLAYING') return;
    const expected = targetOrder[progress];
    if (expected?.id === id) {
      const nextProgress = progress + 1;
      setProgress(nextProgress);
      setScore((prev) => prev + 10);
      setMessage('Benar! Teruskan alurnya.');
      if (nextProgress === targetOrder.length) {
        setMessage('Jalur selesai!');
        setGameState('GAMEOVER');
      }
    } else {
      setScore((prev) => Math.max(0, prev - 5));
      setTimeLeft((prev) => Math.max(0, prev - 4));
      setMessage('Oops — salah ketuk. Coba lagi!');
      if (timeLeft <= 4) {
        setGameState('GAMEOVER');
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-[#050814] text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_28%)]" />
      <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-between px-4 py-6">
        <div className="w-full max-w-md rounded-[24px] border border-slate-200/10 bg-slate-950/80 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl font-black text-cyan-300">Glow Trail</h1>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Hafalkan pola bercahaya, lalu ketuk sesuai urutan.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-200 border-t border-slate-200/5 pt-2">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Skor</span>
                <span className="text-lg font-bold text-white">{score}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Waktu</span>
                <span className="text-lg font-bold text-white">{timeLeft}s</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Progres</span>
                <span className="text-lg font-bold text-white">{progress}/{targetOrder.length || 9}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-[24px] border border-cyan-500/15 bg-[#020617]/95 p-3 shadow-2xl shadow-cyan-500/10">
          <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#090a1f] p-4">
            {/* SVG Glow Trail Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Memorization Path (Pulse) */}
              {gameState === 'SHOW' && targetOrder.slice(0, -1).map((node, idx) => {
                const nextNode = targetOrder[idx + 1];
                return (
                  <line
                    key={`line-show-${idx}`}
                    x1={node.x}
                    y1={node.y}
                    x2={nextNode.x}
                    y2={nextNode.y}
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                    filter="url(#glow)"
                    opacity="0.85"
                  />
                );
              })}
              {/* Gameplay Progression Path */}
              {gameState === 'PLAYING' && progress > 0 && targetOrder.slice(0, progress).map((node, idx) => {
                if (idx === progress - 1) return null;
                const nextNode = targetOrder[idx + 1];
                return (
                  <motion.line
                    key={`line-play-${idx}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    x1={node.x}
                    y1={node.y}
                    x2={nextNode.x}
                    y2={nextNode.y}
                    stroke="#22d3ee"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                );
              })}
            </svg>

            {(targetOrder.length > 0 ? targetOrder : sequence).map((node) => {
              const nodeIndex = targetOrder.findIndex((item) => item.id === node.id);
              const isActive = gameState === 'SHOW' || (gameState === 'PLAYING' && progress > nodeIndex);
              const shouldShowLabel = gameState === 'SHOW' || (gameState === 'PLAYING' && progress > nodeIndex);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeTap(node.id)}
                  className={`absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all duration-300 ${node.positionClass} ${isActive ? 'bg-cyan-400/90 border-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.55)] scale-105' : 'bg-white/5 border-white/10 active:bg-white/10'} ${gameState === 'SHOW' ? 'animate-pulse' : ''}`}
                >
                  <span className="font-black text-base text-white">{shouldShowLabel ? node.label : ''}</span>
                </button>
              );
            })}
            <div className="absolute inset-x-0 top-4 mx-auto h-1 rounded-full bg-cyan-500/20" />
            <div className="absolute inset-x-0 bottom-4 mx-auto h-1 rounded-full bg-pink-500/20" />
          </div>
          <p className="mt-4 text-center text-sm text-slate-300">{message}</p>
        </div>

        <div className="flex w-full max-w-md flex-row gap-3">
          <button
            onClick={gameState === 'PLAYING' ? () => setGameState('GAMEOVER') : startGame}
            className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold uppercase text-slate-950 transition-all hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25"
          >
            {gameState === 'PLAYING' ? 'Selesai' : 'Mulai Main'}
          </button>
          <button
            onClick={onExit}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold uppercase text-slate-200 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            Keluar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 p-6"
          >
            <div className="w-full max-w-md rounded-[36px] border border-cyan-500/20 bg-[#020617] p-8 text-center shadow-2xl shadow-cyan-500/25">
              <h2 className="text-4xl font-black text-cyan-300">Jalur Glow Selesai</h2>
              <p className="mt-4 text-slate-300">Skor akhir: <span className="font-bold text-white">{score}</span>.</p>
              <button
                onClick={startGame}
                className="mt-8 inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-base font-bold uppercase text-slate-950 transition hover:bg-cyan-400"
              >
                Main Lagi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
