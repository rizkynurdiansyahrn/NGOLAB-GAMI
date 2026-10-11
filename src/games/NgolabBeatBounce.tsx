import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Clock3, Gamepad2, Headphones, Keyboard, Music2, Sparkles, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  onScoreChange?: (score: number) => void;
}

type Note = { id: string; lane: number; y: number; active: boolean };

export default function NgolabBeatBounce({ onGameOver, onExit, onScoreChange }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState('Ketuk ketukan di zona cahaya!');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeLanes, setActiveLanes] = useState<boolean[]>([false, false, false, false]);
  const [splashes, setSplashes] = useState<{ id: number; lane: number; text: string; color: string }[]>([]);

  const stateRef = useRef({
    state: 'START',
    score: 0,
    combo: 0,
    time: 40,
    notes: [] as Note[],
    lastTime: 0,
    spawnTimer: 0,
    noteId: 0,
  });
  const animationRef = useRef<number | null>(null);
  const splashIdCounter = useRef(0);

  const spawnNote = () => {
    const state = stateRef.current;
    const lane = Math.floor(Math.random() * 4);
    state.notes.push({
      id: `note-${state.noteId += 1}`,
      lane,
      y: -12,
      active: true,
    });
  };

  useEffect(() => {
    let lastNotesUpdate = 0;
    const update = (dt: number) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      const seconds = dt / 1000;
      state.spawnTimer += dt;
      if (state.spawnTimer > 800) {
        spawnNote();
        state.spawnTimer = 0;
      }
      state.notes = state.notes.filter((note) => {
        note.y += 48 * seconds;
        if (note.y > 104) {
          if (note.active) {
            state.combo = 0;
            setCombo(0);
            setFeedback('Ketukan terlewat!');
          }
          return false;
        }
        return true;
      });
      if (performance.now() - lastNotesUpdate >= 32) {
        setNotes([...state.notes]);
        lastNotesUpdate = performance.now();
      }
    };

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      if (!state.lastTime) state.lastTime = timestamp;
      const delta = timestamp - state.lastTime;
      state.lastTime = timestamp;
      update(delta);
      if (state.state === 'PLAYING') {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    if (gameState === 'PLAYING') {
      stateRef.current.lastTime = 0;
      animationRef.current = requestAnimationFrame(loop);
      const timer = setInterval(() => {
        const state = stateRef.current;
        if (state.state !== 'PLAYING') return;
        state.time -= 1;
        setTimeLeft(state.time);
        if (state.time <= 0) {
          state.state = 'GAMEOVER';
          setGameState('GAMEOVER');
          onGameOver(state.score);
        }
      }, 1000);
      return () => {
        clearInterval(timer);
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }

    return undefined;
  }, [gameState, onGameOver]);

  const startGame = () => {
    stateRef.current = {
      state: 'PLAYING',
      score: 0,
      combo: 0,
      time: 40,
      notes: [],
      lastTime: 0,
      spawnTimer: 0,
      noteId: 0,
    };
    setScore(0);
    setCombo(0);
    setTimeLeft(40);
    setFeedback('Ketuk ketukan di zona cahaya!');
    setNotes([]);
    setSplashes([]);
    setGameState('PLAYING');
  };

  const handleTap = (lane: number) => {
    const state = stateRef.current;
    if (state.state !== 'PLAYING') return;
    const hitLine = 88;
    const windowHeight = 16;
    let hit = false;
    for (const note of state.notes) {
      if (note.lane !== lane || !note.active) continue;
      const distance = Math.abs(note.y - hitLine);
      if (distance < windowHeight) {
        note.active = false;
        hit = true;
        const baseScore = 10 + Math.max(0, 30 - Math.floor(distance * 1.5));
        state.score += baseScore;
        state.combo += 1;
        setScore(state.score);
        onScoreChange?.(state.score);
        setCombo(state.combo);

        const splashText = distance < 4 ? 'PERFECT' : distance < 9 ? 'AWESOME' : 'GOOD';
        setFeedback(distance < 4 ? 'Sempurna!' : distance < 9 ? 'Luar Biasa!' : 'Bagus!');

        if (state.combo % 5 === 0) {
          state.time += 2;
          setTimeLeft(state.time);
        }

        // Add visual hit splash
        const color = lane === 0 ? '#22d3ee' : lane === 1 ? '#f43f5e' : lane === 2 ? '#10b981' : '#f59e0b';
        const newId = splashIdCounter.current += 1;
        setSplashes((prev) => [...prev, { id: newId, lane, text: splashText, color }]);
        setTimeout(() => {
          setSplashes((prev) => prev.filter((s) => s.id !== newId));
        }, 250);

        setNotes([...state.notes]);
        break;
      }
    }

    if (!hit) {
      state.combo = 0;
      setCombo(0);
      state.time = Math.max(0, state.time - 2);
      setTimeLeft(state.time);
      setFeedback('Tidak pas ketukan!');
      if (state.time <= 0) {
        state.state = 'GAMEOVER';
        setGameState('GAMEOVER');
        onGameOver(state.score);
      }
    }
  };

  const handleButtonPress = (lane: number) => {
    handleTap(lane);
    setActiveLanes((prev) => {
      const next = [...prev];
      next[lane] = true;
      return next;
    });
    setTimeout(() => {
      setActiveLanes((prev) => {
        const next = [...prev];
        next[lane] = false;
        return next;
      });
    }, 85);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      let lane = -1;
      if (key === 'a') lane = 0;
      else if (key === 'b') lane = 1;
      else if (key === 'c') lane = 2;
      else if (key === 'd') lane = 3;

      if (lane !== -1) {
        handleTap(lane);
        setActiveLanes((prev) => {
          const next = [...prev];
          next[lane] = true;
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let lane = -1;
      if (key === 'a') lane = 0;
      else if (key === 'b') lane = 1;
      else if (key === 'c') lane = 2;
      else if (key === 'd') lane = 3;

      if (lane !== -1) {
        setActiveLanes((prev) => {
          const next = [...prev];
          next[lane] = false;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#070a17] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_8%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(ellipse_at_88%_82%,rgba(217,70,239,0.13),transparent_34%),linear-gradient(180deg,#0a1021_0%,#070a17_68%,#0a1020_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'linear-gradient(rgba(165, 243, 252, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(165, 243, 252, 0.18) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-[100px]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
        <header className="flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-white/10 bg-[#11182a]/85 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[24px] sm:p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-200 to-sky-400 text-[#082332] shadow-[0_6px_18px_rgba(34,211,238,0.22)] sm:h-11 sm:w-11">
              <Music2 className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/80">Ngolab Arcade</div>
              <h1 className="truncate text-base font-black tracking-wide text-white sm:text-lg">BEAT BOUNCE</h1>
              <p className="hidden text-[10px] text-slate-400 sm:block">Ketuk saat nada menyentuh garis bercahaya.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:min-w-[390px] md:max-w-[510px] md:flex-1">
            <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.06] px-2.5 py-2 sm:rounded-2xl sm:px-3">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-cyan-100/60 sm:text-[9px]">Skor</div>
              <div className="mt-0.5 text-base font-black tabular-nums text-cyan-100 sm:text-lg">{score}</div>
            </div>
            <div className="rounded-xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-2.5 py-2 sm:rounded-2xl sm:px-3">
              <div className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-fuchsia-100/60 sm:text-[9px]">Kombo</div>
              <div className="mt-0.5 text-base font-black tabular-nums text-fuchsia-100 sm:text-lg">{combo}<span className="ml-1 text-[9px] font-bold text-slate-400">x</span></div>
            </div>
            <div className={`rounded-xl border px-2.5 py-2 sm:rounded-2xl sm:px-3 ${timeLeft <= 10 ? 'border-rose-200/25 bg-rose-300/[0.08]' : 'border-amber-200/10 bg-amber-300/[0.06]'}`}>
              <div className={`flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-[0.12em] sm:text-[9px] ${timeLeft <= 10 ? 'text-rose-200/80' : 'text-amber-100/60'}`}>
                <Clock3 className="h-3 w-3" aria-hidden="true" /> Waktu
              </div>
              <div className={`mt-0.5 text-base font-black tabular-nums sm:text-lg ${timeLeft <= 10 ? 'animate-pulse text-rose-200' : 'text-amber-100'}`}>{timeLeft}<span className="ml-1 text-[9px] font-bold text-slate-400">dtk</span></div>
            </div>
          </div>
        </header>

        <section className="relative flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-[24px] border border-cyan-200/10 bg-[#080d1b]/90 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:rounded-[30px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-white/[0.07]" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/[0.07]" />
          <div className="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-white/[0.07]" />

          {activeLanes.map((active, lane) => (
            <div
              key={`lane-glow-${lane}`}
              className={`pointer-events-none absolute inset-y-0 w-1/4 transition-opacity duration-100 ${active ? 'opacity-100' : 'opacity-0'}`}
              style={{
                left: `${lane * 25}%`,
                background: `linear-gradient(to top, ${lane === 0 ? '#22d3ee' : lane === 1 ? '#f43f5e' : lane === 2 ? '#10b981' : '#f59e0b'}30, transparent 55%)`,
              }}
            />
          ))}

          <div className="relative flex min-h-[240px] flex-1 select-none flex-col touch-none">
            <div className="pointer-events-none absolute inset-x-0 top-[88%] z-10 h-[3px] -translate-y-1/2 bg-gradient-to-r from-cyan-300/15 via-white/70 to-amber-300/15 shadow-[0_0_18px_rgba(165,243,252,0.55)]" />
            <div className="pointer-events-none absolute left-1/2 top-[88%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[#11182a]/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/70 backdrop-blur sm:px-3 sm:text-[9px]">Zona ketuk</div>

            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={false}
                animate={{ top: `${note.y}%`, opacity: note.active ? 1 : 0 }}
                transition={{ duration: 0.03, ease: 'linear' }}
                className="absolute z-20 w-[19%] -translate-x-1/2 -translate-y-1/2 sm:w-[16%]"
                style={{ left: `${note.lane * 25 + 12.5}%` }}
              >
                <div className={`h-4 w-full rounded-full border border-white/55 shadow-[0_0_22px_currentColor] sm:h-5 ${note.lane === 0 ? 'bg-gradient-to-r from-cyan-300 to-cyan-500 text-cyan-300' : note.lane === 1 ? 'bg-gradient-to-r from-rose-300 to-pink-500 text-rose-300' : note.lane === 2 ? 'bg-gradient-to-r from-emerald-300 to-teal-500 text-emerald-300' : 'bg-gradient-to-r from-amber-200 to-orange-500 text-amber-300'}`} />
              </motion.div>
            ))}

            <AnimatePresence>
              {splashes.map((splash) => (
                <motion.div
                  key={splash.id}
                  initial={{ opacity: 1, scale: 0.8, y: 0 }}
                  animate={{ opacity: 0, scale: 1.15, y: -24 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="pointer-events-none absolute z-30 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${splash.lane * 25 + 12.5}%`, top: '81%' }}
                >
                  <span className="rounded-full border px-2.5 py-1 text-[8px] font-black tracking-[0.15em] shadow-lg sm:text-[9px]" style={{ color: splash.color, borderColor: `${splash.color}88`, backgroundColor: `${splash.color}18`, boxShadow: `0 0 18px ${splash.color}44` }}>{splash.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="absolute inset-x-0 top-[88%] z-20 h-12 -translate-y-1/2">
              {Array.from({ length: 4 }).map((_, lane) => (
                <button
                  key={lane}
                  type="button"
                  aria-label={`Ketuk lajur ${['A', 'B', 'C', 'D'][lane]}`}
                  title={`Ketuk atau tekan ${['A', 'B', 'C', 'D'][lane]}`}
                  onClick={() => handleButtonPress(lane)}
                  className={`absolute top-1/2 inline-flex h-11 w-[21%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-xs font-black tracking-wider shadow-lg transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-12 sm:w-[18%] ${activeLanes[lane]
                    ? lane === 0 ? 'scale-95 border-cyan-300 bg-cyan-400/25 text-cyan-100 shadow-cyan-400/25'
                      : lane === 1 ? 'scale-95 border-rose-300 bg-rose-400/25 text-rose-100 shadow-rose-400/25'
                        : lane === 2 ? 'scale-95 border-emerald-300 bg-emerald-400/25 text-emerald-100 shadow-emerald-400/25'
                          : 'scale-95 border-amber-300 bg-amber-400/25 text-amber-100 shadow-amber-400/25'
                    : lane === 0 ? 'border-cyan-200/20 bg-[#10182a]/85 text-cyan-100/70 hover:border-cyan-200/50'
                      : lane === 1 ? 'border-rose-200/20 bg-[#10182a]/85 text-rose-100/70 hover:border-rose-200/50'
                        : lane === 2 ? 'border-emerald-200/20 bg-[#10182a]/85 text-emerald-100/70 hover:border-emerald-200/50'
                          : 'border-amber-200/20 bg-[#10182a]/85 text-amber-100/70 hover:border-amber-200/50'
                    }`}
                  style={{ left: `${lane * 25 + 12.5}%`, WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="mr-1.5 hidden sm:inline">LAJUR</span>{['A', 'B', 'C', 'D'][lane]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-10 items-center justify-center border-t border-white/[0.07] bg-[#080d18]/85 px-3 py-2 text-center">
            <p className={`text-[10px] font-bold sm:text-xs ${feedback.includes('terlewat') || feedback.includes('pas') ? 'text-rose-200' : 'text-slate-300'}`}>{feedback}</p>
          </div>
        </section>

        <footer className="flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[9px] font-semibold text-slate-400 sm:text-xs">
            <Keyboard className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            <span className="truncate">Ketuk lajur atau tekan A • B • C • D</span>
          </div>
          {gameState === 'PLAYING' && (
            <button
              type="button"
              onClick={() => {
                if (stateRef.current.state !== 'PLAYING') return;
                stateRef.current.state = 'GAMEOVER';
                setGameState('GAMEOVER');
                onGameOver(stateRef.current.score);
              }}
              className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/10 sm:px-4 sm:text-[10px]"
            >
              Selesai
            </button>
          )}
        </footer>
      </div>

      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030712]/75 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#11182a]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-cyan-100/20 bg-gradient-to-br from-cyan-200 to-sky-400 text-[#082332] shadow-[0_12px_32px_rgba(34,211,238,0.22)]">
                  <Headphones className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-100/10 bg-cyan-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Beat Bounce</h2>
                <p className="mx-auto mt-2 max-w-[340px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  Ikuti irama, tekan lajur yang tepat, dan pertahankan kombo untuk memperpanjang permainan.
                </p>

                <div className="my-5 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Clock3 className="mx-auto mb-1.5 h-5 w-5 text-amber-200" aria-hidden="true" />
                    <div className="text-[11px] font-black text-amber-100 sm:text-xs">40 DETIK</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Waktu awal</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Gamepad2 className="mx-auto mb-1.5 h-5 w-5 text-cyan-200" aria-hidden="true" />
                    <div className="text-[11px] font-black text-cyan-100 sm:text-xs">4 LAJUR</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Sentuh / klik</div>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-1.5 py-3 sm:px-2">
                    <Zap className="mx-auto mb-1.5 h-5 w-5 text-fuchsia-200" aria-hidden="true" />
                    <div className="text-[11px] font-black text-fuchsia-100 sm:text-xs">+2 DETIK</div>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Setiap 5 kombo</div>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left">
                  <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-white">
                    <Keyboard className="h-4 w-4 text-cyan-200" aria-hidden="true" /> Cara bermain
                  </div>
                  <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5">
                    Ketuk tombol <b className="text-cyan-200">A, B, C, atau D</b> saat nada melintasi zona ketuk di bagian bawah jalurnya. Ketukan meleset mengurangi 2 detik; nada yang terlewat memutus kombo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#082332] shadow-[0_10px_26px_rgba(34,211,238,0.18)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Mulai bermain <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                  Kembali ke menu
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030712]/80 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[420px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#11182a]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-amber-100/20 bg-gradient-to-br from-amber-200/25 to-fuchsia-400/10 text-amber-200 shadow-[0_12px_32px_rgba(251,191,36,0.16)]">
                  <Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" />
                </div>
                <div className="mb-2 inline-flex rounded-full border border-amber-100/10 bg-amber-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-amber-200">Sesi selesai</div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Beat selesai!</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">Bagus! Coba lagi untuk menjaga irama lebih lama dan membangun kombo yang lebih tinggi.</p>

                <div className="my-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-4">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/60">Skor akhir</div>
                    <div className="mt-1 text-3xl font-black tabular-nums text-cyan-100">{score}</div>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] px-3 py-4">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-fuchsia-100/60">Kombo akhir</div>
                    <div className="mt-1 text-3xl font-black tabular-nums text-fuchsia-100">{combo}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGame}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-200 to-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#082332] shadow-[0_10px_26px_rgba(34,211,238,0.18)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Main lagi <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                  Kembali ke menu
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
