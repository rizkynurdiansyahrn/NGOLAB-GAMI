import React, { useState } from "react";
import {
  ArrowLeft,
  Star,
  Users,
  Share2,
  Gamepad2,
  Clock,
  Trophy,
  Zap,
  Award,
} from "lucide-react";
import { Game, dummyGames } from "../data/dummyData";
import HeaderNav from "../components/HeaderNav";
import { AppUser } from "../data/appData";

interface GameDetailProps {
  gameId?: string;
  gameObj?: Game;
  user?: AppUser;
  onBack: () => void;
  onPlay: (gameId: string) => void;
}

export default function GameDetail({
  gameId = "ngolab-catch",
  gameObj,
  user,
  onBack,
  onPlay,
}: GameDetailProps) {
  const [activeTab, setActiveTab] = useState<"deskripsi" | "aturan" | "hadiah">("deskripsi");

  // Find game details from dummyGames if not provided
  const game = gameObj || dummyGames.find((g) => g.id === gameId) || dummyGames[0];

  const screenshots = [
    game.thumbnail,
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F3F4F8] font-sans pb-24">
      {/* Top Header Nav Bar */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4">
        <HeaderNav breadcrumb="Game Detail" user={user} />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Section Card */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 shadow-lg border border-slate-200">
          <div className="h-64 sm:h-80 md:h-96 w-full relative">
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-full h-full object-cover opacity-70"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Top Back Arrow */}
            <button
              onClick={onBack}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-colors z-20"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Bottom Overlay Content */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-20">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#FF5500] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                    {game.category}
                  </span>
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
                    POPULER
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                  {game.title}
                </h1>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-bold">{game.rating}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span>1,250 Pemain Aktif</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Bagikan"
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onPlay(game.id)}
                  className="px-6 py-3 bg-[#FF5500] hover:bg-[#FF6611] text-white font-bold text-sm rounded-full shadow-lg shadow-[#FF5500]/30 transition-all active:scale-95"
                >
                  Main Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width): Details, Tabs, Screenshots */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              {/* Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl mb-6 max-w-sm">
                <button
                  onClick={() => setActiveTab("deskripsi")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "deskripsi"
                      ? "bg-[#FF5500] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  DESKRIPSI
                </button>
                <button
                  onClick={() => setActiveTab("aturan")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "aturan"
                      ? "bg-[#FF5500] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  ATURAN MAIN
                </button>
                <button
                  onClick={() => setActiveTab("hadiah")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "hadiah"
                      ? "bg-[#FF5500] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  HADIAH
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "deskripsi" && (
                <div className="space-y-6">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {(game as any).description ||
                      `${game.title} adalah game arcade seru yang menguji ketangkasan Anda dalam menangkap item-item ikonik kampus yang jatuh dari langit. Semakin banyak item yang Anda tangkap, semakin tinggi poin yang Anda kumpulkan! Gunakan poin tersebut untuk menukarkan berbagai voucher makanan dan minuman menarik di kantin kampus. Hati-hati dengan rintangan yang jatuh, karena itu bisa mengurangi nyawa Anda!`}
                  </p>

                  {/* Info Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 text-[#FF5500] flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          MODE GAME
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          Single Player
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 text-[#FF5500] flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          DURASI RATA-RATA
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          2 - 5 Menit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "aturan" && (
                <div className="space-y-3 text-sm text-slate-600">
                  <p className="font-bold text-slate-900">Aturan Bermain:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Gunakan tombol panah atau geser layar untuk menggerakkan karakter.</li>
                    <li>Tangkap item kampus untuk mendapatkan poin (+10 PTS per item).</li>
                    <li>Hindari rintangan yang jatuh agar nyawa tidak berkurang.</li>
                    <li>Setiap akhir permainan, poin otomatis ditambahkan ke saldo akun Anda.</li>
                  </ul>
                </div>
              )}

              {activeTab === "hadiah" && (
                <div className="space-y-3 text-sm text-slate-600">
                  <p className="font-bold text-slate-900">Potensi Hadiah:</p>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <Zap className="w-5 h-5 text-[#FF5500]" />
                    <span className="text-slate-800 font-semibold">Dapatkan hingga 500 Poin per sesi permainan!</span>
                  </div>
                </div>
              )}

              {/* Screenshots Gallery Section */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 mb-4">
                  Cuplikan Game
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {screenshots.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
                    >
                      <img
                        src={img}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width): Sidebar Widgets */}
          <div className="space-y-6">
            {/* Widget 1: Leaderboard Preview */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Papan Peringkat
                </h3>
                <Trophy className="w-5 h-5 text-[#FF5500]" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">1</span>
                    <img
                      src="https://i.pravatar.cc/150?u=andi"
                      alt="Player 1"
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800">Andi Saputra</span>
                  </div>
                  <span className="text-xs font-black text-[#FF5500]">12,450</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">2</span>
                    <img
                      src="https://i.pravatar.cc/150?u=siti"
                      alt="Player 2"
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800">Siti Aminah</span>
                  </div>
                  <span className="text-xs font-black text-[#FF5500]">11,200</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">3</span>
                    <img
                      src="https://i.pravatar.cc/150?u=budi"
                      alt="Player 3"
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800">Budi Santoso</span>
                  </div>
                  <span className="text-xs font-black text-[#FF5500]">10,870</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full text-center text-xs font-black text-[#FF5500] hover:underline uppercase tracking-wider"
              >
                LIHAT SEMUA PERINGKAT
              </button>
            </div>

            {/* Widget 2: User Achievement Progress */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Pencapaian Anda
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                PROGRES LEVEL 12 (85%)
              </p>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                <div className="bg-[#FF5500] h-full w-[85%] rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FF5500]" />
                  <div>
                    <p className="text-sm font-black text-slate-900">24</p>
                    <p className="text-[10px] font-semibold text-slate-400">Lencana</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#FF5500]" />
                  <div>
                    <p className="text-sm font-black text-slate-900">1.2k</p>
                    <p className="text-[10px] font-semibold text-slate-400">Poin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 3: Ready to Play Card */}
            <div className="bg-slate-50 rounded-3xl p-6 shadow-sm border border-slate-200 text-left">
              <div className="w-10 h-10 rounded-xl bg-[#FF5500] text-white flex items-center justify-center mb-3">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                Siap Bermain?
              </h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Kumpulkan poin harianmu dan jadilah legenda kampus di NGOLAB-GAMI.
              </p>
              <button
                type="button"
                onClick={() => onPlay(game.id)}
                className="w-full py-3 bg-[#FF5500] hover:bg-[#FF6611] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#FF5500]/20 transition-all active:scale-95"
              >
                Mulai Main
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
