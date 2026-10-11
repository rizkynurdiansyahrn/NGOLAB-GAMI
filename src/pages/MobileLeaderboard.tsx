import React from "react";
import { Trophy } from "lucide-react";
import type { AppUser } from "../data/appData";

export default function MobileLeaderboard({ user }: { user: AppUser }) {
  return (
    <main className="mx-auto w-full max-w-4xl p-6 pb-32 text-slate-800">
      <h2 className="mb-2 text-3xl font-extrabold text-slate-900">Papan Skor</h2>
      <p className="mb-6 text-sm text-slate-500">Peringkat pemain berdasarkan Loyalty Points.</p>
      <section className="mb-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
        <div className="flex-1"><h3 className="font-bold">{user.name}</h3><p className="text-xs text-slate-500">{user.rank ? "Peringkat #" + user.rank : "Peringkat belum tersedia"}</p></div>
        <span className="font-bold text-[#FF5500]">{user.pointsAvailable === false ? "Saldo belum tersedia" : user.points.toLocaleString() + " PT"}</span>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">Peringkat poin belum tersedia.</p>
        <p className="mt-2 text-sm text-slate-500">Daftar pemain akan ditampilkan saat data peringkat tersedia.</p>
      </section>
    </main>
  );
}
