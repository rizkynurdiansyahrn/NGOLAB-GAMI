import React from 'react';
import { Edit3, Trophy, User } from 'lucide-react';
import { mockUser } from '../data/appData';

export default function Profile() {
  const user = mockUser;

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#06060a] to-[#0f0f12] rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(2,6,23,0.22)] border border-slate-800 flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-52 h-52 rounded-3xl overflow-hidden bg-gradient-to-br from-[#0f1114] to-[#151518] flex items-center justify-center border border-slate-700 shadow-2xl relative ring-1 ring-slate-900/20">
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-3xl" referrerPolicy="no-referrer" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center border-2 border-white text-black font-extrabold text-sm shadow-[0_10px_24px_rgba(0,0,0,0.35)]">{user.level}</div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{user.name}</h1>
                <p className="text-sm text-slate-400 mt-1">Pengguna Ngolab Gami</p>
                <div className="mt-4 bg-slate-800/40 rounded-xl p-4 w-full sm:w-96">
                  <div className="text-xs text-slate-300">Level</div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="bg-[#FF6B00] text-white px-4 py-1.5 rounded-full font-extrabold text-sm">{user.level}</div>
                    <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div className="h-4 bg-[#FF6B00] transition-all" style={{ width: `${Math.min(100, (user.exp / user.nextExp) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="bg-[#FF6B00] text-white px-4 py-2 rounded-2xl font-semibold flex items-center gap-2 text-sm"><Edit3 className="w-4 h-4" /> Edit</button>
                <button className="bg-slate-700 text-white px-4 py-2 rounded-2xl text-sm">Riwayat</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 p-4 rounded-2xl text-center border border-slate-700">
                <div className="text-sm text-slate-300">Poin</div>
                <div className="text-lg sm:text-xl font-extrabold text-white">{user.points.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-2xl text-center border border-slate-700">
                <div className="text-sm text-slate-300">Game</div>
                <div className="text-lg sm:text-xl font-extrabold text-white">48</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-2xl text-center border border-slate-700">
                <div className="text-sm text-slate-300">Win Rate</div>
                <div className="text-lg sm:text-xl font-extrabold text-white">68%</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-2xl text-center border border-slate-700">
                <div className="text-sm text-slate-300">Streak</div>
                <div className="text-lg sm:text-xl font-extrabold text-white">{user.streak || 12} hari</div>
              </div>
            </div>
          </div>
        </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200"> 
            <h3 className="text-slate-900 font-extrabold">Pencapaian</h3>
            <p className="text-sm text-slate-500 mt-2">Lihat pencapaian dan progress Anda.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-slate-900 font-extrabold">Pengaturan Akun</h3>
            <p className="text-sm text-slate-500 mt-2">Kelola profil dan preferensi.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-slate-900 font-extrabold">Aktivitas</h3>
            <p className="text-sm text-slate-500 mt-2">Riwayat permainan dan aktivitas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
