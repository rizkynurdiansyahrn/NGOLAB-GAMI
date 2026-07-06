/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sword, Clock, Trophy, Users, Star } from "lucide-react";
import { dummyUser } from "../data/dummyData";
import { motion } from "motion/react";

const iconMap: Record<string, any> = {
  Sword,
  Clock,
  Trophy,
  Users,
};

export default function SidebarProfile() {
  const expPercentage = (dummyUser.exp / dummyUser.maxExp) * 100;

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-6 lg:flex">
      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur"></div>
            <img
              src={dummyUser.avatar}
              alt={dummyUser.name}
              className="relative h-24 w-24 rounded-full border-2 border-white object-cover shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-bold text-white shadow-lg ring-2 ring-white">
              {dummyUser.level}
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900">{dummyUser.name}</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Pro Gamer</p>
        </div>

        {/* EXP Progress */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-400">Pengalaman</span>
            <span className="text-slate-900">{dummyUser.exp} / {dummyUser.maxExp} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${expPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </div>

        {/* Badges */}
        <div className="mt-8">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Lencana Didapat</h4>
          <div className="grid grid-cols-4 gap-3">
            {dummyUser.badges.map((badge) => {
              const Icon = iconMap[badge.icon] || Star;
              return (
                <div
                  key={badge.id}
                  title={badge.name}
                  className="group relative flex aspect-square items-center justify-center rounded-xl border border-slate-100 bg-slate-50 transition-all hover:border-indigo-500/50 hover:bg-indigo-50"
                >
                  <Icon className={`h-5 w-5 ${badge.color} transition-transform group-hover:scale-110`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Statistik Cepat</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Game Dimainkan</span>
            <span className="font-mono text-sm font-bold text-slate-900">24</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Kemenangan</span>
            <span className="font-mono text-sm font-bold text-slate-900">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Rasio Kemenangan</span>
            <span className="font-mono text-sm font-bold text-slate-900">50%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
