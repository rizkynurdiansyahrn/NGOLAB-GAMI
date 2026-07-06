/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Heart, Play, Star } from "lucide-react";
import { Game } from "../data/dummyData";
import { motion } from "motion/react";

interface GameCardProps {
  game: Game;
  onPlay?: (gameId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
}

export default function GameCard({
  game,
  onPlay,
  isFavorite = false,
  onToggleFavorite,
}: GameCardProps) {
  return (
    <motion.div
      id={`card_${game.id.replace('ngolab-', 'game_').replace(/-/g, '_')}`}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/40">
            <Play className="h-6 w-6 fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            {game.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-bold text-slate-900">{game.rating}</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{game.title}</h3>

        {(onPlay || onToggleFavorite) && (
          <div className="mt-5 flex items-center justify-between gap-3">
            {onPlay ? (
              <button
                id={`btn_play_${game.id.replace(/-/g, '_')}`}
                type="button"
                onClick={() => onPlay(game.id)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                aria-label={`Play ${game.title}`}
              >
                <Play className="h-4 w-4" />
                Mainkan
              </button>
            ) : null}

            {onToggleFavorite ? (
              <button
                type="button"
                onClick={() => onToggleFavorite(game.id)}
                className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  isFavorite
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-900"
                }`}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? `Hapus ${game.title} dari favorit` : `Tambah ${game.title} ke favorit`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "text-red-500" : "text-slate-400"}`} />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
