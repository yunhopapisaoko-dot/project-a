import { X, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { StatsDisplay } from './StatsDisplay';

interface Chat {
  chatId: string;
  chatName: string;
  chatImage: string;
}

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl: string | null;
  playerStats: {
    health: number;
    hunger: number;
    thirst: number;
    alcoholism: number;
  };
  visitedChats: Chat[];
  onChatClick: (chatId: string) => void;
}

export function ProfileDrawer({
  isOpen,
  onClose,
  username,
  avatarUrl,
  playerStats,
  visitedChats,
  onChatClick
}: ProfileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-full md:w-1/2 bg-gradient-to-b from-[#0a0a0f] to-black border-r border-purple-500/30 z-50 overflow-y-auto"
          >
        {/* Cyberpunk Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        {/* Animated Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 
              className="text-white text-xl"
              style={{
                textShadow: '0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(168,85,247,0.4)'
              }}
            >
              Meu Perfil
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-purple-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="mb-8">
            <div className="flex flex-col items-center mb-6">
              {/* Avatar with Glow */}
              <div className="relative mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full opacity-50 blur-lg animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/50">
                  {avatarUrl ? (
                    <ImageWithFallback
                      src={avatarUrl}
                      alt={username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <h3 
                className="text-white text-2xl mb-2"
                style={{
                  textShadow: '0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(168,85,247,0.4)'
                }}
              >
                {username}
              </h3>
              <p className="text-cyan-400/70 text-sm">@{username.toLowerCase()}</p>
            </div>

            {/* Stats Section */}
            <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 backdrop-blur-sm">
              <h4 className="text-purple-400 text-sm mb-3">Status do Personagem</h4>
              <StatsDisplay
                health={playerStats.health}
                hunger={playerStats.hunger}
                thirst={playerStats.thirst}
                alcoholism={playerStats.alcoholism}
              />
            </div>
          </div>

          {/* My Chats Section */}
          <div className="mb-6">
            <h4 className="text-white mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              Meus Chats
              <span className="text-xs text-gray-400 ml-auto">
                {visitedChats.length} {visitedChats.length === 1 ? 'chat' : 'chats'}
              </span>
            </h4>

            {visitedChats.length === 0 ? (
              <div className="bg-black/40 border border-purple-500/20 rounded-xl p-8 text-center backdrop-blur-sm">
                <p className="text-gray-400 text-sm">
                  Você ainda não entrou em nenhum chat
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Entre em um chat na aba "Locais" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visitedChats.map((chat) => (
                  <button
                    key={chat.chatId}
                    onClick={() => {
                      onChatClick(chat.chatId);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                  >
                    {/* Chat Avatar */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-50 blur group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50">
                        <ImageWithFallback
                          src={chat.chatImage}
                          alt={chat.chatName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Chat Name */}
                    <div className="flex-1 text-left">
                      <p className="text-white group-hover:text-cyan-400 transition-colors">
                        {chat.chatName}
                      </p>
                      <p className="text-xs text-gray-400">Chat público</p>
                    </div>

                    {/* Arrow */}
                    <div className="text-purple-400 group-hover:text-cyan-400 transition-colors">
                      →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}