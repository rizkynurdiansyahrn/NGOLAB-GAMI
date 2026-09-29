import React from 'react';
import { Trophy } from 'lucide-react';
import { mockUser } from '../data/appData';

export default function Achievement() {
  const user = mockUser;

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Pencapaian Saya</h2>
        <p className="text-sm text-slate-500 mb-6">Lacak pencapaianmu, kumpulkan lencana, dan tukarkan poin menarik.</p>

        <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(2,6,23,0.22)] mb-6 flex gap-4 sm:gap-6 items-center">
          <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-[#0b0c0e] to-[#151617] rounded-2xl flex items-center justify-center border border-gray-800 shadow-2xl ring-1 ring-yellow-500/10">
            <Trophy className="w-18 h-18 text-yellow-400 drop-shadow-[0_14px_40px_rgba(250,204,21,0.22)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-extrabold text-2xl sm:text-3xl">Grandmaster Arcadia</h3>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">Kamu telah mencapai level tertinggi dan memenangkan 100 pertandingan dalam mode Arcade.</p>
            <div className="mt-4 flex gap-3">
              <button className="bg-[#FF6B00] text-white px-6 py-2.5 rounded-3xl font-semibold shadow-[0_14px_40px_rgba(255,107,0,0.22)]">Lihat</button>
              <button className="bg-white text-slate-700 px-4 py-2 rounded-2xl ring-1 ring-gray-200">Bagikan</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700 hover:scale-[1.01] transition-transform shadow-[0_8px_22px_rgba(2,6,23,0.6)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center ring-1 ring-slate-900/10">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-300">{`Achievement ${i}`}</div>
                  <div className="mt-1 text-white font-semibold text-sm">Deskripsi singkat</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
