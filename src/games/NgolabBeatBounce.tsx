import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

type Note = { id: string; lane: number; y: number; active: boolean };

export default function NgolabBeatBounce({ onGameOver, onExit }: GameProps) {
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
      y: -60,
      active: true,
    });
  };

  useEffect(() => {
    const update = (dt: number) => {
      const state = stateRef.current;
      if (state.state !== 'PLAYING') return;
      const seconds = dt / 1000;
      state.spawnTimer += dt;
      if (state.spawnTimer > 850) {
        spawnNote();
        state.spawnTimer = 0;
      }
      state.notes = state.notes.filter((note) => {
        note.y += 240 * seconds; // Slightly increased speed for dynamic flow
        if (note.y > 520) {
          if (note.active) {
            state.combo = 0;
            setCombo(0);
            setFeedback('Ketukan terlewat!');
          }
          return false;
        }
        return true;
      });
      setNotes([...state.notes]);
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
      return () => clearInterval(timer);
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
    const hitLine = 440;
    const windowHeight = 85;
    let hit = false;
    for (const note of state.notes) {
      if (note.lane !== lane || !note.active) continue;
      const distance = Math.abs(note.y - hitLine);
      if (distance < windowHeight) {
        note.active = false;
        hit = true;
        const baseScore = 10 + Math.max(0, 30 - Math.floor(distance / 2.5));
        state.score += baseScore;
        state.combo += 1;
        setScore(state.score);
        setCombo(state.combo);

        const splashText = distance < 18 ? 'PERFECT' : distance < 40 ? 'AWESOME' : 'GOOD';
        setFeedback(distance < 18 ? 'Sempurna!' : distance < 40 ? 'Luar Biasa!' : 'Bagus!');

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
    <div className="relative min-h-screen overflow-hidden bg-[#050714] text-white font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(244,63,94,0.08),_transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-6">
        {/* Info panel */}
        <div className="w-full max-w-2xl rounded-3xl border border-white/5 bg-slate-950/70 p-4 shadow-xl shadow-slate-950/50 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">BEAT BOUNCE</h1>
              <p className="mt-1 text-xs text-slate-400">Tekuk lajur saat ketukan melintasi garis. Jaga kombo untuk bonus waktu.</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-300">
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">Skor: <span className="text-cyan-400 font-extrabold">{score}</span></div>
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">Kombo: <span className="text-pink-400 font-extrabold">{combo}</span></div>
              <div className="rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">Waktu: <span className="text-amber-400 font-extrabold">{timeLeft}s</span></div>
            </div>
          </div>
        </div>

        {/* Music Lane tracks container */}
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-500/10 bg-slate-950/90 shadow-2xl">
          {/* Subtle Grid overlay for rhythm vibe */}
          <div className="absolute inset-0 bg-[#070a1e] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Lane dividers */}
          <div className="absolute inset-y-0 left-[25%] w-px bg-white/5 pointer-events-none" />
          <div className="absolute inset-y-0 left-[50%] w-px bg-white/5 pointer-events-none" />
          <div className="absolute inset-y-0 left-[75%] w-px bg-white/5 pointer-events-none" />

          {/* Active Lane glows */}
          {activeLanes.map((active, idx) => (
            <div
              key={`lane-glow-${idx}`}
              className={`absolute inset-y-0 w-[25%] transition-opacity duration-100 pointer-events-none ${active ? 'opacity-25' : 'opacity-0'
                }`}
              style={{
                left: `${idx * 25}%`,
                background: `linear-gradient(to top, ${idx === 0 ? '#22d3ee' : idx === 1 ? '#f43f5e' : idx === 2 ? '#10b981' : '#f59e0b'
                  }33, transparent)`,
              }}
            />
          ))}

          {/* Play field */}
          <div className="relative h-[500px] w-full px-4">
            {/* Target Hit Line */}
            <div className="absolute top-[440px] inset-x-0 h-0.5 border-t border-dashed border-white/20 pointer-events-none" />
            <div className="absolute top-[438px] inset-x-0 h-1 bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-amber-500/10 blur-[1px] pointer-events-none" />

            {/* Notes */}
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={false}
                animate={{ top: `${note.y}px`, opacity: note.active ? 1 : 0 }}
                transition={{ duration: 0.05 }}
                className={`absolute -translate-x-1/2 w-[21%]`}
                style={{ left: note.lane === 0 ? '12.5%' : note.lane === 1 ? '37.5%' : note.lane === 2 ? '62.5%' : '87.5%' }}
              >
                {/* 3D-like glowing horizontal capsule note bar */}
                <div
                  className={`h-6 w-full rounded-full border border-white/40 shadow-lg ${note.lane === 0 ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-cyan-400/50' :
                    note.lane === 1 ? 'bg-gradient-to-r from-pink-400 to-rose-500 shadow-rose-400/50' :
                      note.lane === 2 ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-400/50' :
                        'bg-gradient-to-r from-amber-400 to-orange-500 shadow-orange-400/50'
                    }`}
                />
              </motion.div>
            ))}

            {/* Hit Splashes */}
            <AnimatePresence>
              {splashes.map((splash) => (
                <motion.div
                  key={splash.id}
                  initial={{ opacity: 1, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.35 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="absolute top-[420px] -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: splash.lane === 0 ? '12.5%' : splash.lane === 1 ? '37.5%' : splash.lane === 2 ? '62.5%' : '87.5%' }}
                >
                  <div
                    className="w-16 h-5 rounded-full border-2 blur-[1px]"
                    style={{ borderColor: splash.color, boxShadow: `0 0 12px ${splash.color}` }}
                  />
                  <span
                    className="text-[9px] font-black tracking-widest mt-1.5"
                    style={{ color: splash.color, textShadow: `0 0 6px ${splash.color}` }}
                  >
                    {splash.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Target Hit Buttons */}
            <div className="absolute top-[425px] inset-x-0 h-16 pointer-events-auto">
              {Array.from({ length: 4 }).map((_, lane) => (
                <button
                  key={lane}
                  onMouseDown={() => handleButtonPress(lane)}
                  onTouchStart={(e) => { e.preventDefault(); handleButtonPress(lane); }}
                  className={`absolute -translate-x-1/2 inline-flex h-11 w-[21%] items-center justify-center rounded-xl border transition-all duration-75 ${activeLanes[lane]
                    ? lane === 0 ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)] scale-95'
                      : lane === 1 ? 'bg-pink-500/20 border-pink-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-95'
                        : lane === 2 ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-95'
                          : 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-95'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                    } ${lane === 0 ? 'left-[12.5%]' : lane === 1 ? 'left-[37.5%]' : lane === 2 ? 'left-[62.5%]' : 'left-[87.5%]'}`}
                >
                  <span className={`text-xs font-black tracking-wider ${activeLanes[lane] ? 'text-white' : 'text-slate-500'}`}>
                    {['A', 'B', 'C', 'D'][lane]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback bar */}
          <div className="py-3 bg-slate-950/60 border-t border-white/5 text-center">
            <p className="text-xs font-semibold text-slate-300">{feedback}</p>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={gameState === 'PLAYING' ? () => { stateRef.current.state = 'GAMEOVER'; setGameState('GAMEOVER'); onGameOver(stateRef.current.score); } : startGame}
            className="w-full rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20 sm:w-auto px-8"
          >
            {gameState === 'PLAYING' ? 'Selesai' : 'Mulai Bermain'}
          </button>
          <button
            onClick={onExit}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] sm:w-auto px-6"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>

      {/* Game Over modal */}
      <AnimatePresence>
        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-[32px] border border-cyan-500/20 bg-slate-950 p-6 text-center shadow-2xl shadow-cyan-500/20">
              <h2 className="text-3xl font-black text-cyan-400 tracking-wider">LAGU SELESAI</h2>
              <div className="my-6 rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Skor Kamu</p>
                <p className="text-4xl font-extrabold text-white mt-1">{score}</p>
                <p className="text-[11px] text-slate-400 mt-2">Kombo Maksimal: <span className="text-white font-bold">{combo}</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={startGame}
                  className="w-full rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 transition-all hover:bg-cyan-400"
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
