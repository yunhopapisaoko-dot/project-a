import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ChatInfo {
  chatId: string;
  chatName: string;
  chatImage: string;
}

interface MyChatsScreenProps {
  visitedChats: ChatInfo[];
  onChatClick: (chatId: string) => void;
  onClose: () => void;
}

export function MyChatsScreen({ visitedChats, onChatClick, onClose }: MyChatsScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 max-h-[80vh] bg-gradient-to-b from-[#0a0a0f] to-black rounded-t-3xl overflow-hidden border-t border-purple-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 border-b border-purple-500/20 backdrop-blur-xl bg-black/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 
                    className="text-white text-xl"
                    style={{
                      textShadow: '0 0 20px rgba(168,85,247,0.6)'
                    }}
                  >
                    Meus Chats
                  </h2>
                  <p className="text-sm text-gray-400">
                    {visitedChats.length} {visitedChats.length === 1 ? 'chat' : 'chats'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-purple-500/20 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chats List */}
          <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[calc(80vh-100px)]">
            {visitedChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-500/50" />
                </div>
                <p className="text-gray-400 text-lg mb-2">Nenhum chat ainda</p>
                <p className="text-gray-500 text-sm">Visite locais para começar a conversar</p>
              </div>
            ) : (
              visitedChats.map((chat) => (
                <motion.button
                  key={chat.chatId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onChatClick(chat.chatId);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-purple-500/30 flex-shrink-0">
                    <ImageWithFallback
                      src={chat.chatImage}
                      alt={chat.chatName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 
                      className="text-white mb-1"
                      style={{
                        textShadow: '0 0 10px rgba(168,85,247,0.4)'
                      }}
                    >
                      {chat.chatName}
                    </h3>
                    <p className="text-sm text-gray-400">Toque para abrir</p>
                  </div>
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}