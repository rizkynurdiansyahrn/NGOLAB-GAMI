import React from 'react';
import { Settings, User, Globe } from 'lucide-react';

export default function SettingsPage(){
  return (
    <div className="p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Pengaturan Akun</h2>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="h-40 bg-gradient-to-r from-orange-50 to-orange-100 flex items-end p-6">
            <h3 className="text-xl font-extrabold text-slate-900">Pengaturan Akun</h3>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="bg-orange-50 p-4 rounded-lg mb-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center ring-1 ring-gray-100">🎮</div>
                  <div>
                    <div className="text-sm text-slate-500">Pengaturan Akun</div>
                    <div className="font-semibold text-slate-900">Kelola profil</div>
                  </div>
                </div>
                <ul className="text-sm text-slate-500 space-y-2">
                  <li>Profil</li>
                  <li>Keamanan</li>
                  <li>Notifikasi</li>
                </ul>
              </div>
            </div>
            <div className="col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-slate-900 font-bold">Informasi Dasar</h4>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100">
                    <div className="text-sm text-slate-500">Nama Pengguna</div>
                    <div className="font-semibold text-slate-900 mt-2">budi_gamer</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100">
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="font-semibold text-slate-900 mt-2">budi@example.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
