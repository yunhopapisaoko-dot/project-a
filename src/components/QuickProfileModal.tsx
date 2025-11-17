import { X, User as UserIcon, UserPlus, UserCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/client';

interface QuickProfileModalProps {
  userId: string;
  username: string;
  avatarUrl: string | null;
  currentUserId: string;
  accessToken: string;
  onClose: () => void;
  onViewFullProfile: (userId: string) => void;
}

export function QuickProfileModal({
  userId,
  username,
  avatarUrl,
  currentUserId,
  accessToken,
  onClose,
  onViewFullProfile
}: QuickProfileModalProps) {
  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'follower' | 'mutual'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFollowStatus();
  }, [userId]);

  const loadFollowStatus = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/follow-status/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data.status || 'none');
      }
    } catch (err) {
      console.error('Error loading follow status:', err);
    }
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (response.ok) {
        await loadFollowStatus();
      }
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (response.ok) {
        await loadFollowStatus();
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFollowButton = () => {
    if (followStatus === 'mutual') {
      return {
        text: 'Amigos',
        icon: <Users className="w-4 h-4" />,
        color: 'from-green-500 to-emerald-500',
        hoverColor: 'hover:from-green-600 hover:to-emerald-600',
        action: handleUnfollow
      };
    } else if (followStatus === 'following') {
      return {
        text: 'Seguindo',
        icon: <UserCheck className="w-4 h-4" />,
        color: 'from-purple-500 to-pink-500',
        hoverColor: 'hover:from-purple-600 hover:to-pink-600',
        action: handleUnfollow
      };
    } else if (followStatus === 'follower') {
      return {
        text: 'Seguir de Volta',
        icon: <UserPlus className="w-4 h-4" />,
        color: 'from-cyan-500 to-blue-500',
        hoverColor: 'hover:from-cyan-600 hover:to-blue-600',
        action: handleFollow
      };
    } else {
      return {
        text: 'Seguir',
        icon: <UserPlus className="w-4 h-4" />,
        color: 'from-pink-500 to-purple-500',
        hoverColor: 'hover:from-pink-600 hover:to-purple-600',
        action: handleFollow
      };
    }
  };

  const followButton = getFollowButton();

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-purple-500/20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white">Perfil</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-purple-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Info */}
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

          {/* Actions */}
          <div className="space-y-2">
            {/* View Full Profile */}
            <button
              onClick={() => {
                onViewFullProfile(userId);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-500/50 text-white transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>Ver Perfil Completo</span>
            </button>

            {/* Follow/Unfollow Button */}
            {userId !== currentUserId && (
              <button
                onClick={followButton.action}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${followButton.color} ${followButton.hoverColor} text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followButton.icon}
                <span>{loading ? 'Processando...' : followButton.text}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
