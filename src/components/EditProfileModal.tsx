import React, { useState } from "react";
import { motion } from "motion/react";
import { Camera, RotateCcw, Save, Upload, X } from "lucide-react";
import { AppUser } from "../data/appData";
import { DEFAULT_AVATAR } from "../lib/userProfile";
import { sanitizePhoneInput, validateProfileInput } from "../lib/profileEdits";
import { compressImageFile } from "../lib/imageUpload";

interface EditProfileModalProps {
  isOpen: boolean;
  user: AppUser;
  onClose: () => void;
  // Mengembalikan { synced: false } bila perubahan hanya tersimpan di perangkat
  // (server belum mengizinkan akun ini mengubah profil).
  onSave: (updatedUser: AppUser) => Promise<{ synced: boolean } | void> | void;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const predefinedAvatars = [
  DEFAULT_AVATAR,
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200"
];

export default function EditProfileModal({ isOpen, user, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!isOpen) return null;

  const handlePickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, atau sejenisnya).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Ukuran foto maksimal 8 MB.");
      return;
    }
    setIsUploading(true);
    try {
      setAvatar(await compressImageFile(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Foto belum dapat diproses.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setNotice("");
    const check = validateProfileInput(name, phone);
    if (!check.valid) {
      setError(check.nameError ?? check.phoneError ?? "Data profil belum lengkap.");
      return;
    }
    setIsSaving(true);
    try {
      const result = await onSave({
        ...user,
        name: name.trim(),
        phone: sanitizePhoneInput(phone),
        avatar,
      });
      if (result && result.synced === false) {
        // Beri waktu pengguna membaca keterangan sebelum modal menutup.
        setNotice("Disimpan di perangkat ini. Perubahan akan tersinkron saat server mengizinkan.");
        window.setTimeout(onClose, 1600);
      } else {
        onClose();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profil belum dapat disimpan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isUploading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 w-full max-w-sm flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Edit Profil</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile modal"
            title="Close edit profile modal"
            className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Foto profil */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-[#FF6B00] rounded-full blur-md opacity-30" />
              <img src={avatar} alt="Avatar" className="relative h-28 w-28 rounded-full border-2 border-gray-900 object-cover shadow-lg" referrerPolicy="no-referrer" />
              <div className="absolute bottom-0 right-0 h-10 w-10 bg-[#FF6B00] rounded-full flex items-center justify-center border-4 border-gray-900 shadow-md">
                <Camera className="h-4 w-4 text-black" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <label
                htmlFor="input_foto_profil"
                className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10 ${busy ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
              >
                <Upload className="h-3.5 w-3.5" />
                {isUploading ? "Mengompres..." : "Unggah dari perangkat"}
              </label>
              <input
                id="input_foto_profil"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={handlePickPhoto}
              />
              {avatar !== DEFAULT_AVATAR && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAvatar(DEFAULT_AVATAR)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Pakai avatar standar
                </button>
              )}
            </div>

            <div className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-3 mt-6">Pilih Avatar</div>
            <div className="flex flex-wrap gap-3 justify-center">
              {predefinedAvatars.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={idx === 0 ? "Gunakan avatar standar" : `Pilih avatar ${idx}`}
                  aria-pressed={avatar === imgUrl}
                  title={idx === 0 ? "Avatar standar" : `Avatar ${idx}`}
                  disabled={busy}
                  onClick={() => setAvatar(imgUrl)}
                  className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all ${avatar === imgUrl ? 'border-[#FF6B00] scale-110 shadow-[0_0_15px_rgba(255,107,0,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt={idx === 0 ? "Avatar standar" : `Avatar ${idx}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col space-y-5">
            <div>
              <label htmlFor="input_nama_baru" className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-2 px-1">Nama Lengkap</label>
              <input
                id="input_nama_baru"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama kamu"
                autoComplete="name"
                disabled={busy}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-lg font-semibold text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white/10 transition-colors backdrop-blur-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="input_telepon_baru" className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-2 px-1">No Telepon</label>
              <input
                id="input_telepon_baru"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                autoComplete="tel"
                disabled={busy}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-lg font-semibold text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white/10 transition-colors backdrop-blur-sm disabled:opacity-60"
              />
              <p className="mt-2 px-1 text-[11px] text-gray-500">Boleh dikosongkan bila belum ingin diisi.</p>
            </div>

            {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
            {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
            <button
              id="btn_simpan_profil"
              onClick={handleSave}
              disabled={busy || !name.trim()}
              className="w-full h-14 rounded-2xl bg-[#FF6B00] text-black font-bold tracking-wide hover:opacity-90 shadow-[0_4px_20px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {isSaving ? "Menyimpan..." : isUploading ? "Memproses foto..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
