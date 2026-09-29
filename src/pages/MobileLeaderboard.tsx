import React from "react";
import { motion } from "motion/react";
import { Trophy, Crown } from "lucide-react";
import { leaderboardData, AppUser } from "../data/appData";

import { useState, useEffect } from "react";

interface LeaderboardItem {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

interface MobileLeaderboardProps {
  user: AppUser;
}

export default function MobileLeaderboard({ user }: MobileLeaderboardProps) {
  const [data, setData] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("https://geasture.kolab.top/api/users", { cache: 'no-store' });
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const json = await response.json();
        
        let usersArray = Array.isArray(json) ? json : (json.data && Array.isArray(json.data) ? json.data : null);
        if (!usersArray) throw new Error("Invalid API response format");
        
        if (isMounted) {
          let formatted = usersArray.map((item: any, idx: number): LeaderboardItem => ({
            rank: 0,
            name: item.nama ?? item.name ?? "Anonym",
            points: Number(item.coin_balance ?? item.points ?? item.coins ?? 0),
            avatar: item.avatar_url ?? item.avatar ?? `https://i.pravatar.cc/150?u=${idx}`
          }));

          // Merge current user
          const userIndex = formatted.findIndex((item: any) => 
            item.name && user.name && 
            item.name.trim().toLowerCase() === user.name.trim().toLowerCase()
          );
          if (userIndex !== -1) {
            if (user.points > formatted[userIndex].points) {
              formatted[userIndex].points = user.points;
            }
          } else if (user.name) {
            formatted.push({
              rank: 0,
              name: user.name,
              points: user.points,
              avatar: user.avatar
            });
          }

          formatted = formatted
            .sort((a: any, b: any) => b.points - a.points)
            .map((item: any, idx: number) => ({ ...item, rank: idx + 1 }));
          
          setData(formatted);
        }
      } catch (err) {
        console.warn("Gagal mengambil data peringkat dari API, menggunakan data mock:", err);
        if (isMounted) {
          let formatted = leaderboardData.map((item, idx) => ({
            rank: 0,
            name: item.name,
            points: item.points,
            avatar: item.avatar
          }));

          const userIndex = formatted.findIndex(item => 
            item.name && user.name && 
            item.name.trim().toLowerCase() === user.name.trim().toLowerCase()
          );
          if (userIndex !== -1) {
            if (user.points > formatted[userIndex].points) {
              formatted[userIndex].points = user.points;
            }
          } else if (user.name) {
            formatted.push({
              rank: 0,
              name: user.name,
              points: user.points,
              avatar: user.avatar
            });
          }

          formatted = formatted
            .sort((a, b) => b.points - a.points)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

          setData(formatted);
        }
      }
    };

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [user.points, user.name, user.avatar]);

  const top3 = data.slice(0, 3);
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];
  const rest = data.slice(3);

  return (
    <div className="flex-1 w-full bg-gray-50 overflow-y-auto custom-scrollbar p-6 pt-12 font-sans pb-32 text-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">Papan Skor</h2>
          <p className="text-[#FF6B00] text-sm font-semibold tracking-wide">Kompetisi Mingguan</p>
        </div>

        {/* Podium Layout */}
        <div className="flex items-end justify-center mb-10 px-2 gap-4 sm:gap-6 h-[18rem] sm:h-[20rem]">
          {/* Rank 2 */}
          {rank2 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-1/4 sm:w-1/3"
            >
              <div className="w-16 h-16 rounded-full border-2 border-slate-300 p-0.5 mb-2 relative shadow-[0_6px_14px_rgba(0,0,0,0.45)] -mt-4 ring-1 ring-slate-700/20">
                <span className="absolute -bottom-3 relative z-10 bg-slate-300 text-slate-900 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center mx-auto ring-2 ring-gray-900 -mt-3 shadow-sm">
                  2
                </span>
                <img
                  src={rank2.avatar}
                  alt={`${rank2.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-slate-800 text-sm font-bold truncate w-full text-center leading-tight mt-1">
                {rank2.name}
              </p>
              <p className="text-slate-500 text-xs font-semibold mb-3">
                {rank2.points.toLocaleString()} PT
              </p>
              <div className="w-full h-36 sm:h-40 bg-gradient-to-t from-slate-400/14 to-slate-400/4 rounded-t-[22px] border-t border-slate-400/20 shadow-[inset_0_6px_14px_rgba(0,0,0,0.6)]"></div>
            </motion.div>
          )}

          {/* Rank 1 */}
          {rank1 && (
            <motion.div
              id="list_rank_1"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center w-[44%] z-10"
            >
              <Crown className="w-8 h-8 text-yellow-500 mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              <div className="w-32 h-32 rounded-full border-3 border-yellow-500 p-1 mb-2 relative shadow-[0_8px_28px_rgba(234,179,8,0.16)] -mt-6 ring-1 ring-yellow-400/20">
                <span className="absolute -bottom-4 relative z-10 bg-yellow-500 text-yellow-900 text-sm font-extrabold w-8 h-8 rounded-full flex items-center justify-center mx-auto ring-2 ring-gray-900 -mt-5 shadow-sm">
                  1
                </span>
                <img
                  src={rank1.avatar}
                  alt={`${rank1.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-slate-900 text-lg font-extrabold truncate w-full text-center leading-tight mt-1">
                {rank1.name}
              </p>
              <p className="text-[#FF6B00] text-sm font-extrabold mb-3">
                {rank1.points.toLocaleString()} PT
              </p>
              <div className="w-full h-52 sm:h-56 bg-gradient-to-t from-yellow-500/18 to-yellow-500/4 rounded-t-[24px] border-t-2 border-yellow-500/40 shadow-[inset_0_10px_20px_rgba(0,0,0,0.58)] relative">
                <div className="absolute inset-0 bg-yellow-500/6 blur-md" />
              </div>
            </motion.div>
          )}

          {/* Rank 3 */}
          {rank3 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center w-1/4 sm:w-1/3"
            >
              <div className="w-16 h-16 rounded-full border-2 border-orange-500 p-0.5 mb-2 relative shadow-[0_6px_12px_rgba(0,0,0,0.45)] -mt-4 ring-1 ring-orange-700/10">
                <span className="absolute -bottom-3 relative z-10 bg-orange-500 text-orange-900 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center mx-auto ring-2 ring-gray-900 -mt-3 shadow-sm">
                  3
                </span>
                <img
                  src={rank3.avatar}
                  alt={`${rank3.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-white text-sm font-bold truncate w-full text-center leading-tight mt-1">
                {rank3.name}
              </p>
              <p className="text-orange-400 text-xs font-semibold mb-3">
                {rank3.points.toLocaleString()} PT
              </p>
              <div className="w-full h-32 bg-gradient-to-t from-orange-500/16 to-orange-500/4 rounded-t-[20px] border-t border-orange-500/28 shadow-[inset_0_6px_12px_rgba(0,0,0,0.5)]"></div>
            </motion.div>
          )}
        </div>

        {/* Rest of the list */}
        <div className="rounded-2xl p-3">
          {rest.map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.4, ease: "easeOut" }}
              className={`flex items-center gap-4 p-3 rounded-2xl transition-colors border mb-2 last:mb-0 ${user.name && player.name===user.name ? 'bg-[#FFF7F1] border-[#FF6B00] shadow-[0_8px_30px_rgba(255,107,0,0.08)]' : 'bg-white border-transparent'}`}
            >
              <div className="w-6 flex justify-center">
                <span className="font-bold text-slate-600 text-sm">{player.rank}</span>
              </div>
              <img src={player.avatar} alt={`${player.name} avatar`} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold text-sm text-slate-900 truncate tracking-tight">{player.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{player.rank <= 10 ? 'Top Player' : 'Member'}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF6B00] border border-[#FF6B00]/20 inline-block">
                  {player.points.toLocaleString()} PT
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
