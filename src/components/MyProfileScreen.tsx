import { useState, useEffect } from 'react';
import { ArrowLeft, User, Edit2, Check, X, Grid3x3 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId } from '../utils/supabase/client';

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

interface MyProfileScreenProps {
  accessToken: string;
  onBack: () => void;
  onPostClick?: (post: Post) => void;
  onAvatarClick?: () => void;
  onProfileUpdate?: () => void;
}

export default function MyProfileScreen({ accessToken, onBack, onPostClick, onAvatarClick, onProfileUpdate }: MyProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    loadMyProfile();
    loadMyPosts();
  }, []);

  const loadMyProfile = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setNewUsername(data.username);
        setNewBio(data.bio || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadMyPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/my-posts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameError('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/update-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        setUsernameError(data.error || 'Erro ao atualizar nome de usuário');
        return;
      }

      setProfile(prev => prev ? { ...prev, username: newUsername } : null);
      setEditingUsername(false);
      setUsernameError('');
    } catch (err) {
      console.error('Error updating username:', err);
      setUsernameError('Erro ao atualizar nome de usuário');
    }
  };

  const handleUpdateBio = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/update-bio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ bio: newBio })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error updating bio:', data.error);
        return;
      }

      setProfile(prev => prev ? { ...prev, bio: newBio } : null);
      setEditingBio(false);
    } catch (err) {
      console.error('Error updating bio:', err);
    }
  };

  return (
    <div>
      {/* Content */}
      {profile ? (
        <>
          {/* Profile Header */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <button 
              onClick={onAvatarClick}
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-lg shadow-pink-500/50 hover:border-purple-500 transition-all group relative"
            >
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
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
            </button>

            <div className="text-center w-full max-w-md">
              {editingUsername ? (
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setUsernameError('');
                    }}
                    className="bg-black/40 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Nome de usuário"
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="p-2 text-green-500 hover:text-green-400 transition-all"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername(profile.username);
                      setUsernameError('');
                    }}
                    className="p-2 text-red-500 hover:text-red-400 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 justify-center">
                    <h3 className="text-white text-2xl" style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6)'
                    }}>
                      {profile.username}
                    </h3>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="p-1 text-gray-400 hover:text-purple-400 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
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
              )}
              {usernameError && (
                <p className="text-red-400 text-sm mt-2">{usernameError}</p>
              )}
            </div>

            {/* Bio Section */}
            <div className="w-full max-w-md text-center">
              {editingBio ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="bg-black/40 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[80px] resize-none"
                    placeholder="Escreva sua bio..."
                    maxLength={150}
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleUpdateBio}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingBio(false);
                        setNewBio(profile.bio || '');
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-gray-300 text-sm">
                    {profile.bio || 'Adicione uma bio...'}
                  </p>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="p-1 text-gray-400 hover:text-purple-400 transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-8 text-center">
              <div>
                <p className="text-2xl text-white">{posts.length}</p>
                <p className="text-sm text-gray-400">Posts</p>
              </div>
              <div>
                <p className="text-2xl text-white">{posts.reduce((sum, p) => sum + p.likes.length, 0)}</p>
                <p className="text-sm text-gray-400">Likes</p>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-purple-400" />
              <h4 className="text-white">Meus Posts</h4>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Você ainda não tem posts</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}