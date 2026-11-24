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
  const milestones = [
    { icon: Flame, title: "Konsisten", detail: "Main 7 hari berturut-turut", progress: Math.min(7, user.streak), total: 7 },
    { icon: Star, title: "Kolektor poin", detail: "Kumpulkan 1.000 poin", progress: Math.min(1000, user.points), total: 1000 },
    { icon: Zap, title: "Naik level", detail: "Capai level 15", progress: Math.min(15, user.level), total: 15 },
  ];

  return (
    <div id="div_saldo_poin" className="relative isolate flex-1 w-full bg-[radial-gradient(ellipse_at_10%_0%,rgba(217,119,6,0.16),transparent_45%),radial-gradient(ellipse_at_90%_34%,rgba(217,119,6,0.06),transparent_50%),linear-gradient(180deg,#FAF9F6,#FAF9F6,#FAF9F6)] font-sans pb-28">
      {/* Orbs dekoratif melayang */}
      <motion.div aria-hidden="true" animate={{ y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -top-10 right-8 h-64 w-64 rounded-full bg-[#D97706]/10 blur-[80px]" />
      <motion.div aria-hidden="true" animate={{ y: [0, 16, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute top-1/3 -left-16 h-72 w-72 rounded-full bg-amber-300/10 blur-[90px]" />

      {/* Top Header Navigation Bar (Screenshot 3 Header) */}
      <HeaderNav
        breadcrumb="Dashboard Pemain"
        user={user}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Featured game banner */}
      <div className="relative isolate mb-7 w-full overflow-hidden rounded-[30px] border border-[#D97706]/30 bg-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.28),0_0_60px_rgba(217,119,6,0.18)] ring-1 ring-[#D97706]/20 sm:mb-8 sm:rounded-[36px]">
        <div className="min-h-[300px] sm:min-h-[360px] md:min-h-[400px] relative flex items-center p-6 sm:p-10 md:p-12 overflow-hidden">
          {/* Background image & overlays */}
          <img
            src={featuredGame.thumbnail}
            alt={featuredGame.title}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-65 transition-transform duration-700 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b18]/95 via-[#080b18]/75 to-[#080b18]/20" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#D97706]/30 blur-[100px] pointer-events-none" />
          <motion.div aria-hidden="true" animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute right-[12%] top-[16%] hidden h-24 w-24 rounded-[28px] border border-white/20 bg-white/10 shadow-[0_0_50px_rgba(255,112,35,0.3)] backdrop-blur-md lg:block">
            <div className="absolute inset-3 rounded-[20px] border border-[#E0D6C2]" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-orange-100" />
          </motion.div>

          {/* Banner Text */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="relative z-10 max-w-xl space-y-3.5 sm:space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/20 bg-orange-500/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-orange-100 shadow-md backdrop-blur-md sm:text-[10px]">
              <Sparkles className="h-3.5 w-3.5" /> PILIHAN BUAT KAMU
            </span>
            <p className="text-xs font-bold text-slate-300 sm:text-sm">Halo, {firstName}! Siap main?</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
              Saatnya bikin <span className="bg-gradient-to-r from-orange-300 via-[#D97706] to-amber-300 bg-clip-text text-transparent">rekor baru.</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Mulai dari <span className="font-extrabold text-white">{featuredGame.title}</span>, kumpulkan poin, dan teruskan streak bermainmu.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[9px] font-extrabold uppercase tracking-wide text-white/90 sm:gap-2.5 sm:text-[10px]">
              <span className="rounded-full border border-[#E0D6C2] bg-white/10 px-3 py-1.5 backdrop-blur">{featuredGame.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E0D6C2] bg-white/10 px-3 py-1.5 backdrop-blur"><Star className="h-3 w-3 fill-amber-300 text-amber-700" /> {featuredGame.rating.toFixed(1)} rating</span>
              <span className="rounded-full border border-[#E0D6C2] bg-white/10 px-3 py-1.5 backdrop-blur">Main tanpa unduh</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onPlay(featuredGame.id)}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] px-5 py-3 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_10px_28px_rgba(217,119,6,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(217,119,6,0.42)] active:scale-95 sm:px-6 sm:text-xs"
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
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8DFCE] bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-amber-500/15 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              POIN NGOLAB
            </span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-[#D97706] leading-tight">
              {user.pointsAvailable === false ? "—" : user.points.toLocaleString()}{" "}
              <span className="text-xs font-bold text-slate-500">PTS</span>
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
            className="group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#E8DFCE] bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#D97706]/15 p-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                PERINGKAT
              </span>
              <Trophy className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-[#D97706] leading-tight">
                {user.rank ? `#${user.rank}` : "—"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {user.rank ? "Peringkat pemain · lihat papan skor" : "Peringkat poin belum tersedia"}
              </p>
            </div>
          </button>
        ) : (
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8DFCE] bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-[#D97706]/15 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                PERINGKAT
              </span>
              <Trophy className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-[#D97706] leading-tight">
                {user.rank ? `#${user.rank}` : "—"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {user.rank ? "Peringkat pemain" : "Peringkat poin belum tersedia"}
              </p>
            </div>
          </div>
        )}

        {/* Stat 3: Game Dimainkan */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8DFCE] bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-indigo-500/15 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              GAME DIMAINKAN
            </span>
            <Gamepad2 className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black tabular-nums text-[#D97706] leading-tight">
              {user.gamesPlayed ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Minggu ini {user.gamesThisWeek ?? 0}
            </p>
          </div>
        </div>

        {/* Stat 4: Level XP & Streak */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8DFCE] bg-gradient-to-br from-[#FAF9F6] via-[#FAF9F6] to-rose-500/15 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] sm:p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              LEVEL {user.level}
            </span>
            <span className="text-[10px] font-extrabold tabular-nums text-slate-500">
              {user.exp}/{user.nextExp} XP
            </span>
          </div>
          <div>
            <div className="w-full bg-[#FBF9F6] rounded-full h-2 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-[#D97706] transition-[width] duration-500 ease-out" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <Flame className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
              <span>{user.streak} Hari Beruntun</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Game Populer Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3 px-0.5">
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#D97706]">PILIHAN ARCADE</p>
            <h2 className="text-lg font-black tracking-tight bg-gradient-to-r from-[#D97706] to-amber-500/100 bg-clip-text text-transparent sm:text-xl">Game populer</h2>
          </div>
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-black text-[#D97706] hover:underline flex items-center gap-0.5"
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
              className="group flex w-full overflow-hidden rounded-2xl border border-[#E8DFCE] bg-white text-left shadow-[0_14px_40px_rgba(15,23,42,0.10)] transition-shadow hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden bg-[#EFEAE2] sm:w-36">
                <img src={game.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                <span className="mb-1 w-fit rounded-full bg-[#D97706] px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-white shadow-sm sm:text-[8px]">Populer</span>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#D97706] sm:text-[9px]">{game.category}</p>
                <h3 className="mt-1 line-clamp-2 text-xs font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#D97706] sm:text-sm">{game.title}</h3>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {game.rating.toFixed(1)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[8px] font-black uppercase text-[#B45309] transition group-hover:bg-[#D97706] group-hover:text-white">Detail <ArrowUpRight className="h-3 w-3" /></span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Misi & Pencapaian */}
      <section className="mb-8 rounded-3xl border border-[#E8DFCE] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-[#D97706]" /> Misi &amp; Pencapaian
          </h3>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-[#B45309]">{milestones.filter((m) => m.progress >= m.total).length}/{milestones.length} selesai</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {milestones.map((m) => {
            const done = m.progress >= m.total;
            const pct = Math.min(100, Math.round((m.progress / m.total) * 100));
            return (
              <div key={m.title} className="rounded-2xl border border-[#F0EAE0] bg-[#FBF9F6] p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-[#D97706]"}`}>
                    <m.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800">{m.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{m.detail}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EFEAE2]">
                  <div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-[#D97706]"} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] font-bold text-slate-600">{done ? "Selesai" : `${m.progress.toLocaleString()} / ${m.total.toLocaleString()}`}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Game lainnya */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h3 className="text-base font-extrabold text-slate-900">Jelajahi game lainnya</h3>
          <button type="button" onClick={onSeeAll} className="flex items-center gap-0.5 text-xs font-black text-[#D97706] hover:underline">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {dummyGames.slice(3, 6).map((game) => (
            <button key={game.id} type="button" onClick={() => { if (onSelectDetail) onSelectDetail(game); else onPlay(game.id); }} className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-[#E8DFCE] bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D97706]/40 hover:shadow-lg">
              <img src={game.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-slate-800">{game.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {game.rating.toFixed(1)} · {game.category}</p>
              </div>
              <Play className="h-4 w-4 shrink-0 text-[#D97706]" />
            </button>
          ))}
        </div>
      </div>

      {/* Aksi cepat */}
      <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={onSeeAll} className="flex items-center justify-between gap-2 rounded-2xl border border-[#E8DFCE] bg-white p-4 text-left transition hover:border-[#D97706]/40 hover:bg-orange-50/40">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#D97706]"><Gamepad2 className="h-5 w-5" /></span><span><span className="block text-sm font-extrabold text-slate-800">Semua Game</span><span className="text-[11px] text-slate-500">Jelajahi 11 mini-game</span></span></span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
        <button type="button" onClick={onOpenLeaderboard} className="flex items-center justify-between gap-2 rounded-2xl border border-[#E8DFCE] bg-white p-4 text-left transition hover:border-[#D97706]/40 hover:bg-orange-50/40">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#D97706]"><Trophy className="h-5 w-5" /></span><span><span className="block text-sm font-extrabold text-slate-800">Leaderboard</span><span className="text-[11px] text-slate-500">Lihat papan skor kafe</span></span></span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
        <button type="button" onClick={onOpenProfile} className="flex items-center justify-between gap-2 rounded-2xl border border-[#E8DFCE] bg-white p-4 text-left transition hover:border-[#D97706]/40 hover:bg-orange-50/40">
          <span className="flex items-center gap-3"><img src={user.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" referrerPolicy="no-referrer" /><span><span className="block text-sm font-extrabold text-slate-800">Profil</span><span className="text-[11px] text-slate-500">Pantau progres akun</span></span></span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
