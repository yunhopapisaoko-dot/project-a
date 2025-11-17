import { useState, useEffect } from 'react';
import { X, User as UserIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

interface UserData {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role?: 'leader' | 'helper' | 'member';
}

export function MembersModal({ isOpen, onClose, onUserClick }: MembersModalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/users`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl shadow-purple-500/20 pointer-events-auto max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl" style={{
                textShadow: '0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(168,85,247,0.4)'
              }}>
                Membros da Comunidade
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-purple-500/20 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar membros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-purple-500/30 rounded-xl text-white placeholder:text-gray-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/30 transition-all"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'Nenhum membro encontrado' : 'Nenhum membro ainda'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => {
                      onUserClick(user.userId);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-50 blur transition-opacity"></div>
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/40">
                        {user.avatarUrl ? (
                          <ImageWithFallback
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-white">{user.username}</p>
                        {user.role === 'leader' && (
                          <span className="px-2 py-0.5 bg-green-900/50 border border-green-700 text-green-400 text-xs rounded">
                            Líder
                          </span>
                        )}
                        {user.role === 'helper' && (
                          <span className="px-2 py-0.5 bg-purple-900/50 border border-purple-700 text-purple-400 text-xs rounded">
                            Ajudante
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cyan-400/70">@{user.username.toLowerCase()}</p>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                      →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-purple-500/20">
            <p className="text-center text-sm text-gray-400">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
