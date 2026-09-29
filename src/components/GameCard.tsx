/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, Play, Users, Zap } from "lucide-react";
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
  const cardId = `card_${game.id.replace("ngolab-", "game_").replace(/-/g, "_")}`;
  const playBtnId = `btn_play_${game.id.replace(/-/g, "_")}`;

  // Determine badge type based on game data
  const isHot = game.id === "ngolab-catch" || game.id === "ngolab-burger" || game.id === "ngolab-neon-merge";
  const isNew = game.id === "ngolab-astro-drift" || game.id === "ngolab-glow-trail";
  const badgeLabel = isHot ? "HOT" : isNew ? "BARU" : game.isFeatured ? "POPULER" : null;

  const handleCardClick = () => {
    if (onSelectDetail) {
      onSelectDetail(game);
    } else if (onPlay) {
      onPlay(game.id);
    }
  };

  return (
    <motion.div
      id={cardId}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Badge Overlay (Top Left) */}
        {badgeLabel && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-md ${
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

        {/* Info Badges Overlay (Bottom Bar over image) */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold z-10 drop-shadow-md">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
            <Zap className="w-3 h-3 text-[#FF5500] fill-[#FF5500]" />
            <span>400 pts</span>
          </div>
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-slate-300">
            <Users className="w-3 h-3" />
            <span>1.2k</span>
          </div>
        </div>

        {/* Play Button Overlay on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#FF5500] text-white flex items-center justify-center shadow-lg shadow-[#FF5500]/40 transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Card Content Footer */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-[#FF5500] transition-colors">
              {game.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-slate-800">{game.rating}</span>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {game.category}
          </p>
        </div>

        {/* Action Button if provided */}
        {onPlay && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
            <button
              id={playBtnId}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(game.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5500] hover:bg-[#FF6611] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Mainkan</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
