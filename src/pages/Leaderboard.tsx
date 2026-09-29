/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy } from "lucide-react";
import React from 'react';

export default function Leaderboard() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900">Papan Skor</h2>
            <p className="text-sm text-slate-500 mt-1">Lihat siapa yang memimpin di kampus</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-3xl font-semibold text-sm">Peringkat</button>
            <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-2xl text-sm">Filter</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center ring-2 ring-yellow-100 shadow-sm">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Juara Kampus</div>
                  <div className="font-extrabold text-slate-900 text-lg">Bima</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Skor</div>
              <div className="font-extrabold text-slate-900 text-2xl">12.450 PT</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white border border-gray-100 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-slate-400 font-bold text-sm">#{i}</div>
                  <div className="w-12 h-12 rounded-full bg-gray-100 ring-2 ring-white shadow-sm" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Player_{i}</div>
                    <div className="text-xs text-slate-500">Campus Pro</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[#FF6B00]">{1200 - i * 30} PT</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
