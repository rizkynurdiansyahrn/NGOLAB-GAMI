import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Gift,
  Gamepad2,
} from "lucide-react";
import type { AuthSession } from "../lib/userProfile";
import { redirectToPointLabAuth, POINTLAB_AUTH_PAGE } from "../lib/pointlabSso";

export default function MobileLogin({
  initialTab = "login",
  onBackHome,
}: {
  initialTab?: "login" | "register";
  onBackHome?: () => void;
  onLogin?: (session: AuthSession) => void;
}) {
  const [targetMode, setTargetMode] = useState<"login" | "register">(initialTab);
  const [countdown, setCountdown] = useState<number>(3);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(true);

  useEffect(() => {
    setTargetMode(initialTab);
  }, [initialTab]);

  // Otomatis mengalihkan ke halaman resmi PointLab setelah beberapa detik
  useEffect(() => {
    if (!isRedirecting) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          redirectToPointLabAuth(targetMode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRedirecting, targetMode]);

  const handleManualRedirect = (mode: "login" | "register") => {
    setIsRedirecting(false);
    redirectToPointLabAuth(mode);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#1A1B27] relative overflow-hidden font-sans">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative z-10"
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">
                Point<span className="text-[#FF5500]">Lab</span>
                <span className="text-slate-400 font-semibold text-xs ml-1.5">× GAMI</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">Satu Akun untuk Semua Layanan</p>
            </div>
          </div>

          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notice Badge */}
        <div className="mb-6 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FF5500] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-orange-200">
                Autentikasi Terpadu PointLab
              </p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Fitur Mini Game, Gami-Study, dan penukaran voucher NGOLAB-GAMI hanya dapat diakses oleh member resmi.
                Pendaftaran &amp; login dilakukan langsung melalui sistem terpusat PointLab.
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Banner */}
        {isRedirecting && (
          <div className="mb-6 flex items-center justify-between bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5500]"></span>
              </span>
              Mengarahkan ke PointLab dalam {countdown} detik...
            </span>
            <button
              type="button"
              onClick={() => setIsRedirecting(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline"
            >
              Batalkan
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            id="btn_sso_pointlab_login"
            onClick={() => handleManualRedirect("login")}
            className="w-full bg-[#FF5500] hover:bg-[#e64d00] text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/30 transition-all active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            Masuk dengan Akun PointLab
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          <button
            type="button"
            id="btn_sso_pointlab_register"
            onClick={() => handleManualRedirect("register")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm py-3.5 px-4 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            Daftar Akun Member Baru di PointLab
            <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
          </button>
        </div>

        {/* Key Features Info */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-orange-400" />
            <span>Mini Game Arcade</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-orange-400" />
            <span>Voucher &amp; Riwayat Poin</span>
          </div>
        </div>

        {/* Back Link */}
        {onBackHome && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBackHome}
              className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
