import React from "react";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8 text-slate-800">
      <h2 className="mb-2 text-3xl font-extrabold">Notifikasi</h2>
      <p className="mb-6 text-sm text-slate-500">Pesan dan pemberitahuan untuk akunmu.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">Notifikasi akun belum tersedia.</p>
      </div>
    </main>
  );
}
