import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ArrowRight, Clock3, Dumbbell, Flame, HeartPulse, Sparkles, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const questionsDB = [
  { question: "Sumber protein terbaik untuk pembentukan otot adalah?", options: ["Dada Ayam", "Nasi Putih", "Keripik Kentang", "Gula Pasir"], answer: 0 },
  { question: "Berapa anjuran minimal minum air putih harian untuk orang dewasa?", options: ["1 Liter", "2 Liter", "500 ml", "4 Liter"], answer: 1 },
  { question: "Olahraga kardiovaskular sangat baik untuk melatih organ apa?", options: ["Paru-paru & Jantung", "Otot Bicep", "Tulang Kering", "Mata"], answer: 0 },
  { question: "Kapan waktu terbaik mengonsumsi karbohidrat kompleks?", options: ["Sebelum tidur", "Sebelum olahraga", "Saat menonton TV", "Tengah malam"], answer: 1 },
  { question: "Nutrisi makro apa yang berfungsi sebagai sumber energi utama tubuh?", options: ["Protein", "Vitamin", "Karbohidrat", "Mineral"], answer: 2 },
  { question: "Sayuran berwarna hijau gelap biasanya kaya akan mineral apa?", options: ["Zat Besi", "Natrium", "Gula", "Lemak Trans"], answer: 0 },
  { question: "Berapa jam waktu tidur ideal untuk pemulihan otot mahasiswa?", options: ["3-4 jam", "5-6 jam", "7-9 jam", "10-12 jam"], answer: 2 },
  { question: "Contoh lemak sehat (HDL) bisa didapatkan dari makanan?", options: ["Gorengan", "Alpukat", "Mie Instan", "Mentega"], answer: 1 },
  { question: "Aktivitas pemanasan sebelum olahraga bertujuan untuk?", options: ["Membakar otot", "Mencegah cedera", "Mendinginkan tubuh", "Menghemat waktu"], answer: 1 },
  { question: "Vitamin apa yang paling banyak dihasilkan tubuh saat terkena sinar matahari pagi?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], answer: 3 },
  { question: "Diet yang sehat sebaiknya?", options: ["Tidak makan sama sekali", "Hanya makan daging", "Seimbang dan bervariasi", "Hanya minum air"], answer: 2 },
  { question: "Membakar lemak paling efektif dengan kombinasi latihan?", options: ["Tidur & Makan", "Kardio & Angkat Beban", "Peregangan saja", "Nonton & Ngemil"], answer: 1 },
  { question: "Minuman mana yang paling baik dikonsumsi setelah olahraga berat?", options: ["Soda", "Kopi", "Air Putih / Elektrolit", "Boba"], answer: 2 },
  { question: "Apa efek terlalu banyak mengonsumsi gula olahan?", options: ["Otot membesar", "Peningkatan berat badan (lemak)", "Mata lebih sehat", "Tulang kuat"], answer: 1 },
  { question: "Cara terbaik mengukur kemajuan program kebugaran adalah?", options: ["Timbang berat setiap jam", "Melihat perubahan komposisi tubuh", "Hanya melihat skala timbangan", "Berhenti makan sehari"], answer: 1 }
];

export default function NgolabFitnessQuiz({ onGameOver, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shakeTimer, setShakeTimer] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('GAMEOVER');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > 0) {
      onGameOver(score);
    }
  }, [gameState]);

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentIndex(0);
    
    // shuffle questions
    const shuffledQs = [...questionsDB].sort(() => Math.random() - 0.5).map(q => {
      // shuffle options and track correct answer
      let opts = q.options.map((text, i) => ({ text, isCorrect: i === q.answer }));
      opts.sort(() => Math.random() - 0.5);
      return { ...q, options: opts };
    });
    
    setQuestions(shuffledQs);
    setGameState('PLAYING');
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 10);
    } else {
      setTimeLeft(t => Math.max(0, t - 3));
      setShakeTimer(true);
      setTimeout(() => setShakeTimer(false), 300);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setGameState('GAMEOVER');
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#08131a] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(ellipse_at_90%_85%,rgba(132,204,22,0.14),transparent_34%),linear-gradient(180deg,#0b1b20_0%,#08131a_66%,#0b151b_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage: 'linear-gradient(rgba(167, 243, 208, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 243, 208, 0.2) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />
      <div className="pointer-events-none absolute -left-28 top-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-lime-400/10 blur-[100px]" />

      {gameState === 'PLAYING' && currentQ && (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <header className="mx-auto flex w-full max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#10231f]/80 px-3 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:rounded-[22px] sm:px-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-200 to-lime-300 text-[#123322] shadow-[0_6px_18px_rgba(74,222,128,0.18)]">
                <Dumbbell className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-emerald-200/80">Ngolab Arcade</div>
                <div className="mt-0.5 text-sm font-black tracking-wide text-white sm:text-base">FITNESS QUIZ</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:min-w-[330px] md:max-w-[420px] md:flex-1">
              <div className={`rounded-2xl border px-3 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-4 sm:py-2.5 ${shakeTimer ? 'border-rose-300/35 bg-rose-950/50' : 'border-orange-200/15 bg-[#171f25]/85'}`}>
                <div className={`flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em] sm:text-[9px] ${shakeTimer ? 'text-rose-200' : 'text-orange-200/75'}`}>
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Waktu tersisa
                </div>
                <div className={`mt-0.5 text-lg font-black tabular-nums sm:text-xl ${shakeTimer || timeLeft <= 10 ? 'animate-pulse text-rose-300' : 'text-white'}`}>
                  {timeLeft}<span className="ml-1 text-[9px] font-bold text-slate-400">dtk</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${timeLeft <= 10 ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-300 to-lime-300'}`} style={{ width: `${Math.max(0, (timeLeft / 60) * 100)}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200/15 bg-[#171f25]/85 px-3 py-2 shadow-lg backdrop-blur-xl sm:rounded-[20px] sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.15em] text-emerald-200/75 sm:text-[9px]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Skor
                </div>
                <div className="mt-0.5 text-lg font-black tabular-nums text-emerald-100 sm:text-xl">{score}<span className="ml-1 text-[9px] font-bold text-slate-400">poin</span></div>
              </div>
            </div>
          </header>

          <div className="mx-auto mt-3 flex w-full max-w-5xl items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#10201f]/65 px-3 py-2.5 backdrop-blur-xl sm:mt-4 sm:rounded-[20px] sm:px-4">
            <div className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-300 sm:text-xs">
              <span className="text-emerald-200">{currentIndex + 1}</span><span className="mx-1 text-slate-500">/</span>{questions.length}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-lime-300 transition-[width] duration-500" style={{ width: `${((currentIndex + 1) / Math.max(questions.length, 1)) * 100}%` }} />
            </div>
            <div className="shrink-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">PERTANYAAN</div>
          </div>

          <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-4 sm:py-6">
            <section className="rounded-[26px] border border-white/10 bg-[#10201f]/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[32px] sm:p-7 md:p-9">
              <div className="mb-4 flex items-center justify-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-emerald-200/70 sm:mb-5 sm:text-[10px]">
                <HeartPulse className="h-4 w-4" aria-hidden="true" /> Gerak • Nutrisi • Kebiasaan Sehat
              </div>
              <h1 className="mx-auto max-w-3xl text-center text-xl font-black leading-snug tracking-tight text-white sm:text-2xl sm:leading-relaxed md:text-3xl">
                {currentQ.question}
              </h1>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:mt-7 sm:grid-cols-2 sm:gap-3">
                {currentQ.options.map((opt: any, i: number) => (
                  <motion.button
                    key={`${currentIndex}-${i}`}
                    type="button"
                    onClick={() => handleAnswer(opt.isCorrect)}
                    whileTap={{ scale: 0.985 }}
                    className="group flex min-h-[58px] items-center gap-3 rounded-2xl border border-white/10 bg-[#172a29]/80 p-3 text-left text-sm font-bold text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition hover:border-emerald-200/40 hover:bg-emerald-300/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 sm:min-h-[68px] sm:rounded-[20px] sm:p-4 sm:text-base"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[10px] font-black text-emerald-200 transition group-hover:border-emerald-100/20 group-hover:bg-emerald-200/15 sm:h-9 sm:w-9 sm:text-xs">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 leading-snug">{opt.text}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-200" aria-hidden="true" />
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-500 sm:mt-5 sm:text-xs">
                <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> Jawaban benar +10 poin • jawaban salah mengurangi 3 detik
              </div>
            </section>
          </main>
        </div>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030b0c]/75 p-3 backdrop-blur-md sm:p-6"
          >
            <motion.section
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative my-auto max-h-full w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[#10211f]/95 p-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:rounded-[32px] sm:p-7"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-lime-400/10 blur-3xl" />

              {gameState === 'START' ? (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-emerald-100/20 bg-gradient-to-br from-emerald-200 to-lime-300 text-[#123322] shadow-[0_12px_32px_rgba(74,222,128,0.2)]">
                    <Dumbbell className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100/10 bg-emerald-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-emerald-200">
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" /> Ngolab Arcade
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Fitness Quiz</h1>
                  <p className="mx-auto mt-2 max-w-[350px] text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                    Uji pengetahuanmu tentang olahraga, nutrisi, dan kebiasaan sehat. Jawab sebanyak mungkin sebelum waktu habis!
                  </p>

                  <div className="my-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl border border-orange-200/10 bg-orange-300/[0.07] px-1.5 py-3 sm:px-2">
                      <Clock3 className="mx-auto mb-1.5 h-5 w-5 text-orange-200" aria-hidden="true" />
                      <div className="text-[11px] font-black text-orange-100 sm:text-xs">60 DETIK</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Waktu main</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/[0.06] px-1.5 py-3 sm:px-2">
                      <HeartPulse className="mx-auto mb-1.5 h-5 w-5 text-emerald-200" aria-hidden="true" />
                      <div className="text-[11px] font-black text-emerald-100 sm:text-xs">15 SOAL</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Topik kebugaran</div>
                    </div>
                    <div className="rounded-2xl border border-lime-200/10 bg-lime-300/[0.06] px-1.5 py-3 sm:px-2">
                      <Flame className="mx-auto mb-1.5 h-5 w-5 text-lime-200" aria-hidden="true" />
                      <div className="text-[11px] font-black text-lime-100 sm:text-xs">+10 POIN</div>
                      <div className="mt-1 text-[9px] font-semibold text-slate-400">Jawaban benar</div>
                    </div>
                  </div>

                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-left">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-300/10 text-rose-200">
                      <Zap className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="text-[10px] leading-4 text-slate-300 sm:text-xs sm:leading-5">
                      Pilih satu jawaban. Jawaban salah mengurangi waktu <span className="font-bold text-rose-200">3 detik</span>, jadi pikir cepat dan tetap fokus!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={initGame}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-200 to-lime-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#123322] shadow-[0_10px_26px_rgba(74,222,128,0.18)] transition hover:brightness-105 active:scale-[0.98]"
                  >
                    Mulai kuis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={onExit} className="mt-2 h-10 w-full rounded-xl text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
                    Kembali ke menu
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-amber-100/20 bg-gradient-to-br from-amber-200/25 to-lime-300/10 text-amber-200 shadow-[0_12px_32px_rgba(251,191,36,0.16)]">
                    <Trophy className="h-9 w-9" strokeWidth={2.3} aria-hidden="true" />
                  </div>
                  <div className="mb-2 inline-flex rounded-full border border-amber-100/10 bg-amber-200/[0.07] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-amber-200">Sesi latihan selesai</div>
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Kuis selesai!</h1>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Terus latih pengetahuan kebugaranmu dan coba pecahkan skor terbaikmu.</p>

                  <div className="my-5 rounded-[24px] border border-emerald-200/10 bg-gradient-to-br from-emerald-300/[0.09] to-lime-400/[0.04] px-5 py-5">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-emerald-100/60">Skor akhir</div>
                    <div className="mt-1 text-5xl font-black tabular-nums tracking-tight text-emerald-100">{score}</div>
                    <div className="mt-2 text-[10px] font-semibold text-slate-400">Jawaban benar: {score / 10} dari {questions.length || questionsDB.length}</div>
                  </div>

                  <button
                    type="button"
                    onClick={initGame}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-200 to-lime-300 px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#123322] shadow-[0_10px_26px_rgba(74,222,128,0.18)] transition hover:brightness-105 active:scale-[0.98]"
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
  );
}
