/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Bell, Gamepad2, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: "Jelajah", path: "/" },
    { name: "Game Saya", path: "/library" },
    { name: "Peringkat", path: "/leaderboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="https://i.imgur.com/4V1GTcC.png" 
            alt="Ngolab-Gami Logo" 
            className="h-10 w-auto"
            referrerPolicy="no-referrer"
          />
          <span className="text-xl font-black tracking-tighter text-slate-900">
            NGOLAB<span className="text-indigo-600">-GAMI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-semibold transition-colors hover:text-indigo-600 ${
                location.pathname === link.path ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari game..."
              className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          
          <button type="button" aria-label="Open notifications" title="Open notifications" className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
          </button>

          <button type="button" aria-label="Open menu" title="Open menu" className="md:hidden p-2 text-slate-400">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
