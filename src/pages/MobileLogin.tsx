import React from "react";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { redirectToPointLabAuth, POINTLAB_AUTH_PAGE } from "../lib/pointlabSso";

// Halaman autentikasi Ngolab-Gami TIDAK lagi memuat form login/daftar
// tiruan. Ekosistem Ngolab memakai satu akun PointLab: pengguna dialihkan ke
// halaman login/daftar RESMI PointLab, lalu kembali ke Ngolab-Gami dengan
// token JWT valid pada fragment URL (#token=...) yang diverifikasi ke server.
export default function MobileLogin({
  initialTab = "login",
  onBackHome,
  authNotice = "",
}: {
  initialTab?: "login" | "register";
  onBackHome: () => void;
  authNotice?: string;
}) {
  const mode = initialTab === "register" ? "register" : "login";

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
          className="mb-8 inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-bold text-slate-300 backdrop-blur-md transition-colors hover:border-[#FF7A03]/40 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke beranda
        </button>

        {/* Kartu informasi */}
        <div
          id="card_pointlab_redirect"
          className="rounded-[20px] border border-white/10 bg-[rgba(30,41,59,0.65)] p-7 shadow-2xl backdrop-blur-[20px]"
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

          <h1 className="mt-6 text-xl font-black tracking-tight text-white">
            {mode === "register" ? "Daftar akun PointLab" : "Masuk dengan akun PointLab"}
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">
            Ngolab-Gami memakai akun membership PointLab. Login dan pendaftaran
            dilakukan di halaman <span className="font-bold text-white">resmi PointLab</span>.
            Setelah berhasil, kamu otomatis kembali ke Ngolab-Gami beserta
            saldo poin dan profilmu.
          </p>

          {authNotice && (
            <div
              id="auth_notice"
              role="alert"
              className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-semibold leading-relaxed text-red-200"
            >
              {authNotice}
            </div>
          )}

          <button
            id="btn_login_pointlab"
            type="button"
            onClick={() => redirectToPointLabAuth(mode)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF7A03] to-[#e66a00] px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#FF7A03]/30 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            {mode === "register" ? "Lanjut ke pendaftaran PointLab" : "Lanjut ke login PointLab"}
          </button>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/5 px-3.5 py-3">
            <ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
            <p className="text-[11px] font-medium leading-relaxed text-slate-300">
              Kredensial hanya dimasukkan di PointLab. Ngolab-Gami menerima
              token sesi yang diverifikasi ke server, tanpa pernah melihat
              password-mu.
            </p>
          </div>
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
