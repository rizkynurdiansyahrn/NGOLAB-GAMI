import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const questionsDB = [
  { question: "Sumber protein terbaik untuk pembentukan otot adalah?", options: ["Dada Ayam", "Nasi Putih", "Keripik Kentang", "Gula Pasir"], answer: 0 },
  { question: "Berapa anjuran minimal minum air putih harian untuk orang dewasa?", options: ["1 Liter", "2 Liter", "500 ml", "4 Liter"], answer: 1 },
  { question: "Olahraga kardiovaskular sangat baik untuk melatih organ apa?", options: ["Paru-paru & Jantung", "Otot Bicep", "Tulang Kering", "Mata"], answer: 0 },
  { question: "Kapan waktu terbaik mengonsumsi karbohidrat kompleks?", options: ["Sebelum tidur", "Sebelum olahraga", "Saat menonton TV", "Tengah malam"], answer: 1 },
  { question: "Nutrisi makro apa yang berfungsi sebagai sumber energi utama tubuh?", options: ["Protein", "Vitamin", "Karbohidrat", "Mineral"], answer: 2 },
  { question: "Sayuran berwarna hijau gelap biasanya kaya akan mineral apa?", options: ["Zat Besi", "Natrium", "Gula", "Lemak Trans"], answer: 0 },
  { question: "Berapa jam waktu tidur ideal untuk pemulihan otot mahasiswa?", options: ["3-4 jam", "5-6 jam", "7-9 jam", "10-12 jam"], answer: 2 },
  { question: "Contoh lemak sehat (HDL) bisa didapatkan dari makanan?", options: ["Gorengan", "Alpukat", "Mie Instan", "Mentega"], answer: 1 },
  { question: "Aktivitas pemanasan sebelum olahraga bertujuan untuk?", options: ["Membakar otot", "Mencegah cedera", "Mendinginkan tubuh", "Menghemat waktu"], answer: 1 },
  { question: "Vitamin apa yang paling banyak dihasilkan tubuh saat terkena sinar matahari pagi?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], answer: 3 },
  { question: "Diet yang sehat sebaiknya?", options: ["Tidak makan sama sekali", "Hanya makan daging", "Seimbang dan bervariasi", "Hanya minum air"], answer: 2 },
  { question: "Membakar lemak paling efektif dengan kombinasi latihan?", options: ["Tidur & Makan", "Kardio & Angkat Beban", "Peregangan saja", "Nonton & Ngemil"], answer: 1 },
  { question: "Minuman mana yang paling baik dikonsumsi setelah olahraga berat?", options: ["Soda", "Kopi", "Air Putih / Elektrolit", "Boba"], answer: 2 },
  { question: "Apa efek terlalu banyak mengonsumsi gula olahan?", options: ["Otot membesar", "Peningkatan berat badan (lemak)", "Mata lebih sehat", "Tulang kuat"], answer: 1 },
  { question: "Cara terbaik mengukur kemajuan program kebugaran adalah?", options: ["Timbang berat setiap jam", "Melihat perubahan komposisi tubuh", "Hanya melihat skala timbangan", "Berhenti makan sehari"], answer: 1 }
];

export default function NgolabFitnessQuiz({ onGameOver, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shakeTimer, setShakeTimer] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('GAMEOVER');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > 0) {
      onGameOver(score);
    }
  }, [gameState]);

  const initGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCurrentIndex(0);
    
    // shuffle questions
    const shuffledQs = [...questionsDB].sort(() => Math.random() - 0.5).map(q => {
      // shuffle options and track correct answer
      let opts = q.options.map((text, i) => ({ text, isCorrect: i === q.answer }));
      opts.sort(() => Math.random() - 0.5);
      return { ...q, options: opts };
    });
    
    setQuestions(shuffledQs);
    setGameState('PLAYING');
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 10);
    } else {
      setTimeLeft(t => Math.max(0, t - 3));
      setShakeTimer(true);
      setTimeout(() => setShakeTimer(false), 300);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setGameState('GAMEOVER');
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="relative w-full min-h-screen bg-[#121212] overflow-hidden text-[#FF6B00] flex flex-col font-sans">
      
      {gameState === 'PLAYING' && currentQ && (
        <>
          <header className="flex justify-between items-center text-xl font-bold p-6 border-b-2 border-[#FF6B00]">
            <div>Skor: <span className="text-white">{score}</span></div>
            <div className={`${shakeTimer ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              Waktu: {timeLeft}s
            </div>
          </header>

          <div className="flex-1 flex flex-col justify-center p-6 max-w-2xl mx-auto w-full relative z-10">
            <h2 className="text-2xl md:text-3xl text-center mb-10 text-white leading-relaxed">
              {currentQ.question}
            </h2>
            <div className="flex flex-col gap-4">
              {currentQ.options.map((opt: any, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.isCorrect)}
                  className="bg-transparent text-[#FF6B00] border-2 border-[#FF6B00] rounded-xl p-5 text-lg font-bold hover:bg-[#FF6B00] hover:text-[#121212] active:scale-[0.98] transition-all text-left"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#121212] p-8 text-center"
          >
            <h1 className="text-4xl text-white font-black uppercase tracking-wider mb-6">
              {gameState === 'START' ? 'KUIS KEBUGARAN' : 'KUIS SELESAI!'}
            </h1>
            
            {gameState === 'START' && (
              <p className="text-lg text-gray-300 mb-10">Jawab cepat! Benar +10 poin.<br/>Salah potong waktu 3 detik!</p>
            )}
            
            {gameState === 'GAMEOVER' && (
              <div className="text-3xl mb-10">
                <p className="text-gray-400 text-lg mb-2">Total Skor:</p>
                <p className="text-[#FF6B00] font-bold text-5xl">{score}</p>
              </div>
            )}

            <button 
              onClick={initGame}
              className="bg-[#FF6B00] text-[#121212] px-8 py-4 rounded-xl text-xl font-bold uppercase hover:bg-orange-600 transition-colors mb-4 w-full max-w-sm"
            >
              {gameState === 'START' ? 'Mulai Kuis' : 'Main Lagi'}
            </button>
            <button 
              onClick={onExit}
              className="bg-transparent border border-gray-600 text-gray-400 px-8 py-4 rounded-xl text-xl font-bold uppercase hover:bg-gray-800 transition-colors w-full max-w-sm"
            >
              Kembali
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
