import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

export default function NgolabMemory({ onGameOver, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const emojis = ['🍔', '🍟', '🍕', '🥤', '☕', '🍩', '🍦', '🍰'];

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setMatchedPairs(0);
    setFlippedIndices([]);
    setIsLocked(false);
    
    let arr = [...emojis, ...emojis];
    arr.sort(() => Math.random() - 0.5);
    setCards(arr.map((emoji, id) => ({ id, emoji, matched: false })));
    
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('GAMEOVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > 0) {
      onGameOver(score);
    }
  }, [gameState]);

  const flipCard = (index: number) => {
    if (isLocked || gameState !== 'PLAYING' || flippedIndices.includes(index) || cards[index].matched) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        // match
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === first || i === second) ? { ...c, matched: true } : c));
          setScore(s => s + 10);
          setMatchedPairs(m => {
            const next = m + 1;
            if (next === emojis.length) {
              // Win! add time bonus
              setScore(s => s + 10 + timeLeft);
              setGameState('GAMEOVER');
            }
            return next;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#0a0a2a] overflow-hidden text-fuchsia-500 flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="absolute top-0 w-full z-20 flex justify-between p-4 px-6 md:px-12 text-xs font-bold font-mono">
        <div className="bg-black/60 border border-fuchsia-500 p-2 px-4 rounded shadow-[0_0_10px_#f0f]">WAKTU: {timeLeft}</div>
        <div className="bg-black/60 border border-fuchsia-500 p-2 px-4 rounded shadow-[0_0_10px_#f0f]">SKOR: {score}</div>
      </div>

      {gameState === 'PLAYING' || gameState === 'GAMEOVER' ? (
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm mt-12 aspect-square">
          {cards.map((card, i) => {
            const isFlipped = flippedIndices.includes(i) || card.matched;
            return (
              <div 
                key={i} 
                className="relative w-full h-full cursor-pointer perspective-1000"
                onClick={() => flipCard(i)}
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full relative preserve-3d"
                >
                  <div className="absolute inset-0 bg-gray-800 border-2 border-fuchsia-500 rounded-xl flex items-center justify-center text-3xl backface-hidden">
                    <span className="text-white opacity-50 font-mono">?</span>
                  </div>
                  <div className="absolute inset-0 bg-gray-700 border-2 border-cyan-400 rounded-xl flex items-center justify-center text-4xl backface-hidden flip-card-back">
                    {card.emoji}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      ) : null}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-center"
          >
            <div className="bg-gray-900 border-2 border-fuchsia-500 p-8 rounded-xl flex flex-col items-center">
              <h1 className="text-2xl text-cyan-400 font-black mb-4">
                {gameState === 'START' ? 'MEMORY MATCH' : matchedPairs === emojis.length ? 'BERHASIL!' : 'WAKTU HABIS!'}
              </h1>
              
              {gameState === 'GAMEOVER' && (
                <div className="mb-6">
                  <p className="text-sm text-gray-300 mb-2">SKOR AKHIR:</p>
                  <p className="text-4xl text-cyan-400 font-bold mb-4">{score}</p>
                </div>
              )}

              <button 
                onClick={initGame}
                className="bg-fuchsia-500 text-white px-6 py-3 rounded font-bold uppercase w-full mb-3 shadow-[0_0_10px_#f0f]"
              >
                {gameState === 'START' ? 'MULAI GAME' : 'MAIN LAGI'}
              </button>
              
              <button 
                onClick={onExit}
                className="bg-gray-800 text-fuchsia-400 border border-fuchsia-500 px-6 py-3 rounded font-bold uppercase w-full"
              >
                KEMBALI KE MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
