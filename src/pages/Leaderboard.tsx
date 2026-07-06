/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy } from "lucide-react";

export default function Leaderboard() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[40px] border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-50 text-yellow-600">
        <Trophy className="h-10 w-10" />
      </div>
      <h1 className="mb-2 text-4xl font-black tracking-tighter text-slate-900">Peringkat</h1>
      <p className="max-w-md text-slate-500">
        Lihat siapa yang mendominasi kampus. Bersaing dengan teman-teman Anda dan naik ke puncak peringkat.
      </p>
      <div className="mt-12 w-full max-w-2xl space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-indigo-500/50">
            <div className="flex items-center gap-4">
              <span className="w-6 font-mono font-bold text-slate-400">#{i}</span>
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <span className="font-bold text-slate-900">Player_{i}</span>
            </div>
            <span className="font-mono font-bold text-indigo-600">{10000 - i * 500} PTS</span>
          </div>
        ))}
      </div>
    </div>
  );
}
