import React, { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import type { AppUser } from "../data/appData";
import { fetchLeaderboard } from "../lib/ngolabApi";
import { normalizeName, type LeaderboardEntry } from "../lib/ngolabContract";

type LoadState = "loading" | "ready" | "failed";

const SKELETON_ROWS = [0, 1, 2, 3];

export default function MobileLeaderboard({ user, onBack }: { user: AppUser; onBack?: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetchLeaderboard(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setEntries(data);
      setState(data && data.length > 0 ? "ready" : "failed");
    });
    return () => controller.abort();
  }, []);

  const myEntry =
    entries?.find((entry) => normalizeName(entry.name) === normalizeName(user.name)) ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl p-6 pb-32 text-slate-800">
      <div className="mb-2 flex items-center gap-3">
        {onBack && (
          <button
            id="btn_kembali_beranda"
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#FF5500] hover:text-[#FF5500]"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-3xl font-extrabold text-slate-900">Papan Skor</h2>
      </div>
      <p className="mb-6 text-sm text-slate-500">Peringkat pemain berdasarkan Loyalty Points.</p>
      <section className="mb-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
        <div className="flex-1"><h3 className="font-bold">{user.name}</h3><p className="text-xs text-slate-500">{myEntry ? "Peringkat #" + myEntry.rank : "Peringkat belum tersedia"}</p></div>
        <span className="font-bold text-[#FF5500]">{user.pointsAvailable === false ? "Saldo belum tersedia" : user.points.toLocaleString() + " PT"}</span>
      </section>
      {state === "loading" && (
        <section className="space-y-2" aria-busy="true" aria-label="Memuat peringkat">
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </section>
      )}

      {state === "failed" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">Peringkat poin belum tersedia.</p>
          <p className="mt-2 text-sm text-slate-500">Daftar pemain akan ditampilkan saat data peringkat tersedia.</p>
        </section>
      )}

      {state === "ready" && entries && (
        <section className="space-y-2">
          {entries.map((entry) => {
            const isMe =
              myEntry !== null &&
              entry.rank === myEntry.rank &&
              normalizeName(entry.name) === normalizeName(user.name);
            return (
              <div
                key={entry.rank + "-" + entry.name}
                className={`flex items-center gap-3 rounded-2xl border bg-white p-4 ${
                  isMe ? "border-[#FF5500] ring-1 ring-[#FF5500]" : "border-slate-200"
                }`}
              >
                <span className="w-8 text-center text-lg font-extrabold text-slate-400">#{entry.rank}</span>
                {entry.avatar ? (
                  <img src={entry.avatar} alt={entry.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-800">{entry.name}</h3>
                  {isMe && <p className="text-xs font-semibold text-[#FF5500]">Kamu</p>}
                </div>
                <span className="font-bold text-[#FF5500]">{entry.points.toLocaleString()} PT</span>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
