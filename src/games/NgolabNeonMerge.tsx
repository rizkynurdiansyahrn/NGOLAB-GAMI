import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type Tile = { colorClass: string; id: string } | null;
const palette = ['bg-emerald-400', 'bg-amber-500', 'bg-sky-400', 'bg-violet-500', 'bg-pink-500'];

const createTile = (id: string): Tile => ({ colorClass: palette[Math.floor(Math.random() * palette.length)], id });

const getNeighbors = (index: number, columns: number, rows: number) => {
  const neighbors = [];
  const x = index % columns;
  const y = Math.floor(index / columns);
  if (x > 0) neighbors.push(index - 1);
  if (x < columns - 1) neighbors.push(index + 1);
  if (y > 0) neighbors.push(index - columns);
  if (y < rows - 1) neighbors.push(index + columns);
  return neighbors;
};

export default function NgolabNeonMerge({ onGameOver, onExit }: GameProps) {
  const columns = 6;
  const rows = 6;
  const [grid, setGrid] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [message, setMessage] = useState('Ketuk kelompok ubin dengan warna yang sama berjumlah 3 atau lebih untuk memicu reaksi berantai.');

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

  const initializeGrid = () => {
    const newGrid: Tile[] = [];
    for (let i = 0; i < columns * rows; i += 1) {
      newGrid.push(createTile(`tile-${Date.now()}-${i}`));
    }
    setGrid(newGrid);
    setScore(0);
    setTimeLeft(45);
    setMessage('Ketuk kelompok ubin dengan warna yang sama berjumlah 3 atau lebih untuk memicu reaksi berantai.');
    setGameState('PLAYING');
  };

  const findGroup = (startIndex: number, tiles: Tile[]) => {
    const start = tiles[startIndex];
    if (!start) return [] as number[];
    const visited = new Set<number>();
    const stack = [startIndex];
    while (stack.length) {
      const current = stack.pop() as number;
      if (visited.has(current)) continue;
      visited.add(current);
      const neighbors = getNeighbors(current, columns, rows);
      neighbors.forEach((next) => {
        if (!visited.has(next) && tiles[next]?.colorClass === start.colorClass) {
          stack.push(next);
        }
      });
    }
    return Array.from(visited);
  };

  const refillGrid = (tiles: Tile[]) => {
    const newGrid = [...tiles];
    for (let col = 0; col < columns; col += 1) {
      const stack: Tile[] = [];
      for (let row = 0; row < rows; row += 1) {
        const index = row * columns + col;
        if (newGrid[index]) stack.push(newGrid[index]);
      }
      const emptySlots = rows - stack.length;
      const filled = Array.from({ length: emptySlots }, (_, idx) => createTile(`tile-fill-${col}-${Date.now()}-${idx}`));
      const columnTiles = [...filled, ...stack];
      for (let row = 0; row < rows; row += 1) {
        newGrid[row * columns + col] = columnTiles[row];
      }
    }
    return newGrid;
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;
    const group = findGroup(index, grid);
    if (group.length < 3) {
      setMessage('Kelompok terlalu kecil — cari kelompok yang lebih besar!');
      return;
    }
    const newGrid = [...grid];
    group.forEach((tileIndex) => {
      newGrid[tileIndex] = null;
    });
    const collapsed = refillGrid(newGrid);
    setGrid(collapsed);
    setScore((prev) => prev + group.length * 8 + (group.length >= 6 ? 20 : 0));
    setMessage(`Bagus! ${group.length} ubin digabungkan.`);
  };

  const totalMatches = useMemo(() => {
    const colors = grid.reduce((acc, tile) => {
      if (tile) acc[tile.colorClass] = (acc[tile.colorClass] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.values(colors).filter((count) => count >= 3).length;
  }, [grid]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050814] via-[#0d1732] to-[#05070d] text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_28%)]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-8">
        <div className="w-full max-w-4xl rounded-[40px] border border-slate-200/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-cyan-300">Neon Merge</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Ketuk kelompok ubin dengan warna yang sama berjumlah tiga atau lebih untuk menghapusnya dan membuat kisi menyala. Setiap rantai memberikan poin bonus.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
              <div>
                <span className="block text-slate-400">Skor</span>
                <span className="text-2xl font-semibold text-white">{score}</span>
              </div>
              <div>
                <span className="block text-slate-400">Waktu</span>
                <span className="text-2xl font-semibold text-white">{timeLeft}s</span>
              </div>
              <div>
                <span className="block text-slate-400">Kelompok</span>
                <span className="text-2xl font-semibold text-white">{totalMatches}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl rounded-[36px] border border-cyan-500/15 bg-[#020617]/95 p-5 shadow-2xl shadow-cyan-500/10">
          <div className="grid grid-cols-6 gap-3 rounded-[28px] bg-[#0f172a]/80 p-4">
            {grid.map((tile, index) => (
              <button
                key={tile?.id || `empty-${index}`}
                type="button"
                className={`aspect-square rounded-3xl border border-white/10 transition-all duration-200 ${tile ? `${tile.colorClass} shadow-[0_0_45px_rgba(34,211,238,0.18)] hover:scale-[1.02]` : 'bg-slate-950/40 opacity-25'}`}
                onClick={() => tile && handleTileClick(index)}
              >
                {tile ? <span className="text-2xl font-black text-white/80">•</span> : null}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-slate-300">{message}</p>
        </div>

        <div className="flex w-full max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={gameState === 'PLAYING' ? () => setGameState('GAMEOVER') : initializeGrid}
            className="w-full rounded-3xl bg-cyan-500 px-6 py-4 text-base font-bold uppercase text-slate-950 transition hover:bg-cyan-400 sm:w-auto"
          >
            {gameState === 'PLAYING' ? 'Selesai' : 'Mulai Bermain'}
          </button>
          <button
            onClick={onExit}
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-base font-semibold uppercase text-slate-200 transition hover:bg-white/10 sm:w-auto"
          >
            Kembali ke Menu
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
              <h2 className="text-4xl font-black text-cyan-300">Game Neon Merge Berakhir</h2>
              <p className="mt-4 text-slate-300">Skor neon Anda adalah <span className="font-bold text-white">{score}</span>.</p>
              <button
                onClick={initializeGrid}
                className="mt-8 inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-base font-bold uppercase text-slate-950 transition hover:bg-cyan-400"
              >
                Coba Lagi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
