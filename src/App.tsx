/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MobileLogin from './pages/MobileLogin';
import LandingPage from './pages/LandingPage';
import MobileAppLayout from './pages/MobileAppLayout';
import GameContainerMobile from './pages/GameContainerMobile';
import type { AppUser } from './data/appData';
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './lib/authSession';
import { normalizeUserProfile } from './lib/userProfile';
import { IDENTITY_PROVIDER, POINTLAB_API_BASE_URL } from './lib/api';
import { toProfilePayload } from './lib/identity';
import { currentReturnUrl, extractTokenFromLocationHash } from './lib/pointlabSso';

type MobileAppState = 'landing' | 'login' | 'hub' | 'playing';

// Pulihkan sesi tersimpan sekali saat aplikasi dimuat agar refresh tidak
// mengembalikan pengguna ke halaman login.
const restoredSession = loadAuthSession();

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
    restoredSession?.token ?? null,
  );
  const [authNotice, setAuthNotice] = useState('');

  // ── Callback Redirect-Auth dari PointLab ──────────────────────────────
  // Setelah pengguna login/daftar di PointLab, ia dikembalikan ke aplikasi
  // ini dengan token JWT di fragment URL (#token=...). Token diverifikasi ke
  // GET /api/users/profile (Bearer) sebelum dipakai membuat sesi lokal.
  useEffect(() => {
    const consumeToken = () => {
      const token = extractTokenFromLocationHash(window.location.hash);
      if (!token) return;
      let cancelled = false;
      const stripHash = () =>
        window.history.replaceState(null, '', currentReturnUrl());
      (async () => {
        try {
          const res = await fetch(`${POINTLAB_API_BASE_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = res.ok ? await res.json() : null;
          const profileUser = data?.user;
          if (cancelled) return;
          stripHash();
          if (!profileUser) {
            setAuthNotice(
              'Sesi dari PointLab tidak valid atau telah kedaluwarsa. Silakan masuk kembali.',
            );
            setState('login');
            return;
          }
          const user = normalizeUserProfile(
            toProfilePayload(IDENTITY_PROVIDER, profileUser) as unknown as AppUser,
          );
          saveAuthSession({ user, token });
          setCurrentUser(user);
          setAuthToken(token);
          setAuthNotice('');
          toHub();
        } catch {
          if (cancelled) return;
          stripHash();
          setAuthNotice(
            'Gagal memverifikasi sesi PointLab. Periksa koneksi lalu coba lagi.',
          );
          setState('login');
        }
      })();
      return () => {
        cancelled = true;
      };
    };
    consumeToken();
    // Fragment bisa berubah tanpa reload penuh (mis. PWA sudah terbuka).
    window.addEventListener('hashchange', consumeToken);
    return () => window.removeEventListener('hashchange', consumeToken);
  }, []);

  // Transitions
  const toLanding = () => setState('landing');
  const toLogin = () => setState('login');
  const toHub = () => setState('hub');
  
  const startGame = (gameId: string) => {
    setActiveGame(gameId);
    setState('playing');
  };

  const closeGame = () => {
    setActiveGame(null);
    setState('hub');
  };

  // Pengunjung dari landing page masuk ke halaman login/daftar.
  const openAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    toLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F4F8] flex justify-center selection:bg-[#FF5500]/30 selection:text-slate-900">
      <AnimatePresence mode="wait">
        {/* Landing page publik untuk pengunjung yang belum masuk akun. */}
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
              authNotice={authNotice}
              onAuthenticated={(session) => {
                // Login/daftar langsung berhasil lewat API PoinLab:
                // simpan sesi dan buka hub seperti alur redirect SSO.
                saveAuthSession(session);
                setCurrentUser(session.user);
                setAuthToken(session.token);
                setAuthNotice('');
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
