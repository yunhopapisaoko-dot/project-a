import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart, MessageCircle, User, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { BottomNav } from './BottomNav';
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

interface DestaqueProps {
  posts: Post[];
  currentUserId: string;
  onPostClick: (post: Post) => void;
  onLike: (postId: string) => void;
  onUserClick: (userId: string) => void;
}

export function Destaque({ posts, currentUserId, onPostClick, onLike, onUserClick }: DestaqueProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showMembers, setShowMembers] = useState(false);

  // Use real featured posts or show default content
  const carouselPosts = posts.length > 0 ? posts.slice(0, 5) : [];
  const gridPosts = posts.length > 5 ? posts.slice(5) : [];

  // Auto-advance carousel
  useEffect(() => {
    if (carouselPosts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselPosts.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [carouselPosts.length]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselPosts.length);
  };

  if (posts.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum post em destaque</p>
          <p className="text-sm text-gray-500 mt-2">Posts em destaque aparecerão aqui</p>
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

      <div className="space-y-6 pb-6">
      {/* Featured Carousel */}
      {carouselPosts.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden">
          <div className="relative">
            {carouselPosts.map((post, index) => (
              <div 
                key={post.postId} 
                className={`transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
              >
                <div 
                  onClick={() => onPostClick(post)}
                  className="relative h-[280px] rounded-3xl overflow-hidden w-full cursor-pointer"
                >
                  {post.imageUrl ? (
                    <ImageWithFallback
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60"></div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* User info */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick(post.userId);
                      }}
                      className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                        {post.avatarUrl ? (
                          <ImageWithFallback
                            src={post.avatarUrl}
                            alt={post.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-white text-sm">{post.username}</span>
                    </button>

                    <div className="flex items-end justify-between">
                      <div className="flex-1">
                        <h2 className="text-white mb-2">{post.title || 'Post em destaque'}</h2>
                        {post.text && (
                          <p className="text-gray-200 text-sm max-w-xs line-clamp-2">
                            {post.text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLike(post.postId);
                          }}
                          className={`flex items-center gap-1 transition-all ${
                            post.likes.includes(currentUserId)
                              ? 'text-pink-500'
                              : 'text-white hover:text-pink-400'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.likes.includes(currentUserId) ? 'fill-pink-500' : ''}`} />
                          <span className="text-sm">{post.likes.length}</span>
                        </button>
                        <button className="flex items-center gap-1 text-white">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {carouselPosts.length > 1 && (
            <>
              <button
                onClick={goToPrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {carouselPosts.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {carouselPosts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-white w-6'
                      : 'bg-white/50 w-2 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Posts */}
      {gridPosts.length > 0 && (
        <div>
          <h3 className="text-white mb-4 px-1">Mais destaques</h3>
          <div className="grid grid-cols-2 gap-4">
            {gridPosts.map((post) => (
              <button
                key={post.postId}
                onClick={() => onPostClick(post)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer h-[200px]"
              >
                {post.imageUrl ? (
                  <ImageWithFallback
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60"></div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white mb-2">{post.title || post.username}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments.length}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
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