import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Save, X } from 'lucide-react';
import { AppUser } from '../data/appData';

interface EditProfileModalProps {
  isOpen: boolean;
  user: AppUser;
  onClose: () => void;
  onSave: (updatedUser: AppUser) => void;
}

const predefinedAvatars = [
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200"
];

export default function EditProfileModal({ isOpen, user, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...user, name, avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 w-full max-w-sm flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
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
          {/* Avatar Selection */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute -inset-1 bg-[#FF6B00] rounded-full blur-md opacity-30" />
              <img src={avatar} alt="Avatar" className="relative h-28 w-28 rounded-full border-2 border-gray-900 object-cover shadow-lg" referrerPolicy="no-referrer" />
              <div className="absolute bottom-0 right-0 h-10 w-10 bg-[#FF6B00] rounded-full flex items-center justify-center border-4 border-gray-900 shadow-md">
                <Camera className="h-4 w-4 text-black" />
              </div>
            </div>
            
            <div className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-3">Pilih Avatar</div>
            <div className="flex flex-wrap gap-3 justify-center">
              {predefinedAvatars.map((imgUrl, idx) => (
                <button 
                  key={idx}
                  onClick={() => setAvatar(imgUrl)}
                  className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all ${avatar === imgUrl ? 'border-[#FF6B00] scale-110 shadow-[0_0_15px_rgba(255,107,0,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={imgUrl} alt={`Avatar ${idx}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col space-y-5">
            <div>
              <label htmlFor="input_nama_baru" className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-2 px-1">Nama Player</label>
              <input 
                id="input_nama_baru"
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama kamu"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-lg font-semibold text-white focus:outline-none focus:border-[#FF6B00] focus:bg-white/10 transition-colors backdrop-blur-sm"
              />
            </div>
            
            <button 
              id="btn_simpan_profil"
              onClick={handleSave}
              className="w-full h-14 rounded-2xl bg-[#FF6B00] text-black font-bold tracking-wide hover:opacity-90 shadow-[0_4px_20px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="h-5 w-5" />
              Simpan Perubahan
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
