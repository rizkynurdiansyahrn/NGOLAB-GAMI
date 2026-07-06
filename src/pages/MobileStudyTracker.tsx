import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Laptop,
  Play,
  Pause,
  X,
  AlertTriangle,
  Bell,
  Clock,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { AppUser } from "../data/appData";

interface MobileStudyTrackerProps {
  userId: string | null;
  user: AppUser;
  onRefreshUser?: () => void;
}

type SessionState = "idle" | "studying" | "finished" | "failed";
type PetState = "idle" | "studying" | "anxious" | "sleeping" | "happy";

const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
const CHECK_TIME_LIMIT = 5; // 5 seconds to respond

const petStateTranslation: Record<PetState, string> = {
  idle: "Santai",
  studying: "Belajar",
  anxious: "Cemas",
  sleeping: "Tidur",
  happy: "Senang"
};

export default function MobileStudyTracker({ userId, user, onRefreshUser }: MobileStudyTrackerProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isActive, setIsActive] = useState(false);
  const [petState, setPetState] = useState<PetState>("idle");
  const [history, setHistory] = useState<any[]>([]);

  const fetchStudySessions = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/study-sessions`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setHistory(data);
          return;
        }
      }
      throw new Error("Invalid format");
    } catch (e) {
      console.warn("Gagal memuat riwayat belajar dari server, menggunakan fallback data lokal:", e);
      const stored = localStorage.getItem(`study_history_${userId}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        const defaultHistory = [
          {
            id: "hist-1",
            created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            duration: 25,
            notes: "Mempelajari fundamental React Hooks dan state management.",
            points: 150
          },
          {
            id: "hist-2",
            created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
            duration: 25,
            notes: "Menyelesaikan styling halaman dashboard menggunakan TailwindCSS.",
            points: 120
          }
        ];
        setHistory(defaultHistory);
        localStorage.setItem(`study_history_${userId}`, JSON.stringify(defaultHistory));
      }
    }
  };

  useEffect(() => {
    fetchStudySessions();
  }, [userId]);

  // Anti-cheat state
  const [isCheckActive, setIsCheckActive] = useState(false);
  const [checkTimeLeft, setCheckTimeLeft] = useState(CHECK_TIME_LIMIT);
  const lastActivityTimeRef = useRef<number>(Date.now());

  const [summaryNotes, setSummaryNotes] = useState("");
  const [earnedPoints, setEarnedPoints] = useState(0);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startSession = () => {
    setSessionState("studying");
    setTimeLeft(POMODORO_TIME);
    setIsActive(true);
    setPetState("studying");
    lastActivityTimeRef.current = Date.now();
  };

  // Activity tracking for AFK
  useEffect(() => {
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("touchmove", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, []);

  const failSession = () => {
    setIsActive(false);
    setIsCheckActive(false);
    setSessionState("idle");
    setPetState("idle");
    setTimeLeft(POMODORO_TIME);
    setSummaryNotes("");
    setEarnedPoints(0);
  };

  const finishSession = async () => {
    setIsActive(false);
    setIsCheckActive(false);

    // Calculate points based on summary length
    const words = summaryNotes
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    // Base 50 points + 5 points per word, max 300 points
    const calculatedPoints = 50 + Math.min(words * 5, 250);
    setEarnedPoints(calculatedPoints);

    setSessionState("finished");
    setPetState("happy");

    if (userId) {
      try {
        // 1. Post to study-sessions
        await fetch(`https://geasture.kolab.top/api/users/${userId}/study-sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: summaryNotes || "Fokus Belajar Pomodoro",
            duration: 25,
            points: calculatedPoints,
            coins: calculatedPoints
          })
        });

        // 2. Add coins to user balance
        await fetch(`https://geasture.kolab.top/api/users/${userId}/earn-coins`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: calculatedPoints,
            description: "Menang Sesi Belajar Gami-Study"
          })
        });

        if (onRefreshUser) onRefreshUser();
        fetchStudySessions();
      } catch (err) {
        console.error("Gagal mengirim sesi belajar atau menambahkan koin ke server:", err);
        const newSession = {
          id: "hist-mock-" + Date.now(),
          created_at: new Date().toISOString(),
          duration: 25,
          notes: summaryNotes || "Fokus Belajar Pomodoro",
          points: calculatedPoints
        };
        const updatedHistory = [newSession, ...history];
        setHistory(updatedHistory);
        localStorage.setItem(`study_history_${userId}`, JSON.stringify(updatedHistory));
        if (onRefreshUser) onRefreshUser();
      }
    }
  };

  // Main Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;

          // Trigger AFK alarm if inactive for 1 minute
          if (!isCheckActive && sessionState === "studying") {
            const idleTime = Date.now() - lastActivityTimeRef.current;
            if (idleTime >= 60000) {
              setIsCheckActive(true);
              setCheckTimeLeft(CHECK_TIME_LIMIT);
              setPetState("anxious");
              // Play notification sound
              try {
                const audio = new Audio(
                  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
                );
                audio.play();
              } catch (e) {}
            }
          }

          if (newTime <= 0) {
            finishSession();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isCheckActive, sessionState]);

  // Random Check Timer Effect
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    if (isCheckActive && checkTimeLeft > 0) {
      checkInterval = setInterval(() => {
        setCheckTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            failSession();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isCheckActive, checkTimeLeft]);

  const handleImStillWorking = () => {
    setIsCheckActive(false);
    setPetState("studying");
    lastActivityTimeRef.current = Date.now();
  };

  // --- Rendering Helpers ---

  const renderPet = () => {
    const petVariants = {
      idle: { y: [0, -5, 0], transition: { repeat: Infinity, duration: 2 } },
      studying: {
        y: [0, -2, 0],
        scale: [1, 1.05, 1],
        transition: { repeat: Infinity, duration: 1 },
      },
      anxious: {
        x: [-5, 5, -5, 5, 0],
        transition: { repeat: Infinity, duration: 0.5 },
      },
      sleeping: { opacity: 0.7, scale: 0.95 },
      happy: {
        y: [0, -20, 0],
        rotate: [0, 10, -10, 0],
        transition: { repeat: Infinity, duration: 1.5 },
      },
    };

    const petFace = {
      idle: "₍^. .^₎",
      studying: "₍^•ﻌ•^₎✍",
      anxious: "₍^;﹏;^₎",
      sleeping: "₍^ - -^₎zZ",
      happy: "₍^>ヮ<^₎🎉",
    };

    return (
      <motion.div
        variants={petVariants}
        animate={petState}
        className="w-40 h-40 bg-white border-4 border-gray-100 rounded-full flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-6 mx-auto"
      >
        <span className="text-4xl text-[#FF6B00] mb-2">
          {petFace[petState]}
        </span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {petStateTranslation[petState]}
        </span>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 w-full relative overflow-y-auto custom-scrollbar p-6 pt-10 font-sans pb-32 bg-[#FAF9F6] min-h-full">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-[#FF6B00]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] mb-1">
          Gami-Study
        </h2>
        <p className="text-[#1A1A1A]/60 text-sm font-semibold tracking-wide">
          Tetap Fokus, Dapatkan Poin
        </p>
      </div>

      <AnimatePresence mode="wait">
        {sessionState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6 max-w-lg mx-auto"
          >
            <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-100 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Laptop className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-xl text-[#1A1A1A] mb-2">
                Sesi Fokus 25 Menit
              </h3>
              <p className="text-[#1A1A1A]/70 text-sm font-medium mb-8 leading-relaxed max-w-xs">
                Mulai belajar, coding, atau membaca tugasmu. Kamu bebas membuka
                aplikasi apapun, tetapi pastikan merespons Random Focus Check!
              </p>

              {renderPet()}

              <button
                onClick={startSession}
                className="w-full h-16 rounded-2xl bg-[#FF6B00] text-black font-extrabold text-lg uppercase tracking-wider shadow-[0_4px_20px_rgba(255,107,0,0.4)] hover:shadow-[0_4px_30px_rgba(255,107,0,0.6)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-6 h-6 fill-current" /> Mulai Belajar!
              </button>
            </div>
          </motion.div>
        )}

        {(sessionState === "studying" ||
          sessionState === "finished" ||
          sessionState === "failed") && (
          <motion.div
            key="studying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center relative z-10 max-w-lg mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gray-200 shadow-sm mb-8 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
              />
              <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest">
                Sesi Berjalan bebas AFK Check
              </span>
            </div>

            {renderPet()}

            <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full text-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100">
                <motion.div
                  className="h-full bg-[#FF6B00]"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / POMODORO_TIME) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>

              <h1 className="text-6xl font-black text-[#1A1A1A] tracking-tighter mb-2 font-mono">
                {formatTime(timeLeft)}
              </h1>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
                Tersisa
              </p>

              {sessionState === "finished" && (
                <div className="bg-green-50 text-green-600 rounded-xl p-4 mb-6 text-sm font-bold flex items-center justify-center gap-2">
                  Selesai! +{earnedPoints} Gami Poin
                </div>
              )}

              {sessionState === "failed" && (
                <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 text-sm font-bold flex items-center justify-center gap-2">
                  <X className="w-5 h-5" /> Gagal. Jangan Lupa Kembali!
                </div>
              )}

              {(sessionState === "studying" || sessionState === "finished") && (
                <div className="mb-6 w-full text-left">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">
                    Catatan / Rangkuman Belajar
                  </label>
                  <textarea
                    readOnly={sessionState === "finished"}
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    placeholder={
                      sessionState === "studying"
                        ? "Makin bagus dan lengkap rangkumanmu, makin tinggi poin yang ditambahkan saat selesai lho!"
                        : "Kamu tidak menulis rangkuman apapun."
                    }
                    className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors resize-none custom-scrollbar"
                  />
                  {sessionState === "studying" && (
                    <p className="text-[10px] text-gray-400 font-bold px-2 mt-2 text-right">
                      {
                        summaryNotes
                          .trim()
                          .split(/\s+/)
                          .filter((w) => w.length > 0).length
                      }{" "}
                      Kata
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4 relative z-50">
                {sessionState === "studying" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      aria-label={isActive ? "Pause study session" : "Resume study session"}
                      title={isActive ? "Pause study session" : "Resume study session"}
                      className="w-14 h-14 rounded-full bg-gray-100 text-[#1A1A1A] flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      {isActive ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      aria-label="Cancel study session"
                      title="Cancel study session"
                      className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </>
                )}
                {(sessionState === "finished" || sessionState === "failed") && (
                  <button
                    onClick={() => {
                      setSessionState("idle");
                      setPetState("idle");
                      setTimeLeft(POMODORO_TIME);
                      setSummaryNotes("");
                      setEarnedPoints(0);
                    }}
                    className="flex-1 bg-[#1A1A1A] text-white h-14 rounded-2xl font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" /> Mulai Baru
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riwayat Sesi Belajar */}
      {sessionState === "idle" && (
        <div className="max-w-lg mx-auto mt-12 border-t border-gray-200 pt-8 relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-[#FF6B00]" />
            <h3 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
              Riwayat Sesi Belajar
            </h3>
          </div>
          
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 font-medium border border-gray-100 shadow-sm">
              Belum ada riwayat belajar. Mulai sesi pertamamu untuk mengumpulkan koin!
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h, index) => (
                <motion.div
                  key={h.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {h.created_at ? new Date(h.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Sesi Belajar"}
                      </span>
                      <h4 className="font-bold text-sm text-[#1A1A1A] mt-0.5">
                        Fokus {h.duration ?? 25} Menit
                      </h4>
                    </div>
                    <span className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs font-black px-2.5 py-1 rounded-xl shrink-0">
                      +{h.points ?? h.coins ?? 100} PT
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {h.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-xs text-center shadow-2xl relative overflow-hidden flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-xl text-[#1A1A1A] mb-2">
                Batalkan Sesi?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Progress kamu akan hilang dan Poin tidak akan didapat.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  Teruskan
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setIsActive(false);
                    setSessionState("idle");
                    setPetState("idle");
                    setTimeLeft(POMODORO_TIME);
                    setSummaryNotes("");
                    setEarnedPoints(0);
                  }}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-[0_4px_15px_rgba(239,68,68,0.4)]"
                >
                  Batalkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Random Focus Check Modal */}
      <AnimatePresence>
        {isCheckActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              {/* Pulsing Alert BG */}
              <div className="absolute inset-0 bg-[#FF6B00]/5 animate-pulse" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-red-50">
                  <Bell className="w-10 h-10 text-red-500 animate-[wiggle_1s_ease-in-out_infinite]" />
                </div>

                <h3 className="text-2xl font-black text-[#1A1A1A] mb-2 tracking-tight">
                  Apakah kamu di sana?
                </h3>
                <p className="text-sm text-gray-500 font-medium mb-6">
                  Klik tombol di bawah sebelum waktu habis untuk melanjutkan
                  sesi study kamu!
                </p>

                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-mono font-bold text-xl mb-8 border border-red-100">
                  <Clock className="w-5 h-5" /> 00:
                  {checkTimeLeft.toString().padStart(2, "0")}
                </div>

                <button
                  onClick={handleImStillWorking}
                  className="w-full h-16 rounded-2xl bg-[#FF6B00] text-black font-extrabold text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(255,107,0,0.4)] hover:shadow-[0_0_40px_rgba(255,107,0,0.6)] active:scale-95 transition-all text-center flex items-center justify-center"
                >
                  SAYA MASIH BELAJAR!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
