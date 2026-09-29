/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, Play, Zap } from "lucide-react";
import { Game } from "../data/dummyData";
import { motion } from "motion/react";

interface GameCardProps {
  game: Game;
  onPlay?: (gameId: string) => void;
  onSelectDetail?: (game: Game) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
}

export default function GameCard({
  game,
  onPlay,
  onSelectDetail,
}: GameCardProps) {
  const handleCardClick = () => {
    if (onSelectDetail) {
      onSelectDetail(game);
    } else if (onPlay) {
      onPlay(game.id);
    }
  };

  const isHot = game.id === "ngolab-catch" || game.id === "ngolab-burger" || game.id === "ngolab-neon-merge";
  const isNew = game.id === "ngolab-astro-drift" || game.id === "ngolab-glow-trail";
  const badgeLabel = isHot ? "HOT" : isNew ? "BARU" : game.isFeatured ? "POPULER" : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.15 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Thumbnail — square */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Badge */}
        {badgeLabel && (
          <div className="absolute top-2 left-2 z-10">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${
                badgeLabel === "HOT"
                  ? "bg-gradient-to-r from-orange-600 to-[#FF5500]"
                  : badgeLabel === "BARU"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                  : "bg-slate-900/80 backdrop-blur-md"
              }`}
            >
              {badgeLabel}
            </span>
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center shadow-md shadow-[#FF5500]/40 transform group-hover:scale-110 transition-transform duration-200">
            <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate group-hover:text-[#FF5500] transition-colors">
            {game.title}
          </h3>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate">
            {game.category}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-slate-600">{game.rating}</span>
        </div>
      </div>
    </motion.div>
  );
}
