/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Landing page publik Ngolab Gami: halaman utama yang dilihat pengunjung
 * sebelum masuk. Berisi navbar, hero, showcase mini-games, highlight
 * Gami Study, info loyalty & rewards, dan footer. Seluruh CTA "main"
 * mengarahkan pengunjung ke halaman login/daftar agar progres, poin, dan
 * catatan belajar tersimpan di akun.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Coins,
  Gamepad2,
  Gift,
  Instagram,
  Menu,
  Music2,
  Play,
  Sparkles,
  Star,
  Trophy,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import { dummyGames, type Game } from "../data/dummyData";

type AuthTab = "login" | "register";

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "games", label: "Mini Games" },
  { id: "study", label: "Gami Study" },
  { id: "rewards", label: "Leaderboard/Rewards" },
];

/** Deskripsi singkat tiap game untuk kartu showcase di landing page. */
const GAME_DESCRIPTIONS: Record<string, string> = {
  "ngolab-catch":
    "Tangkap pesanan Ngolab yang berjatuhan sebelum terlambat disajikan. Uji refleksmu!",
  "ngolab-memory":
    "Cocokkan pasangan menu kafe secepat mungkin. Latih memori sambil ngopi!",
  "ngolab-burger":
    "Susun burger setinggi mungkin sebelum pelanggan kehabisan sabar.",
  "ngolab-traffic-escape":
    "Geser mobil untuk mengeluarkan diri dari kemacetan. Puzzle logika paling seru!",
  "ngolab-fitness-quiz":
    "Kuis gaya hidup sehat & fitness. Jawab benar, kumpulkan poin!",
  "ngolab-astro-drift":
    "Layangkan pesawat melintasi asteroid dan kumpulkan kristal energi.",
  "ngolab-beat-bounce":
    "Pantulkan bola mengikuti irama musik. Sinkron penuh atau game over!",
  "ngolab-neon-merge":
    "Gabungkan blok neon hingga mencapai target skor. Adiktifnya luar biasa!",
  "ngolab-glow-trail":
    "Ikuti jejak cahaya dan ulangi polanya. Semakin lama semakin sulit!",
  "ngolab-sky-swipe":
    "Geser dan hindari rintangan di langit. Santai tapi bikin nagih!",
  "ngolab-neon-slither":
    "Ular neon raksasa: makan, tumbuh, dan kuasai arena!",
};

const HERO_STATS = [
  { value: "11", label: "Mini-Game" },
  { value: "10", label: "Poin / Game" },
  { value: "50", label: "Poin / Hari" },
  { value: "100%", label: "Reward Kafe" },
];

const LOYALTY_STEPS = [
  {
    icon: Gamepad2,
    title: "Main Mini-Game",
    description:
      "Pilih game favoritmu di Ngolab Gami dan capai target skor. Setiap game punya target berbeda-beda.",
  },
  {
    icon: Coins,
    title: "Kumpulkan Poin",
    description:
      "Capai target skor untuk mendapat 10 poin per game. Maksimal 50 poin setiap hari, langsung tercatat otomatis.",
  },
  {
    icon: Gift,
    title: "Tukar Reward Kafe",
    description:
      "Tukarkan poin menjadi voucher F&B Ngolab: kopi, burger, dan menu favorit lainnya lewat program membership cafe.",
  },
];

const STUDY_FEATURES = [
  {
    icon: BookOpen,
    title: "Catatan pintar ala NotebookLM",
    description:
      "Susun materi kuliah, catatan kelas, dan rangkuman dalam satu notebook digital yang rapi.",
  },
  {
    icon: Sparkles,
    title: "Bantuan AI saat belajar",
    description:
      "Minta ringkasan, penjelasan konsep, atau kuis latihan langsung dari catatanmu sendiri.",
  },
  {
    icon: Trophy,
    title: "Tracking waktu belajar",
    description:
      "Pantau sesi belajarmu sambil nongkrong di cafe dan jaga streak belajar tetap hidup.",
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", icon: Instagram, href: "https://instagram.com/ngolab.gami" },
  { label: "TikTok", icon: Music2, href: "https://tiktok.com/@ngolab.gami" },
  { label: "X", icon: Twitter, href: "https://x.com/ngolabgami" },
  { label: "YouTube", icon: Youtube, href: "https://youtube.com/@ngolabgami" },
];

/** Badge gamified di kartu game — mengikuti aturan badge GameCard. */
function gameBadge(game: Game): { label: string; className: string } | null {
  const isHot = ["ngolab-catch", "ngolab-burger", "ngolab-neon-merge"].includes(game.id);
  const isNew = ["ngolab-astro-drift", "ngolab-glow-trail"].includes(game.id);
  if (isHot) {
    return {
      label: "HOT",
      className: "bg-gradient-to-r from-orange-600 to-[#FF5500]",
    };
  }
  if (isNew) {
    return {
      label: "BARU",
      className: "bg-gradient-to-r from-blue-600 to-indigo-600",
    };
  }
  if (game.isFeatured) {
    return { label: "POPULER", className: "bg-slate-900/80 backdrop-blur-md" };
  }
  return null;
}

export default function LandingPage({
  onOpenAuth,
}: {
  onOpenAuth: (tab: AuthTab) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Game unggulan tampil lebih dulu; sisanya mengikuti rating. */
  const orderedGames = useMemo(
    () =>
      [...dummyGames].sort(
        (a, b) =>
          Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
          b.rating - a.rating,
      ),
    [],
  );
  const visibleGames = showAllGames ? orderedGames : orderedGames.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F3F4F8] font-sans text-slate-900">
      {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
      <header
        id="navbar"
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/70"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <button
            id="nav_logo"
            type="button"
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2.5 group"
          >
            <span className="w-9 h-9 rounded-xl bg-[#FF5500] flex items-center justify-center shadow-md shadow-[#FF5500]/30 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5 text-white" />
            </span>
            <span className="text-left leading-none">
              <span className="block text-sm font-black tracking-wide text-slate-900">
                NGOLAB GAMI
              </span>
              <span className="block text-[9px] font-bold text-[#FF5500] tracking-[0.2em] uppercase mt-0.5">
                Play · Study · Earn
              </span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                id={`nav_${link.id}`}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-[#FF5500] hover:bg-[#FF5500]/5 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              id="btn_login"
              type="button"
              onClick={() => onOpenAuth("login")}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 bg-white hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
            >
              Login
            </button>
            <button
              id="btn_register"
              type="button"
              onClick={() => onOpenAuth("register")}
              className="px-4 py-2 rounded-xl text-sm font-extrabold text-white bg-[#FF5500] hover:bg-[#e64d00] shadow-md shadow-[#FF5500]/30 transition-all active:scale-95"
            >
              Register
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            id="btn_menu"
            type="button"
            aria-label="Buka menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <motion.div
            id="menu_mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg"
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                id={`nav_mobile_${link.id}`}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-[#FF5500]/5 hover:text-[#FF5500] transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                id="btn_login_mobile"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth("login");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 bg-white"
              >
                Login
              </button>
              <button
                id="btn_register_mobile"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAuth("register");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-[#FF5500] shadow-md shadow-[#FF5500]/30"
              >
                Register
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-[#FDF7F1] to-[#F3F4F8] pt-10 pb-16 sm:pt-16 sm:pb-20"
      >
        {/* Dekorasi glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#FF5500]/15 blur-[100px]" />
        <div className="pointer-events-none absolute top-16 right-0 w-72 h-72 rounded-full bg-amber-300/25 blur-[90px]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          {/* Teks hero */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5500]/20 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF5500] shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Ngolab Cafe × Program Loyalitas Gamifikasi
            </span>

            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Main Game, Kumpulkan Poin,{" "}
              <span className="text-[#FF5500]">Tukar Jadi Reward Kafe!</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base lg:mx-0">
              Ngolab Gami adalah platform gamifikasi resmi cafe kami: mainkan
              mini-game, belajar lewat Gami Study, kumpulkan loyalty points, dan
              tukarkan dengan voucher F&amp;B favoritmu. Pantau progres, skor, dan
              catatan belajarmu dalam satu akun.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                id="btn_cta_play"
                type="button"
                onClick={() => scrollToSection("games")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF5500] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#FF5500]/30 transition-all hover:bg-[#e64d00] active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Main Sekarang
              </button>
              <button
                id="btn_cta_study"
                type="button"
                onClick={() => scrollToSection("study")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                Buka Gami Study
              </button>
            </div>

            {/* Statistik */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3 text-center backdrop-blur-sm"
                >
                  <p className="text-xl font-black text-[#FF5500] sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Kolase thumbnail game */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="rotate-[-4deg] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                <img
                  src="/thumbnails/catch_thumbnail.webp"
                  alt="Ngolab Catch: Arcade Rush"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
                <div className="flex items-center justify-between px-1 pt-3 pb-1">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Ngolab Catch: Arcade Rush
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Arcade
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    4.9
                  </span>
                </div>
              </div>

              <motion.img
                src="/thumbnails/burger_thumbnail.webp"
                alt="Ngolab Burger Builder"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-10 w-32 rounded-2xl border-4 border-white shadow-lg"
              />
              <motion.img
                src="/thumbnails/memory_thumbnail.webp"
                alt="Ngolab Memory Match"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-8 w-28 rounded-2xl border-4 border-white shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MINI-GAMES SHOWCASE ═══════════════════════ */}
      <section id="games" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5500]">
            Mini Games
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Pilihan Mini-Game Ngolab Gami
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            Setiap game punya target skor berbeda. Capai targetnya, kumpulkan
            poin, dan naik ke puncak leaderboard. Progres otomatis tersimpan di
            akunmu.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleGames.map((game) => {
            const badge = gameBadge(game);
            const description = GAME_DESCRIPTIONS[game.id] ?? "Mini-game seru dari Ngolab Gami.";
            return (
              <motion.div
                key={game.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.15 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-slate-300"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {badge && (
                    <span
                      className={`absolute top-2 left-2 z-10 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5500] shadow-md shadow-[#FF5500]/40">
                      <Play className="w-3.5 h-3.5 fill-white translate-x-0.5 text-white" />
                    </span>
                  </div>
                </div>

                {/* Konten */}
                <div className="flex flex-1 flex-col p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-tight text-slate-900 group-hover:text-[#FF5500] transition-colors">
                      {game.title}
                    </h3>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-slate-600">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {game.rating}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500">
                    {description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {game.category}
                    </span>
                    <button
                      id={`btn_play_${game.id}`}
                      type="button"
                      onClick={() => onOpenAuth("login")}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#FF5500] px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white transition-all hover:bg-[#e64d00] active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Main
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!showAllGames && orderedGames.length > 8 && (
          <div className="mt-6 text-center">
            <button
              id="btn_lihat_semua_game"
              type="button"
              onClick={() => setShowAllGames(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#FF5500] hover:text-[#FF5500]"
            >
              Lihat semua {orderedGames.length} game
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs font-semibold text-slate-400">
          Login atau daftar akun PointLab untuk bermain dan menyimpan progres,
          poin, serta catatan belajarmu.
        </p>
      </section>

      {/* ═════════════════════ GAMI STUDY HIGHLIGHT ═════════════════════ */}
      <section id="study" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#FF5500]/25 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-[90px]" />

          <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF5500] backdrop-blur-md">
                <BookOpen className="w-3.5 h-3.5" />
                Gami Study · Student Notes
              </span>
              <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">
                Notebook Pintar untuk Mahasiswa{" "}
                <span className="text-[#FF5500]">Nongkrong di Cafe</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-300">
                Gami Study Student Notes adalah catatan belajar bertenaga AI
                sejenis NotebookLM, dibuat untuk mahasiswa yang belajar sambil
                nongkrong di cafe kami. Susun catatan kelas, minta ringkasan dan
                penjelasan konsep, buat kuis latihan — semua tersimpan rapi di
                akunmu.
              </p>
              <button
                id="btn_cta_start_studying"
                type="button"
                onClick={() => onOpenAuth("register")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#FF5500] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#FF5500]/30 transition-all hover:bg-[#e64d00] active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                Mulai Belajar
              </button>
            </div>

            <div className="space-y-3">
              {STUDY_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5500] text-white">
                    <feature.icon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ LOYALTY & REWARDS INFO ═══════════════════ */}
      <section id="rewards" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5500]">
              Loyalty &amp; Rewards
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Main Sambil Nongkrong, Poin Mengalir
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
              Ngolab Gami adalah bagian dari program membership &amp; loyalty cafe
              kami. Setiap permainan yang kamu menangkan dikonversi menjadi poin
              loyalitas.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LOYALTY_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-[#F3F4F8]/60 p-5"
              >
                <span className="absolute right-4 top-4 text-3xl font-black text-slate-200">
                  {index + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/30">
                  <step.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-3 text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Leaderboard teaser */}
          <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-[#FF5500]/20 bg-gradient-to-r from-[#FFF3EA] to-amber-50 p-5 text-center sm:flex-row sm:text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/30">
              <Trophy className="w-6 h-6" />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Leaderboard Kafe &amp; Kampus
              </h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                Bersaing dengan pemain lain, raih peringkat teratas, dan buktikan
                siapa raja arcade Ngolab. Semakin aktif bermain dan belajar,
                semakin tinggi posisimu.
              </p>
            </div>
            <button
              id="btn_cta_leaderboard"
              type="button"
              onClick={() => onOpenAuth("login")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#FF5500] hover:text-[#FF5500]"
            >
              Lihat Leaderboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5500]">
                <Gamepad2 className="w-5 h-5 text-white" />
              </span>
              <span className="text-sm font-black tracking-wide text-white">
                NGOLAB GAMI
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs font-medium leading-relaxed">
              Platform gamifikasi resmi Ngolab Cafe: main mini-game, belajar lewat
              Gami Study, kumpulkan loyalty points, dan tukar jadi reward F&amp;B
              favoritmu.
            </p>
            <div className="mt-4 flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-[#FF5500]/40 hover:text-[#FF5500]"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigasi
            </h3>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#FF5500]"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth("login")}
                  className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#FF5500]"
                >
                  Login / Daftar (PointLab)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#"
                  className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#FF5500]"
                >
                  Syarat &amp; Ketentuan
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#FF5500]"
                >
                  Kebijakan Privasi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-5 text-center sm:px-6">
          <p className="text-[11px] font-semibold text-slate-500">
            © 2026 Ngolab Gami · Ngolab Cafe. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
