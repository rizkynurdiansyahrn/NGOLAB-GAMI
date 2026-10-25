/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPage from './pages/LandingPage';
import MobileLogin from './pages/MobileLogin';
import MobileAppLayout from './pages/MobileAppLayout';
import GameContainerMobile from './pages/GameContainerMobile';
import type { AppUser } from './data/appData';
import { API_BASE_URL } from './lib/api';
import { normalizeUserProfile } from './lib/userProfile';
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './lib/authSession';

type MobileAppState = 'landing' | 'login' | 'hub' | 'playing';

function consumeSsoTokenFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hashRaw = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);
    const searchParams = new URLSearchParams(window.location.search);
    const token = (
      hashParams.get('token') ||
      hashParams.get('sso_token') ||
      searchParams.get('token') ||
      searchParams.get('sso_token') ||
      ''
    ).trim();
    if (!token) return null;

    hashParams.delete('token');
    hashParams.delete('sso_token');
    searchParams.delete('token');
    searchParams.delete('sso_token');
    const cleanSearch = searchParams.toString();
    const cleanHash = hashParams.toString();
    const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${cleanHash ? `#${cleanHash}` : ''}`;
    window.history.replaceState({}, document.title, cleanUrl);
    return token;
  } catch {
    return null;
  }
}

// Pulihkan sesi tersimpan sekali saat aplikasi dimuat agar refresh tidak
// mengembalikan pengguna ke halaman login.
const restoredSession = loadAuthSession();
const initialSsoToken = consumeSsoTokenFromLocation();

export default function App() {
  const [state, setState] = useState<MobileAppState>(
    restoredSession ? 'hub' : 'landing',
  );
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(
    restoredSession?.user ?? null,
  );
  const [authToken, setAuthToken] = useState<string | null>(
    initialSsoToken ?? restoredSession?.token ?? null,
  );
  const [ssoPending, setSsoPending] = useState<boolean>(Boolean(initialSsoToken));

  useEffect(() => {
    if (!initialSsoToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${initialSsoToken}` },
        });
        if (!res.ok) throw new Error(`SSO profile status ${res.status}`);
        const data = await res.json();
        const rawUser = data?.user ?? data;
        if (!rawUser?.id || cancelled) return;
        const normalized = normalizeUserProfile(rawUser);
        saveAuthSession({ user: normalized, token: initialSsoToken });
        setCurrentUser(normalized);
        setAuthToken(initialSsoToken);
        setState('hub');
      } catch (err) {
        console.warn('Gagal memulihkan sesi SSO dari PointLab:', err);
      } finally {
        if (!cancelled) setSsoPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Transitions
  const toLanding = () => setState('landing');
  const toLogin = () => setState('login');
  const toHub = () => setState('hub');

  const openAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    toLogin();
  };
  
  const startGame = (gameId: string) => {
    setActiveGame(gameId);
    setState('playing');
  };

  const closeGame = () => {
    setActiveGame(null);
    setState('hub');
  };

  if (ssoPending && !currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#F3F4F8] flex items-center justify-center p-6">
        <div role="status" className="rounded-3xl bg-white border border-slate-200 px-6 py-5 shadow-lg text-sm font-bold text-slate-700">
          Menghubungkan sesi akun dari PointLab...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F4F8] flex justify-center selection:bg-[#FF5500]/30 selection:text-slate-900">
      <AnimatePresence mode="wait">
        {state === 'landing' && !currentUser && (
          <motion.div
            className="w-full"
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onOpenAuth={openAuth} />
          </motion.div>
        )}

        {state === 'login' && (
          <motion.div 
            className="w-full flex justify-center"
            key="login"
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }}
          >
            <MobileLogin 
              initialTab={authTab}
              onBackHome={toLanding}
              onLogin={(session) => {
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                saveAuthSession(session);
                setCurrentUser(session.user);
                setAuthToken(session.token);
                toHub();
              }} 
            />
          </motion.div>
        )}

        {/* Keep the hub mounted behind games so the study timer and activity tracking keep running. */}
        {state !== 'login' && state !== 'landing' && currentUser && (
          <motion.div 
            className="w-full flex justify-center"
            key="hub"
            initial={{ scale: 1.05, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <MobileAppLayout 
              key={currentUser.id}
              initialUser={currentUser}
              accessToken={authToken}
              onLogout={() => {
                clearAuthSession();
                setCurrentUser(null);
                setAuthToken(null);
                toLanding();
              }}
              onPlay={startGame}
            />
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {state === 'playing' && activeGame && (
          <motion.div 
            className="w-full flex justify-center absolute inset-0 z-50"
            key="playing"
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            exit={{ y: "100%" }}
          >
            <GameContainerMobile 
              userId={currentUser?.id ?? null}
              gameId={activeGame}
              memberId={currentUser?.memberId ?? null}
              accessToken={authToken}
              onPointsEarned={(points) => setCurrentUser((previous) => (previous ? { ...previous, points, pointsAvailable: true } : previous))}
              onClose={closeGame} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
