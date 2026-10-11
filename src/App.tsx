/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MobileLogin from './pages/MobileLogin';
import MobileAppLayout from './pages/MobileAppLayout';
import GameContainerMobile from './pages/GameContainerMobile';
import type { AppUser } from './data/appData';
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './lib/authSession';

type MobileAppState = 'login' | 'hub' | 'playing';

// Pulihkan sesi tersimpan sekali saat aplikasi dimuat agar refresh tidak
// mengembalikan pengguna ke halaman login.
const restoredSession = loadAuthSession();

export default function App() {
  const [state, setState] = useState<MobileAppState>(
    restoredSession ? 'hub' : 'login',
  );
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(
    restoredSession?.user ?? null,
  );
  const [authToken, setAuthToken] = useState<string | null>(
    restoredSession?.token ?? null,
  );

  // Transitions
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

  return (
    <div className="min-h-screen w-full bg-[#F3F4F8] flex justify-center selection:bg-[#FF5500]/30 selection:text-slate-900">
      <AnimatePresence mode="wait">
        {state === 'login' && (
          <motion.div 
            className="w-full flex justify-center"
            key="login"
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }}
          >
            <MobileLogin 
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
        {state !== 'login' && currentUser && (
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
                toLogin();
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
