import React, { useEffect, useState } from "react";
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
  KeyRound,
} from "lucide-react";
import { API_BASE_URL } from "../lib/api";
import { normalizeUserProfile, type AuthSession } from "../lib/userProfile";

export default function MobileLogin({
  initialTab = "login",
  onBackHome,
  onLogin,
}: {
  initialTab?: "login" | "register";
  onBackHome?: () => void;
  onLogin: (session: AuthSession) => void;
}) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(
    initialTab === "register" ? "register" : "login",
  );

  useEffect(() => {
    setActiveTab(initialTab === "register" ? "register" : "login");
  }, [initialTab]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const identifier = phone.trim();
      const credentials = identifier.includes("@")
        ? { identifier, email: identifier, password }
        : { identifier, phone_number: identifier, nim: identifier, password };
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMsg(data?.message || `Login gagal (HTTP ${response.status}).`);
        return;
      }

      if (!data?.user?.id || typeof data.token !== "string") {
        setErrorMsg("Respons login dari server tidak lengkap. Silakan coba lagi.");
        return;
      }

      onLogin({
        user: normalizeUserProfile(data.user),
        token: data.token,
      });
    } catch (err) {
      console.error("Gagal menghubungi API login:", err);
      setErrorMsg("Tidak dapat terhubung ke server login. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitted(true);
    setErrorMsg("");
    setSuccessMsg("");

    const registration = {
      name: nama.trim(),
      phone_number: phone.trim(),
      email: email.trim(),
      password,
    };

    if (!registration.name || !registration.phone_number || !registration.email || !password) {
      setErrorMsg("Lengkapi nama lengkap, nomor HP/NIM, email, dan kata sandi.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Kata sandi wajib minimal 6 karakter.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Silakan setujui Syarat & Ketentuan terlebih dahulu.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMsg(data?.message || `Pendaftaran gagal (HTTP ${response.status}).`);
        return;
      }

      if (!data?.user?.id || typeof data.token !== "string") {
        setErrorMsg("Respons pendaftaran dari server tidak lengkap. Silakan coba lagi.");
        return;
      }

      const submittedProfile = normalizeUserProfile({
        id: data.user.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone_number,
      });
      onLogin({
        user: normalizeUserProfile(data.user, submittedProfile),
        token: data.token,
      });
    } catch (err) {
      console.error("Gagal menghubungi API pendaftaran:", err);
      setErrorMsg("Tidak dapat terhubung ke server pendaftaran. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    setErrorMsg("");
    setSuccessMsg("");

    const identifier = phone.trim();
    if (!identifier || !password) {
      setErrorMsg("Masukkan Email/NIM/Nomor HP dan kata sandi baru.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, newPassword: password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMsg(data?.message || `Reset kata sandi gagal (HTTP ${response.status}).`);
        return;
      }
      setSuccessMsg(data?.message || "Kata sandi berhasil diperbarui! Silakan masuk menggunakan kata sandi baru.");
      setConfirmPassword("");
      setActiveTab("login");
    } catch (err) {
      console.error("Gagal reset password:", err);
      setErrorMsg("Tidak dapat terhubung ke server untuk reset kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginDisabled = !phone.trim() || !password;

  return (
    <div className="flex min-h-screen w-full bg-[#F3F4F8] font-sans items-center justify-center p-3 sm:p-6 lg:p-10">

      {/* ─── Split Card Container ─── */}
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">

        {/* ══════════════════════════════════════════
            LEFT PANEL — dark poster / branding
        ══════════════════════════════════════════ */}
        <div className="relative w-full md:w-1/2 bg-slate-950 text-white flex flex-col justify-between overflow-hidden min-h-[160px] md:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80"
            alt="Gaming poster"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
          />
          <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-[#FF5500]/25 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col flex-1 p-5 md:p-10 gap-5 md:gap-8">
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

            <AnimatePresence mode="wait">
              {activeTab !== "register" ? (
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
                    Platform gaming &amp; fokus belajar kampus terintegrasi penuh dengan PointLab &amp; Kantin WarmingUp Telkom University.
                  </p>
                  <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                    <div>
                      <h4 className="text-2xl font-black text-[#FF5500]">SSO</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1 AKUN TERPADU</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                      <h4 className="text-2xl font-black text-[#FF5500]">REAL-TIME</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POIN &amp; VOUCHER</p>
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
                    Bergabunglah dengan komunitas mahasiswa di NGOLAB-GAMI. Kumpulkan poin dan tukarkan di PointLab maupun kantin favoritmu.
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: <Zap className="w-4 h-4" />, title: "kompetisi harian", desc: "Turnamen arcade & fokus belajar" },
                      { icon: <Gift className="w-4 h-4" />, title: "loyalty reward", desc: "Tukar poin otomatis ke PointLab" },
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

            <div className="md:hidden mt-1">
              {activeTab === "register" ? (
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                  Daftar &amp; <span className="text-[#FF5500]">Mulai Main!</span>
                </h2>
              ) : (
                <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                  Main. Menang. <span className="text-[#FF5500]">Reward!</span>
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — white form area
        ══════════════════════════════════════════ */}
        <div className="w-full md:w-1/2 bg-white flex flex-col">
          {onBackHome && (
            <div className="px-5 sm:px-8 md:px-10 pt-5">
              <button
                id="btn_back_home"
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#FF5500] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Beranda
              </button>
            </div>
          )}
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
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Masuk Akun</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                      Gunakan akun yang sama dengan PointLab (Email, NIM, atau No HP).
                    </p>
                  </div>

                  {successMsg && (
                    <div role="status" className="text-emerald-700 text-xs font-semibold text-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="flex flex-col gap-3.5" noValidate>
                    <div>
                      <label htmlFor="input_phone_login" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                        EMAIL, NIM, ATAU NOMOR HP
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_phone_login"
                          type="text"
                          placeholder="member@ngolab.test / 2101001 / 08..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="input_password" className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          KATA SANDI
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("forgot");
                            setErrorMsg("");
                            setSuccessMsg("");
                            setPassword("");
                            setConfirmPassword("");
                          }}
                          className="text-[11px] font-bold text-[#FF5500] hover:underline"
                        >
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
                          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {errorMsg && (
                      <div id="div_errormsg" role="alert" className="text-red-600 text-xs font-semibold text-center bg-red-50 p-3 rounded-xl border border-red-200">
                        {errorMsg}
                      </div>
                    )}

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

                  <p className="text-center text-sm text-slate-500 font-medium">
                    Belum punya akun?{" "}
                    <button
                      id="btn_tab_daftar"
                      type="button"
                      onClick={() => { setActiveTab("register"); setErrorMsg(""); setSuccessMsg(""); setRegisterSubmitted(false); }}
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
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); setErrorMsg(""); setRegisterSubmitted(false); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 self-start transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                  </button>

                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Akun Baru</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                      Satu akun otomatis aktif untuk NGOLAB-GAMI &amp; PointLab (+100 Poin).
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="flex flex-col gap-3" noValidate>
                    <div>
                      <label htmlFor="input_register_nama" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
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
                          aria-invalid={registerSubmitted && !nama.trim() ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="input_register_phone" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          NOMOR HP / NIM
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="input_register_phone"
                            type="text"
                            placeholder="081234567890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            aria-invalid={registerSubmitted && !phone.trim() ? true : undefined}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="input_register_email" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
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
                            aria-invalid={registerSubmitted && !email.trim() ? true : undefined}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input_register_password" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KATA SANDI (MIN. 6 KARAKTER)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_register_password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={registerSubmitted && password.length < 6 ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input_register_confirm_password" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KONFIRMASI KATA SANDI
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_register_confirm_password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          aria-invalid={registerSubmitted && Boolean(confirmPassword) && password !== confirmPassword ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

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

                    {errorMsg && (
                      <div id="div_errormsg" role="alert" className="text-red-600 text-xs font-semibold text-center bg-red-50 p-3 rounded-xl border border-red-200">
                        {errorMsg}
                      </div>
                    )}

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
                </motion.div>
              )}

              {/* ── FORGOT PASSWORD FORM ── */}
              {activeTab === "forgot" && (
                <motion.div
                  key="form-forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col gap-4"
                >
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); setErrorMsg(""); setForgotSubmitted(false); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 self-start transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
                  </button>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <KeyRound className="w-6 h-6 text-[#FF5500]" /> Atur Ulang Kata Sandi
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                      Masukkan Email, NIM, atau Nomor HP terdaftar beserta kata sandi baru.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-3.5" noValidate>
                    <div>
                      <label htmlFor="input_forgot_identifier" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        EMAIL, NIM, ATAU NOMOR HP
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_forgot_identifier"
                          type="text"
                          placeholder="member@ngolab.test / 2101001"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          aria-invalid={forgotSubmitted && !phone.trim() ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input_forgot_new_password" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KATA SANDI BARU (MIN. 6 KARAKTER)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_forgot_new_password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={forgotSubmitted && password.length < 6 ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input_forgot_confirm_password" className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                        KONFIRMASI KATA SANDI BARU
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="input_forgot_confirm_password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          aria-invalid={forgotSubmitted && Boolean(confirmPassword) && password !== confirmPassword ? true : undefined}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div id="div_errormsg" role="alert" className="text-red-600 text-xs font-semibold text-center bg-red-50 p-3 rounded-xl border border-red-200">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#FF5500] hover:bg-[#e64d00] text-white font-extrabold text-sm uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF5500]/30 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? "Memperbarui..." : "SIMPAN KATA SANDI BARU"}
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
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
              © 2026 NGOLAB-GAMI × POINTLAB, INDONESIA.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
