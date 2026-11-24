/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, Play } from "lucide-react";
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
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#E8DFCE] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_22px_55px_rgba(15,23,42,0.16)] hover:border-[#D97706]/40 hover:ring-1 hover:ring-[#D97706]/20 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FBF9F6]">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Play overlay saat hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D97706] text-white shadow-md shadow-[#D97706]/40 transform transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Konten */}
      <div className="flex flex-1 flex-col p-4">
        {badgeLabel && (
          <span
            className={`mb-2 inline-flex w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${
              badgeLabel === "HOT"
                ? "bg-gradient-to-r from-orange-600 to-[#D97706]"
                : badgeLabel === "BARU"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                : "bg-slate-900/80"
            }`}
          >
            {badgeLabel}
          </span>
        )}
        <h3 className="line-clamp-1 text-sm font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#D97706]">
          {game.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B45309]">
            {game.category}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            {game.rating}
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (onPlay) onPlay(game.id);
            else handleCardClick();
          }}
          className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-xs font-extrabold uppercase tracking-wider text-white shadow-sm shadow-[#D97706]/30 transition hover:shadow-md active:scale-95"
        >
          <Play className="h-3.5 w-3.5 fill-white" /> Main
        </button>
      </div>
    </motion.div>
  );
}
