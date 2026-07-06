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
    <div className="flex-1 w-full bg-transparent overflow-y-auto custom-scrollbar p-6 pt-12 font-sans pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
            Peringkat
          </h2>
          <p className="text-[#FF6B00] text-sm font-medium tracking-wide">
            Kompetisi Mingguan
          </p>
        </div>

        {/* Podium Layout */}
        <div className="flex items-end justify-center mb-10 px-2 gap-3 h-64">
          {/* Rank 2 */}
          {rank2 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-1/3"
            >
              <div className="w-14 h-14 rounded-full border-2 border-slate-300 p-0.5 mb-2 relative shadow-lg">
                <span className="absolute -bottom-2.5 relative z-10 bg-slate-300 text-slate-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto ring-4 ring-gray-900 pb-[1px] -mt-3 shadow-md">
                  2
                </span>
                <img
                  src={rank2.avatar}
                  alt={`${rank2.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-white text-xs font-bold truncate w-full text-center leading-tight mt-1">
                {rank2.name.split(" ")[0]}
              </p>
              <p className="text-slate-400 text-[10px] font-bold mb-3">
                {rank2.points.toLocaleString()} PT
              </p>
              <div className="w-full h-28 bg-gradient-to-t from-slate-400/20 to-slate-400/5 rounded-t-[20px] border-t border-slate-400/30 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"></div>
            </motion.div>
          )}

          {/* Rank 1 */}
          {rank1 && (
            <motion.div
              id="list_rank_1"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center w-[40%] z-10"
            >
              <Crown className="w-8 h-8 text-yellow-500 mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              <div className="w-20 h-20 rounded-full border-4 border-yellow-500 p-1 mb-2 relative shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                <span className="absolute -bottom-3 relative z-10 bg-yellow-500 text-yellow-900 text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center mx-auto ring-4 ring-gray-900 pb-[1px] -mt-4 shadow-md">
                  1
                </span>
                <img
                  src={rank1.avatar}
                  alt={`${rank1.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-white text-sm font-bold truncate w-full text-center leading-tight mt-1">
                {rank1.name.split(" ")[0]}
              </p>
              <p className="text-yellow-500 text-[11px] font-bold mb-3">
                {rank1.points.toLocaleString()} PT
              </p>
              <div className="w-full h-36 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 rounded-t-[20px] border-t-2 border-yellow-500/50 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] relative">
                <div className="absolute inset-0 bg-yellow-500/5 blur-md" />
              </div>
            </motion.div>
          )}

          {/* Rank 3 */}
          {rank3 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center w-1/3"
            >
              <div className="w-14 h-14 rounded-full border-2 border-orange-500 p-0.5 mb-2 relative shadow-lg">
                <span className="absolute -bottom-2.5 relative z-10 bg-orange-500 text-orange-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto ring-4 ring-gray-900 pb-[1px] -mt-3 shadow-md">
                  3
                </span>
                <img
                  src={rank3.avatar}
                  alt={`${rank3.name} avatar`}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-white text-xs font-bold truncate w-full text-center leading-tight mt-1">
                {rank3.name.split(" ")[0]}
              </p>
              <p className="text-orange-400 text-[10px] font-bold mb-3">
                {rank3.points.toLocaleString()} PT
              </p>
              <div className="w-full h-24 bg-gradient-to-t from-orange-500/20 to-orange-500/5 rounded-t-[20px] border-t border-orange-500/30 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"></div>
            </motion.div>
          )}
        </div>

        {/* Rest of the list */}
        <div className="bg-white/5 rounded-[32px] p-3 border border-white/5 shadow-xl backdrop-blur-md">
          {rest.map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.4, ease: "easeOut" }}
              className="flex items-center gap-4 p-4 rounded-[24px] bg-black/40 hover:bg-black/60 transition-colors border border-transparent hover:border-white/5 mb-2 last:mb-0"
            >
              <div className="w-6 flex justify-center">
                <span className="font-bold text-gray-500 text-sm">
                  {player.rank}
                </span>
              </div>
              <img
                src={player.avatar}
                alt={`${player.name} avatar`}
                className="w-10 h-10 rounded-full object-cover opacity-90 ring-1 ring-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-sm text-gray-300 truncate tracking-tight">
                  {player.name}
                </h4>
                <p className="text-[11px] text-gray-500 font-medium">
                  Campus Pro
                </p>
              </div>
              <div className="text-right">
                <span className="bg-[#FF6B00]/10 px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF6B00] border border-[#FF6B00]/20 inline-block">
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
