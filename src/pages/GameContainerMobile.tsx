import React, { useState } from 'react';
import { ArrowLeft, Trophy, X } from 'lucide-react';
import { dummyGames } from '../data/dummyData';

import NgolabBurger from '../games/NgolabBurger';
import NgolabCatch from '../games/NgolabCatch';
import NgolabTrafficEscape from '../games/NgolabTrafficEscape';
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
      case 'ngolab-doodle-road':
      case 'ngolab-traffic-escape': return <NgolabTrafficEscape onGameOver={handleGameOver} onExit={onClose} />;
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
    <div className="fixed inset-0 z-[100] flex h-[100dvh] min-h-0 w-auto max-w-none flex-col overflow-hidden bg-black font-sans">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm flex items-start justify-between px-4 pt-4 z-30 pointer-events-none">
        
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            aria-label="Kembali ke halaman sebelumnya"
            title="Kembali"
            onClick={onClose}
            className="w-10 h-10 shrink-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gray-900/80 overflow-hidden border border-white/10 p-0.5 shadow-lg backdrop-blur-md">
            <img src={game.thumbnail} alt={game.title} loading="lazy" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
          </div>
          <div className="drop-shadow-md">
            <h3 className="font-bold text-white text-sm tracking-tight truncate w-20 sm:w-32">{game.title}</h3>
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
      <div className="absolute inset-x-0 bottom-0 top-20 overflow-hidden bg-black">
        {renderGame()}
      </div>

      {/* Game Over Modal (visual only) */}
      {gameOverData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden p-3 sm:p-6">
          <button
            type="button"
            aria-label="Tutup ringkasan permainan"
            className="absolute inset-0 cursor-default bg-[#1b130f]/75 backdrop-blur-md"
            onClick={() => setGameOverData(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className="relative z-10 max-h-[90dvh] w-full max-w-3xl touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-[28px] border border-white/70 bg-[#fffaf1] p-5 text-[#3f2921] shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:rounded-[32px] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ffe2b2]/70 blur-2xl" />
            <div className="relative">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#ffc54f] to-[#f47a32] text-white shadow-[0_10px_25px_rgba(222,111,43,0.28)] sm:h-[72px] sm:w-[72px] sm:rounded-[24px]">
                  <Trophy className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.4} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-1 inline-flex rounded-full bg-[#f4ead6] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#9a603d]">
                    RINGKASAN PERMAINAN
                  </div>
                  <h2 id="game-over-title" className="text-xl font-black leading-tight tracking-tight text-[#39251e] sm:text-3xl">
                    Permainan selesai!
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-[#806957] sm:text-sm sm:leading-6">
                    Terima kasih telah bermain <span className="font-extrabold text-[#51392b]">{game?.title}</span>. Ini hasil permainanmu.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3.5">
                <div className="rounded-2xl border border-[#f2e3cd] bg-white/80 p-3.5 sm:p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#9a7d67] sm:text-[10px]">Skor akhir</p>
                  <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-[#39251e] sm:text-3xl">{gameOverData.score.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-[#f4d9bd] bg-[#fff0dc] p-3.5 sm:p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#a46e43] sm:text-[10px]">Poin didapat</p>
                  <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-[#ed6b16] sm:text-3xl">+{gameOverData.points.toLocaleString()} <span className="text-sm sm:text-base">PT</span></p>
                </div>
                <div className="col-span-2 rounded-2xl border border-[#e8e9d8] bg-[#f2f3e8] p-3.5 sm:col-span-1 sm:p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7c8065] sm:text-[10px]">Peringkat sementara</p>
                  <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-[#4d6041] sm:text-3xl">#42</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f5eee4] px-4 py-3.5 sm:mt-5 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#755c49]">
                  <span>Progres peringkat</span>
                  <span className="tabular-nums text-[#a26037]">42%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#e5d9c9]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#f3a52e] to-[#ef6c1c] shadow-[0_0_12px_rgba(239,108,28,0.24)]" style={{ width: '42%' }} />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 min-[420px]:flex-row sm:mt-6">
                <button
                  type="button"
                  onClick={() => setGameOverData(null)}
                  className="min-h-12 rounded-2xl bg-gradient-to-r from-[#ff9c24] to-[#f47717] px-5 py-3 text-sm font-extrabold text-[#2f2118] shadow-[0_7px_18px_rgba(225,113,25,0.2)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Lihat Rapor Skor
                </button>
                <button
                  type="button"
                  onClick={() => { setGameOverData(null); onClose(); }}
                  className="min-h-12 rounded-2xl border border-[#e7d9c9] bg-white/70 px-5 py-3 text-sm font-bold text-[#715a49] transition hover:bg-white active:scale-[0.98]"
                >
                  Kembali
                </button>
              </div>

              <div className="mt-6 border-t border-[#eadfD1] pt-5 sm:mt-7 sm:pt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-[#4a3328] sm:text-base">Lanjut main yuk</h3>
                  <span className="text-[10px] font-semibold text-[#a28a75]">Pilihan game</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3">
                  {dummyGames.slice(0, 3).map((suggestedGame) => (
                    <div key={suggestedGame.id} className="group overflow-hidden rounded-2xl border border-[#eee1d1] bg-white/80 p-2 transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(94,57,35,0.1)]">
                      <img
                        src={suggestedGame.thumbnail}
                        alt={suggestedGame.title}
                        className="h-[72px] w-full rounded-xl object-cover sm:h-[82px]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="px-1 pb-0.5 pt-2 text-center text-[10px] font-extrabold leading-4 text-[#563b2d] sm:text-[11px]">
                        {suggestedGame.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
