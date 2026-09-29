import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Gamepad2,
  Trophy,
  Gift,
  Zap,
  ArrowLeft,
} from "lucide-react";

export default function MobileLogin({ onLogin }: { onLogin: (userObj: any) => void }) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("https://geasture.kolab.top/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user || data;
        onLogin({
          id: apiUser.id || "user_" + Math.random().toString(36).substring(2, 9),
          name: apiUser.nama || apiUser.name || "User Gami",
          points: apiUser.points || apiUser.coin_balance || 0,
        });
      } else {
        throw new Error("Kredensial salah.");
      }
    } catch (err) {
      console.warn("Gagal login via API, mencoba simulasi lokal...", err);
      if ((phone === "08123456789" || phone === "nama@kampus.ac.id") && password === "ropaldo") {
        onLogin({ id: "user_ropaldo", name: "Ropaldo", points: 500 });
      } else if (phone && password) {
        onLogin({
          id: "user_" + Math.random().toString(36).substring(2, 7),
          name: phone.includes("@") ? phone.split("@")[0] : "Budi Gamer",
          points: 858,
        });
      } else {
        setErrorMsg("Gagal masuk. Periksa email/nomor HP & password Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !phone || !email || !password) return;

    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("https://geasture.kolab.top/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nama, phone_number: phone, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user || data;
        onLogin({
          id: apiUser.id || "user_new",
          name: apiUser.nama || apiUser.name || nama,
          points: apiUser.points || 0,
        });
      } else {
        throw new Error("Gagal mendaftar via API.");
      }
    } catch (err) {
      console.warn("Gagal register via API, simulasi lokal...", err);
      onLogin({ id: "user_new", name: nama, points: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginDisabled = !phone || !password;

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F8] font-sans items-center justify-center p-3 sm:p-6 lg:p-10">

      {/* ─── Split Card Container ─── */}
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">

        {/* ══════════════════════════════════════════
            LEFT PANEL — dark poster / branding
            Mobile: compact header strip (no scroll-heavy poster)
        ══════════════════════════════════════════ */}
        <div className="relative w-full md:w-1/2 bg-slate-950 text-white flex flex-col justify-between overflow-hidden min-h-[160px] md:min-h-full">
          {/* Background & glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80"
            alt="Gaming poster"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
          />
          <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-[#FF5500]/25 blur-[120px] rounded-full pointer-events-none" />

          {/* Mobile-compact: branding only on small screens */}
          <div className="relative z-10 flex flex-col flex-1 p-5 md:p-10 gap-5 md:gap-8">
            {/* Logo badge — always visible */}
            <div className="inline-flex items-center gap-2.5 self-start bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-6 h-6 rounded-lg bg-[#FF5500] flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-black text-white tracking-wide block">NGOLAB-GAMI</span>
                <span className="text-[8px] font-bold text-[#FF5500] tracking-widest uppercase block leading-none md:hidden">
                  LEVEL UP
                </span>
              </div>
            </div>

            {/* Full poster content — hidden on mobile, shown md+ */}
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.div
                  key="left-login"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="hidden md:flex flex-col gap-5"
                >
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    Main. Menang. <br />
                    <span className="text-[#FF5500]">Dapatkan Reward!</span>
                  </h2>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm">
                    Platform gaming &amp; e-sports arena kampus pertama di Indonesia. Ubah skor tinggimu menjadi voucher di kantin favoritmu.
                  </p>
                  <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                    <div>
                      <h4 className="text-2xl font-black text-[#FF5500]">10K+</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PEMAIN AKTIF</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                      <h4 className="text-2xl font-black text-[#FF5500]">50+</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PARTNER KANTIN</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="left-register"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="hidden md:flex flex-col gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/20 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    Mainkan Game, <br />
                    <span className="text-[#FF5500]">Dapatkan Reward!</span>
                  </h2>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">
                    Bergabunglah dengan ribuan mahasiswa di NGOLAB-GAMI. Kumpulkan poin dan tukarkan dengan voucher F&amp;B favoritmu.
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: <Zap className="w-4 h-4" />, title: "kompetisi harian", desc: "Turnamen arcade setiap hari" },
                      { icon: <Gift className="w-4 h-4" />, title: "loyalty reward", desc: "Tukar poin dengan Kopi & Burger" },
                      { icon: <Trophy className="w-4 h-4" />, title: "leaderboard kampus", desc: "Jadilah pemain nomor satu" },
                    ].map((f) => (
                      <div key={f.title} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                        <div className="w-8 h-8 rounded-xl bg-[#FF5500] flex items-center justify-center text-white shrink-0">
                          {f.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{f.title}</h4>
                          <p className="text-[11px] text-slate-400">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile hero — compact tagline, hidden md+ */}
            <div className="md:hidden mt-1">
              {activeTab === "login" ? (
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                  Main. Menang. <span className="text-[#FF5500]">Reward!</span>
                </h2>
              ) : (
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                  Daftar & <span className="text-[#FF5500]">Mulai Main!</span>
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — white form area
        ══════════════════════════════════════════ */}
        <div className="w-full md:w-1/2 bg-white flex flex-col">
          <div className="flex-1 flex flex-col justify-center p-5 sm:p-8 md:p-10 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ── LOGIN FORM ── */}
              {activeTab === "login" && (
                <motion.div
                  key="form-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col gap-5"
                >
                  {/* Heading */}
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Masuk Akun</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                      Selamat datang kembali, Gamer!
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                    {/* Email / Phone */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                        EMAIL ATAU USERNAME
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_phone_login"
                          type="text"
                          placeholder="nama@kampus.ac.id"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          KATA SANDI
                        </label>
                        <button type="button" className="text-[11px] font-bold text-[#FF5500] hover:underline">
                          Lupa Sandi?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-10 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                      <div id="div_errormsg" className="text-red-600 text-xs font-semibold text-center bg-red-50 p-3 rounded-xl border border-red-200">
                        {errorMsg}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      id="btn_masuk"
                      type="submit"
                      disabled={isLoginDisabled || isLoading}
                      className="w-full bg-[#FF5500] hover:bg-[#e64d00] text-white font-extrabold text-sm uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF5500]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Memproses..." : "MASUK SEKARANG"}
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  {/* Social divider */}
                  <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ATAU MASUK DENGAN
                    </span>
                  </div>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onLogin({ id: "user_google", name: "Google User", points: 858 })}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 transition-colors"
                    >
                      <span className="font-black text-slate-900">G</span> Google
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogin({ id: "user_fb", name: "Facebook User", points: 858 })}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 transition-colors"
                    >
                      <span className="font-black text-blue-600">f</span> Facebook
                    </button>
                  </div>

                  {/* Register link */}
                  <p className="text-center text-sm text-slate-500 font-medium">
                    Belum punya akun?{" "}
                    <button
                      id="btn_tab_daftar"
                      type="button"
                      onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
                      className="text-[#FF5500] font-bold hover:underline"
                    >
                      Daftar Sekarang
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── REGISTER FORM ── */}
              {activeTab === "register" && (
                <motion.div
                  key="form-register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col gap-4"
                >
                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 self-start transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                  </button>

                  {/* Heading */}
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Akun Baru</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                      Lengkapi data untuk mulai berpetualang.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    {/* Nama */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        NAMA LENGKAP
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_register_nama"
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          value={nama}
                          onChange={(e) => setNama(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Username + Email (2-col) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          USERNAME
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="input_register_phone"
                            type="text"
                            placeholder="GamerID"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          EMAIL KAMPUS
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="input_register_email"
                            type="email"
                            placeholder="mhs@univ.ac.id"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KATA SANDI
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_register_password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KONFIRMASI KATA SANDI
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Terms checkbox */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 accent-[#FF5500]"
                      />
                      <label htmlFor="terms" className="text-[11px] text-slate-500 leading-tight cursor-pointer">
                        Saya menyetujui{" "}
                        <span className="text-[#FF5500] font-bold">Syarat &amp; Ketentuan</span> serta{" "}
                        <span className="text-[#FF5500] font-bold">Kebijakan Privasi</span> NGOLAB-GAMI.
                      </label>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                      <div id="div_errormsg" className="text-red-600 text-xs font-semibold text-center bg-red-50 p-3 rounded-xl border border-red-200">
                        {errorMsg}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      id="btn_daftar_sekarang"
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#FF5500] hover:bg-[#e64d00] text-white font-extrabold text-sm uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF5500]/30 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? "Mendaftar..." : "DAFTAR SEKARANG"}
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  {/* Login link */}
                  <p className="text-center text-sm text-slate-500 font-medium">
                    Sudah punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
                      className="text-[#FF5500] font-bold hover:underline"
                    >
                      Masuk di sini
                    </button>
                  </p>

                  {/* Social divider */}
                  <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      ATAU DAFTAR DENGAN
                    </span>
                  </div>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onLogin({ id: "user_google", name: "Google User", points: 858 })}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 transition-colors"
                    >
                      <span className="font-black text-slate-900">G</span> Google
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogin({ id: "user_fb", name: "Facebook User", points: 858 })}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 transition-colors"
                    >
                      <span className="font-black text-blue-600">f</span> Facebook
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-8 md:px-10 py-3 border-t border-slate-100 text-center space-y-0.5">
            <div className="flex justify-center items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wider">
              <span>SYARAT &amp; KETENTUAN</span>
              <span>•</span>
              <span>KEBIJAKAN PRIVASI</span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400">
              © 2024 NGOLAB-GAMI TEAM, INDONESIA.
            </p>
          </div>
        </div>
        {/* ── end RIGHT PANEL ── */}

      </div>
      {/* ── end Split Card ── */}

    </div>
  );
}
