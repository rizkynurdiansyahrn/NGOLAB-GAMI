import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock3, Grid2X2, Layers3, MousePointer2, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type PaletteColor = { name: string; className: string };
type Tile = { color: PaletteColor; id: string } | null;

const palette: PaletteColor[] = [
  { name: 'hijau', className: 'from-emerald-300 to-emerald-600' },
  { name: 'kuning', className: 'from-amber-200 to-orange-500' },
  { name: 'biru', className: 'from-sky-300 to-blue-600' },
  { name: 'ungu', className: 'from-violet-300 to-purple-600' },
  { name: 'merah muda', className: 'from-pink-300 to-rose-600' },
];

const createTile = (id: string): Tile => ({ color: palette[Math.floor(Math.random() * palette.length)], id });

const getNeighbors = (index: number, columns: number, rows: number) => {
  const neighbors: number[] = [];
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
  const gameOverReportedRef = useRef(false);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [tilesCleared, setTilesCleared] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [message, setMessage] = useState('Pilih kelompok ubin yang bersebelahan.');

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setGameState('GAMEOVER');
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && !gameOverReportedRef.current) {
      gameOverReportedRef.current = true;
      onGameOver(score);
    }
  }, [gameState, onGameOver, score]);

  const initializeGrid = () => {
    const newGrid: Tile[] = [];
    for (let index = 0; index < columns * rows; index += 1) {
      newGrid.push(createTile(`tile-${Date.now()}-${index}`));
    }
    gameOverReportedRef.current = false;
    setGrid(newGrid);
    setScore(0);
    setTilesCleared(0);
    setTimeLeft(45);
    setMessage('Pilih kelompok ubin yang bersebelahan.');
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
      getNeighbors(current, columns, rows).forEach((next) => {
        if (!visited.has(next) && tiles[next]?.color.name === start.color.name) stack.push(next);
      });
    }
    return Array.from(visited);
  };

  const refillGrid = (tiles: Tile[]) => {
    const nextGrid = [...tiles];
    for (let column = 0; column < columns; column += 1) {
      const remaining: Tile[] = [];
      for (let row = 0; row < rows; row += 1) {
        const tile = nextGrid[row * columns + column];
        if (tile) remaining.push(tile);
      }
      const emptySlots = rows - remaining.length;
      const newTiles = Array.from({ length: emptySlots }, (_, index) => createTile(`tile-fill-${column}-${Date.now()}-${index}`));
      const columnTiles = [...newTiles, ...remaining];
      for (let row = 0; row < rows; row += 1) nextGrid[row * columns + column] = columnTiles[row];
    }
    return nextGrid;
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;
    const group = findGroup(index, grid);
    if (group.length < 3) {
      setMessage('Pilih minimal 3 ubin sewarna yang bersentuhan.');
      return;
    }

    const nextGrid = [...grid];
    group.forEach((tileIndex) => { nextGrid[tileIndex] = null; });
    setGrid(refillGrid(nextGrid));
    setScore((previous) => previous + group.length * 8 + (group.length >= 6 ? 20 : 0));
    setTilesCleared((previous) => previous + group.length);
    setMessage(group.length >= 6
      ? `Kombo besar! ${group.length} ubin hilang, bonus +20 poin.`
      : `${group.length} ubin digabungkan. Cari kelompok berikutnya!`);
  };

  const endGame = () => setGameState('GAMEOVER');
  const progress = (timeLeft / 45) * 100;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#070817] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_8%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(ellipse_at_88%_82%,rgba(217,70,239,0.16),transparent_34%),linear-gradient(180deg,#0b1028_0%,#080817_58%,#050814_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(165, 243, 252, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(165, 243, 252, 0.18) 1px, transparent 1px)', backgroundSize: '36px 36px', maskImage: 'linear-gradient(to bottom, black, transparent 88%)' }} />

      {gameState === 'PLAYING' && (
        <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col items-center gap-2.5 overflow-hidden px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#11152b]/85 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:rounded-[22px] sm:p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-200 to-violet-400 text-[#11152b] shadow-[0_0_25px_rgba(103,232,249,0.2)]">
                <Layers3 className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/75">Ngolab Arcade</div>
                <h1 className="mt-0.5 text-sm font-black tracking-wide text-white sm:text-base">NEON MERGE</h1>
                <p className="hidden text-[10px] text-slate-400 sm:block">Gabungkan 3+ ubin sewarna yang bersentuhan.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:min-w-[390px] md:max-w-[510px] md:flex-1">
              <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/65 sm:text-[9px]"><Sparkles className="h-3 w-3" aria-hidden="true" /> Skor</div>
                <div className="mt-0.5 text-base font-black tabular-nums text-cyan-100 sm:text-lg">{score}</div>
              </div>
              <div className={'rounded-xl border px-2.5 py-2 sm:rounded-2xl sm:px-3 ' + (timeLeft <= 10 ? 'border-rose-200/20 bg-rose-300/[0.07]' : 'border-violet-200/10 bg-violet-300/[0.05]')}>
                <div className={'flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ' + (timeLeft <= 10 ? 'text-rose-200/75' : 'text-violet-100/60')}><Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu</div>
                <div className={'mt-0.5 text-base font-black tabular-nums sm:text-lg ' + (timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-violet-100')}>{timeLeft}<span className="ml-1 text-[8px] font-bold text-slate-400">dtk</span></div>
              </div>
              <div className="rounded-xl border border-fuchsia-200/10 bg-fuchsia-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-fuchsia-100/60 sm:text-[9px]"><Grid2X2 className="h-3 w-3" aria-hidden="true" /> Ubin</div>
                <div className="mt-0.5 text-base font-black tabular-nums text-fuchsia-100 sm:text-lg">{tilesCleared}</div>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#11152b]/65 px-3 py-2 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
            <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-300 sm:text-[10px]">WAKTU</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={'h-full rounded-full transition-[width] duration-500 ' + (timeLeft <= 10 ? 'bg-gradient-to-r from-rose-400 to-orange-300' : 'bg-gradient-to-r from-cyan-300 to-violet-400')} style={{ width: `${progress}%` }} />
            </div>
            <span className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">PAPAN 6 × 6</span>
          </div>

          <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-0.5">
            <div className="grid h-full max-h-full w-auto max-w-full min-h-0 min-w-0 aspect-square grid-cols-6 grid-rows-6 gap-1.5 rounded-[24px] border border-cyan-100/10 bg-[#0b1024]/85 p-2 shadow-[0_0_55px_rgba(34,211,238,0.08)] sm:gap-2 sm:rounded-[28px] sm:p-3">
              {grid.map((tile, index) => (
                <motion.button
                  layout
                  key={tile?.id || `empty-${index}`}
                  type="button"
                  aria-label={tile ? `Ubin ${tile.color.name}, pilih untuk menggabungkan kelompok sewarna` : 'Ruang kosong'}
                  disabled={!tile}
                  onClick={() => handleTileClick(index)}
                  whileHover={tile ? { scale: 1.045, zIndex: 2 } : undefined}
                  whileTap={tile ? { scale: 0.92 } : undefined}
                  transition={{ layout: { duration: 0.22, ease: 'easeOut' } }}
                  className={'group relative min-h-0 min-w-0 overflow-hidden rounded-[10px] border outline-none transition-[filter,box-shadow] focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-default sm:rounded-[14px] ' + (tile
                    ? `border-white/25 bg-gradient-to-br ${tile.color.className} shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_10px_rgba(0,0,0,0.32)] hover:brightness-110`
                    : 'border-white/[0.04] bg-slate-950/40 opacity-25')}
                >
                  {tile && <>
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/25" />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/75 shadow-[0_0_14px_rgba(255,255,255,0.75)] transition-transform group-hover:scale-125 sm:h-3 sm:w-3" />
                  </>}
                </motion.button>
              ))}
            </div>
          </main>

          <footer className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-[#11152b]/75 px-3 py-2 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><MousePointer2 className="h-4 w-4" aria-hidden="true" /></div>
              <p className="truncate text-[10px] font-bold text-slate-300 sm:text-xs">{message}</p>
            </div>
            <button type="button" onClick={endGame} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-300 transition hover:border-rose-200/20 hover:bg-rose-300/10 hover:text-rose-100 sm:px-4 sm:text-[10px]">Akhiri sesi</button>
          </footer>
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#030611]/75 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#11152b]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />

              {gameState === 'START' ? (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border border-cyan-100/20 bg-gradient-to-br from-cyan-200 to-violet-400 text-[#11152b] shadow-[0_12px_34px_rgba(34,211,238,0.2)]"><Layers3 className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" /></div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade</div>
                  <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Neon Merge</h2>
                  <p className="mx-auto mt-2 max-w-[360px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">Satukan ubin neon dengan warna sama dan kumpulkan skor sebanyak mungkin sebelum waktu habis.</p>

                  <div className="my-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-violet-200/10 bg-violet-300/[0.06] px-1.5 py-3 sm:px-2"><Clock3 className="mx-auto mb-1.5 h-5 w-5 text-violet-200" aria-hidden="true" /><div className="text-[11px] font-black text-violet-100 sm:text-xs">45 DETIK</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Waktu bermain</div></div>
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-1.5 py-3 sm:px-2"><Grid2X2 className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" /><div className="text-[11px] font-black text-cyan-100 sm:text-xs">6 × 6</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Papan neon</div></div>
                    <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-1.5 py-3 sm:px-2"><Zap className="mx-auto mb-1.5 h-5 w-5 text-fuchsia-200" aria-hidden="true" /><div className="text-[11px] font-black text-fuchsia-100 sm:text-xs">+8 / UBIN</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Bonus grup 6+</div></div>
                  </div>

                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><MousePointer2 className="h-4 w-4" aria-hidden="true" /></div>
                    <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5"><span className="font-extrabold text-white">Cara bermain:</span> ketuk satu ubin untuk menghapus kelompok warna sama yang tersambung dari sisi. Minimal 3 ubin. Kelompok 6 atau lebih memberi bonus +20 poin; ubin baru jatuh mengisi kolom.</p>
                  </div>

                  <button type="button" onClick={initializeGrid} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-violet-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#10142a] shadow-[0_10px_26px_rgba(103,232,249,0.18)] transition hover:brightness-105 active:scale-[0.98]">Mulai bermain <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border border-cyan-100/15 bg-gradient-to-br from-cyan-200/20 to-violet-400/20 text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,0.15)]"><Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" /></div>
                  <div className="mb-2 inline-flex rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-cyan-200">Sesi selesai</div>
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{timeLeft === 0 ? 'Waktu habis!' : 'Permainan berakhir'}</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Kamu sudah membersihkan {tilesCleared} ubin. Coba lagi dan pecahkan skor tertinggi.</p>

                  <div className="my-5 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/60">Skor akhir</div><div className="mt-1 text-3xl font-black tabular-nums text-cyan-100">{score}</div></div>
                    <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-100/60">Ubin digabung</div><div className="mt-1 text-3xl font-black tabular-nums text-fuchsia-100">{tilesCleared}</div></div>
                  </div>

                  <button type="button" onClick={initializeGrid} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-violet-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#10142a] shadow-[0_10px_26px_rgba(103,232,249,0.18)] transition hover:brightness-105 active:scale-[0.98]"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Main lagi</button>
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
