/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, TrendingUp, X } from "lucide-react";
import { dummyGames, Game } from "../data/dummyData";
import GameCard from "../components/GameCard";
import NgolabBurger from "../games/NgolabBurger";
import NgolabCatch from "../games/NgolabCatch";
import NgolabDoodleRoad from "../games/NgolabDoodleRoad";
import NgolabFitnessQuiz from "../games/NgolabFitnessQuiz";
import NgolabMemory from "../games/NgolabMemory";
import NgolabAstroDrift from "../games/NgolabAstroDrift";
import NgolabBeatBounce from "../games/NgolabBeatBounce";
import NgolabNeonMerge from "../games/NgolabNeonMerge";
import NgolabGlowTrail from "../games/NgolabGlowTrail";
import NgolabSkySwipe from "../games/NgolabSkySwipe";
import NgolabNeonSlither from "../games/NgolabNeonSlither";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function GameHub() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const featuredGame = dummyGames.find((g) => g.isFeatured) || dummyGames[0];

  const handlePlay = (game: Game) => {
    setActiveGame(game);
  };

  const closeActiveGame = () => setActiveGame(null);

  const handleGameOver = (score: number) => {
    console.log("[GameHub] Game completed with score:", score);
  };

  const renderActiveGame = (game: Game) => {
    switch (game.id) {
      case "ngolab-burger":
        return <NgolabBurger onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-catch":
        return <NgolabCatch onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-doodle-road":
        return <NgolabDoodleRoad onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-fitness-quiz":
        return <NgolabFitnessQuiz onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-memory":
        return <NgolabMemory onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-astro-drift":
        return <NgolabAstroDrift onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-beat-bounce":
        return <NgolabBeatBounce onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-neon-merge":
        return <NgolabNeonMerge onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-glow-trail":
        return <NgolabGlowTrail onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-sky-swipe":
        return <NgolabSkySwipe onGameOver={handleGameOver} onExit={closeActiveGame} />;
      case "ngolab-neon-slither":
        return <NgolabNeonSlither onGameOver={handleGameOver} onExit={closeActiveGame} />;
      default:
        return (
          <div className="p-10 text-center text-slate-500">
            Game ini belum tersedia untuk dimainkan.
          </div>
        );
    }
  };

  return (
    <div className="flex-1 space-y-10 pb-12">
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm"
          >
            {renderActiveGame(activeGame)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden rounded-[40px] bg-indigo-600 shadow-2xl shadow-indigo-500/20">
        <img
          src={featuredGame.thumbnail}
          alt={featuredGame.title}
          className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-indigo-900/40 to-transparent" />
        
        <div className="relative flex h-full flex-col justify-center px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <TrendingUp className="h-3 w-3" />
              Pilihan Terbaik untuk Anda
            </div>
            
            <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl">
              {featuredGame.title}
            </h1>
            
            <p className="text-lg text-indigo-100">
              Langsung masuk ke aksi. Tanpa unduhan, tanpa menunggu. Hanya keseruan game kampus yang murni.
            </p>
            
            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={() => handlePlay(featuredGame)}
                className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-indigo-600 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                Main Sekarang
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Game Grid */}
      <section>
        <div className="mb-8 flex items-center justify-between px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Semua Game</h2>
          <div className="flex gap-2">
            {['Semua', 'Action', 'Puzzle', 'Simulation'].map((cat) => (
              <button 
                key={cat} 
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  cat === 'Semua' 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-500/50 hover:text-indigo-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dummyGames.map((game) => (
            <div key={game.id} onClick={() => handlePlay(game)} className="cursor-pointer">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
