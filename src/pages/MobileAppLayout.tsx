import React, { useState, useEffect } from "react";
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
import GameDetail from "./GameDetail";
import MobileLeaderboard from "./MobileLeaderboard";
import MobileRewards from "./MobileRewards";
import MobilePatungan from "./MobilePatungan";
import MobileStudyTracker from "./MobileStudyTracker";
import Profile from "./Profile";
import Achievement from "./Achievement";
import Notifications from "./Notifications";
import SettingsPage from "./Settings";
import { AppUser, mockUser } from "../data/appData";
import { Game } from "../data/dummyData";
import EditProfileModal from "../components/EditProfileModal";
import { AnimatePresence, motion } from "motion/react";

type Tab =
  | "home"
  | "library"
  | "detail"
  | "leaderboard"
  | "patungan"
  | "study"
  | "rewards"
  | "profile"
  | "achievement"
  | "notifications"
  | "settings";

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
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [user, setUser] = useState<AppUser>(mockUser);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const refreshUserProfile = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://geasture.kolab.top/api/users/${userId}/recommendations`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const apiUser = data.user || {};
        const pts = apiUser.coin_balance ?? apiUser.points ?? apiUser.coins ?? user.points;
        const uname = apiUser.nama ?? apiUser.name ?? apiUser.username ?? user.name;
        setUser((prev) => ({
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
        console.error("Gagal mengambil profil dari API, menggunakan mock:", err);
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

  const handleSelectDetail = (game: Game) => {
    setSelectedGame(game);
    setActiveTab("detail");
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F3F4F8] font-sans relative">
      {/* Main Page Area */}
      <div
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {activeTab === "home" && (
          <MobileDashboard
            userId={userId}
            user={user}
            onPlay={onPlay}
            onSelectDetail={handleSelectDetail}
            onAvatarClick={() => setActiveTab("profile")}
            onRefreshUser={refreshUserProfile}
            onSeeAll={() => setActiveTab("library")}
          />
        )}
        {activeTab === "library" && (
          <Library
            user={user}
            onPlay={onPlay}
            onSelectDetail={handleSelectDetail}
          />
        )}
        {activeTab === "detail" && (
          <GameDetail
            gameObj={selectedGame || undefined}
            user={user}
            onBack={() => setActiveTab("library")}
            onPlay={onPlay}
          />
        )}
        {activeTab === "leaderboard" && <MobileLeaderboard user={user} />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "achievement" && <Achievement />}
        {activeTab === "notifications" && <Notifications />}
        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "patungan" && <MobilePatungan userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {activeTab === "study" && <MobileStudyTracker userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {activeTab === "rewards" && <MobileRewards userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 w-full max-w-2xl mx-auto flex flex-col p-6 pt-12"
          >
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative mb-4">
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#FF5500] rounded-full flex items-center justify-center border-2 border-white font-bold text-white text-xs shadow-md">
                  {user.level}
                </div>
              </div>
              <h2 id="txt_sidebar_nama" className="text-2xl font-bold text-slate-900 tracking-tight">
                {user.name}
              </h2>
              <p className="text-[#FF5500] text-xs font-extrabold uppercase tracking-wider mt-0.5">
                Campus Pro Gamer
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <button
                  id="btn_edit_profile"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full flex items-center justify-between py-2.5 group text-slate-700 hover:text-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF5500]">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-base">Edit Profil</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </button>
                
                <div className="h-px w-full bg-slate-100 my-2" />
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between py-2.5 group text-red-600 hover:text-red-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-base">Keluar Akun</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Floating Navigation Bar (Screenshots 3, 4, 5) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavButton
            id="tab_home"
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            icon={<Home className="w-5 h-5" />}
            label="Beranda"
          />
          <NavButton
            id="tab_library"
            active={activeTab === "library" || activeTab === "detail"}
            onClick={() => setActiveTab("library")}
            icon={<Gamepad2 className="w-5 h-5" />}
            label="Game"
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
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      nama: updatedUser.name,
                      avatar_url: updatedUser.avatar,
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const updatedApiUser = data.user || {};
                    setUser((prev) => ({
                      ...prev,
                      name: updatedApiUser.nama ?? updatedApiUser.name ?? updatedUser.name,
                      avatar: updatedApiUser.avatar_url ?? updatedApiUser.avatar ?? updatedUser.avatar,
                    }));
                  }
                } catch (e) {
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
      className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
        active ? "text-[#FF5500] font-extrabold" : "text-slate-400 hover:text-slate-600 font-semibold"
      }`}
    >
      <div className="relative">
        {icon}
        {active && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF5500] rounded-full" />
        )}
      </div>
      <span className="text-[10px] mt-1 tracking-tight">{label}</span>
    </button>
  );
}
