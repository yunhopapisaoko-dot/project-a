import { X, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId } from '../utils/supabase/client';

interface Notification {
  notificationId: string;
  type: 'like' | 'comment' | 'follow';
  fromUserId: string;
  fromUsername: string;
  fromAvatarUrl: string | null;
  postId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  accessToken,
  onNotificationClick
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      
      // Poll for new notifications
      const interval = setInterval(loadNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/mark-notification-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ notificationId })
      });
      
      loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/mark-all-notifications-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      loadNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-cyan-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/20 rounded-2xl w-full max-w-lg my-8 shadow-2xl shadow-purple-500/20 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-xl border-b border-purple-500/20 p-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-white">Notificações</h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
              >
                Marcar tudo como lido
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Nenhuma notificação</p>
              <p className="text-sm text-gray-500 mt-2">
                Você será notificado quando alguém curtir, comentar ou seguir você
              </p>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/10">
              {notifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.notificationId);
                    }
                    if (onNotificationClick) {
                      onNotificationClick(notification);
                    }
                  }}
                  className={`w-full p-4 flex items-start gap-3 transition-all text-left ${
                    notification.isRead
                      ? 'bg-transparent hover:bg-purple-500/5'
                      : 'bg-purple-500/10 hover:bg-purple-500/20'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-purple-500/30 flex-shrink-0">
                    {notification.fromAvatarUrl ? (
                      <ImageWithFallback
                        src={notification.fromAvatarUrl}
                        alt={notification.fromUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-medium">{notification.fromUsername}</span>
                          {' '}
                          <span className="text-gray-300">{notification.message}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </button>
              ))}
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
