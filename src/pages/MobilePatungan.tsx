import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Search, Send, Plus, Gift, CheckCircle2 } from "lucide-react";
import { AppUser } from "../data/appData";
import { API_BASE_URL } from "../lib/api";

interface MobilePatunganProps {
  userId: string | null;
  user: AppUser;
  accessToken?: string | null;
  onRefreshUser?: () => void;
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const endValue = value;
    const duration = 1200; // 1.2s animation

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(
        Math.floor(startValue + (endValue - startValue) * easeProgress),
      );

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function MobilePatungan({ userId, user, accessToken, onRefreshUser }: MobilePatunganProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [successRoom, setSuccessRoom] = useState<any | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomTarget, setNewRoomTarget] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Input contribution per room
  const [contribAmounts, setContribAmounts] = useState<Record<string, string>>({});

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/patungan-rooms`, {
        cache: "no-store",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped = data.map((room: any) => ({
            id: String(room.id || room.room_id || "room-1"),
            title: room.title || room.name || "Patungan Kampus",
            category: room.category || "Kantin",
            targetAmount: Number(room.targetAmount ?? room.target_amount ?? room.target ?? 15000),
            currentAmount: Number(room.currentAmount ?? room.current_amount ?? room.current ?? 0),
            membersCount: Number(room.membersCount ?? room.members_count ?? room.members?.length ?? 3),
            members: room.members || [
              { name: "Vemas", amount: 2000, img: "https://i.pravatar.cc/150?u=1" },
              { name: "Zulfahmi", amount: 4500, img: "https://i.pravatar.cc/150?u=2" },
              { name: "Rizky", amount: 2000, img: "https://i.pravatar.cc/150?u=3" }
            ],
            voucherCode: room.voucherCode ?? room.voucher_code ?? "GAMI-KNTN-88",
            voucherValue: room.voucherValue ?? room.voucher_value ?? "Rp 50.000",
            description: room.description || "Urunan bersama untuk mendapatkan voucher makan siang kantin!"
          }));
          setRooms(mapped);
          setLoadingRooms(false);
          return;
        }
      }
      throw new Error("Invalid structure");
    } catch (err) {
      console.warn("Gagal mengambil patungan rooms dari API, menggunakan cadangan lokal:", err);
      const stored = localStorage.getItem(`patungan_rooms_${userId || 'mock'}`);
      if (stored) {
        setRooms(JSON.parse(stored));
      } else {
        const defaultRooms = [
          {
            id: "room-1",
            title: "Patungan Ultah Vemas",
            category: "Kantin",
            targetAmount: 15000,
            currentAmount: 8500,
            membersCount: 3,
            members: [
              { name: "Vemas", amount: 2000, img: "https://i.pravatar.cc/150?u=1" },
              { name: "Zulfahmi", amount: 4500, img: "https://i.pravatar.cc/150?u=2" },
              { name: "Rizky", amount: 2000, img: "https://i.pravatar.cc/150?u=3" }
            ],
            voucherCode: "GAMI-KNTN-88",
            voucherValue: "Rp 50.000",
            description: "Urunan bersama untuk merayakan ulang tahun Vemas di kantin!"
          },
          {
            id: "room-2",
            title: "Patungan Kopi Senja",
            category: "Kafe",
            targetAmount: 10000,
            currentAmount: 4000,
            membersCount: 2,
            members: [
              { name: "Adit", amount: 2000, img: "https://i.pravatar.cc/150?u=4" },
              { name: "Bagus", amount: 2000, img: "https://i.pravatar.cc/150?u=5" }
            ],
            voucherCode: "GAMI-KOPI-77",
            voucherValue: "Rp 30.000",
            description: "Urunan ngopi bareng sepulang kuliah di Kafe Gesture!"
          }
        ];
        setRooms(defaultRooms);
        localStorage.setItem(`patungan_rooms_${userId || 'mock'}`, JSON.stringify(defaultRooms));
      }
    }
    setLoadingRooms(false);
  };

  useEffect(() => {
    void fetchRooms();
  }, [userId, accessToken]);

  const handleContribute = async (roomId: string, amountStr: string) => {
    setFeedbackError(null);
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setFeedbackError("Masukkan jumlah poin urunan yang valid (lebih dari 0).");
      return;
    }
    if (user.points < amount) {
      setFeedbackError("Saldo poin Anda tidak cukup untuk jumlah urunan ini.");
      return;
    }

    if (!userId) {
      setFeedbackError("Silakan login terlebih dahulu untuk berkontribusi.");
      return;
    }

    setIsFloating(true);
    setSelectedRoomId(roomId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/patungan-rooms/${encodeURIComponent(roomId)}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          amount,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || `HTTP ${response.status}`);
      }

      if (onRefreshUser) onRefreshUser();
      await fetchRooms();

      setTimeout(() => {
        setIsFloating(false);
        const roomObj = rooms.find((r) => r.id === roomId);
        if (roomObj) {
          const isCompleted = roomObj.currentAmount + amount >= roomObj.targetAmount;
          if (isCompleted) {
            setSuccessRoom({
              ...roomObj,
              currentAmount: roomObj.currentAmount + amount,
            });
            setIsSuccess(true);
          }
        }
        setContribAmounts((prev) => ({ ...prev, [roomId]: "" }));
        setToastMessage("Berhasil Urunan");
        setTimeout(() => setToastMessage(null), 3000);
      }, 900);
    } catch (err: any) {
      setIsFloating(false);
      setFeedbackError(err?.message || "Gagal memproses kontribusi patungan.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    if (!newRoomTitle.trim() || !newRoomTarget) return;
    const parsedTarget = parseInt(newRoomTarget, 10);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFeedbackError("Target poin patungan harus lebih dari 0.");
      return;
    }

    const roomId = `room-${Date.now()}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/patungan-rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          id: roomId,
          title: newRoomTitle.trim(),
          target_amount: parsedTarget,
          description: newRoomDesc.trim(),
        }),
      });
      if (res.ok) {
        await fetchRooms();
      } else {
        throw new Error("Fallback local");
      }
    } catch {
      const newRoom = {
        id: roomId,
        title: newRoomTitle.trim(),
        category: "UMKM",
        targetAmount: parsedTarget,
        currentAmount: 0,
        membersCount: 0,
        members: [],
        voucherCode: `GAMI-UMKM-${Math.floor(Math.random() * 100)}`,
        voucherValue: "Sesuai Target",
        description: newRoomDesc.trim() || `Patungan baru untuk ${newRoomTitle.trim()}`,
      };
      const updatedRooms = [newRoom, ...rooms];
      setRooms(updatedRooms);
      localStorage.setItem(`patungan_rooms_${userId || "mock"}`, JSON.stringify(updatedRooms));
    }

    setShowCreateModal(false);
    setNewRoomTitle("");
    setNewRoomTarget("");
    setNewRoomDesc("");
    setToastMessage("Patungan Berhasil Dibuat");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mockFriends = [
    { name: "Mahasiswa Demo", query: "2101001", avatar: "https://i.pravatar.cc/150?u=member" },
    { name: "Ayesha Al Sidiq", query: "ayesha@student.telkomuniversity.ac.id", avatar: "https://i.pravatar.cc/150?u=ayesha" },
    { name: "Rizky Nurd", query: "nurd@student.telkomuniversity.ac.id", avatar: "https://i.pravatar.cc/150?u=nurd" },
  ];

  const suggestedUsers = mockFriends.filter(
    (u) =>
      u.name.toLowerCase().includes(recipient.toLowerCase()) ||
      u.query.toLowerCase().includes(recipient.toLowerCase()),
  );

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setTransferSuccessMsg(null);
    const amount = parseInt(transferAmount, 10);
    if (!transferAmount || !recipient.trim() || isNaN(amount) || amount <= 0) {
      setFeedbackError("Masukkan penerima dan nominal poin yang valid.");
      return;
    }

    if (user.points < amount) {
      setFeedbackError("Saldo poin Anda tidak cukup untuk transfer ini.");
      return;
    }

    if (!userId || !accessToken) {
      setFeedbackError("Silakan login terlebih dahulu.");
      return;
    }

    setIsFloating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/patungan-rooms/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: recipient.trim(),
          amount,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Gagal mengirim poin (HTTP ${res.status})`);
      }

      setTimeout(() => {
        setIsFloating(false);
        setTransferSuccessMsg(data?.message || `Transfer instan sebesar ${amount} PT berhasil!`);
        setTransferAmount("");
        setRecipient("");
        if (onRefreshUser) onRefreshUser();
      }, 800);
    } catch (err: any) {
      setIsFloating(false);
      setFeedbackError(err?.message || "Gagal memproses transfer poin.");
    }
  };

  return (
    <div className="flex-1 w-full relative overflow-y-auto custom-scrollbar p-6 pt-10 font-sans pb-32 bg-[#FAF9F6] rounded-3xl">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] mb-1">
              Gami-Patungan
            </h2>
            <p className="text-[#1A1A1A]/60 text-sm font-semibold tracking-wide">
              Bagi Poin, Bagi Kebahagiaan ({user.points.toLocaleString()} PT tersedia)
            </p>
          </div>
          <button
            type="button"
            aria-label="Buat patungan baru"
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1A1A1A] text-white p-3 rounded-2xl hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {feedbackError && (
          <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {feedbackError}
          </div>
        )}

        {transferSuccessMsg && (
          <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            {transferSuccessMsg}
          </div>
        )}

        {loadingRooms && rooms.length === 0 ? (
          <div role="status" className="text-center py-12 text-gray-500 font-medium">Memuat ruangan patungan...</div>
        ) : (
          <div className="space-y-6 mb-8">
            {rooms.map((room) => {
              const percentage = Math.min(100, Math.floor((room.currentAmount / Math.max(1, room.targetAmount)) * 100));
              const isRoomSuccess = isSuccess && successRoom?.id === room.id;

              return (
                <motion.div
                  key={room.id}
                  id={room.id === "room-1" ? "btn_room_aktif" : undefined}
                  className={`relative bg-white/70 backdrop-blur-xl border ${isRoomSuccess || selectedRoomId === room.id ? "border-[#FF6B00]" : "border-gray-200"} rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#FF6B00]" /> {room.title}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Members Avatar */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex -space-x-3">
                        {room.members.slice(0, 5).map((member: any, i: number) => (
                          <div key={i} className="relative group cursor-pointer">
                            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm relative z-10 group-hover:scale-110 transition-transform">
                              <img
                                src={member.img || `https://i.pravatar.cc/150?u=${member.name}`}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                              {member.name}: +{member.amount} PT
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-400 ml-2">
                        {room.membersCount} Kontribusi
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[11px] text-[#1A1A1A]/50 font-bold uppercase tracking-widest">
                          Terkumpul
                        </p>
                        <p className="text-sm font-extrabold text-[#1A1A1A]">
                          <AnimatedCounter value={room.currentAmount} />{" "}
                          <span className="text-xs text-gray-400 font-semibold">
                            / {room.targetAmount.toLocaleString()} PT
                          </span>
                        </p>
                      </div>

                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner relative mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-orange-400 to-[#FF6B00] rounded-full relative"
                        >
                          <span className="absolute top-0 bottom-0 right-0 w-10 bg-white/40 blur-[4px] -skew-x-12 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Contribute Input Area */}
                    {room.currentAmount < room.targetAmount && (
                      <div className="flex gap-2 mt-4 relative z-20">
                        <input
                          id={room.id === "room-1" ? "input_poin_patungan" : undefined}
                          type="number"
                          min={1}
                          placeholder="Jumlah poin urunan..."
                          value={contribAmounts[room.id] || ""}
                          onChange={(e) => setContribAmounts((prev) => ({ ...prev, [room.id]: e.target.value }))}
                          className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-xs font-bold text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#FF6B00]"
                        />
                        <button
                          id={room.id === "room-1" ? "btn_sumbang_patungan" : undefined}
                          type="button"
                          onClick={() => void handleContribute(room.id, contribAmounts[room.id] || "")}
                          className="bg-[#1A1A1A] hover:bg-gray-800 text-white font-extrabold text-xs px-5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center"
                        >
                          Urunan
                        </button>
                      </div>
                    )}

                    {/* Target Reached Button */}
                    {room.currentAmount >= room.targetAmount && (
                      <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                        <h4 className="font-extrabold text-sm text-[#1A1A1A]">Target Tercapai!</h4>
                        <p className="text-xs text-gray-500 mb-3">Voucher {room.voucherValue} siap diklaim bersama.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccessRoom(room);
                            setShowVoucher(true);
                          }}
                          className="bg-[#FF6B00] text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-500 transition-colors uppercase tracking-wider"
                        >
                          Lihat Voucher
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Voucher Reveal Modal */}
        <AnimatePresence>
          {showVoucher && successRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-white p-6 text-center rounded-[32px] border-2 border-[#FF6B00] shadow-2xl relative"
              >
                <div className="w-16 h-16 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Gift className="w-8 h-8 text-[#FF6B00]" />
                </div>
                <h4 className="font-extrabold text-2xl text-[#1A1A1A] mb-1">
                  Yeay! Voucher Siap
                </h4>
                <p className="text-sm text-[#1A1A1A]/70 font-semibold mb-6">
                  Tunjukkan kode ini ke kasir
                </p>

                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 w-full mb-6">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
                    Kode Voucher ({successRoom.title})
                  </p>
                  <div className="text-2xl font-black text-[#FF6B00] tracking-[0.15em] uppercase font-mono">
                    {successRoom.voucherCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVoucher(false)}
                  className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors w-full uppercase text-xs tracking-wider"
                >
                  Tutup
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-white p-6 rounded-[32px] shadow-2xl relative"
              >
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Buat Patungan Baru</h3>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Judul Patungan</label>
                    <input type="text" required value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-[#1A1A1A] text-sm font-semibold focus:outline-none focus:border-[#FF6B00]" placeholder="Contoh: Kado Wisuda Teman" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Target Poin</label>
                    <input type="number" min={1} required value={newRoomTarget} onChange={(e) => setNewRoomTarget(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-[#1A1A1A] text-sm font-semibold focus:outline-none focus:border-[#FF6B00]" placeholder="Contoh: 50000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Deskripsi</label>
                    <textarea value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[#1A1A1A] text-sm font-semibold focus:outline-none focus:border-[#FF6B00]" placeholder="Deskripsi singkat..." rows={2}></textarea>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-100 text-gray-600 h-12 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors hover:bg-gray-200">Batal</button>
                    <button type="submit" className="flex-1 bg-[#FF6B00] text-white h-12 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg hover:bg-orange-500 transition-colors">Buat</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Coins Animation */}
        <AnimatePresence>
          {isFloating && (
            <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: -100, scale: 1.5 }}
                exit={{ opacity: 0, scale: 2 }}
                transition={{ duration: 1.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 bg-yellow-400 rounded-full border-4 border-yellow-200 shadow-xl shadow-yellow-400/50 flex items-center justify-center text-xs font-black text-yellow-800">C</div>
                <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-lg shadow-yellow-400/50 mt-2 ml-6" />
                <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-lg shadow-yellow-400/50 mt-3 -ml-4" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Message for Katalon Test */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              id="div_status_sumbang"
              role="status"
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl font-bold z-[100]"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Transfer Box */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Send className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="text-lg font-bold text-[#1A1A1A]">
              Kirim Poin Instan (Antar Member)
            </h3>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF6B00] transition-colors" />
              </div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="NIM, Email, No HP, atau Nama Teman"
                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 text-[#1A1A1A] font-semibold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all placeholder:text-gray-400 text-sm relative z-10"
              />

              {/* Dropdown Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestedUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto custom-scrollbar"
                  >
                    {suggestedUsers.map((u, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setRecipient(u.query);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-[#1A1A1A]">{u.name}</span>
                          <span className="block text-[11px] text-gray-400 truncate">{u.query}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Gift className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF6B00] transition-colors" />
              </div>
              <input
                type="number"
                min={1}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Nominal Poin"
                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 text-[#1A1A1A] font-extrabold focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all placeholder:text-gray-400 text-lg"
              />
            </div>

            <button
              type="submit"
              disabled={!transferAmount || !recipient || isFloating}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-all ${
                transferAmount && recipient
                  ? "bg-[#FF6B00] text-white shadow-[0_4px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.5)] active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isFloating ? "Mengirim..." : "Kirim Gami-Poin"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(300px) skewX(-12deg);
          }
        }
      `}</style>
    </div>
  );
}
