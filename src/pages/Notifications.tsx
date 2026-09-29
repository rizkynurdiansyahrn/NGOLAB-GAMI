import React from 'react';

const sample = [
  {id:1, title: 'Hadiah Voucher Berhasil Diambil', body: 'Voucher kampus Anda berhasil ditukar.'},
  {id:2, title: 'Pencapaian Baru Tercapai', body: 'Selamat! Anda mendapatkan Pencapaian: Night OwL.'},
  {id:3, title: 'Pengumuman', body: 'Server akan dimulai ulang pada jam 02:00.'}
];

export default function Notifications(){
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Notifikasi</h2>
        <p className="text-sm text-slate-500 mb-6">Kelola notifikasi dan lihat pesan penting untuk akunmu.</p>

        <div className="space-y-4">
          {sample.map(s => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-sm font-extrabold text-[#FF6B00] ring-1 ring-gray-100 shadow-sm">OK</div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 text-sm">{s.title}</div>
                <div className="text-sm text-slate-500 mt-1">{s.body}</div>
                <div className="text-xs text-slate-400 mt-2">2 hari lalu</div>
              </div>
              <div className="flex-shrink-0">
                <button className="bg-white text-[#FF6B00] px-3 py-2 rounded-xl font-semibold ring-1 ring-gray-100">Lihat</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
