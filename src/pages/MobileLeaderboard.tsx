import React, { useEffect, useState } from "react";
import { Award, Crown, Medal, RefreshCw, Trophy } from "lucide-react";
import type { AppUser } from "../data/appData";
import { API_BASE_URL } from "../lib/api";
import { DEFAULT_AVATAR } from "../lib/userProfile";

interface LeaderboardEntry {
  rank: number;
  id: string;
  nama: string;
  points: number;
  avatar: string;
  tier: string;
}

interface MobileLeaderboardProps {
  user: AppUser;
  accessToken?: string | null;
  onRankResolved?: (rank: number) => void;
}

export default function MobileLeaderboard({
  user,
  accessToken,
  onRankResolved,
}: MobileLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/api/leaderboard`, {
      cache: "no-store",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (controller.signal.aborted) return;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.leaderboard)
            ? raw.leaderboard
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        const mapped: LeaderboardEntry[] = list.map((item: any, idx: number) => ({
          rank: Number(item.rank) > 0 ? Number(item.rank) : idx + 1,
          id: String(item.id ?? idx + 1),
          nama: String(item.nama || item.name || "Member Ngolab"),
          points: Number(item.points ?? item.currentPoints ?? item.coin_balance ?? 0),
          avatar: String(item.avatar_url || item.avatar || DEFAULT_AVATAR),
          tier: String(item.tier || "Classmate"),
        }));
        setEntries(mapped);
        const myEntry = mapped.find((e) => String(e.id) === String(user.id));
        if (myEntry && onRankResolved) {
          onRankResolved(myEntry.rank);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn("Gagal memuat leaderboard:", err);
        setError("Papan peringkat belum dapat dimuat dari server.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, user.id, reloadTick]);

  const myRank = entries.find((e) => String(e.id) === String(user.id))?.rank ?? user.rank;

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 pb-32 text-slate-800">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Papan Skor Kampus</h2>
          <p className="mt-1 text-sm text-slate-500">Peringkat real-time pemain berdasarkan Loyalty Points.</p>
        </div>
        <button
          type="button"
          onClick={() => setReloadTick((v) => v + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#FF5500]" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Kartu Posisi Pengguna */}
      <section className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-[#FF5500]/30 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt={user.name}
          className="h-12 w-12 rounded-full border-2 border-[#FF5500] object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#FF5500]">POSISI KAMU</p>
          <h3 className="truncate font-extrabold text-slate-900">{user.name}</h3>
          <p className="text-xs font-semibold text-slate-500">
            {myRank ? `Peringkat #${myRank}` : "Belum masuk 50 besar"}
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-[#FF5500] px-3.5 py-2 text-sm font-black text-white shadow-sm">
          {user.pointsAvailable === false ? "—" : `${user.points.toLocaleString()} PT`}
        </span>
      </section>

      {loading && (
        <section role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Memuat peringkat pemain...
        </section>
      )}

      {!loading && error && (
        <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-semibold text-amber-800">
          {error}
        </section>
      )}

      {!loading && !error && entries.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">Peringkat poin belum tersedia.</p>
          <p className="mt-2 text-sm text-slate-500">Daftar pemain akan ditampilkan saat data peringkat tersedia.</p>
        </section>
      )}

      {!loading && !error && entries.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {entries.map((entry, idx) => {
            const isCurrentUser = String(entry.id) === String(user.id);
            const badgeIcon =
              entry.rank === 1 ? (
                <Crown className="h-5 w-5 text-amber-500 fill-amber-400" />
              ) : entry.rank === 2 ? (
                <Medal className="h-5 w-5 text-slate-400" />
              ) : entry.rank === 3 ? (
                <Award className="h-5 w-5 text-amber-700" />
              ) : null;

            return (
              <div
                key={entry.id}
                id={idx === 0 ? "list_rank_1" : undefined}
                className={`flex items-center gap-3.5 px-4 py-3.5 sm:px-6 transition-colors ${
                  isCurrentUser ? "bg-orange-50/70" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-xs text-slate-700">
                  {badgeIcon ?? `#${entry.rank}`}
                </div>
                <img
                  src={entry.avatar || DEFAULT_AVATAR}
                  alt={entry.nama}
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover bg-slate-100"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-extrabold text-slate-900">
                      {entry.nama}
                    </h4>
                    {isCurrentUser && (
                      <span className="rounded-full bg-[#FF5500] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                        Kamu
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">{entry.tier}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[#FF5500]">
                    {entry.points.toLocaleString()} PT
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
