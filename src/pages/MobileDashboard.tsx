import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Bell,
  Gift,
  ChevronRight,
  Trophy,
  Star,
  Gamepad2,
  Play,
} from "lucide-react";
import { AppUser } from "../data/appData";
import { dummyGames } from "../data/dummyData";

interface MobileDashboardProps {
  userId: string | null;
  user: AppUser;
  onPlay: (gameId: string) => void;
  onAvatarClick?: () => void;
  onRefreshUser?: () => void;
}

export default function MobileDashboard({
  userId,
  user,
  onPlay,
  onAvatarClick,
  onRefreshUser,
}: MobileDashboardProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMysteryReward, setShowMysteryReward] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topPlayer, setTopPlayer] = useState<{ name: string; points: number; avatar: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTopPlayer = async () => {
      try {
        const response = await fetch("https://geasture.kolab.top/api/users", { cache: 'no-store' });
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            let players = json.map((item: any, idx: number) => ({
              name: item.nama ?? item.name ?? "Anonym",
              points: Number(item.coin_balance ?? item.points ?? item.coins ?? 0),
              avatar: item.avatar_url ?? item.avatar ?? `https://picsum.photos/seed/${item.id}/100/100`
            }));

            // Merge current user
            const userIndex = players.findIndex(item => 
              item.name && user.name && 
              item.name.trim().toLowerCase() === user.name.trim().toLowerCase()
            );
            if (userIndex !== -1) {
              if (user.points > players[userIndex].points) {
                players[userIndex].points = user.points;
              }
            } else if (user.name) {
              players.push({
                name: user.name,
                points: user.points,
                avatar: user.avatar
              });
            }

            const sorted = players.sort((a, b) => b.points - a.points);
            if (isMounted) {
              setTopPlayer(sorted[0]);
            }
          }
        }
      } catch (e) {
        console.warn("Gagal mengambil top player dari server, menggunakan data default:", e);
        if (isMounted) {
          // If api fails, check user against the mock top player
          const defaultTop = {
            name: "ARCADE_MASTER",
            points: 25400,
            avatar: "https://i.pravatar.cc/150?u=1"
          };
          if (user.points >= defaultTop.points) {
            setTopPlayer({
              name: user.name,
              points: user.points,
              avatar: user.avatar
            });
          } else {
            setTopPlayer(defaultTop);
          }
        }
      }
    };
    fetchTopPlayer();
    return () => {
      isMounted = false;
    };
  }, [user.points, user.name, user.avatar]);

  const goalPoints = 2000;
  const progressPercent = Math.min(
    100,
    Math.floor((user.points / goalPoints) * 100),
  );

  return (
    <div id="div_saldo_poin" className="flex-1 w-full bg-transparent overflow-y-auto custom-scrollbar p-6 pt-12 font-sans pb-32">
      {/* Header Profile & Notifications */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-gray-400 text-sm mb-1 font-medium tracking-wide">
            Halo, {user.name.split(" ")[0]} 👋
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ayo bermain & menang!
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Toggle notifications"
            title="Toggle notifications"
            className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <Bell className="w-5 h-5 text-gray-200" />
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-gray-900"></span>
            </span>
          </button>
          <button
            id="btn_sidebar"
            type="button"
            onClick={onAvatarClick}
            aria-label="Open profile"
            title="Open profile"
            className="w-12 h-12 rounded-full border-2 border-[#FF6B00] p-0.5 overflow-hidden shadow-lg shadow-[#FF6B00]/20 transition-transform active:scale-95"
          >
            <img
              src={user.avatar}
              alt={`${user.name} avatar`}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-28 right-6 left-6 bg-gray-900/95 backdrop-blur-3xl border border-white/10 rounded-[28px] p-5 shadow-2xl z-50"
          >
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Notifikasi
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Misi Harian</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Mainkan 1 game lagi untuk membuka Kotak Misteri.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Voucher Akan Kedaluwarsa
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Voucher diskon 50% Anda kedaluwarsa besok!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Streak Box */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-[32px] p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/20 blur-2xl rounded-full"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-orange-500/10">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] text-orange-200/70 font-semibold mb-1 tracking-wide uppercase">
              Streak Harian
            </p>
            <h3 className="text-3xl font-bold text-white">
              {user.streak}{" "}
              <span className="text-base text-orange-200/60 font-medium">
                Hari
              </span>
            </h3>
          </div>
        </div>

        {/* Progress Box */}
        <div className="bg-gradient-to-br from-[#FF6B00]/10 to-orange-500/10 border border-[#FF6B00]/20 rounded-[32px] p-5 flex flex-col justify-between relative overflow-hidden lg:col-span-3">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF6B00]/20 blur-2xl rounded-full"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 flex items-center justify-center backdrop-blur-sm border border-[#FF6B00]/10">
              <Gift className="w-5 h-5 text-[#FF6B00]" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[11px] text-orange-200/70 font-semibold tracking-wide uppercase">
                Progres Target
              </p>
              <p className="text-xs font-bold text-white">{progressPercent}%</p>
            </div>
            <div className="w-full bg-black/50 rounded-full h-1.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-[#FF6B00] to-orange-400 h-1.5 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Reward Full Width Card */}
      {!isClaimed && (
        <motion.div
          onClick={() => setShowMysteryReward(true)}
          whileTap={{ scale: 0.98 }}
          className="mb-8 p-[1px] rounded-[32px] bg-gradient-to-r from-[#FF6B00] via-orange-500 to-[#FF6B00] cursor-pointer overflow-hidden shadow-[0_10px_30px_rgba(255,107,0,0.2)]"
        >
          <div className="bg-gray-900 rounded-[31px] p-5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/20 blur-[40px]" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-orange-500 flex items-center justify-center shadow-lg border border-white/20">
                <Gift className="w-7 h-7 text-black animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">
                  Misi Selesai!
                </h4>
                <p className="text-sm text-gray-400 font-medium">
                  Ketuk untuk membuka kotak misteri
                </p>
              </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Arcade Area */}
      <div className="mb-4 flex justify-between items-end">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Game Populer
        </h3>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-8 hide-scrollbar snap-x -mx-6 px-6 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:snap-none md:overflow-visible md:mx-0 md:px-0 md:pb-4">
        {dummyGames.map((game, idx) => (
          <motion.div
            key={game.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onPlay(game.id)}
            className="min-w-[260px] md:min-w-0 snap-center md:snap-align-none relative rounded-[32px] overflow-hidden bg-gray-900 shadow-xl border border-white/5 group lg:w-full"
          >
            <div className="h-48 w-full relative">
              <img
                src={game.thumbnail}
                alt={`${game.title} thumbnail`}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md text-[#FF6B00] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/10 shadow-sm">
                  {game.category}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <h4 className="text-lg font-bold text-white mb-3">
                  {game.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    {game.rating}
                  </div>
                  <div className="flex items-center gap-2 bg-[#FF6B00] text-black px-3 py-1.5 rounded-xl shadow-lg font-black text-xs">
                    <Play className="w-3 h-3 fill-black" />
                    Mainkan
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* NEW PROMO BANNER & LEADERBOARD SNIPPET */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 mt-4 md:mt-8">
        {/* Promo Banner */}
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#FF6B00] to-orange-400 p-6 flex flex-col justify-center items-start shadow-xl shadow-[#FF6B00]/20 min-h-[140px]">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute right-4 bottom-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <span className="bg-black/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 backdrop-blur-sm border border-white/10">
            Promo Spesial
          </span>
          <h3 className="font-extrabold text-2xl text-black tracking-tight mb-1">
            Poin Ganda!
          </h3>
          <p className="text-black/70 text-sm font-semibold mb-4">
            Main game puzzle hari ini.
          </p>
          <button
            type="button"
            onClick={() => onPlay("ngolab-memory")}
            className="bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-transform active:scale-95 cursor-pointer"
          >
            Mulai Main
          </button>
        </div>

        {/* Top Player Snippet */}
        <div className="bg-gray-900 rounded-[32px] p-5 border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-white font-bold text-lg tracking-tight">
              Top Player Hari Ini
            </h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-500/10 to-transparent p-4 rounded-2xl border border-yellow-500/20">
            <div className="relative w-12 h-12">
              <img
                src={topPlayer ? topPlayer.avatar : "https://i.pravatar.cc/150?u=a042581f4e29026024d"}
                alt="Top Player"
                className="w-full h-full rounded-full object-cover border-2 border-yellow-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-gray-900">
                #1
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold">{topPlayer ? topPlayer.name : "Rizky N."}</h4>
              <p className="text-yellow-500 text-xs font-semibold">
                {(topPlayer ? topPlayer.points : 15400).toLocaleString()} PT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mystery Reward Modal Pop-up */}
      <AnimatePresence>
        {showMysteryReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setShowMysteryReward(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 text-center shadow-2xl flex flex-col items-center"
            >
              <div className="absolute inset-0 rounded-[40px] border border-white/5 pointer-events-none" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-28 h-28 flex items-center justify-center mb-6"
              >
                <div className="absolute inset-0 bg-[#FF6B00]/30 rounded-full blur-xl" />
                <div className="relative w-24 h-24 bg-[#FF6B00]/20 backdrop-blur-xl rounded-full border border-[#FF6B00]/30 flex items-center justify-center">
                  <Gift className="w-12 h-12 text-[#FF6B00]" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">
                Kejutan!
              </h2>
              <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed">
                Kamu mendapatkan tambahan{" "}
                <span className="text-[#FF6B00] font-bold">500 Poin</span>{" "}
                untuk penukaran voucher!
              </p>

              <button
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  if (userId) {
                    try {
                      const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/earn-coins`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          amount: 500,
                          description: "Klaim Kotak Misteri Harian"
                        })
                      });
                      if (response.ok) {
                        alert("Berhasil mengklaim 500 koin!");
                      } else {
                        throw new Error("Gagal mengklaim koin ke server.");
                      }
                    } catch (e) {
                      console.warn("Gagal klaim koin ke server, melakukan simulasi lokal:", e);
                      user.points += 500;
                    }
                  } else {
                    user.points += 500;
                  }

                  if (onRefreshUser) onRefreshUser();
                  setShowMysteryReward(false);
                  setIsClaimed(true);
                  setIsLoading(false);
                }}
                className="w-full bg-white text-gray-900 font-bold tracking-wide text-sm rounded-2xl py-4 hover:bg-gray-100 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Mengklaim..." : "Klaim Sekarang"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
