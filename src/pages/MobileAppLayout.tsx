import React, { useState, useEffect, useCallback } from "react";
import {
  Home,
  Trophy,
  Gift,
  User,
  Gamepad2,
  BookOpen,
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
import { AppUser } from "../data/appData";
import { Game } from "../data/dummyData";
import EditProfileModal from "../components/EditProfileModal";
import { AnimatePresence } from "motion/react";
import { API_BASE_URL } from "../lib/api";
import { avatarUrlForApi, normalizeUserProfile } from "../lib/userProfile";

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
  initialUser,
  accessToken,
  onLogout,
  onPlay,
}: {
  initialUser: AppUser;
  accessToken: string | null;
  onLogout: () => void;
  onPlay: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [hasOpenedStudy, setHasOpenedStudy] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const userId = initialUser.id;
  const [user, setUser] = useState<AppUser>(() => normalizeUserProfile(initialUser));
  const [profileError, setProfileError] = useState("");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    setUser(normalizeUserProfile(initialUser));
  }, [initialUser]);

  const refreshUserProfile = useCallback(async (signal?: AbortSignal) => {
    if (!userId || !accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}/recommendations`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      });
      if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
      const data = await response.json();
      if (!data.user || String(data.user.id) !== userId) throw new Error("Invalid profile response");
      if (signal?.aborted) return;
      setUser((previous) => normalizeUserProfile(data.user, previous));
      setProfileError("");
    } catch (err) {
      if (signal?.aborted) return;
      console.warn("Gagal memperbarui profil:", err);
      setProfileError("Profil belum dapat diperbarui. Data akun terakhir tetap ditampilkan.");
    }
  }, [userId, accessToken]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshUserProfile(controller.signal);
    return () => controller.abort();
  }, [refreshUserProfile]);

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
        {profileError && (
          <p role="status" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{profileError}</p>
        )}
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
            onAvatarClick={() => setActiveTab("profile")}
          />
        )}
        {activeTab === "detail" && (
          <GameDetail
            gameObj={selectedGame || undefined}
            user={user}
            onBack={() => setActiveTab("library")}
            onPlay={onPlay}
            onAvatarClick={() => setActiveTab("profile")}
          />
        )}
        {activeTab === "leaderboard" && <MobileLeaderboard user={user} />}
        {activeTab === "profile" && (
          <Profile
            user={user}
            onEdit={() => setIsEditProfileOpen(true)}
            onLogout={onLogout}
          />
        )}
        {activeTab === "achievement" && <Achievement user={user} />}
        {activeTab === "notifications" && <Notifications />}
        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "patungan" && <MobilePatungan userId={userId} user={user} onRefreshUser={refreshUserProfile} />}
        {hasOpenedStudy && (
          <div className={activeTab === "study" ? "block" : "hidden"} aria-hidden={activeTab !== "study"}>
            <MobileStudyTracker userId={userId} user={user} onRefreshUser={refreshUserProfile} isActive={activeTab === "study"} />
          </div>
        )}
        {activeTab === "rewards" && <MobileRewards user={user} accessToken={accessToken} onRefreshUser={refreshUserProfile} onPointsUpdated={(points) => setUser((previous) => ({ ...previous, points, pointsAvailable: true }))} />}
      </div>

      {/* Bottom Floating Navigation Bar (Screenshots 3, 4, 5) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-4">
        <div className="mx-auto flex w-full max-w-md items-center justify-around">
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
            id="tab_study"
            active={activeTab === "study"}
            onClick={() => {
              setHasOpenedStudy(true);
              setActiveTab("study");
            }}
            icon={<BookOpen className="w-5 h-5" />}
            label="Gami-Study"
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
              if (!userId || !accessToken) throw new Error("Silakan masuk kembali sebelum mengubah profil.");
              const changes: { nama: string; avatar_url?: string } = { nama: updatedUser.name };
              if (updatedUser.avatar !== user.avatar) {
                changes.avatar_url = avatarUrlForApi(updatedUser.avatar, userId);
              }
              const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(changes),
              });
              const data = await response.json().catch(() => null);
              if (!response.ok) throw new Error(data?.message || "Perubahan profil belum dapat disimpan.");
              if (!data?.user || String(data.user.id) !== userId) throw new Error("Data profil hasil penyimpanan belum tersedia.");
              setUser((previous) => normalizeUserProfile(data.user, previous));
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
      className={`flex flex-1 flex-col items-center justify-center py-1 px-1 sm:px-3 rounded-2xl transition-all ${
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
