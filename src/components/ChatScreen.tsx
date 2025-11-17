import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Copy, Reply, Eye, User as UserIcon, X, UtensilsCrossed, UserPlus, LogOut, Shield, Activity, UserCog, Wallet, Building2, Heart, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { MenuModal } from './MenuModal';
import { StatsDisplay } from './StatsDisplay';
import { ManagerHub } from './ManagerHub';
import { QuickProfileModal } from './QuickProfileModal';
import { WalletModal } from './WalletModal';
import { BankModal } from './BankModal';
import { HospitalModal } from './HospitalModal';
import { HospitalManagerModal } from './HospitalManagerModal';
import { BankChatSystem } from './BankChatSystem';
import { BankDocumentModal } from './BankDocumentModal';
import { RoomSelectorModal } from './RoomSelectorModal';
import { toast } from 'sonner@2.0.3';

interface Message {
  messageId: string;
  chatId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  replyTo?: string;
  replyToText?: string;
  replyToUsername?: string;
  viewedBy?: string[];
  createdAt: string;
}

interface MenuItem {
  name: string;
  price: string;
  description: string;
  stats: {
    fome: number;
    sede: number;
    alcoolismo: number;
  };
}

interface ChatScreenProps {
  chatId: string;
  chatName: string;
  chatImage: string;
  chatBackground: string;
  chatDescription: string;
  createdBy: string;
  accessToken: string;
  currentUserId: string;
  currentUsername: string;
  onBack: () => void;
  onLeaveChat?: (chatId: string) => void;
  onViewProfile?: (userId: string) => void;
  menuData?: {
    bebidas: MenuItem[];
    comidas: MenuItem[];
    alcoolicas: MenuItem[];
  };
}

export default function ChatScreen({
  chatId,
  chatName,
  chatImage,
  chatBackground,
  chatDescription,
  createdBy,
  accessToken,
  currentUserId,
  currentUsername,
  onBack,
  onLeaveChat,
  onViewProfile,
  menuData
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMakeManagerModal, setShowMakeManagerModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [longPressMessage, setLongPressMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null);
  const [creatorUsername, setCreatorUsername] = useState('');
  const [showManagerHub, setShowManagerHub] = useState(false);
  const [userRole, setUserRole] = useState<'none' | 'employee' | 'manager'>('none');
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    hunger: 100,
    thirst: 100,
    alcoholism: 0
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [quickProfileUser, setQuickProfileUser] = useState<{userId: string; username: string; avatarUrl: string | null} | null>(null);
  const [playerWallet, setPlayerWallet] = useState(3000);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showHospitalManagerModal, setShowHospitalManagerModal] = useState(false);
  const [showBankDocumentModal, setShowBankDocumentModal] = useState(false);
  const [showChangeBackgroundModal, setShowChangeBackgroundModal] = useState(false);
  const [showBankChatSystem, setShowBankChatSystem] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [newBackgroundUrl, setNewBackgroundUrl] = useState('');
  const [documentForm, setDocumentForm] = useState({
    name: '',
    age: '',
    gender: '',
    pronouns: '',
    photoUrl: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadCreator = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/user/${createdBy}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCreatorUsername(data.username || 'Admin');
      }
    } catch (err) {
      console.error('Error loading creator:', err);
    }
  };

  const loadUserRole = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/user-role/${chatId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role || 'none');
      }
    } catch (err) {
      console.error('Error loading user role:', err);
    }
  };

  const loadPlayerStats = async () => {
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
        // Update wallet if available
        if (data.wallet !== undefined) {
          setPlayerWallet(data.wallet);
        }
      }
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/users`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const applyStatsDecay = async () => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/apply-stats-decay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      await loadPlayerStats();
    } catch (err) {
      console.error('Error applying stats decay:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chatId,
          text: newMessage,
          replyTo: replyingTo?.messageId,
          replyToText: replyingTo?.text,
          replyToUsername: replyingTo?.username
        })
      });

      if (response.ok) {
        setNewMessage('');
        setReplyingTo(null);
        await loadMessages();
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (messageId: string) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/view-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ messageId })
      });
    } catch (err) {
      console.error('Error marking message as viewed:', err);
    }
  };

  const leaveChat = () => {
    if (confirm('Tem certeza que deseja sair deste chat?')) {
      onLeaveChat?.(chatId);
      onBack();
    }
  };

  const makeManager = async (userId: string, role: 'manager' | 'employee') => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/set-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chatId,
          targetUserId: userId,
          role
        })
      });

      if (response.ok) {
        toast.success(`✅ Usuário promovido a ${role === 'manager' ? 'Gerente' : 'Funcionário'} com sucesso!`);
        setShowMakeManagerModal(false);
      } else {
        toast.error('❌ Erro ao promover usuário');
      }
    } catch (err) {
      console.error('Error making manager:', err);
      toast.error('❌ Erro ao promover usuário');
    }
  };

  /* 
   * SENHAS DOS GERENTES (configuradas no servidor):
   * - Restaurante: Restaurante1919
   * - Bar: Bar1918
   * - Padaria: Padaria1213
   * - Hospital: Hospital1819
   * - Banco: Banco1211
   */
  const handlePasswordSubmit = async () => {
    if (!managerPassword.trim()) {
      toast.error('⚠️ Por favor, digite a senha');
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/verify-manager-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chatId,
          password: managerPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowPasswordModal(false);
          setManagerPassword('');
          setShowManagerHub(true);
          await loadUserRole(); // Reload para atualizar o role
        } else {
          toast.error('❌ Senha incorreta!');
        }
      } else {
        toast.error('❌ Erro ao verificar senha');
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      toast.error('❌ Erro ao verificar senha');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setLongPressMessage(null);
  };

  const handleMessageClick = (message: Message) => {
    if (message.userId === currentUserId) {
      setViewingMessage(message);
      loadMessages();
    }
  };

  const handleLongPressStart = (messageId: string) => {
    longPressTimer.current = window.setTimeout(() => {
      setLongPressMessage(messageId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    loadMessages();
    loadCreator();
    loadUserRole();
    loadPlayerStats();
    loadAllUsers();
    
    pollInterval.current = window.setInterval(loadMessages, 3000);

    const alcoholismInterval = window.setInterval(applyStatsDecay, 180000);
    const hungerThirstInterval = window.setInterval(applyStatsDecay, 1800000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      clearInterval(alcoholismInterval);
      clearInterval(hungerThirstInterval);
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.viewedBy && !msg.viewedBy.includes(currentUserId)) {
        markAsViewed(msg.messageId);
      }
    });
  }, [messages.length]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fixed Background Layer - This won't scroll */}
      <div className="fixed inset-0 z-0">
        {/* Background Image - Full visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${chatBackground})` }}
        ></div>
      </div>

      {/* Main Container - Full Screen */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Ultra Modern Header */}
        <div className="relative backdrop-blur-xl bg-black/40 border-b border-purple-500/20">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5"></div>
          
          <div className="relative flex items-center gap-3 px-4 py-3">
            <button
              onClick={onBack}
              className="group relative p-2 rounded-xl hover:bg-purple-500/20 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
              <ArrowLeft className="w-6 h-6 text-gray-300 group-hover:text-cyan-400 transition-colors relative z-10" />
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full opacity-50 blur"></div>
                <button
                  onClick={() => {
                    if (chatName === '🏦 Banco' || chatName === '🏥 Hospital') {
                      setShowRoomSelector(true);
                    }
                  }}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50 ${(chatName === '🏦 Banco' || chatName === '🏥 Hospital') ? 'cursor-pointer hover:border-yellow-500/70 transition-all' : ''}`}
                >
                  <ImageWithFallback
                    src={chatImage}
                    alt={chatName}
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h2 
                  className="text-white truncate"
                  style={{
                    textShadow: '0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(168,85,247,0.4)'
                  }}
                >
                  {chatName}
                </h2>
                <p className="text-xs text-cyan-400/70">Chat público • {messages.length} mensagens</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {menuData && (
                <>
                  <button
                    onClick={() => setShowMenuModal(true)}
                    className="group relative p-2 rounded-xl hover:bg-purple-500/20 transition-all"
                    title="Cardápio"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                    <UtensilsCrossed className="w-6 h-6 text-gray-300 group-hover:text-purple-400 transition-colors relative z-10" />
                  </button>

                  {/* Wallet Button in Header - Only for Bar, Padaria, Restaurante */}
                  {(chatName.includes('Bar') || chatName.includes('Padaria') || chatName.includes('Restaurante')) && (
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="group relative p-2 rounded-xl hover:bg-cyan-500/20 transition-all"
                      title="Carteira"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                      <Wallet className="w-6 h-6 text-gray-300 group-hover:text-cyan-400 transition-colors relative z-10" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="group relative p-2 rounded-xl hover:bg-cyan-500/20 transition-all"
                    title="Virar Gerente"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                    <UserCog className="w-6 h-6 text-gray-300 group-hover:text-cyan-400 transition-colors relative z-10" />
                  </button>
                </>
              )}

              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`group relative p-2 rounded-xl transition-all ${showMenu ? 'bg-purple-500/30' : 'hover:bg-purple-500/20'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                <MoreVertical className={`w-6 h-6 transition-all relative z-10 ${showMenu ? 'text-purple-400 rotate-90' : 'text-gray-300 group-hover:text-purple-400'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu - Redesigned */}
        {showMenu && (
          <div className="relative backdrop-blur-xl bg-black/60 border-b border-purple-500/10 animate-in slide-in-from-top duration-200">
            <div className="px-4 py-3 space-y-2">
              {/* Ver Stats */}
              <button
                onClick={() => {
                  setShowStatsModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white">Ver Stats</p>
                  <p className="text-xs text-gray-400">Saúde, Fome, Sede, Alcoolismo</p>
                </div>
              </button>

              {/* Bank Chat System - Only show in Banco */}
              {chatName === '🏦 Banco' && (
                <button
                  onClick={() => {
                    setShowBankChatSystem(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 border border-yellow-500/20 hover:border-yellow-500/40 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                    <Building2 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white">Sistema Bancário</p>
                    <p className="text-xs text-gray-400">Acessar serviços do banco</p>
                  </div>
                </button>
              )}

              {/* Tornar Gerente - Only for admins */}
              {currentUserId === createdBy && (
                <button
                  onClick={() => {
                    setShowMakeManagerModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                    <Shield className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white">Tornar Gerente</p>
                    <p className="text-xs text-gray-400">Promover usuários</p>
                  </div>
                </button>
              )}

              {/* Convidar Usuários */}
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/20 hover:border-pink-500/40 transition-all group"
              >
                <div className="p-2 rounded-lg bg-pink-500/20 group-hover:bg-pink-500/30 transition-colors">
                  <UserPlus className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white">Convidar Usuários</p>
                  <p className="text-xs text-gray-400">Adicionar pessoas ao chat</p>
                </div>
              </button>

              {/* Manager Hub */}
              {userRole !== 'none' && (
                <button
                  onClick={() => {
                    setShowManagerHub(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white">Gerente Hub</p>
                    <p className="text-xs text-gray-400">Painel de gerenciamento</p>
                  </div>
                </button>
              )}

              {/* Mudar Background - Only for chat creator/leader */}
              {currentUserId === createdBy && (
                <button
                  onClick={() => {
                    setShowChangeBackgroundModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                    <ImageIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white">Mudar Background</p>
                    <p className="text-xs text-gray-400">Personalizar fundo do chat</p>
                  </div>
                </button>
              )}

              {/* Sair do Chat */}
              <button
                onClick={leaveChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/20 hover:border-red-500/40 transition-all group"
              >
                <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white">Sair do Chat</p>
                  <p className="text-xs text-gray-400">Voltar para a lista</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative"
        >
          {messages.map((message) => {
              const isCurrentUser = message.userId === currentUserId;
              const isLongPressed = longPressMessage === message.messageId;
              
              return (
                <div
                  key={message.messageId}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* Avatar for all users - including current user */}
                  <div 
                    className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickProfileUser({
                        userId: message.userId,
                        username: message.username,
                        avatarUrl: message.avatarUrl
                      });
                    }}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/40">
                      {message.avatarUrl ? (
                        <img
                          src={message.avatarUrl}
                          alt={message.username}
                          className="w-full h-full object-cover"
                          loading="eager"
                          decoding="sync"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%] relative`}>
                    {/* Show username for all users */}
                    <span 
                      className="text-xs text-purple-300 mb-1 px-1 drop-shadow-lg cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickProfileUser({
                          userId: message.userId,
                          username: message.username,
                          avatarUrl: message.avatarUrl
                        });
                      }}
                    >
                      {message.username}
                    </span>
                    
                    <div
                      onMouseDown={() => handleLongPressStart(message.messageId)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart(message.messageId)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={() => handleMessageClick(message)}
                      className={`relative group cursor-pointer`}
                    >
                      {/* Message Glow Effect */}
                      <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-300 ${
                        isCurrentUser ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-purple-500'
                      }`}></div>

                      <div className={`relative px-4 py-3 rounded-2xl backdrop-blur-xl shadow-xl ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-pink-500/50 to-purple-600/50 border border-pink-500/40'
                          : 'bg-black/80 border border-purple-500/30'
                      }`}>
                        {message.replyTo && message.replyToText && (
                          <div className="mb-2 pb-2 border-b border-purple-500/30">
                            <div className="flex items-center gap-1 mb-1">
                              <Reply className="w-3 h-3 text-purple-300" />
                              <span className="text-xs text-purple-300">{message.replyToUsername}</span>
                            </div>
                            <p className="text-xs text-gray-300 italic truncate">{message.replyToText}</p>
                          </div>
                        )}
                        
                        <p className="text-white leading-relaxed">{message.text}</p>
                      </div>

                      {/* Long Press Menu */}
                      {isLongPressed && (
                        <div className="absolute bottom-full left-0 mb-2 bg-black/95 backdrop-blur-xl border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[200px]">
                          <button
                            onClick={() => copyText(message.text)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/20 text-white w-full transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copiar texto</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(message);
                              setLongPressMessage(null);
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/20 text-white w-full border-t border-purple-500/20 transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            <span>Responder</span>
                          </button>
                          <button
                            onClick={() => setLongPressMessage(null)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 text-red-400 w-full border-t border-purple-500/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Fechar</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isCurrentUser && message.viewedBy && message.viewedBy.length > 1 && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400">
                          <Eye className="w-3 h-3" />
                          <span>{message.viewedBy.length - 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Bar */}
        {replyingTo && (
          <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-t border-purple-500/30 animate-in slide-in-from-bottom duration-200">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/30">
                <Reply className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400">Respondendo a {replyingTo.username}</p>
                <p className="text-sm text-white truncate">{replyingTo.text}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area - Ultra Modern */}
        <form onSubmit={sendMessage} className="relative backdrop-blur-xl bg-black/50 border-t border-purple-500/20 px-4 py-3">
          <div className="flex gap-3 items-end">
            {/* Document Button - Only show in Banco chat */}
            {chatName === '🏦 Banco' && (
              <button
                type="button"
                onClick={() => setShowBankDocumentModal(true)}
                className="relative group p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:text-yellow-300 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Criar Documento"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity"></div>
                <FileText className="w-5 h-5 relative z-10" />
              </button>
            )}

            {/* Bank Button - Only show in Banco chat */}
            {chatName === '🏦 Banco' && (
              <button
                type="button"
                onClick={() => setShowBankModal(true)}
                className="relative group p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:text-yellow-300 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Banco"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity"></div>
                <Building2 className="w-5 h-5 relative z-10" />
              </button>
            )}

            {/* Hospital Button - Only show in Hospital chat */}
            {chatName.includes('Hospital') && (
              <button
                type="button"
                onClick={() => setShowHospitalModal(true)}
                className="relative group p-4 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                title="Hospital"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity"></div>
                <Heart className="w-5 h-5 relative z-10" />
              </button>
            )}
            
            <div className="flex-1 relative group min-w-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within:opacity-30 blur transition-opacity"></div>
              
              <Textarea
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
                className="relative bg-black/60 border-purple-500/40 text-white placeholder:text-gray-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/30 rounded-2xl px-5 py-3 transition-all backdrop-blur-sm resize-none max-h-32 w-full overflow-wrap-anywhere break-words"
                style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="relative group p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed shadow-lg shadow-pink-500/30 hover:shadow-pink-500/60 disabled:shadow-none transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity"></div>
              
              <Send 
                className={`w-5 h-5 relative z-10 transition-transform ${
                  loading ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                }`} 
              />
            </button>
          </div>
        </form>
      </div>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowStatsModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-400" />
                Seus Stats
              </h3>
              <button 
                onClick={() => setShowStatsModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <StatsDisplay
              health={playerStats.health}
              hunger={playerStats.hunger}
              thirst={playerStats.thirst}
              alcoholism={playerStats.alcoholism}
            />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/20 max-h-[70vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-pink-400" />
                Convidar Usuários
              </h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {allUsers.filter(u => u.userId !== currentUserId).map(user => (
                <button
                  key={user.userId}
                  onClick={() => {
                    toast.success(`✉️ Convite enviado para ${user.username}!`);
                    setShowInviteModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/30">
                    {user.avatarUrl ? (
                      <ImageWithFallback
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-white">{user.username}</span>
                </button>
              ))}
            </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Make Manager Modal */}
      <AnimatePresence>
        {showMakeManagerModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowMakeManagerModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/20 max-h-[70vh] overflow-y-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-400" />
                Promover Usuário
              </h3>
              <button 
                onClick={() => setShowMakeManagerModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Selecione um usuário para promover a Gerente ou Funcionário deste estabelecimento.
            </p>
            
            <div className="space-y-2">
              {allUsers.filter(u => u.userId !== currentUserId).map(user => (
                <div key={user.userId} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/30">
                      {user.avatarUrl ? (
                        <ImageWithFallback
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-white flex-1">{user.username}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => makeManager(user.userId, 'manager')}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/40 text-cyan-400 text-xs transition-all"
                      title="Gerente"
                    >
                      👑
                    </button>
                    <button
                      onClick={() => makeManager(user.userId, 'employee')}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-purple-400 text-xs transition-all"
                      title="Funcionário"
                    >
                      🛠️
                    </button>
                  </div>
                </div>
              ))}
            </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Count Modal */}
      <AnimatePresence>
        {viewingMessage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setViewingMessage(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-purple-500/20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Visualizações
              </h3>
              <button 
                onClick={() => setViewingMessage(null)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {!viewingMessage.viewedBy || viewingMessage.viewedBy.length === 1 
                ? 'Ninguém visualizou ainda'
                : `${viewingMessage.viewedBy.length - 1} pessoa(s) visualizaram`
              }
            </p>
            <div className="bg-black/40 p-4 rounded-xl border border-purple-500/20">
              <p className="text-sm text-white">{viewingMessage.text}</p>
            </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Menu Modal */}
      {menuData && showMenuModal && (
        <MenuModal
          menuData={menuData}
          chatId={chatId}
          userId={currentUserId}
          userName={currentUsername}
          accessToken={accessToken}
          onClose={() => setShowMenuModal(false)}
        />
      )}

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => {
                setShowPasswordModal(false);
                setManagerPassword('');
              }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-cyan-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-cyan-500/20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white flex items-center gap-2">
                <UserCog className="w-6 h-6 text-cyan-400" />
                Virar Gerente
              </h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setManagerPassword('');
                }}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Digite a senha do estabelecimento para se tornar gerente
            </p>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Digite a senha..."
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="bg-black/60 border-cyan-500/40 text-white placeholder:text-gray-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/30"
                autoFocus
              />
              
              <button
                onClick={handlePasswordSubmit}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 transition-all shadow-lg shadow-cyan-500/30"
              >
                Confirmar
              </button>
            </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Manager Hub */}
      {showManagerHub && (
        <ManagerHub
          chatId={chatId}
          chatName={chatName}
          accessToken={accessToken}
          currentUserId={currentUserId}
          isManager={userRole === 'manager'}
          onClose={() => setShowManagerHub(false)}
        />
      )}

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
            setQuickProfileUser(null);
            if (onViewProfile) {
              onViewProfile(userId);
            }
          }}
        />
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          currentUserId={currentUserId}
          accessToken={accessToken}
          currentBalance={playerWallet}
          chatId={chatId}
          onBalanceUpdate={loadPlayerStats}
        />
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <BankModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          currentUserId={currentUserId}
          accessToken={accessToken}
          currentBalance={playerWallet}
          onBalanceUpdate={loadPlayerStats}
        />
      )}

      {/* Hospital Modal */}
      {showHospitalModal && (
        <HospitalModal
          isOpen={showHospitalModal}
          onClose={() => setShowHospitalModal(false)}
          currentUserId={currentUserId}
          accessToken={accessToken}
          currentHealth={playerStats.health}
          currentBalance={playerWallet}
          onStatsUpdate={loadPlayerStats}
        />
      )}

      {/* Hospital Manager Modal */}
      {showHospitalManagerModal && (
        <HospitalManagerModal
          isOpen={showHospitalManagerModal}
          onClose={() => setShowHospitalManagerModal(false)}
          accessToken={accessToken}
          onStatsUpdate={loadPlayerStats}
        />
      )}

      {/* Bank Document Modal */}
      {showBankDocumentModal && (
        <BankDocumentModal
          userId={currentUserId}
          userName={currentUsername}
          accessToken={accessToken}
          onClose={() => setShowBankDocumentModal(false)}
        />
      )}

      {/* Change Background Modal */}
      <AnimatePresence>
        {showChangeBackgroundModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowChangeBackgroundModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                className="bg-gradient-to-b from-[#0a0a0f] to-black border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-cyan-400" />
                    Mudar Background
                  </h3>
                  <button 
                    onClick={() => setShowChangeBackgroundModal(false)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-400 text-sm mb-6">
                  Cole a URL de uma imagem para usar como fundo do chat
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={newBackgroundUrl}
                    onChange={(e) => setNewBackgroundUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />

                  <button
                    onClick={() => {
                      if (newBackgroundUrl.trim()) {
                        toast.success('✅ Background atualizado! (Funcionalidade em desenvolvimento)');
                        setShowChangeBackgroundModal(false);
                        setNewBackgroundUrl('');
                      }
                    }}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                  >
                    Atualizar Background
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bank Chat System */}
      {chatName === '🏦 Banco' && (
        <BankChatSystem
          isOpen={showBankChatSystem}
          onClose={() => setShowBankChatSystem(false)}
          currentUserId={currentUserId}
          accessToken={accessToken}
          chatImage={chatImage}
        />
      )}

      {/* Room Selector Modal */}
      {showRoomSelector && (
        <RoomSelectorModal
          type={chatName === '🏥 Hospital' ? 'hospital' : 'bank'}
          locationName={chatName}
          onClose={() => setShowRoomSelector(false)}
          onSelectRoom={(roomName) => {
            toast.success(`Você entrou em ${roomName}`);
            // Here you can add logic to open a specific chat room
          }}
        />
      )}
    </div>
  );
}