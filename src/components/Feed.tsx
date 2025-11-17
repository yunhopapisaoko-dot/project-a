import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, MessageCircle, Star, User, Users } from 'lucide-react';
import { useState } from 'react';
import { QuickProfileModal } from './QuickProfileModal';
import { MembersModal } from './MembersModal';

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

interface FeedProps {
  posts: Post[];
  currentUserId: string;
  accessToken: string;
  onPostClick: (post: Post) => void;
  onLike: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onToggleFeature: (postId: string) => void;
}

export function Feed({ posts, currentUserId, accessToken, onPostClick, onLike, onUserClick, onToggleFeature }: FeedProps) {
  const [quickProfileUser, setQuickProfileUser] = useState<{userId: string; username: string; avatarUrl: string | null} | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  
  // Filter out featured posts from Feed
  const nonFeaturedPosts = posts.filter(post => !post.isFeatured);

  if (nonFeaturedPosts.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum post ainda</p>
          <p className="text-sm text-gray-500 mt-2">Seja o primeiro a postar!</p>
        </div>
        
        {/* Members Button */}
        <div className="fixed top-20 right-4 z-40">
          <button
            onClick={() => setShowMembers(true)}
            className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50 transition-all hover:scale-110"
            title="Ver Membros"
          >
            <Users className="w-6 h-6" />
          </button>
        </div>

        {/* Members Modal */}
        <MembersModal
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          onUserClick={onUserClick}
        />
      </>
    );
  }

  return (
    <>
      {/* Members Button */}
      <div className="fixed top-20 right-4 z-40">
        <button
          onClick={() => setShowMembers(true)}
          className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/50 transition-all hover:scale-110"
          title="Ver Membros"
        >
          <Users className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
      {/* Feed Posts */}
      {nonFeaturedPosts.map((post) => (
        <div
          key={post.postId}
          className="relative rounded-2xl overflow-hidden shadow-lg bg-black/40 backdrop-blur-sm border border-pink-500/20 shadow-pink-500/20"
        >

          {/* Post Header */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setQuickProfileUser({
                userId: post.userId,
                username: post.username,
                avatarUrl: post.avatarUrl
              });
            }}
            className="w-full p-4 flex items-center gap-3 border-b border-purple-500/10 hover:bg-purple-500/5 transition-all"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/30">
              {post.avatarUrl ? (
                <ImageWithFallback
                  src={post.avatarUrl}
                  alt={post.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-white">{post.username}</p>
              <p className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </button>

          {/* Post Image */}
          {post.imageUrl && (
            <button 
              onClick={() => onPostClick(post)}
              className="relative w-full hover:opacity-90 transition-opacity"
            >
              <ImageWithFallback
                src={post.imageUrl}
                alt={post.title}
                className="w-full object-cover h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
            </button>
          )}

          {/* Post Content */}
          <div className="p-4 space-y-2">
            {post.title && (
              <h3 
                className="text-white cursor-pointer"
                onClick={() => onPostClick(post)}
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6)'
                }}
              >
                {post.title}
              </h3>
            )}
            {post.text && (
              <p className="text-gray-300 text-sm cursor-pointer" onClick={() => onPostClick(post)}>
                {post.text}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3">
              <button
                onClick={() => onLike(post.postId)}
                className={`flex items-center gap-2 transition-all ${
                  post.likes.includes(currentUserId)
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-pink-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.likes.includes(currentUserId) ? 'fill-pink-500' : ''}`} />
                <span className="text-sm">{post.likes.length}</span>
              </button>
              <button
                onClick={() => onPostClick(post)}
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments.length}</span>
              </button>
              {post.userId === currentUserId && (
                <button
                  onClick={() => onToggleFeature(post.postId)}
                  className={`ml-auto flex items-center gap-2 transition-all ${
                    post.isFeatured
                      ? 'text-yellow-500'
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  <Star className={`w-5 h-5 ${post.isFeatured ? 'fill-yellow-500' : ''}`} />
                  <span className="text-xs">{post.isFeatured ? 'Remover destaque' : 'Destacar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      </div>

      {/* Quick Profile Modal */}
      {quickProfileUser && (
        <QuickProfileModal
          userId={quickProfileUser.userId}
          username={quickProfileUser.username}
          avatarUrl={quickProfileUser.avatarUrl}
          currentUserId={currentUserId}
          accessToken={accessToken}
          onClose={() => setQuickProfileUser(null)}
          onViewFullProfile={(userId) => {
            onUserClick(userId);
            setQuickProfileUser(null);
          }}
        />
      )}

      {/* Members Modal */}
      <MembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        onUserClick={onUserClick}
      />
    </>
  );
}