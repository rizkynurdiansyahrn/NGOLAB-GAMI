import React from "react";
import { Search, Bell, ChevronRight } from "lucide-react";

interface HeaderNavProps {
  breadcrumb?: string;
  user?: {
    name: string;
    avatar: string;
    level?: number;
  };
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  onAvatarClick?: () => void;
}

export default function HeaderNav({
  breadcrumb = "Dashboard Pemain",
  user,
  onSearchChange,
  searchValue = "",
  onAvatarClick,
}: HeaderNavProps) {
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
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5500] rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Chip */}
        <div
          onClick={onAvatarClick}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full py-1 px-3 cursor-pointer transition-all shrink-0"
        >
          <div className="text-right hidden xs:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || "Budi Gamer"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              {user?.level ? `VIP ${user.level}` : "VIP 12"}
            </p>
          </div>
          <img
            src={user?.avatar || "https://i.pravatar.cc/150?u=budi_gamer"}
            alt="User Avatar"
            className="w-7 h-7 rounded-full object-cover border border-slate-300"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
