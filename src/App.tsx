/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MobileLogin from './pages/MobileLogin';
import MobileAppLayout from './pages/MobileAppLayout';
import GameContainerMobile from './pages/GameContainerMobile';
import { mockUser, AppUser } from './data/appData';

type MobileAppState = 'login' | 'hub' | 'playing';

export default function App() {
  const [state, setState] = useState<MobileAppState>('login');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
    <div className="min-h-screen w-full bg-brand-black flex justify-center selection:bg-brand-orange/30 selection:text-white">
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
              onLogin={(userObj) => {
                console.log("Logged in with user object:", userObj);
                setUserId(userObj.id);
                toHub();
              }} 
            />
          </motion.div>
        )}

        {state === 'hub' && (
          <motion.div 
            className="w-full flex justify-center"
            key="hub"
            initial={{ scale: 1.05, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <MobileAppLayout 
              userId={userId}
              onLogout={() => {
                setUserId(null);
                toLogin();
              }}
              onPlay={startGame}
            />
          </motion.div>
        )}

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
              userId={userId}
              gameId={activeGame} 
              onClose={closeGame} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
