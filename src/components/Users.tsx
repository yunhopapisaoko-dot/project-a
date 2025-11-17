import { useState, useEffect } from 'react';
import { Search, User as UserIcon, MessageCircle, UserPlus, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';

interface User {
  userId: string;
  username: string;
  avatarUrl: string | null;
  wallet?: number;
}

interface UsersProps {
  accessToken: string;
  currentUserId: string;
  onUserClick: (userId: string) => void;
  onChatPrivateClick: (userId: string, username: string, avatarUrl: string | null) => void;
}

export function Users({ accessToken, currentUserId, onUserClick, onChatPrivateClick }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'getAllUsers',
          accessToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.userId !== currentUserId && 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 
            className="text-white text-xl"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(34,211,238,0.6)'
            }}
          >
            Usuários
          </h3>
          <p className="text-sm text-gray-400">{filteredUsers.length} usuários online</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome de usuário..."
          className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/60 transition-all"
          style={{
            boxShadow: '0 4px 20px rgba(168,85,247,0.1)'
          }}
        />
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.userId}
              whileHover={{ scale: 1.05 }}
              className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-black/90 backdrop-blur-sm transition-all hover:border-cyan-500/50"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
              }}
            >
              {/* Avatar */}
              <div className="relative p-4 pb-2">
                <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/50">
                  {user.avatarUrl ? (
                    <ImageWithFallback
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="px-4 pb-3 text-center">
                <h4 
                  className="text-white truncate mb-1"
                  style={{
                    textShadow: '0 0 10px rgba(168,85,247,0.6)'
                  }}
                >
                  {user.username}
                </h4>
                {user.wallet !== undefined && (
                  <p className="text-xs text-cyan-400">💰 {user.wallet}</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => onUserClick(user.userId)}
                  className="flex-1 py-2 px-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-purple-600/30 transition-all flex items-center justify-center gap-1"
                  title="Ver Perfil"
                >
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white hidden sm:inline">Perfil</span>
                </button>
                <button
                  onClick={() => onChatPrivateClick(user.userId, user.username, user.avatarUrl)}
                  className="flex-1 py-2 px-2 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 rounded-xl hover:from-cyan-500/30 hover:to-cyan-600/30 transition-all flex items-center justify-center gap-1"
                  title="Chat Privado"
                >
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-white hidden sm:inline">Chat</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
            <UserIcon className="w-10 h-10 text-purple-500/50" />
          </div>
          <p className="text-gray-400 text-lg mb-2">Nenhum usuário encontrado</p>
          <p className="text-gray-500 text-sm">Tente buscar com outro nome</p>
        </div>
      )}
    </div>
  );
}
