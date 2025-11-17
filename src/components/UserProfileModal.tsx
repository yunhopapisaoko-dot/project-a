import { useState, useEffect } from 'react';
import { X, User, Grid3x3, UserPlus, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey, supabase } from '../utils/supabase/client';

interface Post {
  postId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  title: string;
  text: string;
  imageUrl: string | null;
  isFeatured: boolean;
  likes: string[];
  comments: any[];
  createdAt: string;
  featuredAt?: string;
}

interface UserProfile {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio?: string;
  role?: 'leader' | 'helper' | 'member';
  createdAt: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onPostClick?: (post: Post) => void;
}

export default function UserProfileModal({ isOpen, onClose, userId, onPostClick }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
      loadFollowStats();
      if (currentUserId) {
        checkFollowStatus();
      }
    }
  }, [isOpen, userId, currentUserId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Load user posts
      const postsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/posts?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowStats = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/user/${userId}/follow-stats`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFollowersCount(data.followersCount || 0);
        setFollowingCount(data.followingCount || 0);
      }
    } catch (err) {
      console.error('Error loading follow stats:', err);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/is-following/${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/follow-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        // Update followers count
        setFollowersCount(prev => data.isFollowing ? prev + 1 : prev - 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="w-full max-w-4xl bg-gradient-to-b from-[#0a0a0f] to-black rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
          <h2 className="text-white text-2xl" style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.6)'
          }}>
            Perfil
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-pink-500 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : profile ? (
            <>
              {/* Profile Header */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-lg shadow-pink-500/50">
                  {profile.avatarUrl ? (
                    <ImageWithFallback
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-white text-2xl" style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6)'
                    }}>
                      {profile.username}
                    </h3>
                    {profile.role === 'leader' && (
                      <span className="px-2 py-1 bg-green-900/50 border border-green-700 text-green-400 text-xs rounded">
                        Líder
                      </span>
                    )}
                    {profile.role === 'helper' && (
                      <span className="px-2 py-1 bg-purple-900/50 border border-purple-700 text-purple-400 text-xs rounded">
                        Ajudante
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-gray-400 text-sm max-w-md">{profile.bio}</p>
                  )}
                </div>

                <div className="flex gap-8 text-center">
                  <div>
                    <p className="text-2xl text-white">{posts.length}</p>
                    <p className="text-sm text-gray-400">Posts</p>
                  </div>
                  <button className="hover:opacity-80 transition-opacity">
                    <p className="text-2xl text-white">{followersCount}</p>
                    <p className="text-sm text-gray-400">Seguidores</p>
                  </button>
                  <button className="hover:opacity-80 transition-opacity">
                    <p className="text-2xl text-white">{followingCount}</p>
                    <p className="text-sm text-gray-400">Seguindo</p>
                  </button>
                </div>

                {/* Follow Button */}
                {currentUserId && currentUserId !== userId && (
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all ${
                      isFollowing
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-purple-500/30'
                        : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-5 h-5" />
                        <span>Deixar de seguir</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Posts Grid */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Grid3x3 className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white">Posts</h4>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nenhum post ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {posts.map((post) => (
                      <button
                        key={post.postId}
                        onClick={() => onPostClick?.(post)}
                        className="aspect-square rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/60 transition-all group relative"
                      >
                        {post.imageUrl ? (
                          <>
                            <ImageWithFallback
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <p className="text-white text-xs line-clamp-2">{post.title || post.text}</p>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center p-2">
                            <p className="text-white text-xs text-center line-clamp-4">{post.title || post.text}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Perfil não encontrado</p>
            </div>
          )}
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
