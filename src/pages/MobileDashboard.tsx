import React from "react";
import { motion } from "motion/react";
import {
  Flame,
  ChevronRight,
  Trophy,
  Star,
  Gamepad2,
  Play,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { AppUser } from "../data/appData";
import { dummyGames, Game } from "../data/dummyData";
import HeaderNav from "../components/HeaderNav";

interface MobileDashboardProps {
  userId: string | null;
  user: AppUser;
  onPlay: (gameId: string) => void;
  onSelectDetail?: (game: Game) => void;
  onOpenProfile?: () => void;
  onOpenLeaderboard?: () => void;
  onLogout?: () => void;
  onRefreshUser?: () => void;
  onSeeAll?: () => void;
}

export default function MobileDashboard({
  user,
  onPlay,
  onSelectDetail,
  onOpenProfile,
  onOpenLeaderboard,
  onLogout,
  onSeeAll,
}: MobileDashboardProps) {
  const popularGames = dummyGames.slice(0, 3);
  const featuredGame = dummyGames.find((game) => game.id === "ngolab-catch") || dummyGames[0];
  const firstName = user.name?.trim().split(/\s+/)[0] || "Gamer";
  const levelProgress = Math.min(100, Math.max(0, (user.exp / user.nextExp) * 100));

  return (
    <div id="div_saldo_poin" className="relative isolate flex-1 w-full bg-[radial-gradient(ellipse_at_10%_0%,rgba(255,85,0,0.07),transparent_30%),radial-gradient(ellipse_at_90%_34%,rgba(99,102,241,0.06),transparent_28%),#F3F4F8] font-sans pb-28">
      {/* Top Header Navigation Bar (Screenshot 3 Header) */}
      <HeaderNav
        breadcrumb="Dashboard Pemain"
        user={user}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Featured game banner */}
      <div className="relative isolate mb-7 w-full overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:mb-8 sm:rounded-[36px]">
        <div className="min-h-[300px] sm:min-h-[360px] md:min-h-[400px] relative flex items-center p-6 sm:p-10 md:p-12 overflow-hidden">
          {/* Background image & overlays */}
          <img
            src={featuredGame.thumbnail}
            alt={featuredGame.title}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-65 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b18]/95 via-[#080b18]/75 to-[#080b18]/20" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#FF5500]/30 blur-[100px] pointer-events-none" />
          <motion.div aria-hidden="true" animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute right-[12%] top-[16%] hidden h-24 w-24 rounded-[28px] border border-white/20 bg-white/10 shadow-[0_0_50px_rgba(255,112,35,0.3)] backdrop-blur-md lg:block">
            <div className="absolute inset-3 rounded-[20px] border border-white/15" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-orange-100" />
          </motion.div>

          {/* Banner Text */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="relative z-10 max-w-xl space-y-3.5 sm:space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/20 bg-orange-500/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-orange-100 shadow-md backdrop-blur-md sm:text-[10px]">
              <Sparkles className="h-3.5 w-3.5" /> PILIHAN BUAT KAMU
            </span>
            <p className="text-xs font-bold text-slate-300 sm:text-sm">Halo, {firstName}! Siap main?</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
              Saatnya bikin <span className="bg-gradient-to-r from-orange-300 via-[#FF5500] to-amber-300 bg-clip-text text-transparent">rekor baru.</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Mulai dari <span className="font-extrabold text-white">{featuredGame.title}</span>, kumpulkan poin, dan teruskan streak bermainmu.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[9px] font-extrabold uppercase tracking-wide text-white/90 sm:gap-2.5 sm:text-[10px]">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">{featuredGame.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur"><Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {featuredGame.rating.toFixed(1)} rating</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">Main tanpa unduh</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onPlay(featuredGame.id)}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF5500] to-orange-400 px-5 py-3 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_10px_28px_rgba(255,85,0,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(255,85,0,0.42)] active:scale-95 sm:px-6 sm:text-xs"
              >
                <Play className="h-4 w-4 fill-white transition-transform group-hover:translate-x-0.5" /> Main sekarang
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSelectDetail) onSelectDetail(featuredGame);
                  else onPlay(featuredGame.id);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-5 py-3 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white/[0.16] active:scale-95 sm:px-6 sm:text-xs"
              >
                Lihat detail <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 4 Stat Cards Grid (Screenshot 3) */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }} className="grid grid-cols-2 gap-3.5 mb-8 sm:gap-4 lg:grid-cols-4">
        {/* Stat 1: Poin Ngolab */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-amber-50 p-4 shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              POIN NGOLAB
            </span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {user.pointsAvailable === false ? "—" : user.points.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-400">PTS</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {user.pointsAvailable === false ? "Saldo poin belum tersedia" : "Saldo Loyalty Points"}
            </p>
          </div>
        </div>

        {/* Stat 2: Peringkat */}
        {onOpenLeaderboard ? (
          <button
            id="btn_stat_peringkat"
            type="button"
            onClick={onOpenLeaderboard}
            className="group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-orange-50 p-4 text-left shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                PERINGKAT
              </span>
              <Trophy className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {user.rank ? `#${user.rank}` : "—"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {user.rank ? "Peringkat pemain · lihat papan skor" : "Peringkat poin belum tersedia"}
              </p>
            </div>
          </button>
        ) : (
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-orange-50 p-4 shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                PERINGKAT
              </span>
              <Trophy className="w-5 h-5 text-[#FF5500]" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {user.rank ? `#${user.rank}` : "—"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {user.rank ? "Peringkat pemain" : "Peringkat poin belum tersedia"}
              </p>
            </div>
          </div>
        )}

        {/* Stat 3: Game Dimainkan */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-indigo-50 p-4 shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              GAME DIMAINKAN
            </span>
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {user.gamesPlayed ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Minggu ini {user.gamesThisWeek ?? 0}
            </p>
          </div>
        </div>

        {/* Stat 4: Level XP & Streak */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-white to-rose-50 p-4 shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              LEVEL {user.level}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500">
              {user.exp}/{user.nextExp} XP
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div className="bg-[#FF5500] h-full rounded-full" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
              <Flame className="w-4 h-4 text-[#FF5500] fill-[#FF5500]" />
              <span>{user.streak} Hari Beruntun</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Game Populer Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3 px-0.5">
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5500]">PILIHAN ARCADE</p>
            <h2 className="text-lg font-black text-slate-900 tracking-tight sm:text-xl">Game populer</h2>
          </div>
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-black text-[#FF5500] hover:underline flex items-center gap-0.5"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {popularGames.map((game, index) => (
            <motion.button
              key={game.id}
              type="button"
              onClick={() => {
                if (onSelectDetail) onSelectDetail(game);
                else onPlay(game.id);
              }}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.24, delay: index * 0.02 }}
              className="group flex w-full overflow-hidden rounded-2xl border border-white bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition-shadow hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden bg-slate-200 sm:w-36">
                <img src={game.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                <span className="absolute left-2 top-2 rounded-full bg-[#FF5500] px-2 py-1 text-[7px] font-black uppercase tracking-wide text-white shadow sm:text-[8px]">Populer</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#FF5500] sm:text-[9px]">{game.category}</p>
                <h3 className="mt-1 line-clamp-2 text-xs font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#FF5500] sm:text-sm">{game.title}</h3>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {game.rating.toFixed(1)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[8px] font-black uppercase text-[#E84D00] transition group-hover:bg-[#FF5500] group-hover:text-white">Detail <ArrowUpRight className="h-3 w-3" /></span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Zap className="h-5 w-5 text-[#FF5500]" /> Aktivitas Terakhir
          </h3>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Riwayat aktivitas akun belum tersedia.
          </p>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-[#FF5500]" /> Misi Harian
          </h3>
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Belum ada misi harian yang tersedia untuk akunmu.
          </p>
        </section>
      </div>
    </div>
  );
}
