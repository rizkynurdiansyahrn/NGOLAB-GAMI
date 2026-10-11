import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Clock3, Layers3, MousePointer2, Sparkles, Star, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

export default function NgolabMemory({ onGameOver, onExit, onScoreChange }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState('Temukan pasangan kartu yang sama.');
  const [lastResult, setLastResult] = useState<'match' | 'miss' | null>(null);

  const emojis = ['\u{1F354}', '\u{1F35F}', '\u{1F355}', '\u{1F964}', '\u{2615}', '\u{1F369}', '\u{1F368}', '\u{1F370}'];

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setMatchedPairs(0);
    setFlippedIndices([]);
    setIsLocked(false);
    setMoves(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback('Temukan pasangan kartu yang sama.');
    setLastResult(null);

    let arr = [...emojis, ...emojis];
    arr.sort(() => Math.random() - 0.5);
    setCards(arr.map((emoji, id) => ({ id, emoji, matched: false })));

    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
    if (gameState === 'GAMEOVER' && score > 0) {
      onGameOver(score);
    }
  }, [gameState]);

  const flipCard = (index: number) => {
    if (isLocked || gameState !== 'PLAYING' || flippedIndices.includes(index) || cards[index].matched) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 1) {
      setLastResult(null);
      setFeedback('Pilih satu kartu lagi.');
    }

    if (newFlipped.length === 2) {
      setMoves((current) => current + 1);
      setIsLocked(true);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // match
        setLastResult('match');
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setBestStreak((current) => Math.max(current, nextStreak));
        setFeedback(streak > 0 ? 'Kombo x' + (streak + 1) + '! Pasangan ditemukan.' : 'Pasangan ditemukan! Lanjutkan kombo.');
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === first || i === second) ? { ...c, matched: true } : c));
          setScore((s) => {
            const next = s + 10;
            onScoreChange?.(next);
            return next;
          });
          setMatchedPairs(m => {
            const next = m + 1;
            if (next === emojis.length) {
              // Win! add time bonus
              setScore((s) => {
                const next = s + 10 + timeLeft;
                onScoreChange?.(next);
                return next;
              });
              setGameState('GAMEOVER');
            }
            return next;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 500);
      } else {
        setLastResult('miss');
        setStreak(0);
        setFeedback('Belum cocok. Ingat posisi kartunya!');
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#0b0718] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_12%,rgba(217,70,239,0.18),transparent_34%),radial-gradient(ellipse_at_88%_82%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#160b2b_0%,#0b0718_70%,#080d1d_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'linear-gradient(rgba(240, 171, 252, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(240, 171, 252, 0.16) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
        }}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center gap-3 overflow-hidden px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
        {(gameState === 'PLAYING' || gameState === 'GAMEOVER') && (
          <>
            <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-col gap-2 rounded-2xl border border-white/10 bg-[#141128]/80 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:rounded-[22px] sm:p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-fuchsia-200 to-violet-400 text-[#2b1239] shadow-[0_6px_18px_rgba(217,70,239,0.2)]">
                  <Layers3 className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-200/80">Ngolab Arcade</div>
                  <div className="mt-0.5 text-sm font-black tracking-wide text-white sm:text-base">MEMORY MATCH</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:min-w-[390px] md:max-w-[510px] md:flex-1">
                <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                  <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/60 sm:text-[9px]">
                    <Sparkles className="h-3 w-3" aria-hidden="true" /> Skor
                  </div>
                  <div className="mt-0.5 text-base font-black tabular-nums text-cyan-100 sm:text-lg">{score}</div>
                </div>
                <div className={'rounded-xl border px-2.5 py-2 sm:rounded-2xl sm:px-3 ' + (timeLeft <= 10 ? 'border-rose-200/20 bg-rose-300/[0.07]' : 'border-amber-200/10 bg-amber-300/[0.05]')}>
                  <div className={'flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ' + (timeLeft <= 10 ? 'text-rose-200/75' : 'text-amber-100/60')}>
                    <Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu
                  </div>
                  <div className={'mt-0.5 text-base font-black tabular-nums sm:text-lg ' + (timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-amber-100')}>{timeLeft}<span className="ml-1 text-[8px] font-bold text-slate-400">dtk</span></div>
                </div>
                <div className="rounded-xl border border-fuchsia-200/10 bg-fuchsia-300/[0.05] px-2.5 py-2 sm:rounded-2xl sm:px-3">
                  <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-fuchsia-100/60 sm:text-[9px]">
                    <Star className="h-3 w-3 text-fuchsia-200" aria-hidden="true" /> Pasangan
                  </div>
                  <div className="mt-0.5 text-base font-black tabular-nums text-fuchsia-100 sm:text-lg">{matchedPairs}<span className="ml-1 text-[9px] font-bold text-slate-400">/ {emojis.length}</span></div>
                </div>
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-5xl shrink-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#151128]/65 px-3 py-2.5 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
              <div className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-300 sm:text-[10px]">PROGRES</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 to-cyan-300 transition-[width] duration-500" style={{ width: ((matchedPairs / emojis.length) * 100) + '%' }} />
              </div>
              <div className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">{moves} LANGKAH</div>
            </div>

            <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden py-1">
              <div className="grid h-full max-h-full w-auto max-w-full min-h-0 min-w-0 aspect-square grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5 md:gap-3">
                {cards.map((card, i) => {
                  const isFlipped = flippedIndices.includes(i) || card.matched;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      aria-label={'Kartu ' + (i + 1) + (card.matched ? ', pasangan sudah ditemukan' : isFlipped ? ', terbuka' : ', tertutup')}
                      aria-pressed={isFlipped}
                      disabled={isLocked || card.matched || gameState !== 'PLAYING'}
                      onClick={() => flipCard(i)}
                      whileHover={!isFlipped && !isLocked ? { y: -3, scale: 1.025 } : undefined}
                      whileTap={!isFlipped && !isLocked ? { scale: 0.96 } : undefined}
                      className="group relative min-h-0 min-w-0 cursor-pointer rounded-2xl text-3xl outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200 disabled:cursor-default sm:rounded-[22px] sm:text-4xl"
                      style={{ perspective: '900px' }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.42, ease: [0.2, 0.75, 0.25, 1] }}
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div
                          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-200/25 bg-gradient-to-br from-[#30204f] via-[#21163e] to-[#15142f] shadow-[0_8px_20px_rgba(0,0,0,0.26)] transition group-hover:border-fuchsia-100/55 sm:rounded-[22px]"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div className="pointer-events-none absolute inset-[5px] rounded-[14px] border border-white/[0.07] sm:rounded-[17px]" />
                          <div className="pointer-events-none absolute -right-4 -top-5 h-16 w-16 rounded-full bg-fuchsia-300/10 blur-xl" />
                          <div className="flex flex-col items-center gap-1 text-fuchsia-100/70">
                            <Sparkles className="h-4 w-4 text-fuchsia-200/70 sm:h-5 sm:w-5" aria-hidden="true" />
                            <span className="text-xl font-black tracking-widest text-white/65 sm:text-2xl">?</span>
                          </div>
                        </div>
                        <div
                          className={'absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_0_26px_rgba(34,211,238,0.16)] sm:rounded-[22px] ' + (card.matched ? 'border-emerald-200/70 from-emerald-400/25 to-cyan-500/15' : 'border-cyan-200/45 from-cyan-300/15 to-violet-400/20')}
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <div className="pointer-events-none absolute inset-[5px] rounded-[14px] border border-white/[0.08] sm:rounded-[17px]" />
                          <span className="relative drop-shadow-[0_5px_12px_rgba(255,255,255,0.2)]">{card.emoji}</span>
                          {card.matched && <Star className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-emerald-200 text-emerald-200 sm:right-2 sm:top-2 sm:h-4 sm:w-4" aria-hidden="true" />}
                        </div>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </main>

            <footer className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-[#121027]/70 px-3 py-2.5 backdrop-blur-xl sm:rounded-[20px] sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ' + (lastResult === 'match' ? 'bg-emerald-300/10 text-emerald-200' : lastResult === 'miss' ? 'bg-amber-300/10 text-amber-200' : 'bg-fuchsia-300/10 text-fuchsia-200')}>
                  {lastResult === 'match' ? <Star className="h-4 w-4 fill-current" aria-hidden="true" /> : lastResult === 'miss' ? <Zap className="h-4 w-4" aria-hidden="true" /> : <MousePointer2 className="h-4 w-4" aria-hidden="true" />}
                </div>
                <p className={'truncate text-[10px] font-bold sm:text-xs ' + (lastResult === 'match' ? 'text-emerald-100' : lastResult === 'miss' ? 'text-amber-100' : 'text-slate-300')}>{feedback}</p>
              </div>
              <div className="shrink-0 text-[9px] font-extrabold text-fuchsia-100/70 sm:text-[10px]">KOMBO x{streak}</div>
            </footer>
          </>
        )}

        {gameState === 'START' && (
          <div className="pointer-events-none absolute inset-0 z-40 bg-[#030612]/40 backdrop-blur-[2px]" />
        )}

        <AnimatePresence>
          {(gameState === 'START' || gameState === 'GAMEOVER') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030612]/72 p-3 backdrop-blur-md sm:p-6"
            >
              <motion.section
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="relative my-auto max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#15112a]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.58)] sm:rounded-[32px] sm:p-7"
              >
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-fuchsia-300/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

                {gameState === 'START' ? (
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-fuchsia-100/20 bg-gradient-to-br from-fuchsia-200 to-violet-400 text-[#291039] shadow-[0_12px_32px_rgba(217,70,239,0.22)]">
                      <Layers3 className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" />
                    </div>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-100/10 bg-fuchsia-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-200">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Memory Match</h1>
                    <p className="mx-auto mt-2 max-w-[340px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                      Buka kartu, ingat gambarnya, lalu temukan semua pasangan sebelum waktunya habis.
                    </p>

                    <div className="my-5 grid grid-cols-3 gap-2.5">
                      <div className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.06] px-1.5 py-3 sm:px-2">
                        <Clock3 className="mx-auto mb-1.5 h-5 w-5 text-amber-200" aria-hidden="true" />
                        <div className="text-[11px] font-black text-amber-100 sm:text-xs">60 DETIK</div>
                        <div className="mt-1 text-[9px] font-semibold text-slate-400">Waktu bermain</div>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-1.5 py-3 sm:px-2">
                        <Layers3 className="mx-auto mb-1.5 h-5 w-5 text-fuchsia-200" aria-hidden="true" />
                        <div className="text-[11px] font-black text-fuchsia-100 sm:text-xs">8 PASANG</div>
                        <div className="mt-1 text-[9px] font-semibold text-slate-400">16 kartu</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-1.5 py-3 sm:px-2">
                        <Sparkles className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                        <div className="text-[11px] font-black text-cyan-100 sm:text-xs">+10 POIN</div>
                        <div className="mt-1 text-[9px] font-semibold text-slate-400">Per pasangan</div>
                      </div>
                    </div>

                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                        <MousePointer2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5">
                        Ketuk dua kartu untuk membuka. Pasangan cocok memberi poin; selesaikan semua pasangan untuk bonus waktu.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={initGame}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 to-violet-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#291039] shadow-[0_10px_26px_rgba(217,70,239,0.2)] transition hover:brightness-105 active:scale-[0.98]"
                    >
                      Mulai bermain <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                      Kembali ke menu
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-amber-100/20 bg-gradient-to-br from-amber-200/25 to-fuchsia-400/10 text-amber-200 shadow-[0_12px_32px_rgba(251,191,36,0.16)]">
                      <Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" />
                    </div>
                    <div className="mb-2 inline-flex rounded-full border border-amber-100/10 bg-amber-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-amber-200">Sesi selesai</div>
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{matchedPairs === emojis.length ? 'Hebat! Semua cocok.' : 'Waktu habis!'}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Kamu menemukan {matchedPairs} dari {emojis.length} pasangan dalam {moves} langkah.</p>

                    <div className="my-5 grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-4">
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/60">Skor akhir</div>
                        <div className="mt-1 text-3xl font-black tabular-nums text-cyan-100">{score}</div>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-3 py-4">
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-100/60">Kombo terbaik</div>
                        <div className="mt-1 text-3xl font-black tabular-nums text-fuchsia-100">{bestStreak}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={initGame}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-200 to-violet-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#291039] shadow-[0_10px_26px_rgba(217,70,239,0.2)] transition hover:brightness-105 active:scale-[0.98]"
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
    </div>
  );
}
