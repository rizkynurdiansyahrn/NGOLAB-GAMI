import React, { useState } from 'react';
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
  const [gameOverData, setGameOverData] = useState<{ score: number; points: number } | null>(null);

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
          // show game over modal while preserving existing API
          setGameOverData({ score, points: pointsToEarn });
        } else {
          console.warn("Server failed to add points:", response.status);
          // fallback: still show modal but mark points as simulated
          setGameOverData({ score, points: pointsToEarn });
        }
      } catch (err) {
        console.error("Gagal mengirim poin ke API:", err);
        setGameOverData({ score, points: pointsToEarn });
      }
    } else {
      setGameOverData({ score, points: pointsToEarn });
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
        <div className="max-w-4xl mx-auto p-6">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0b0b0f] to-[#121015] shadow-2xl border border-white/5">
            {/* Game viewport area */}
            <div className="relative w-full h-[580px] sm:h-[640px]">
              {renderGame()}
            </div>

            {/* Bottom controls / actions */}
            <div className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF6B00] text-black font-bold px-3 py-2 rounded-xl">SCOOP</div>
                <div className="text-sm text-gray-300">{game?.title}</div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-xl">Bagikan</button>
                <button onClick={onClose} className="text-sm text-white bg-[#FF6B00] px-4 py-2 rounded-xl font-bold">Keluar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal (visual only) */}
      {gameOverData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setGameOverData(null)} />
          <div className="relative w-full max-w-4xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl text-white">
            <div className="flex items-start gap-6">
              <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_10px_40px_rgba(255,140,0,0.2)]">
                <img src="/public/thumbnails/trophy.png" alt="trophy" className="w-16 h-16 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold text-white">PERMAINAN SELESAI!</h2>
                <p className="text-sm text-gray-300 mt-2">Terima kasih telah bermain <span className="font-bold text-white">{game?.title}</span>. Berikut rangkuman permainannya.</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/40 p-4 rounded-2xl">
                    <p className="text-xs text-gray-300 uppercase">Skor Akhir</p>
                    <p className="text-2xl font-bold text-white">{gameOverData.score.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-900/40 p-4 rounded-2xl">
                    <p className="text-xs text-gray-300 uppercase">Poin Didapat</p>
                    <p className="text-2xl font-bold text-[#FF6B00]">+{gameOverData.points.toLocaleString()} PT</p>
                  </div>
                  <div className="bg-gray-900/40 p-4 rounded-2xl">
                    <p className="text-xs text-gray-300 uppercase">Peringkat Sementara</p>
                    <p className="text-2xl font-bold text-white">#42</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-xs text-gray-300 mb-2">Progres Peringkat</div>
                  <div className="w-full bg-white/5 rounded-full h-4">
                    <div className="h-4 rounded-full bg-[#FF6B00]" style={{ width: '42%' }} />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => { setGameOverData(null); }} className="bg-[#FF6B00] text-black px-5 py-3 rounded-2xl font-bold">Lihat Rapor Skor</button>
                  <button onClick={() => { setGameOverData(null); onClose(); }} className="bg-transparent border border-white/10 text-white px-4 py-3 rounded-2xl">Kembali</button>
                </div>
              </div>
            </div>

            {/* Suggestions row */}
            <div className="mt-8">
              <h4 className="text-sm text-gray-300 mb-3">Lanjut Main Yuk?</h4>
              <div className="grid grid-cols-3 gap-4">
                {dummyGames.slice(0,3).map(g => (
                  <div key={g.id} className="bg-gray-900/30 rounded-2xl p-3 flex flex-col items-center">
                    <img src={g.thumbnail} className="w-full h-20 object-cover rounded-2xl mb-2" referrerPolicy="no-referrer" />
                    <div className="text-xs font-bold text-white">{g.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
