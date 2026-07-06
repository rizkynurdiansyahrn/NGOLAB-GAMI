/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from "react";
import { Library as LibraryIcon, X, Sparkles } from "lucide-react";
import { dummyGames } from "../data/dummyData";
import GameCard from "../components/GameCard";

type SortOption = "rating" | "title";

interface LibraryProps {
  onPlay: (gameId: string) => void;
}

export default function Library({ onPlay }: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(new Set(dummyGames.map((game) => game.category))),
    ],
    [],
  );

  const totalGames = dummyGames.length;
  const featuredGames = useMemo(
    () => dummyGames.filter((game) => game.isFeatured),
    [],
  );

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem(
      "ngolab-library-favorites",
    );
    if (savedFavorites) {
      setFavoriteIds(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "ngolab-library-favorites",
      JSON.stringify(favoriteIds),
    );
  }, [favoriteIds]);

  const visibleGames = useMemo(() => {
    return [...dummyGames]
      .filter((game) => {
        const matchesCategory =
          selectedCategory === "Semua" || game.category === selectedCategory;
        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());
        const matchesFavorite =
          !showFavoritesOnly || favoriteIds.includes(game.id);
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
        : [...current, gameId],
    );
  };

  const favoriteCount = favoriteIds.length;

  return (
    <div className="flex flex-1 flex-col space-y-10">
      <div className="rounded-[40px] border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
          <LibraryIcon className="h-10 w-10" />
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tighter text-slate-900">Game Saya</h1>
        <p className="mx-auto max-w-md text-slate-500">
          Game yang baru saja Anda mainkan dan favorit Anda. Akses secara instan dari perangkat kampus mana pun.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total Game</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{totalGames}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Unggulan</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{featuredGames.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Favorit</p>
            <div className="mt-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <p className="text-3xl font-black text-slate-900">{favoriteCount}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Perpustakaan Saya
            </h2>
            <p className="text-sm text-slate-500">
              {visibleGames.length} game ditampilkan
              {selectedCategory !== "Semua" && ` di kategori ${selectedCategory}`}
              {showFavoritesOnly && " · Hanya Favorit"}.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <label htmlFor="library-search" className="sr-only">
                Cari game
              </label>
              <input
                id="library-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul game..."
                className="w-full rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowFavoritesOnly((current) => !current)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  showFavoritesOnly
                    ? "border-pink-500 bg-pink-500 text-white shadow-lg shadow-pink-500/10"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-900"
                }`}
              >
                {favoriteCount > 0 ? `Favorit (${favoriteCount})` : "Favorit"}
              </button>
              <label htmlFor="sort-by" className="sr-only">
                Urutkan game
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="rating">Urutkan berdasarkan rating</option>
                <option value="title">Urutkan berdasarkan judul</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("Semua");
                  setSearchTerm("");
                  setShowFavoritesOnly(false);
                  setSortBy("rating");
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-slate-900"
              >
                Reset filter
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              id={`btn_filter_${category.toLowerCase()}`}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-900"
              }`}
            >
              {category}
            </button>
          ))}
          {showFavoritesOnly && favoriteCount > 0 && (
            <span className="ml-auto rounded-full bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700">
              Hanya menampilkan favorit
            </span>
          )}
        </div>

        {visibleGames.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
            Tidak ada game yang cocok dengan filter ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleGames.map((game) => (
              <article key={game.id}>
                <GameCard
                  game={game}
                  onPlay={onPlay}
                  isFavorite={favoriteIds.includes(game.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
