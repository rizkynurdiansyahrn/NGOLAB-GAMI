import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, ChevronRight, Settings, LogOut } from "lucide-react";
import { DEFAULT_AVATAR } from "../lib/userProfile";

interface HeaderNavProps {
  breadcrumb?: string;
  user?: {
    name: string;
    avatar: string;
    level?: number;
  };
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  /** Membuka halaman profil dari menu pengguna. */
  onOpenProfile?: () => void;
  /** Keluar dari akun, dipanggil dari menu pengguna. */
  onLogout?: () => void;
}

export default function HeaderNav({
  breadcrumb = "Dashboard Pemain",
  user,
  onSearchChange,
  searchValue = "",
  onOpenProfile,
  onLogout,
}: HeaderNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup menu saat pengguna mengklik di luar atau menekan Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      )
        setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const openProfile = () => {
    setMenuOpen(false);
    onOpenProfile?.();
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 mb-6 border-b border-gray-200/60">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-slate-700 font-bold">Beranda</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-medium">{breadcrumb}</span>
      </div>

      {/* Right Tools (Search, Bell, User Profile Badge) */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari game..."
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-slate-200/60 border border-slate-300/50 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 transition-all"
          />
        </div>

        {/* Notifications Icon */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors shrink-0"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Chip + Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Menu pengguna"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 hover:bg-slate-200/60 rounded-full py-1 px-3 cursor-pointer transition-all shrink-0 text-left"
          >
            <div className="text-right hidden xs:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || "Pengguna Ngolab-Gami"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                Level {user?.level ?? 1}
              </p>
            </div>
            <img
              src={user?.avatar || DEFAULT_AVATAR}
              alt="User Avatar"
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
              referrerPolicy="no-referrer"
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={openProfile}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Pengaturan
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
