import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Heart, MessageCircle, Send, User } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId } from '../utils/supabase/client';

interface Comment {
  commentId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  parentCommentId: string | null;
  replies: Comment[];
  createdAt: string;
}

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
  comments: Comment[];
  createdAt: string;
  featuredAt?: string;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  accessToken: string;
  currentUserId: string;
  onPostUpdated: () => void;
  onUserClick?: (userId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

// Recursive component for rendering comments with nested replies
function CommentItem({ 
  comment, 
  onReply, 
  level = 0 
}: { 
  comment: Comment; 
  onReply: (commentId: string) => void; 
  level?: number;
}) {
  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-3' : ''}`}>
      <div className="flex gap-3">
        <div className={`${level === 0 ? 'w-8 h-8' : 'w-6 h-6'} rounded-full overflow-hidden border border-purple-500/30 flex-shrink-0`}>
          {comment.avatarUrl ? (
            <ImageWithFallback
              src={comment.avatarUrl}
              alt={comment.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
              <User className={`${level === 0 ? 'w-4 h-4' : 'w-3 h-3'} text-white`} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className={`${level === 0 ? 'bg-black/40 border border-purple-500/20' : 'bg-black/30 border border-purple-500/10'} rounded-lg p-${level === 0 ? 3 : 2}`}>
            <p className={`${level === 0 ? 'text-sm' : 'text-xs'} text-purple-400`}>{comment.username}</p>
            <p className={`text-white ${level === 0 ? 'text-sm' : 'text-xs'} mt-1`}>{comment.text}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs">
            <span className="text-gray-500">
              {new Date(comment.createdAt).toLocaleString('pt-BR')}
            </span>
            <button
              onClick={() => onReply(comment.commentId)}
              className="text-purple-400 hover:text-pink-400"
            >
              Responder
            </button>
          </div>

          {/* Recursively render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.commentId} 
                  comment={reply} 
                  onReply={onReply}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostDetailModal({
  isOpen,
  onClose,
  post,
  accessToken,
  currentUserId,
  onPostUpdated,
  onUserClick,
  onImageClick
}: PostDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!post) return null;

  const handleLike = async () => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/like-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ postId: post.postId })
      });

      onPostUpdated();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/add-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          postId: post.postId,
          text: newComment,
          parentCommentId: replyingTo
        })
      });

      setNewComment('');
      setReplyingTo(null);
      onPostUpdated();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasLiked = post.likes.includes(currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#0a0a0f] to-black border-purple-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <button 
            onClick={() => onUserClick?.(post.userId)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
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
            <div className="text-left">
              <DialogTitle className="text-white">{post.username}</DialogTitle>
              <p className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Image */}
          {post.imageUrl && (
            <button 
              onClick={() => onImageClick?.(post.imageUrl!)}
              className="rounded-lg overflow-hidden border border-purple-500/20 w-full hover:border-purple-500/60 transition-all"
            >
              <ImageWithFallback
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-96 object-cover"
              />
            </button>
          )}

          {/* Post Content */}
          {post.title && (
            <h3 
              className="text-white"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6)'
              }}
            >
              {post.title}
            </h3>
          )}
          
          {post.text && (
            <p className="text-gray-300">{post.text}</p>
          )}

          {/* Like and Comment Buttons */}
          <div className="flex items-center gap-4 pt-2 border-t border-purple-500/10">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-all ${
                hasLiked
                  ? 'text-pink-500'
                  : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-pink-500' : ''}`} />
              <span>{post.likes.length}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments.length}</span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4 border-t border-purple-500/10 pt-4">
            <h4 className="text-white">Comentários</h4>
            
            {post.comments.map((comment) => (
              <CommentItem 
                key={comment.commentId} 
                comment={comment} 
                onReply={setReplyingTo}
              />
            ))}
          </div>

          {/* Add Comment */}
          <form onSubmit={handleComment} className="flex gap-2">
            <Input
              type="text"
              placeholder={replyingTo ? 'Escrever resposta...' : 'Adicionar comentário...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
              className="flex-1 bg-black/40 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
            />
            <Button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white hover:from-pink-600 hover:via-purple-600 hover:to-cyan-500 shadow-lg shadow-pink-500/50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          {replyingTo && (
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancelar resposta
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}