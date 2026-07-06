import React from 'react';
import { X } from 'lucide-react';
import { dummyGames } from '../data/dummyData';

import NgolabBurger from '../games/NgolabBurger';
import NgolabCatch from '../games/NgolabCatch';
import NgolabDoodleRoad from '../games/NgolabDoodleRoad';
import NgolabFitnessQuiz from '../games/NgolabFitnessQuiz';
import NgolabMemory from '../games/NgolabMemory';
import NgolabAstroDrift from '../games/NgolabAstroDrift';
import NgolabBeatBounce from '../games/NgolabBeatBounce';
import NgolabNeonMerge from '../games/NgolabNeonMerge';
import NgolabGlowTrail from '../games/NgolabGlowTrail';
import NgolabSkySwipe from '../games/NgolabSkySwipe';
import NgolabNeonSlither from '../games/NgolabNeonSlither';

interface GameContainerMobileProps {
  userId: string | null;
  gameId: string;
  onClose: () => void;
}

export default function GameContainerMobile({ userId, gameId, onClose }: GameContainerMobileProps) {
  const game = dummyGames.find(g => g.id === gameId);

  const handleGameOver = async (score: number) => {
    console.log(`[${gameId}] Game Over! Score:`, score);
    
    // API #2: Tambah Poin (Setelah Main Game)
    const pointsToEarn = Math.max(10, Math.floor(score / 10));
    const description = `Bermain game ${game?.title || gameId}`;

    if (userId) {
      try {
        const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/earn-coins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: pointsToEarn,
            description: description,
          }),
        });

        if (response.ok) {
          alert(`Selamat! Anda berhasil mendapatkan tambahan +${pointsToEarn} Poin (Gami-Poin)!`);
        } else {
          console.warn("Server failed to add points:", response.status);
          // fallback feedback
          alert(`Game selesai! Skor Anda: ${score} (+${pointsToEarn} Poin disimulasikan).`);
        }
      } catch (err) {
        console.error("Gagal mengirim poin ke API:", err);
        alert(`Game selesai! Skor Anda: ${score} (+${pointsToEarn} Poin disimulasikan secara lokal).`);
      }
    } else {
      alert(`Game selesai! Skor Anda: ${score} (+${pointsToEarn} Poin disimulasikan). Silakan masuk/login untuk menyimpan poin.`);
    }
  };

  const renderGame = () => {
    switch (gameId) {
      case 'ngolab-burger': return <NgolabBurger onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-catch': return <NgolabCatch onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-doodle-road': return <NgolabDoodleRoad onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-fitness-quiz': return <NgolabFitnessQuiz onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-memory': return <NgolabMemory onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-astro-drift': return <NgolabAstroDrift onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-beat-bounce': return <NgolabBeatBounce onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-neon-merge': return <NgolabNeonMerge onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-glow-trail': return <NgolabGlowTrail onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-sky-swipe': return <NgolabSkySwipe onGameOver={handleGameOver} onExit={onClose} />;
      case 'ngolab-neon-slither': return <NgolabNeonSlither onGameOver={handleGameOver} onExit={onClose} />;
      default:
        return <div className="text-white p-4">Game tidak ditemukan</div>;
    }
  };

  if (!game) return null;

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto bg-black relative overflow-hidden shadow-2xl sm:border-x sm:border-white/5 font-sans">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm flex items-start justify-between px-4 pt-4 z-30 pointer-events-none">
        
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-12 h-12 rounded-xl bg-gray-900/80 overflow-hidden border border-white/10 p-0.5 shadow-lg backdrop-blur-md">
            <img src={game.thumbnail} alt={game.title} loading="lazy" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
          </div>
          <div className="drop-shadow-md">
            <h3 className="font-bold text-white text-sm tracking-tight truncate w-32">{game.title}</h3>
            <p className="text-[10px] text-gray-300 font-semibold tracking-widest uppercase">{game.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            type="button"
            title="Close game"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 relative bg-black pt-20 overflow-y-auto">
        {renderGame()}
      </div>
    </div>
  );
}
