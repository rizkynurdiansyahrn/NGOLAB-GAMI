import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Gift,
  ChevronRight,
  Trophy,
  Star,
  Gamepad2,
  Play,
  Zap,
  CheckCircle2,
  Users,
} from "lucide-react";
import { AppUser } from "../data/appData";
import { dummyGames, Game } from "../data/dummyData";
import HeaderNav from "../components/HeaderNav";

interface MobileDashboardProps {
  userId: string | null;
  user: AppUser;
  onPlay: (gameId: string) => void;
  onSelectDetail?: (game: Game) => void;
  onAvatarClick?: () => void;
  onRefreshUser?: () => void;
}

export default function MobileDashboard({
  userId,
  user,
  onPlay,
  onSelectDetail,
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
        const response = await fetch("https://geasture.kolab.top/api/users", { cache: "no-store" });
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            let players = json.map((item: any) => ({
              name: item.nama ?? item.name ?? "Anonym",
              points: Number(item.coin_balance ?? item.points ?? item.coins ?? 0),
              avatar: item.avatar_url ?? item.avatar ?? `https://picsum.photos/seed/${item.id}/100/100`,
            }));

            const userIndex = players.findIndex(
              (item) =>
                item.name &&
                user.name &&
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
                avatar: user.avatar,
              });
            }

            const sorted = players.sort((a, b) => b.points - a.points);
            if (isMounted) setTopPlayer(sorted[0]);
          }
        }
      } catch (e) {
        console.warn("Gagal mengambil top player:", e);
        if (isMounted) {
          setTopPlayer({
            name: "ARCADE_MASTER",
            points: 25400,
            avatar: "https://i.pravatar.cc/150?u=1",
          });
        }
      }
    };
    fetchTopPlayer();
    return () => {
      isMounted = false;
    };
  }, [user.points, user.name, user.avatar]);

  const popularGames = dummyGames.slice(0, 3);

  return (
    <div id="div_saldo_poin" className="flex-1 w-full bg-[#F3F4F8] font-sans pb-28">
      {/* Top Header Navigation Bar (Screenshot 3 Header) */}
      <HeaderNav
        breadcrumb="Dashboard Pemain"
        user={{
          name: user.name || "Budi Gamer",
          avatar: user.avatar || "https://i.pravatar.cc/150?u=budi_gamer",
          level: user.level || 12,
        }}
        onAvatarClick={onAvatarClick}
      />

      {/* Main Hero Banner: Cyber Campus Clash (Screenshot 3) */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 mb-6 shadow-xl border border-slate-200">
        <div className="h-64 sm:h-80 md:h-96 relative flex items-center p-6 sm:p-10 md:p-12 overflow-hidden">
          {/* Background image & overlays */}
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
            alt="Cyber Campus Clash Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#FF5500]/20 blur-[100px] rounded-full pointer-events-none" />

          {/* Banner Text */}
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-block bg-[#FF5500] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md shadow-md">
              BARU MINGGU INI
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Cyber Campus <span className="text-[#FF5500]">Clash</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Tantang teman sekampusmu dan dapatkan voucher makan gratis di kantin pusat!
            </p>
            <p className="text-[10px] sm:text-xs font-black text-[#FF5500] tracking-wider uppercase pt-1">
              THE ULTIMATE CAMPUS ESPORTS ARENA • JOIN THE LEAGUE
            </p>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => onPlay("ngolab-catch")}
                className="inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#FF6611] text-white font-extrabold text-xs uppercase px-6 py-3 rounded-full shadow-lg shadow-[#FF5500]/30 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>MAIN SEKARANG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const catchGame = dummyGames.find((g) => g.id === "ngolab-catch");
                  if (catchGame && onSelectDetail) onSelectDetail(catchGame);
                }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs uppercase px-5 py-3 rounded-full transition-all"
              >
                <span>DETAIL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid (Screenshot 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Stat 1: Poin Ngolab */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              POIN NGOLAB
            </span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {user.points || 858}{" "}
              <span className="text-xs font-bold text-slate-400">PTS</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Setara Rp {((user.points || 858) * 10).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stat 2: Peringkat */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              PERINGKAT
            </span>
            <Trophy className="w-5 h-5 text-[#FF5500]" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              #124{" "}
              <span className="text-xs font-bold text-emerald-600">+12</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Top 8% Kampus
            </p>
          </div>
        </div>

        {/* Stat 3: Game Dimainkan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              GAME DIMAINAN
            </span>
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              42
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Minggu ini 12
            </p>
          </div>
        </div>

        {/* Stat 4: Level XP & Streak */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              LEVEL {user.level || 12}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500">
              850/1200 XP
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div className="bg-[#FF5500] h-full w-[70%] rounded-full" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
              <Flame className="w-4 h-4 text-[#FF5500] fill-[#FF5500]" />
              <span>{user.streak || 5} Hari Beruntun!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Populer Section (Screenshot 3) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Game Populer
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Pilihan favorit pejuang skripsi minggu ini
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-black text-[#FF5500] hover:underline flex items-center gap-0.5"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularGames.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                if (onSelectDetail) onSelectDetail(game);
                else onPlay(game.id);
              }}
              className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
            >
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-[#FF5500] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-md">
                  POPULER
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#FF5500] transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    {game.category}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-slate-800">{game.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Bottom Section Grid (Screenshot 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Aktivitas Terakhir */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#FF5500]" />
            <h3 className="text-base font-extrabold text-slate-900">
              Aktivitas Terakhir
            </h3>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5500] flex items-center justify-center font-bold">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Bermain Ngolab Catch
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      2 jam yang lalu
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-[#FF5500] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  +25 PTS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Misi Harian & Referral */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#FF5500]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Misi Harian
                </h3>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800">Mainkan 3 Game</span>
                  <span className="text-[#FF5500]">10 Pts</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#FF5500] h-full w-[66%]" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800">Capai Skor 1500</span>
                  <span className="text-[#FF5500]">20 Pts</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#FF5500] h-full w-[40%]" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800">Undang Teman</span>
                  <span className="text-[#FF5500]">50 Pts</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#FF5500] h-full w-[100%]" />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors"
            >
              KLAIM SEMUA HADIAH
            </button>
          </div>

          {/* Undang Teman Promo Box */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-4 border border-orange-200 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5500] text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Undang Teman
                </h4>
                <p className="text-[10px] text-slate-500">
                  Dapatkan bonus 100 poin per referral
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#FF5500]" />
          </div>
        </div>
      </div>
    </div>
  );
}
