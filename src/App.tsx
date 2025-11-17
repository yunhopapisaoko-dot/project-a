import { useState, useEffect } from 'react';
import { Menu, Bell, Plus, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import AuthScreen from './components/AuthScreen';
import UsernameScreen from './components/UsernameScreen';
import CreatePostModal from './components/CreatePostModal';
import AvatarUploadModal from './components/AvatarUploadModal';
import PostDetailModal from './components/PostDetailModal';
import ChatScreen from './components/ChatScreen';
import ImageViewModal from './components/ImageViewModal';
import UserProfileModal from './components/UserProfileModal';
import MyProfileScreen from './components/MyProfileScreen';
import NotificationsModal from './components/NotificationsModal';
import SecretAdminScreen from './components/SecretAdminScreen';
import ClearDataButton from './components/ClearDataButton';
import { ProfileDrawer } from './components/ProfileDrawer';
import { Destaque } from './components/Destaque';
import { Feed } from './components/Feed';
import { Locais } from './components/Locais';
import { BottomNav } from './components/BottomNav';
import { MyChatsScreen } from './components/MyChatsScreen';
import { RouletteScreen } from './components/RouletteScreen';
import { supabase, projectId, publicAnonKey } from './utils/supabase/client';
import logoImage from 'figma:asset/d9e83882afc4ff765b094dfca93feda3b8c21c8f.png';

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
  createdAt: string;
  wallet?: number;
}

export default function App() {
  const [authState, setAuthState] = useState<'login' | 'username' | 'main' | 'secret'>('login');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [activeTab, setActiveTab] = useState<'destaques' | 'feed' | 'locais' | 'perfil'>('destaques');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [showMyChats, setShowMyChats] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    chatId: string;
    chatName: string;
    chatImage: string;
    chatBackground: string;
    chatDescription: string;
    createdBy: string;
    menuData?: {
      bebidas: any[];
      comidas: any[];
      alcoolicas: any[];
    };
  } | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [visitedChats, setVisitedChats] = useState<{
    chatId: string; 
    chatName: string; 
    chatImage: string;
    chatBackground: string;
    chatDescription: string;
    createdBy: string;
    menuData?: {
      bebidas: any[];
      comidas: any[];
      alcoolicas: any[];
    };
  }[]>([]);
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    hunger: 100,
    thirst: 100,
    alcoholism: 0
  });

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          
          // Check if user has username
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/profile`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
            setAuthState('main');
          } else {
            setAuthState('username');
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
  }, []);

  const loadPosts = async () => {
    if (!accessToken) return;

    try {
      // Load featured posts
      const featuredResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/posts?type=featured`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        setFeaturedPosts(featuredData.posts || []);
      }

      // Load all posts for feed
      const feedResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/posts`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (feedResponse.ok) {
        const feedData = await feedResponse.json();
        setFeedPosts(feedData.posts || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const loadUserProfile = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadNotifications = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadPlayerStats = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/player-stats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlayerStats(data.stats || {
          health: 100,
          hunger: 100,
          thirst: 100,
          alcoholism: 0
        });
      }
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };

  useEffect(() => {
    if (authState === 'main') {
      loadPosts();
      loadUserProfile();
      loadNotifications();
      loadPlayerStats();

      // Poll for new posts, profile updates, and notifications every 3 seconds for real-time updates
      const interval = setInterval(() => {
        loadPosts();
        loadUserProfile();
        loadNotifications();
        loadPlayerStats();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [authState, accessToken]);

  const handleAuthSuccess = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    
    // Check if user already has a profile/username
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('No profile');
      }
    })
    .then(profile => {
      setUserProfile(profile);
      setAuthState('main');
    })
    .catch(() => {
      // User doesn't have username yet
      setAuthState('username');
    });
  };

  const handleUsernameSet = () => {
    setAuthState('main');
  };

  const handleLike = async (postId: string) => {
    if (!accessToken) return;

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/like-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ postId })
      });

      loadPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleFeature = async (postId: string) => {
    if (!accessToken) return;

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/toggle-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ postId })
      });

      loadPosts();
    } catch (err) {
      console.error('Error toggling feature:', err);
    }
  };

  if (authState === 'login') {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} onSecretAccess={() => setAuthState('secret')} />
        <ClearDataButton />
      </>
    );
  }

  if (authState === 'secret') {
    return <SecretAdminScreen onBack={() => setAuthState('login')} />;
  }

  if (authState === 'username') {
    return <UsernameScreen accessToken={accessToken!} onUsernameSet={handleUsernameSet} />;
  }

  if (showChatScreen && selectedChat) {
    return (
      <ChatScreen
        chatId={selectedChat.chatId}
        chatName={selectedChat.chatName}
        chatImage={selectedChat.chatImage}
        chatBackground={selectedChat.chatBackground}
        chatDescription={selectedChat.chatDescription}
        createdBy={selectedChat.createdBy}
        accessToken={accessToken!}
        currentUserId={userId!}
        currentUsername={userProfile?.username || ''}
        menuData={selectedChat.menuData}
        onBack={() => {
          setShowChatScreen(false);
          setSelectedChat(null);
        }}
        onLeaveChat={(chatId) => {
          // Remove chat from visited list when user leaves
          setVisitedChats(prev => prev.filter(chat => chat.chatId !== chatId));
        }}
        onViewProfile={(userId) => {
          setShowChatScreen(false);
          setViewingUserId(userId);
        }}
      />
    );
  }

  if (showMyChats) {
    return (
      <MyChatsScreen
        visitedChats={visitedChats}
        onChatClick={(chatId) => {
          setShowMyChats(false);
          // Find the chat in visitedChats and reopen it
          const chat = visitedChats.find(c => c.chatId === chatId);
          if (chat) {
            setSelectedChat(chat);
            setShowChatScreen(true);
          }
        }}
        onClose={() => setShowMyChats(false)}
      />
    );
  }

  if (showRoulette) {
    return (
      <RouletteScreen onClose={() => setShowRoulette(false)} />
    );
  }

  const postsToShow = activeTab === 'destaques' ? featuredPosts : feedPosts;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-purple-500/20 backdrop-blur-xl bg-black/40">
          <button 
            onClick={() => setShowProfileDrawer(true)}
            className="text-gray-400 hover:text-cyan-400 transition-all hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Logo */}
          <img 
            src={logoImage} 
            alt="MagicTalk" 
            className="h-8 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
          />
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative group text-gray-400 hover:text-white transition-all"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-black animate-pulse shadow-lg shadow-pink-500/50">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
            
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setAuthState('login');
                setAccessToken(null);
                setUserId(null);
                setUserProfile(null);
                setFeaturedPosts([]);
                setFeedPosts([]);
                setNotifications([]);
                setUnreadCount(0);
              }}
              className="text-gray-400 hover:text-red-400 transition-all hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              title="Sair"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 relative backdrop-blur-sm bg-black/20 border-b border-purple-500/10">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <button
              onClick={() => setActiveTab('destaques')}
              className="relative flex-1 py-2 transition-all group"
            >
              <span 
                className={`relative z-10 transition-all ${ activeTab === 'destaques' 
                    ? 'text-white drop-shadow-[0_0_10px_rgba(236,72,153,1)]' 
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
                style={activeTab === 'destaques' ? {
                  textShadow: '0 0 20px rgba(236,72,153,0.8), 0 0 30px rgba(168,85,247,0.6)'
                } : {}}
              >
                Destaques
              </span>
              {activeTab === 'destaques' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className="relative flex-1 py-2 transition-all group"
            >
              <span 
                className={`relative z-10 transition-all ${
                  activeTab === 'feed' 
                    ? 'text-white drop-shadow-[0_0_10px_rgba(34,211,238,1)]' 
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
                style={activeTab === 'feed' ? {
                  textShadow: '0 0 20px rgba(34,211,238,0.8), 0 0 30px rgba(168,85,247,0.6)'
                } : {}}
              >
                Feed
              </span>
              {activeTab === 'feed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('locais')}
              className="relative flex-1 py-2 transition-all group"
            >
              <span 
                className={`relative z-10 transition-all ${
                  activeTab === 'locais' 
                    ? 'text-white drop-shadow-[0_0_10px_rgba(168,85,247,1)]' 
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
                style={activeTab === 'locais' ? {
                  textShadow: '0 0 20px rgba(168,85,247,0.8), 0 0 30px rgba(236,72,153,0.6)'
                } : {}}
              >
                Locais
              </span>
              {activeTab === 'locais' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('perfil')}
              className="relative flex-1 py-2 transition-all group"
            >
              <span 
                className={`relative z-10 transition-all ${
                  activeTab === 'perfil' 
                    ? 'text-white drop-shadow-[0_0_10px_rgba(236,72,153,1)]' 
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
                style={activeTab === 'perfil' ? {
                  textShadow: '0 0 20px rgba(236,72,153,0.8), 0 0 30px rgba(168,85,247,0.6)'
                } : {}}
              >
                Meu Perfil
              </span>
              {activeTab === 'perfil' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-w-6xl mx-auto pb-24">
          {activeTab === 'destaques' && (
            <>
              <Destaque 
                posts={featuredPosts}
                currentUserId={userId!}
                onPostClick={(post) => setSelectedPost(post)}
                onLike={handleLike}
                onUserClick={(uid) => setViewingUserId(uid)}
              />
              <BottomNav
                onMyChatsClick={() => setShowMyChats(true)}
                onCreateClick={() => setShowCreatePost(true)}
                onRouletteClick={() => setShowRoulette(true)}
              />
            </>
          )}
          {activeTab === 'feed' && (
            <>
              <Feed 
                posts={feedPosts}
                currentUserId={userId!}
                accessToken={accessToken!}
                onPostClick={(post) => setSelectedPost(post)}
                onLike={handleLike}
                onUserClick={(uid) => setViewingUserId(uid)}
                onToggleFeature={handleToggleFeature}
              />
              <BottomNav
                onMyChatsClick={() => setShowMyChats(true)}
                onCreateClick={() => setShowCreatePost(true)}
                onRouletteClick={() => setShowRoulette(true)}
              />
            </>
          )}
          {activeTab === 'locais' && (
            <Locais 
              onChatClick={(chatId, chatName, chatImage, chatBackground, chatDescription, createdBy, menuData) => {
                // Add to visited chats if not already there
                setVisitedChats(prev => {
                  const exists = prev.some(chat => chat.chatId === chatId);
                  if (!exists) {
                    return [...prev, { chatId, chatName, chatImage, chatBackground, chatDescription, createdBy, menuData }];
                  }
                  return prev;
                });
                
                setSelectedChat({ chatId, chatName, chatImage, chatBackground, chatDescription, createdBy, menuData });
                setShowChatScreen(true);
              }}
              onMyChatsClick={() => setShowMyChats(true)}
              onRouletteClick={() => setShowRoulette(true)}
              accessToken={accessToken!}
              currentUserId={userId!}
              currentUsername={userProfile?.username || ''}
            />
          )}
          {activeTab === 'perfil' && (
            <MyProfileScreen
              accessToken={accessToken!}
              onBack={() => setActiveTab('feed')}
              onPostClick={(post) => setSelectedPost(post)}
              onAvatarClick={() => setShowAvatarUpload(true)}
              onProfileUpdate={() => loadUserProfile()}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        accessToken={accessToken!}
        onPostCreated={() => {
          loadPosts();
          setShowCreatePost(false);
        }}
      />

      <AvatarUploadModal
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        accessToken={accessToken!}
        currentAvatarUrl={userProfile?.avatarUrl || null}
        onAvatarUpdated={(newUrl) => {
          loadUserProfile();
          setShowAvatarUpload(false);
        }}
      />

      <PostDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        accessToken={accessToken!}
        currentUserId={userId!}
        onPostUpdated={() => {
          loadPosts();
        }}
        onUserClick={(uid) => {
          setSelectedPost(null);
          setViewingUserId(uid);
        }}
        onImageClick={(url) => {
          setSelectedPost(null);
          setViewingImage(url);
        }}
      />

      <ImageViewModal
        isOpen={!!viewingImage}
        onClose={() => setViewingImage(null)}
        imageUrl={viewingImage}
        alt="Imagem"
      />

      <UserProfileModal
        isOpen={!!viewingUserId}
        onClose={() => setViewingUserId(null)}
        userId={viewingUserId!}
        onPostClick={(post) => {
          setViewingUserId(null);
          setSelectedPost(post);
        }}
      />

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        accessToken={accessToken!}
        onNotificationClick={(notification) => {
          setShowNotifications(false);
          if (notification.postId) {
            // Find and open the post
            const post = [...featuredPosts, ...feedPosts].find(p => p.postId === notification.postId);
            if (post) {
              setSelectedPost(post);
            }
          } else if (notification.type === 'follow') {
            // Open user profile
            setViewingUserId(notification.fromUserId);
          }
        }}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        username={userProfile?.username || ''}
        avatarUrl={userProfile?.avatarUrl || null}
        playerStats={playerStats}
        visitedChats={visitedChats}
        onChatClick={(chatId) => {
          const chat = visitedChats.find(c => c.chatId === chatId);
          if (chat) {
            setShowProfileDrawer(false);
            setSelectedChat(chat);
            setShowChatScreen(true);
          }
        }}
      />
    </div>
  );
}