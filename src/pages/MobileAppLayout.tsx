import React, { useState } from "react";
import {
  Home,
  Trophy,
  Gift,
  User,
  LogOut,
  ChevronRight,
  Users,
  BookOpen,
  Gamepad2,
} from "lucide-react";
import MobileDashboard from "./MobileDashboard";
import Library from "./Library";
import MobileLeaderboard from "./MobileLeaderboard";
import MobileRewards from "./MobileRewards";
import MobilePatungan from "./MobilePatungan";
import MobileStudyTracker from "./MobileStudyTracker";
import { AppUser, mockUser } from "../data/appData";
import EditProfileModal from "../components/EditProfileModal";
import { AnimatePresence, motion } from "motion/react";

type Tab =
  | "home"
  | "library"
  | "leaderboard"
  | "patungan"
  | "study"
  | "rewards"
  | "profile";

import { useEffect } from "react";

export default function MobileAppLayout({
  userId,
  onLogout,
  onPlay,
}: {
  userId: string | null;
  onLogout: () => void;
  onPlay: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [user, setUser] = useState<AppUser>(mockUser);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Fetch profile and points from API #1
  const refreshUserProfile = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/recommendations`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user || {};
        const pts = apiUser.coin_balance ?? apiUser.points ?? apiUser.coins ?? user.points;
        const uname = apiUser.nama ?? apiUser.name ?? apiUser.username ?? user.name;
        setUser(prev => ({
          ...prev,
          name: uname,
          points: Number(pts),
        }));
      }
    } catch (err) {
      console.warn("Gagal menyegarkan poin user:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/recommendations`, { cache: 'no-store' });
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const data = await response.json();
        
        if (isMounted) {
          const apiUser = data.user || {};
          const pts = apiUser.coin_balance ?? apiUser.points ?? apiUser.coins ?? mockUser.points;
          const uname = apiUser.nama ?? apiUser.name ?? apiUser.username ?? mockUser.name;
          const userAvatar = apiUser.avatar_url ?? apiUser.avatar ?? mockUser.avatar;
          
          setUser({
            id: userId,
            name: uname,
            points: Number(pts),
            level: apiUser.level ?? mockUser.level,
            exp: apiUser.exp ?? mockUser.exp,
            nextExp: apiUser.nextExp ?? mockUser.nextExp,
            avatar: userAvatar,
            streak: apiUser.streak ?? mockUser.streak,
          });
        }
      } catch (err) {
        console.error("Gagal mengambil profil dari API, menggunakan data mock lokal:", err);
        setUser({
          ...mockUser,
          id: userId,
          name: userId.startsWith("08") ? `User (${userId.slice(-4)})` : mockUser.name,
        });
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Background switches based on the tab
  const bgClass =
    activeTab === "patungan" || activeTab === "study"
      ? "bg-[#FAF9F6]"
      : "bg-gradient-to-br from-gray-900 via-black to-slate-900";

  return (
    <div
      className={`flex flex-col min-h-screen w-full mx-auto relative overflow-hidden font-sans transition-colors duration-500 ${bgClass}`}
    >
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-28 custom-scrollbar relative z-10 w-full h-full lg:max-w-screen-xl lg:mx-auto lg:px-8">
        {activeTab === "home" && (
          <MobileDashboard
            userId={userId}
            user={user}
            onPlay={onPlay}
            onAvatarClick={() => setActiveTab("profile")}
            onRefreshUser={refreshUserProfile}
          />
        )}
        {activeTab === "library" && <Library onPlay={onPlay} />}
        {activeTab === "leaderboard" && <MobileLeaderboard user={user} />}
        {activeTab === "patungan" && <MobilePatungan userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {activeTab === "study" && <MobileStudyTracker userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {activeTab === "rewards" && <MobileRewards userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full max-w-2xl mx-auto flex flex-col p-6 pt-12 md:pt-24"
          >
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-[#FF6B00] rounded-full blur-md opacity-30" />
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="relative w-32 h-32 rounded-full border-4 border-gray-900 object-cover shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#FF6B00] rounded-full flex items-center justify-center border-4 border-gray-900 font-bold text-black shadow-lg">
                  {user.level}
                </div>
              </div>
              <h2 id="txt_sidebar_nama" className="text-2xl font-bold text-white mb-1 tracking-tight">
                {user.name}
              </h2>
              <p className="text-[#FF6B00] text-sm font-bold tracking-wide">
                Campus Pro
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 shadow-lg backdrop-blur-md">
                <button
                  id="btn_edit_profile"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <div className="flex items-center gap-4 text-gray-300 group-hover:text-white transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-black transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-lg">Edit Profil</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </button>
                <div className="h-px w-full bg-white/5 my-3" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between py-2 group"
                >
                  <div className="flex items-center gap-4 text-gray-300 group-hover:text-red-400 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-lg">Keluar</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Glassy Bottom Navigation */}
      <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-6 md:left-1/2 md:-translate-x-1/2 md:w-[560px] h-16 bg-black/80 backdrop-blur-xl border border-gray-700 rounded-full flex items-center justify-between px-2 z-30 shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
        <NavButton
          id="tab_home"
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
          icon={<Home className="w-5 h-5" />}
          label="Beranda"
        />
        <NavButton
          id="tab_library"
          active={activeTab === "library"}
          onClick={() => setActiveTab("library")}
          icon={<Gamepad2 className="w-5 h-5" />}
          label="Perpustakaan"
        />
        <NavButton
          id="tab_tracker"
          active={activeTab === "study"}
          onClick={() => setActiveTab("study")}
          icon={<BookOpen className="w-5 h-5" />}
          label="Belajar"
        />
        {/* Glowing Center Button for Patungan */}
        <button
          id="tab_patungan"
          type="button"
          onClick={() => setActiveTab("patungan")}
          aria-label="Open patungan"
          title="Open patungan"
          className="relative -top-3 w-14 h-14 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,107,0,0.5)] border-4 border-gray-900 border-opacity-80 active:scale-95 transition-transform shrink-0"
        >
          <Users className="w-6 h-6 text-black" />
        </button>
        <NavButton
          id="tab_leaderboard"
          active={activeTab === "leaderboard"}
          onClick={() => setActiveTab("leaderboard")}
          icon={<Trophy className="w-5 h-5" />}
          label="Peringkat"
        />
        <NavButton
          id="tab_reward"
          active={activeTab === "rewards"}
          onClick={() => setActiveTab("rewards")}
          icon={<Gift className="w-5 h-5" />}
          label="Hadiah"
        />
        <NavButton
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          icon={<User className="w-5 h-5" />}
          label="Profil"
        />
      </div>

      <AnimatePresence>
        {isEditProfileOpen && (
          <EditProfileModal
            isOpen={isEditProfileOpen}
            user={user}
            onClose={() => setIsEditProfileOpen(false)}
            onSave={async (updatedUser) => {
              if (userId) {
                try {
                  const response = await fetch(`https://geasture.kolab.top/api/users/${userId}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      nama: updatedUser.name,
                      avatar_url: updatedUser.avatar,
                    })
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const updatedApiUser = data.user || {};
                    setUser(prev => ({
                      ...prev,
                      name: updatedApiUser.nama ?? updatedApiUser.name ?? updatedUser.name,
                      avatar: updatedApiUser.avatar_url ?? updatedApiUser.avatar ?? updatedUser.avatar,
                    }));
                    alert("Profil berhasil disimpan ke server!");
                  } else {
                    throw new Error("HTTP error " + response.status);
                  }
                } catch (e) {
                  console.warn("Gagal menyimpan profil ke server, menggunakan simulasi lokal:", e);
                  setUser(updatedUser);
                }
              } else {
                setUser(updatedUser);
              }
              setIsEditProfileOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`relative flex-1 flex items-center justify-center h-12 w-12 sm:w-16 rounded-full transition-all duration-300 ${active ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
    >
      <div className="flex flex-col items-center justify-center">
        {icon}
        {active && (
          <span className="text-[9px] font-bold mt-1 tracking-wider">
            {label}
          </span>
        )}
      </div>
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 border border-white/20 rounded-full -z-10"
        />
      )}
    </button>
  );
}
