import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Wallet, Check, TicketPercent, ShieldCheck } from "lucide-react";
import { AppUser, vouchers, Voucher } from "../data/appData";

interface MobileRewardsProps {
  userId: string | null;
  user: AppUser;
  onRefreshUser?: () => void;
}

export default function MobileRewards({ userId, user, onRefreshUser }: MobileRewardsProps) {
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [voucherList, setVoucherList] = useState<Voucher[]>(vouchers);
  const [activeVouchers, setActiveVouchers] = useState<any[]>([]);

  // Voucher validation form states
  const [valVoucherCode, setValVoucherCode] = useState("");
  const [valTotalPrice, setValTotalPrice] = useState(50000);
  const [valResult, setValResult] = useState<{ valid: boolean; message: string; discount?: number } | null>(null);
  const [valLoading, setValLoading] = useState(false);

  // Fetch active vouchers of the user (API #3C)
  const fetchUserVouchers = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://geasture.kolab.top/api/coin-promos/user-vouchers/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setActiveVouchers(data);
        }
      }
    } catch (err) {
      console.warn("Gagal memuat voucher aktif user dari API:", err);
    }
  };

  useEffect(() => {
    fetchUserVouchers();
  }, [userId, selectedVoucher]);

  // Fetch Voucher Promos (API #3A)
  useEffect(() => {
    let isMounted = true;
    const fetchPromos = async () => {
      try {
        const response = await fetch("https://geasture.kolab.top/api/coin-promos");
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const data = await response.json();
        
        if (isMounted && Array.isArray(data)) {
          const mapped = data.map((promo: any): Voucher => ({
            id: String(promo.id ?? promo.id_promo ?? promo.code ?? Math.random()),
            title: promo.title ?? promo.name ?? "Promo Voucher",
            description: promo.description ?? promo.info ?? "Nikmati potongan harga spesial.",
            pointsCost: Number(promo.pointsCost ?? promo.points ?? promo.cost ?? promo.coins ?? 100),
            image: promo.image ?? promo.thumbnail ?? "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300",
            category: promo.category ?? "Food",
          }));
          setVoucherList(mapped);
        }
      } catch (err) {
        console.warn("Gagal memuat katalog voucher dari API, menggunakan data mock lokal:", err);
      }
    };

    fetchPromos();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 w-full bg-transparent overflow-y-auto custom-scrollbar p-6 pt-12 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header and Balance */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Marketplace Hadiah</h2>
            <p className="text-sm text-gray-400">Tukarkan poinmu dengan berbagai voucher menarik.</p>
          </div>

          <div className="bg-gradient-to-r from-[#FF6B00] to-orange-500 rounded-[28px] p-4 shadow-lg flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center border border-white/10">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-orange-100 uppercase tracking-wider">Saldo</div>
              <div className="text-2xl font-bold text-white">{user.points.toLocaleString()} <span className="text-sm text-orange-200">PT</span></div>
            </div>
          </div>
        </div>

        {/* Category Tabs & Filters */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight">Tukar Voucher</h3>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-white/5 text-sm text-white">Semua</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 text-sm text-white">Makanan & Minuman</button>
            <button className="px-4 py-2 rounded-xl bg-white/5 text-sm text-white">OVO / E-Wallet</button>
          </div>
        </div>

        {/* Grid of reward cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {voucherList.map((v, index) => {
            const canAfford = user.points >= v.pointsCost;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gray-900 rounded-2xl overflow-hidden border shadow-lg ${canAfford ? 'border-[#FF6B00]/30 cursor-pointer' : 'border-white/5 opacity-70'}`}
              >
                <div className="relative h-44 w-full">
                  <img src={v.image} alt={v.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#FF6B00] font-bold uppercase tracking-wider">{v.category}</div>
                      <h4 className="text-white font-bold mt-2">{v.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{v.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#FF6B00]">{v.pointsCost.toLocaleString()} PT</div>
                      <div className="mt-3">
                        {canAfford ? (
                          <button onClick={() => setSelectedVoucher(v.id)} className="bg-[#FF6B00] text-black px-3 py-2 rounded-xl font-bold">Tukarkan</button>
                        ) : (
                          <button disabled className="bg-white/5 text-gray-400 px-3 py-2 rounded-xl">Kurang</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My Voucher preview */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-white mb-4">Voucher Saya</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeVouchers.length === 0 ? (
              <div className="bg-gray-900/30 rounded-2xl p-6 text-center text-gray-400">Belum ada voucher aktif.</div>
            ) : activeVouchers.map((av, idx) => (
              <div key={idx} className="bg-gray-900 rounded-2xl p-4 flex flex-col gap-3 border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center">📦</div>
                  <div>
                    <div className="text-sm font-bold text-white">{av.promo_title || av.title}</div>
                    <div className="text-xs text-gray-400">{av.promo_description || av.description}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">Kode</div>
                  <div className="font-mono text-[#FF6B00] font-bold">{av.voucher_code || av.code || av.voucher?.code || '—'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="text-sm font-bold text-white">Aktif</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#FF6B00] text-black py-2 rounded-xl font-bold">Tampilkan</button>
                  <button className="flex-1 bg-white/5 text-gray-200 py-2 rounded-xl">Bagikan</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedVoucher(null)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-md bg-gray-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center text-[#FF6B00]">🎁</div>
                <div>
                  <div className="text-xs text-gray-400">Tukar Voucher</div>
                  <div className="font-bold text-lg">{voucherList.find(v => v.id === selectedVoucher)?.title}</div>
                </div>
              </div>

              <div className="mt-4 bg-white/5 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300">Total Poin</div>
                  <div className="font-bold text-[#FF6B00]">{voucherList.find(v => v.id === selectedVoucher)?.pointsCost.toLocaleString()} PT</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Poin Anda: <span className="font-bold text-white">{user.points.toLocaleString()}</span></div>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={async () => {
                  const promo = voucherList.find((v) => v.id === selectedVoucher);
                  if (!promo) return;
                  // Keep existing redeem flow
                  try {
                    if (userId) {
                      const response = await fetch(`https://geasture.kolab.top/api/coin-promos/${promo.id}/redeem`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId })
                      });
                      if (!response.ok) throw new Error('API');
                    }
                    // optimistic UI update
                    setActiveVouchers(prev => [...prev, { voucher_code: `CODE-${Math.random().toString(36).substring(3,7).toUpperCase()}`, promo_title: promo.title, promo_description: promo.description }]);
                    if (onRefreshUser) onRefreshUser();
                    alert('Penukaran berhasil!');
                  } catch (err) {
                    console.warn('Redeem failed, simulated locally', err);
                    setActiveVouchers(prev => [...prev, { voucher_code: `CODE-${Math.random().toString(36).substring(3,7).toUpperCase()}`, promo_title: promo.title, promo_description: promo.description }]);
                  } finally {
                    setSelectedVoucher(null);
                  }
                }} className="flex-1 bg-[#FF6B00] text-black py-3 rounded-2xl font-bold">Konfirmasi Penukaran</button>
                <button onClick={() => setSelectedVoucher(null)} className="flex-1 bg-transparent border border-white/10 text-gray-300 py-3 rounded-2xl">Batal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
