import React from "react";
import { Trophy, LockKeyhole } from "lucide-react";
import type { AppUser } from "../data/appData";

export default function Achievement({ user }: { user: AppUser }) {
  const milestones = [
    { title: "Konsisten", detail: "Bermain 7 hari berturut-turut", progress: user.streak, goal: 7, available: true },
    { title: "Kolektor poin", detail: "Kumpulkan 1.000 Loyalty Points", progress: user.points, goal: 1000, available: user.pointsAvailable !== false },
    { title: "Naik level", detail: "Capai level 15", progress: user.level, goal: 15, available: true },
  ];
  return (
    <main className="mx-auto w-full max-w-5xl p-6 pb-32 text-slate-800">
      <h2 className="mb-2 text-3xl font-extrabold">Pencapaian Saya</h2>
      <p className="mb-6 text-sm text-slate-500">Target perjalanan {user.name} di Ngolab-Gami.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {milestones.map((milestone) => {
          const done = milestone.available && milestone.progress >= milestone.goal;
          const Icon = done ? Trophy : LockKeyhole;
          return (
            <section key={milestone.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Icon className={done ? "mb-4 h-8 w-8 text-amber-500" : "mb-4 h-8 w-8 text-slate-300"} />
              <h3 className="font-bold">{milestone.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{milestone.detail}</p>
              <p className="mt-4 text-sm font-semibold">{!milestone.available ? "Progres belum tersedia" : done ? "Tercapai" : "Belum tercapai"}</p>
              {milestone.available && <p className="mt-1 text-xs text-slate-500">{Math.min(milestone.goal, milestone.progress)} / {milestone.goal}</p>}
            </section>
          );
        })}
      </div>
    </main>
  );
}
