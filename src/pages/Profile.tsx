import React from "react";
import {
  Activity, ArrowRight, Award, CalendarDays, Check, ChevronRight, Coins,
  Edit3, Flame, Gamepad2, LogOut, ShieldCheck, Sparkles, Star, Target, Trophy,
  Zap,
} from "lucide-react";
import { AppUser } from "../data/appData";

interface ProfileProps {
  user: AppUser;
  onEdit: () => void;
  onLogout: () => void;
}

export default function Profile({ user, onEdit, onLogout }: ProfileProps) {
  const levelProgress = user.nextExp > 0
    ? Math.min(100, Math.max(0, (user.exp / user.nextExp) * 100))
    : 0;
  const xpRemaining = Math.max(0, user.nextExp - user.exp);
  const milestones = [
    { icon: Flame, title: "Konsisten", detail: "Login & bermain 7 hari berturut-turut", progress: Math.min(7, user.streak), total: 7 },
    { icon: Star, title: "Kolektor poin", detail: "Kumpulkan 1.000 poin", progress: Math.min(1000, user.points), total: 1000 },
    { icon: Zap, title: "Naik level", detail: "Capai level 15", progress: Math.min(15, user.level), total: 15 },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-1 py-5 sm:px-2 sm:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#FF5500]">Akun pemain</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Profil Saya</h1>
          <p className="mt-1 text-sm text-slate-500">Pantau progres, pencapaian, dan aktivitasmu di NGOLAB GAMI.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Akun aktif
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <img src={user.avatar} alt={`Foto profil ${user.name}`} className="h-[76px] w-[76px] rounded-2xl border-2 border-white object-cover shadow-sm ring-1 ring-slate-200 sm:h-24 sm:w-24" referrerPolicy="no-referrer" />
                    <span className="absolute -bottom-2 -right-2 flex h-9 min-w-9 items-center justify-center rounded-xl border-2 border-white bg-[#FF5500] px-1.5 text-xs font-black text-white shadow-sm">{user.level}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF5500]">Campus Pro Gamer</p>
                      <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">LVL {user.level}</span>
                    </div>
                    <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{user.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Member NGOLAB GAMI</p>
                  </div>
                </div>
                <button id="btn_edit_profile" type="button" onClick={onEdit} className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-[#FF5500] transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <Edit3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit profil</span><span className="sm:hidden">Edit</span>
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-xs font-bold text-slate-700">Progres menuju Level {user.level + 1}</p><p className="mt-1 text-[11px] text-slate-500">Kumpulkan XP dari aktivitas bermainmu</p></div>
                  <p className="shrink-0 text-xs font-extrabold text-slate-800">{user.exp.toLocaleString()} <span className="text-slate-500">/ {user.nextExp.toLocaleString()} XP</span></p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Progres level" aria-valuenow={Math.round(levelProgress)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-[#FF5500] transition-all" style={{ width: `${levelProgress}%` }} />
                </div>
                <p className="mt-2 text-right text-[10px] font-semibold text-slate-500">{xpRemaining.toLocaleString()} XP lagi untuk level berikutnya</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-slate-100 bg-white">
              <div className="p-4 text-center sm:p-5"><p className="text-xl font-black text-slate-900 sm:text-2xl">{user.points.toLocaleString()}</p><p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Coins className="h-3.5 w-3.5 text-[#FF5500]" /> Poin</p></div>
              <div className="border-x border-slate-100 p-4 text-center sm:p-5"><p className="text-xl font-black text-slate-900 sm:text-2xl">{user.streak}<span className="ml-1 text-xs font-bold text-slate-500">hari</span></p><p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Flame className="h-3.5 w-3.5 text-[#FF5500]" /> Streak</p></div>
              <div className="p-4 text-center sm:p-5"><p className="text-xl font-black text-slate-900 sm:text-2xl">{user.level}</p><p className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Trophy className="h-3.5 w-3.5 text-[#FF5500]" /> Level</p></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#FF5500]">Perjalanan pemain</p><h3 className="mt-1 text-lg font-black text-slate-900">Target & pencapaian</h3></div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Award className="h-5 w-5" /></span>
            </div>
            <div className="space-y-3">
              {milestones.map(({ icon: Icon, title, detail, progress, total }) => {
                const done = progress >= total;
                return <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 sm:gap-4 sm:p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><p className="text-sm font-extrabold text-slate-800">{title}</p><p className="text-[11px] font-bold text-slate-500">{done ? <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3.5 w-3.5" /> Selesai</span> : `${progress.toLocaleString()} / ${total.toLocaleString()}`}</p></div><p className="mt-0.5 text-[11px] text-slate-500">{detail}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-[#FF5500]"}`} style={{ width: `${Math.min(100, (progress / total) * 100)}%` }} /></div></div>
                </div>;
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-[11px] font-semibold text-slate-500"><Sparkles className="h-4 w-4 shrink-0 text-[#FF5500]" /> Mainkan game untuk mengumpulkan poin dan membuka pencapaian.</div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Activity className="h-5 w-5" /></span><div><h3 className="text-base font-black text-slate-900">Ruang bermainmu</h3><p className="mt-0.5 text-xs text-slate-500">Lanjutkan petualangan di NGOLAB GAMI</p></div></div>
              <Gamepad2 className="hidden h-8 w-8 text-slate-200 sm:block" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF5500]"><Target className="h-4 w-4" /></div><p className="mt-3 text-xs font-extrabold text-slate-800">Kejar target</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Selesaikan milestone untuk progres akun yang lebih tinggi.</p></div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF5500]"><CalendarDays className="h-4 w-4" /></div><p className="mt-3 text-xs font-extrabold text-slate-800">Jaga streak</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Kunjungi game setiap hari dan pertahankan konsistensimu.</p></div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF5500]"><ShieldCheck className="h-4 w-4" /></span><div><h3 className="text-sm font-black text-slate-900">Informasi akun</h3><p className="text-[11px] text-slate-500">Detail pemainmu</p></div></div>
            <div className="divide-y divide-slate-100 px-5">
              <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-xs font-medium text-slate-500">ID Pemain</span><span className="truncate rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">{user.id}</span></div>
              <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-xs font-medium text-slate-500">Status akun</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif</span></div>
              <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-xs font-medium text-slate-500">Peringkat</span><span className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><Trophy className="h-3.5 w-3.5 text-amber-500" /> Pemain Level {user.level}</span></div>
            </div>
            <button type="button" onClick={onEdit} className="group flex w-full items-center justify-between border-t border-slate-100 px-5 py-3.5 text-left text-xs font-extrabold text-[#FF5500] transition hover:bg-orange-50/60"><span>Perbarui nama dan avatar</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Coins className="h-5 w-5" /></div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#FF5500]">Koleksi reward</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{user.points.toLocaleString()} poin tersedia</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Tukarkan poin yang kamu kumpulkan dengan hadiah seru di halaman Hadiah.</p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"><Sparkles className="h-4 w-4 text-[#FF5500]" /><span className="text-[11px] font-bold text-slate-600">Terus bermain, reward menantimu!</span></div>
          </section>

          <section aria-label="Pengaturan profil" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={onEdit} className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50">
              <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Edit3 className="h-4 w-4" /></span><span><span className="block text-xs font-extrabold text-slate-800">Edit profil</span><span className="mt-0.5 block text-[11px] text-slate-500">Ubah nama dan avatar</span></span></span><ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="mx-5 h-px bg-slate-100" />
            <button type="button" onClick={onLogout} className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-red-50/60">
              <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500"><LogOut className="h-4 w-4" /></span><span><span className="block text-xs font-extrabold text-red-600">Keluar akun</span><span className="mt-0.5 block text-[11px] text-slate-500">Kembali ke halaman masuk</span></span></span><ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}
