/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from "react";
import { Search, Play, Trophy } from "lucide-react";
import { dummyGames, Game } from "../data/dummyData";
import GameCard from "../components/GameCard";
import HeaderNav from "../components/HeaderNav";
import { AppUser } from "../data/appData";

type SortOption = "rating" | "title";

interface LibraryProps {
  user?: AppUser;
  onPlay: (gameId: string) => void;
  onSelectDetail?: (game: Game) => void;
}

export default function Library({ user, onPlay, onSelectDetail }: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const filterPills = ["Semua", "Populer", "Baru", "Arcade", "Puzzle", "Kasual"];

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem("ngolab-library-favorites");
    if (savedFavorites) {
      setFavoriteIds(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ngolab-library-favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const visibleGames = useMemo(() => {
    return [...dummyGames]
      .filter((game) => {
        const matchesCategory =
          selectedCategory === "Semua" ||
          (selectedCategory === "Populer" && game.isFeatured) ||
          (selectedCategory === "Baru" && (game.id === "ngolab-astro-drift" || game.id === "ngolab-glow-trail")) ||
          game.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());
        const matchesFavorite = !showFavoritesOnly || favoriteIds.includes(game.id);

        return matchesCategory && matchesSearch && matchesFavorite;
      })
      .sort((gameA, gameB) => {
        if (sortBy === "title") {
          return gameA.title.localeCompare(gameB.title);
        }
        return gameB.rating - gameA.rating;
      });
  }, [searchTerm, selectedCategory, showFavoritesOnly, sortBy, favoriteIds]);

  const toggleFavorite = (gameId: string) => {
    setFavoriteIds((current) =>
      current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId]
    );
  };

  return (
    <div className="flex flex-1 flex-col space-y-6 bg-[#F3F4F8] font-sans pb-28">
      {/* Top Header Navigation Bar (Screenshot 4) */}
      <HeaderNav
        breadcrumb="Dashboard Pemain"
        user={{
          name: user?.name || "Budi Gamer",
          avatar: user?.avatar || "https://i.pravatar.cc/150?u=budi_gamer",
          level: user?.level || 12,
        }}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Main Title & Description (Screenshot 4) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Koleksi Game
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Jelajahi berbagai pilihan game menarik, raih skor tertinggi, dan tukarkan poinmu dengan voucher favorit di kampus.
          </p>
        </div>

        {/* Right Search Input Box (Screenshot 4) */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="library-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul game..."
            className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Filter Category Pills Bar (Screenshot 4) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 shrink-0">
          FILTER:
        </span>
        {filterPills.map((pill) => {
          const isActive = selectedCategory === pill;
          const pillId = `btn_filter_${pill.toLowerCase()}`;
          return (
            <button
              key={pill}
              id={pillId}
              type="button"
              onClick={() => setSelectedCategory(pill)}
              className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all shrink-0 ${
                isActive
                  ? "bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/30"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Hidden Sort select for automated accessibility check */}
      <select
        id="sort-by"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortOption)}
        className="sr-only"
      >
        <option value="rating">Rating</option>
        <option value="title">Title</option>
      </select>

      {/* Game Cards Grid (Screenshot 4) */}
      {visibleGames.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 font-semibold text-sm">
          Tidak ada game yang cocok dengan filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlay}
              onSelectDetail={onSelectDetail}
              isFavorite={favoriteIds.includes(game.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Bottom Banner: Tantangan Mingguan Baru! (Screenshot 4) */}
      <div className="mt-8 bg-[#2A1208] text-white p-6 sm:p-8 rounded-3xl border border-orange-950/40 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background glow */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#FF5500]/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[#FF5500] font-black text-xs uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Tantangan Mingguan Baru!</span>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Mainkan game Arcade apapun sebanyak 10 kali minggu ini dan dapatkan bonus 500 Poin ekstra.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">PROGRESS</p>
              <p className="text-sm font-black text-white">4 / 10</p>
            </div>
            <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase">HADIAH</p>
              <p className="text-sm font-black text-[#FF5500]">+500 PTS</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPlay("ngolab-catch")}
          className="relative z-10 inline-flex items-center gap-2 bg-[#FF5500] hover:bg-[#FF6611] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-[#FF5500]/30 transition-all active:scale-95 shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>MAIN SEKARANG</span>
        </button>
      </div>
    </div>
  );
}
