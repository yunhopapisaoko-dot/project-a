import { useState } from 'react';
import { MessageSquare, Plus, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  onMyChatsClick: () => void;
  onCreateClick: () => void;
  onRouletteClick: () => void;
  activeSection?: 'chats' | 'roulette' | null;
}

export function BottomNav({ onMyChatsClick, onCreateClick, onRouletteClick, activeSection }: BottomNavProps) {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-purple-500/20 backdrop-blur-xl bg-black/80"
      style={{
        boxShadow: '0 -4px 24px rgba(168,85,247,0.2)'
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Meus Chats */}
        <button
          onClick={onMyChatsClick}
          className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl transition-all ${
            activeSection === 'chats'
              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50'
              : 'hover:bg-purple-500/10'
          }`}
        >
          <MessageSquare 
            className={`w-6 h-6 transition-all ${
              activeSection === 'chats' 
                ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                : 'text-gray-400'
            }`}
          />
          <span 
            className={`text-sm transition-all ${
              activeSection === 'chats' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Meus Chats
          </span>
        </button>

        {/* Botão Central + */}
        <motion.button
          onClick={onCreateClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 -mt-8 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full shadow-lg shadow-purple-500/50 flex items-center justify-center relative"
          style={{
            boxShadow: '0 0 30px rgba(168,85,247,0.6), 0 8px 20px rgba(0,0,0,0.4)'
          }}
        >
          <Plus className="w-8 h-8 text-white" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
        </motion.button>

        {/* Roleta */}
        <button
          onClick={onRouletteClick}
          className={`flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-2xl transition-all ${
            activeSection === 'roulette'
              ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-500/50'
              : 'hover:bg-cyan-500/10'
          }`}
        >
          <Dices 
            className={`w-6 h-6 transition-all ${
              activeSection === 'roulette' 
                ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
                : 'text-gray-400'
            }`}
          />
          <span 
            className={`text-sm transition-all ${
              activeSection === 'roulette' ? 'text-white' : 'text-gray-400'
            }`}
          >
            Roleta
          </span>
        </button>
      </div>
    </motion.div>
  );
}
