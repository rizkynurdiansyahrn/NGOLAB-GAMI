import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock3, Eye, MousePointer2, RotateCcw, Sparkles, Target, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type NodeData = { id: number; x: number; y: number; label: string };
type EndReason = 'WIN' | 'TIME' | null;

const nodePositions = [
  { x: 18, y: 18 }, { x: 50, y: 12 }, { x: 82, y: 18 },
  { x: 18, y: 45 }, { x: 50, y: 50 }, { x: 82, y: 45 },
  { x: 18, y: 82 }, { x: 50, y: 88 }, { x: 82, y: 82 },
];

export default function NgolabGlowTrail({ onGameOver, onExit }: GameProps) {
  const gameOverReportedRef = useRef(false);
  const [gameState, setGameState] = useState<'START' | 'SHOW' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [progress, setProgress] = useState(0);
  const [targetOrder, setTargetOrder] = useState<NodeData[]>([]);
  const [message, setMessage] = useState('Hafalkan jalur, lalu ketuk titik sesuai urutan.');
  const [endReason, setEndReason] = useState<EndReason>(null);

  const sequence = useMemo(() => nodePositions.map((position, index) => ({
    id: index + 1,
    x: position.x,
    y: position.y,
    label: String(index + 1),
  })), []);

  useEffect(() => {
    if (gameState !== 'SHOW') return;
    const revealTimer = window.setTimeout(() => {
      setGameState('PLAYING');
      setMessage('Jalur tersembunyi. Lanjutkan berdasarkan ingatanmu.');
    }, 2800);
    return () => window.clearTimeout(revealTimer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setEndReason('TIME');
          setGameState('GAMEOVER');
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && !gameOverReportedRef.current) {
      gameOverReportedRef.current = true;
      onGameOver(score);
    }
  }, [gameState, onGameOver, score]);

  const startGame = () => {
    const shuffled = [...sequence].sort(() => Math.random() - 0.5);
    const labeledSequence = shuffled.map((node, index) => ({ ...node, label: String(index + 1) }));
    gameOverReportedRef.current = false;
    setTargetOrder(labeledSequence);
    setProgress(0);
    setScore(0);
    setTimeLeft(40);
    setEndReason(null);
    setMessage('Perhatikan urutan jalur bercahaya.');
    setGameState('SHOW');
  };

  const handleNodeTap = (id: number) => {
    if (gameState !== 'PLAYING') return;
    const expected = targetOrder[progress];
    if (expected?.id === id) {
      const nextProgress = progress + 1;
      setProgress(nextProgress);
      setScore((previous) => previous + 10);
      if (nextProgress === targetOrder.length) {
        setMessage('Sempurna! Seluruh jalur berhasil diingat.');
        setEndReason('WIN');
        setGameState('GAMEOVER');
      } else {
        setMessage('Tepat! Urutannya benar. Lanjutkan mengingat jalurnya.');
      }
      return;
    }

    const nextTime = Math.max(0, timeLeft - 4);
    setScore((previous) => Math.max(0, previous - 5));
    setTimeLeft(nextTime);
    if (nextTime === 0) {
      setMessage('Waktu habis karena salah memilih titik.');
      setEndReason('TIME');
      setGameState('GAMEOVER');
    } else {
      setMessage('Belum tepat. −5 poin dan −4 detik.');
    }
  };

  const progressPercent = (progress / sequence.length) * 100;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#050814] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_10%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(ellipse_at_88%_80%,rgba(34,211,238,0.15),transparent_34%),linear-gradient(180deg,#0c0b25_0%,#070a19_62%,#050814_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(rgba(192, 132, 252, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(192, 132, 252, 0.16) 1px, transparent 1px)', backgroundSize: '38px 38px', maskImage: 'linear-gradient(to bottom, black, transparent 90%)' }} />

      {gameState !== 'START' && (
        <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col items-center gap-2.5 overflow-hidden px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
          <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#111229]/85 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:rounded-[22px] sm:p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-fuchsia-200 to-cyan-300 text-[#17132d] shadow-[0_0_25px_rgba(192,132,252,0.2)]"><Sparkles className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" /></div>
              <div className="min-w-0">
                <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-200/75">Ngolab Arcade</div>
                <h1 className="mt-0.5 text-sm font-black tracking-wide text-white sm:text-base">GLOW TRAIL</h1>
                <p className="hidden text-[10px] text-slate-400 sm:block">Hafalkan jalur, lalu sentuh titiknya secara berurutan.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:min-w-[390px] md:max-w-[510px] md:flex-1">
              <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/65 sm:text-[9px]"><Zap className="h-3 w-3" aria-hidden="true" /> Skor</div>
                <div className="mt-0.5 text-base font-black tabular-nums text-cyan-100 sm:text-lg">{score}</div>
              </div>
              <div className={'rounded-xl border px-2.5 py-2 sm:rounded-2xl sm:px-3 ' + (timeLeft <= 10 ? 'border-rose-200/20 bg-rose-300/[0.07]' : 'border-violet-200/10 bg-violet-300/[0.05]')}>
                <div className={'flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ' + (timeLeft <= 10 ? 'text-rose-200/75' : 'text-violet-100/60')}><Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu</div>
                <div className={'mt-0.5 text-base font-black tabular-nums sm:text-lg ' + (timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-violet-100')}>{timeLeft}<span className="ml-1 text-[8px] font-bold text-slate-400">dtk</span></div>
              </div>
              <div className="rounded-xl border border-fuchsia-200/10 bg-fuchsia-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-fuchsia-100/60 sm:text-[9px]"><Target className="h-3 w-3" aria-hidden="true" /> Progres</div>
                <div className="mt-0.5 text-base font-black tabular-nums text-fuchsia-100 sm:text-lg">{progress}<span className="ml-1 text-[9px] font-bold text-slate-400">/ {sequence.length}</span></div>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#111229]/65 px-3 py-2 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
            <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-300 sm:text-[10px]">{gameState === 'SHOW' ? 'HAFALKAN' : 'PROGRES'}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={'h-full rounded-full transition-[width] duration-500 ' + (gameState === 'SHOW' ? 'animate-pulse bg-gradient-to-r from-fuchsia-300 to-cyan-300' : 'bg-gradient-to-r from-cyan-300 to-violet-400')} style={{ width: gameState === 'SHOW' ? '100%' : `${progressPercent}%` }} />
            </div>
            <span className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">{gameState === 'SHOW' ? 'LIHAT JALURNYA' : `${progress} / ${sequence.length} TITIK`}</span>
          </div>

          <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-0.5">
            <div className="relative h-full max-h-full w-auto max-w-full aspect-square overflow-hidden rounded-[26px] border border-cyan-100/15 bg-[#090b20]/90 shadow-[0_0_55px_rgba(34,211,238,0.09)] sm:rounded-[30px]">
              <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-white/[0.05] sm:inset-4 sm:rounded-[24px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.06),transparent_55%)]" />

              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <filter id="glow-trail-filter" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                {gameState === 'SHOW' && targetOrder.slice(0, -1).map((node, index) => {
                  const nextNode = targetOrder[index + 1];
                  return <motion.line key={`show-${node.id}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.9 }} transition={{ delay: index * 0.14, duration: 0.22 }} x1={node.x} y1={node.y} x2={nextNode.x} y2={nextNode.y} stroke="#67e8f9" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="3 2" filter="url(#glow-trail-filter)" />;
                })}
                {gameState === 'PLAYING' && targetOrder.slice(0, Math.max(0, progress - 1)).map((node, index) => {
                  const nextNode = targetOrder[index + 1];
                  return <motion.line key={`play-${node.id}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} x1={node.x} y1={node.y} x2={nextNode.x} y2={nextNode.y} stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" filter="url(#glow-trail-filter)" />;
                })}
              </svg>

              {(targetOrder.length ? targetOrder : sequence).map((node) => {
                const nodeIndex = targetOrder.findIndex((item) => item.id === node.id);
                const isVisited = gameState === 'PLAYING' && nodeIndex >= 0 && nodeIndex < progress;
                const isRevealed = gameState === 'SHOW' || isVisited;
                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    aria-label={gameState === 'SHOW' ? `Titik urutan ${node.label}` : isVisited ? `Titik ${node.label}, sudah dipilih` : 'Titik bercahaya, pilih sesuai jalur yang diingat'}
                    disabled={gameState !== 'PLAYING'}
                    onClick={() => handleNodeTap(node.id)}
                    whileHover={gameState === 'PLAYING' ? { scale: 1.08 } : undefined}
                    whileTap={gameState === 'PLAYING' ? { scale: 0.92 } : undefined}
                    className={'absolute z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-black transition-all duration-300 disabled:cursor-default sm:h-14 sm:w-14 md:h-16 md:w-16 ' + (isVisited
                      ? 'border-cyan-100 bg-cyan-300 text-[#071426] shadow-[0_0_30px_rgba(34,211,238,0.7)]'
                      : gameState === 'SHOW'
                        ? 'border-cyan-100/80 bg-cyan-400/90 text-[#071426] shadow-[0_0_26px_rgba(34,211,238,0.55)]'
                      : 'border-white/20 bg-[#17182f]/95 text-white/55 shadow-[0_5px_18px_rgba(0,0,0,0.28)] hover:border-cyan-100/60 hover:text-cyan-100')}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    {isRevealed ? node.label : <span className="text-lg font-bold">?</span>}
                  </motion.button>
                );
              })}

              {gameState === 'SHOW' && <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-100/15 bg-[#080b1c]/80 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-cyan-100 shadow-lg backdrop-blur sm:bottom-4 sm:px-4 sm:text-[10px]">Urutan 1 sampai 9</div>}
            </div>
          </main>

          <footer className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-[#111229]/75 px-3 py-2 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ' + (gameState === 'SHOW' ? 'bg-fuchsia-300/10 text-fuchsia-200' : 'bg-cyan-300/10 text-cyan-200')}>
                {gameState === 'SHOW' ? <Eye className="h-4 w-4" aria-hidden="true" /> : <MousePointer2 className="h-4 w-4" aria-hidden="true" />}
              </div>
              <p className="truncate text-[10px] font-bold text-slate-300 sm:text-xs">{gameState === 'SHOW' ? 'Amati jalur bercahaya sebelum menghilang.' : message}</p>
            </div>
            <button type="button" onClick={onExit} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-[10px]">Keluar</button>
          </footer>
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#030611]/75 p-3 backdrop-blur-md sm:p-6">
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#111229]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-fuchsia-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
              {gameState === 'START' ? (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border border-fuchsia-100/20 bg-gradient-to-br from-fuchsia-200 to-cyan-300 text-[#17132d] shadow-[0_12px_34px_rgba(192,132,252,0.22)]"><Sparkles className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" /></div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-100/10 bg-fuchsia-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade</div>
                  <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Glow Trail</h2>
                  <p className="mx-auto mt-2 max-w-[350px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">Ikuti jalur cahaya dengan mengingat urutan sembilan titik. Seberapa jauh kamu bisa melangkah?</p>

                  <div className="my-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-violet-200/10 bg-violet-300/[0.06] px-1.5 py-3 sm:px-2"><Clock3 className="mx-auto mb-1.5 h-5 w-5 text-violet-200" aria-hidden="true" /><div className="text-[11px] font-black text-violet-100 sm:text-xs">40 DETIK</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Waktu bermain</div></div>
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-1.5 py-3 sm:px-2"><Target className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" /><div className="text-[11px] font-black text-cyan-100 sm:text-xs">9 TITIK</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Ikuti urutan</div></div>
                    <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-1.5 py-3 sm:px-2"><Zap className="mx-auto mb-1.5 h-5 w-5 text-fuchsia-200" aria-hidden="true" /><div className="text-[11px] font-black text-fuchsia-100 sm:text-xs">+10 POIN</div><div className="mt-1 text-[9px] font-semibold text-slate-400">Per titik benar</div></div>
                  </div>

                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Eye className="h-4 w-4" aria-hidden="true" /></div>
                    <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5"><span className="font-extrabold text-white">Cara bermain:</span> amati jalur yang menyala selama beberapa detik, lalu ketuk titik dalam urutan dari awal sampai akhir. Salah memilih mengurangi 5 poin dan 4 detik.</p>
                  </div>

                  <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#121329] shadow-[0_10px_26px_rgba(192,132,252,0.2)] transition hover:brightness-105 active:scale-[0.98]">Lihat jalur <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">Kembali ke menu</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[25px] border border-cyan-100/15 bg-gradient-to-br from-cyan-200/20 to-fuchsia-400/20 text-cyan-100 shadow-[0_12px_34px_rgba(34,211,238,0.15)]"><Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" /></div>
                  <div className="mb-2 inline-flex rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-cyan-200">Sesi selesai</div>
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{endReason === 'WIN' ? 'Jalur sempurna!' : 'Waktu habis!'}</h2>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Kamu berhasil mengingat {progress} dari {sequence.length} titik.</p>

                  <div className="my-5 grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/60">Skor akhir</div><div className="mt-1 text-3xl font-black tabular-nums text-cyan-100">{score}</div></div>
                    <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-3 py-4"><div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-100/60">Titik benar</div><div className="mt-1 text-3xl font-black tabular-nums text-fuchsia-100">{progress}<span className="ml-1 text-sm text-slate-400">/ 9</span></div></div>
                  </div>

                  <button type="button" onClick={startGame} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#121329] shadow-[0_10px_26px_rgba(192,132,252,0.2)] transition hover:brightness-105 active:scale-[0.98]"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Main lagi</button>
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
