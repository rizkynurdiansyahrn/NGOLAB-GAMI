import React, { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  IdCard,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { IDENTITY_API_BASE_URL, IDENTITY_PROVIDER } from "../lib/api";
import {
  AUTH_LOGIN_PATH,
  AUTH_REGISTER_PATH,
  isAuthResponseValid,
  loginRequestBody,
  registerRequestBody,
  registerRequiredFields,
  toProfilePayload,
  type RegisterInput,
} from "../lib/identity";
import {
  accountSharingIntro,
  feedbackFromAuthError,
  identifierFieldLabel,
  type AuthFeedback,
} from "../lib/authUi";
import { normalizeUserProfile, type AuthSession } from "../lib/userProfile";
import { POINTLAB_AUTH_PAGE, redirectToPointLabAuth } from "../lib/pointlabSso";
import type { AppUser } from "../data/appData";

// Halaman autentikasi Ngolab-Gami: form login & daftar yang berbicara
// langsung ke API resmi PoinLab (POST /api/auth/login|register). Akun yang
// dipakai SAMA dengan akun PoinLab, jadi pengguna tidak perlu daftar ulang.
// Kalau pengguna mencoba mendaftar dengan NIM/Email yang sudah terdaftar,
// galat dari server diubah menjadi ajakan masuk (lihat src/lib/authUi.ts).
// Halaman auth resmi PoinLab tetap tersedia sebagai jalur alternatif di
// bagian bawah kartu.
export default function MobileLogin({
  initialTab = "login",
  onBackHome,
  authNotice = "",
  onAuthenticated,
}: {
  initialTab?: "login" | "register";
  onBackHome: () => void;
  authNotice?: string;
  onAuthenticated: (session: AuthSession) => void;
}) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    initialTab === "register" ? "register" : "login",
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = activeTab === "register";
  const requiredFields = registerRequiredFields(IDENTITY_PROVIDER);
  const isRequired = (field: keyof RegisterInput) => requiredFields.includes(field as never);

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setFeedback(null);
    setShowPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const input: RegisterInput = { name: nama, phone, email, password, nim };
      const body = isRegister
        ? registerRequestBody(IDENTITY_PROVIDER, input)
        : loginRequestBody(IDENTITY_PROVIDER, identifier, password);
      const response = await fetch(
        `${IDENTITY_API_BASE_URL}${isRegister ? AUTH_REGISTER_PATH : AUTH_LOGIN_PATH}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !isAuthResponseValid(data)) {
        setFeedback(feedbackFromAuthError(data));
        return;
      }
      const user = normalizeUserProfile(
        toProfilePayload(IDENTITY_PROVIDER, data.user) as unknown as AppUser,
      );
      onAuthenticated({ user, token: data.token });
    } catch {
      setFeedback(feedbackFromAuthError(null, { network: true }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Saat daftar gagal karena akun sudah ada, tawarkan pindah ke login dengan
  // identitas yang sudah diketik pengguna (NIM/email) agar tidak mengetik ulang.
  const goToLoginWithFilledIdentity = () => {
    setIdentifier((nim || email || identifier).trim());
    switchTab("login");
  };

  const notice = feedback?.notice ?? authNotice;
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition-colors focus:border-[#FF7A03]/60 focus:bg-white/10";
  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400";

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#1A1B27] relative overflow-hidden">
      <style>{`
        @keyframes orb-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-24px) scale(1.06); } }
        .sso-orb { position: absolute; border-radius: 9999px; filter: blur(70px); animation: orb-float 9s ease-in-out infinite; }
      `}</style>

      {/* Ornamen latar */}
      <div className="sso-orb w-72 h-72 bg-[#FF7A03]/25 -top-16 -right-12" />
      <div className="sso-orb w-64 h-64 bg-indigo-500/20 bottom-0 -left-16" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-[400px] px-5 py-10 flex flex-col">
        {/* Tombol kembali */}
        <button
          id="btn_back_home"
          type="button"
          onClick={onBackHome}
          className="mb-6 inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold text-slate-300 backdrop-blur-md transition-colors hover:border-[#FF7A03]/40 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke beranda
        </button>

        <div
          id="card_pointlab_auth"
          className="rounded-[20px] border border-white/10 bg-[rgba(30,41,59,0.65)] p-6 shadow-2xl backdrop-blur-[20px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A03] to-[#e66a00] shadow-lg shadow-[#FF7A03]/30">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-black tracking-wide text-white">
                Point<span className="text-[#FF7A03]">Lab</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Satu akun, satu ekosistem
              </p>
            </div>
          </div>

          {/* Tab Masuk / Daftar */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              id="tab_login"
              type="button"
              onClick={() => switchTab("login")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                !isRegister
                  ? "bg-gradient-to-r from-[#FF7A03] to-[#e66a00] text-white shadow-md shadow-[#FF7A03]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk
            </button>
            <button
              id="tab_register"
              type="button"
              onClick={() => switchTab("register")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                isRegister
                  ? "bg-gradient-to-r from-[#FF7A03] to-[#e66a00] text-white shadow-md shadow-[#FF7A03]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Daftar
            </button>
          </div>

          <h1 className="mt-5 text-xl font-black tracking-tight text-white">
            {isRegister ? "Daftar akun PoinLab" : "Masuk dengan akun PoinLab"}
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">
            {accountSharingIntro(IDENTITY_PROVIDER, activeTab)}
          </p>

          {notice && (
            <div
              id="auth_notice"
              role="alert"
              className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-semibold leading-relaxed text-red-200"
            >
              {notice}
              {feedback?.suggestLogin && (
                <button
                  id="btn_switch_to_login"
                  type="button"
                  onClick={goToLoginWithFilledIdentity}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-emerald-200 transition-colors hover:bg-emerald-500/25"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk dengan akun ini
                </button>
              )}
            </div>
          )}

          <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit}>
            {isRegister ? (
              <>
                <div>
                  <label className={labelClass} htmlFor="input_register_nama">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input_register_nama"
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama kamu"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="input_register_nim">
                    NIM{isRequired("nim") ? " *" : ""}
                  </label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input_register_nim"
                      type="text"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      placeholder="Nomor induk mahasiswa"
                      required={isRequired("nim")}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="input_register_email">
                    Email{isRequired("email") ? " *" : ""}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input_register_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@kampus.ac.id"
                      required={isRequired("email")}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="input_register_phone">
                    Nomor HP{isRequired("phone") ? " *" : ""}
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input_register_phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required={isRequired("phone")}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className={labelClass} htmlFor="input_auth_identifier">
                  {identifierFieldLabel(IDENTITY_PROVIDER)}
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input_auth_identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan NIM atau Email"
                    required
                    autoComplete="username"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="input_auth_password">
                Password{isRegister ? " (min. 6 karakter)" : ""}
              </label>
              <div className="relative">
                <input
                  id="input_auth_password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "Buat password" : "Password akun PoinLab"}
                  required
                  minLength={isRegister ? 6 : undefined}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className={`${inputClass} pr-12`}
                />
                <button
                  id="btn_toggle_password"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn_submit_auth"
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7A03] to-[#e66a00] px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#FF7A03]/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting
                ? "Memproses…"
                : isRegister
                  ? "Daftar & masuk"
                  : "Masuk"}
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/5 px-3.5 py-3">
            <ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
            <p className="text-[11px] font-medium leading-relaxed text-slate-300">
              Kredensial dikirim langsung ke server PoinLab (pemilik akun).
              Ngolab-Gami hanya menyimpan token sesi — password kamu tidak
              pernah disimpan di sini.
            </p>
          </div>

          <button
            id="link_open_pointlab_auth"
            type="button"
            onClick={() => redirectToPointLabAuth(activeTab)}
            className="mt-3 w-full text-center text-[11px] font-bold text-slate-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-[#FF7A03]"
          >
            atau buka halaman login resmi PoinLab
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] font-semibold text-slate-500">
          Halaman login: <span className="text-slate-400">{POINTLAB_AUTH_PAGE}</span>
        </p>
        <p className="mt-1 text-center text-[10px] font-semibold text-slate-600">
          © 2026 PointLab by NgoLab
        </p>
      </div>
    </div>
  );
}
