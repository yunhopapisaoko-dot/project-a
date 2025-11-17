import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Star, MessageSquare, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface User {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role?: 'leader' | 'helper' | 'member';
  password?: string;
}

interface Chat {
  chatId: string;
  name: string;
  description: string;
  imageUrl: string;
  backgroundUrl: string;
  createdBy: string;
  createdAt: string;
}

interface SecretAdminScreenProps {
  onBack: () => void;
}

export default function SecretAdminScreen({ onBack }: SecretAdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'featured'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  
  // Create Chat State
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatDescription, setNewChatDescription] = useState('');
  const [newChatImage, setNewChatImage] = useState('');
  const [newChatBackground, setNewChatBackground] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load users with credentials
      const usersResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/users`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data.users || []);
      }

      // Load chats
      const chatsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/chats`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (chatsResponse.ok) {
        const data = await chatsResponse.json();
        setChats(data.chats || []);
      }

      // Load featured posts
      const postsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/posts?type=featured`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (postsResponse.ok) {
        const data = await postsResponse.json();
        setFeaturedPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const updateUserRole = async (userId: string, role: 'leader' | 'helper' | 'member') => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ userId, role })
      });
      loadData();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const createChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChatName || !newChatDescription) {
      alert('Preencha nome e descrição do chat');
      return;
    }
    
    try {
      console.log('🚀 Iniciando criação de chat...');
      console.log('📝 Dados do chat:', {
        name: newChatName,
        description: newChatDescription,
        imageUrl: newChatImage,
        backgroundUrl: newChatBackground
      });
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/create-chat`;
      console.log('🌐 URL:', url);
      console.log('🔑 Token:', publicAnonKey.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          name: newChatName,
          description: newChatDescription,
          imageUrl: newChatImage,
          backgroundUrl: newChatBackground
        })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Tenta ler o corpo da resposta mesmo em erro
      const responseText = await response.text();
      console.log('📄 Response body (raw):', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      if (response.ok) {
        console.log('✅ Chat criado com sucesso:', responseData);
        alert('Chat criado com sucesso!');
        setShowCreateChat(false);
        setNewChatName('');
        setNewChatDescription('');
        setNewChatImage('');
        setNewChatBackground('');
        loadData();
      } else {
        console.error('❌ Erro na resposta:', responseData);
        const errorMsg = responseData.error || responseData.message || responseData.raw || 'Erro desconhecido';
        alert(`Erro ao criar chat (${response.status}): ${errorMsg}`);
      }
    } catch (err) {
      console.error('💥 Erro fatal ao criar chat:', err);
      alert(`Erro ao criar chat: ${err instanceof Error ? err.message : 'Erro de conexão'}`);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Tem certeza que deseja excluir este chat?')) return;
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/delete-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ chatId })
      });
      loadData();
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const toggleUserExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'leader': return 'bg-green-900/50 border-green-700 text-green-400';
      case 'helper': return 'bg-purple-900/50 border-purple-700 text-purple-400';
      default: return 'bg-gray-900/50 border-gray-700 text-gray-400';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'leader': return 'Líder';
      case 'helper': return 'Ajudante';
      default: return 'Membro';
    }
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ ATENÇÃO! Isso vai excluir TODAS as contas, posts, chats e mensagens. Esta ação é IRREVERSÍVEL! Tem certeza?')) {
      return;
    }
    
    if (!confirm('Tem CERTEZA MESMO? Digite SIM para confirmar')) {
      return;
    }
    
    try {
      console.log('🗑️ Iniciando limpeza completa do banco de dados...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/clear-all-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dados limpos:', result);
        alert(`✅ Banco de dados limpo com sucesso!\n\n` +
              `👥 Usuários excluídos: ${result.authUsersDeleted}\n` +
              `📦 Itens do KV excluídos: ${result.kvItemsDeleted}`);
        loadData();
      } else {
        const error = await response.json();
        console.error('❌ Erro ao limpar dados:', error);
        alert(`Erro ao limpar dados: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('💥 Erro fatal ao limpar dados:', err);
      alert(`Erro ao limpar dados: ${err instanceof Error ? err.message : 'Erro de conexão'}`);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-900/20 via-black to-blue-900/20"></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-cyan-500/20 backdrop-blur-xl bg-black/40">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-cyan-400 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 
            className="text-white flex items-center gap-2"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(34,211,238,0.6), 0 0 30px rgba(59,130,246,0.4)'
            }}
          >
            <Shield className="w-6 h-6" />
            Painel Secreto
          </h1>
          
          <Button
            onClick={clearAllData}
            className="bg-red-900/50 hover:bg-red-800 text-red-400 border border-red-700 text-sm px-3 py-1 h-auto"
          >
            🗑️ Limpar Tudo
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-cyan-500/10 backdrop-blur-sm bg-black/20">
          <div className="flex gap-4 max-w-6xl mx-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'chats'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Chats Públicos
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'featured'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Star className="w-5 h-5 inline mr-2" />
              Destaques
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-w-6xl mx-auto">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-xl text-cyan-400 mb-4">Gerenciar Usuários ({users.length})</h2>
              {users.map((user) => (
                <div
                  key={user.userId}
                  className="bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30">
                        {user.avatarUrl ? (
                          <ImageWithFallback
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <div className={`inline-block mt-1 px-2 py-1 rounded text-xs border ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUserExpand(user.userId)}
                      className="text-cyan-400 hover:text-cyan-300 transition-all"
                    >
                      {expandedUsers.has(user.userId) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  {expandedUsers.has(user.userId) && (
                    <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-3">
                      <div className="bg-black/40 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Credenciais de Recuperação</p>
                        <p className="text-sm text-white break-all"><strong>Email:</strong> {user.email}</p>
                        <p className="text-sm text-cyan-400 mt-2 break-all"><strong>Senha:</strong> {user.password || 'não disponível'}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateUserRole(user.userId, 'leader')}
                          className={`flex-1 ${
                            user.role === 'leader'
                              ? 'bg-green-900/50 border border-green-700 text-green-400'
                              : 'bg-gray-800 text-gray-300 hover:bg-green-900/30'
                          }`}
                        >
                          Tornar Líder
                        </Button>
                        <Button
                          onClick={() => updateUserRole(user.userId, 'helper')}
                          className={`flex-1 ${
                            user.role === 'helper'
                              ? 'bg-purple-900/50 border border-purple-700 text-purple-400'
                              : 'bg-gray-800 text-gray-300 hover:bg-purple-900/30'
                          }`}
                        >
                          Tornar Ajudante
                        </Button>
                        <Button
                          onClick={() => updateUserRole(user.userId, 'member')}
                          className={`flex-1 ${
                            !user.role || user.role === 'member'
                              ? 'bg-gray-900/50 border border-gray-700 text-gray-400'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-900/30'
                          }`}
                        >
                          Membro Normal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-cyan-400">Chats Públicos ({chats.length})</h2>
                <Button
                  onClick={() => setShowCreateChat(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Chat
                </Button>
              </div>

              {showCreateChat && (
                <form onSubmit={createChat} className="bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 space-y-3">
                  <Input
                    placeholder="Nome do Chat"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    required
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                  <Textarea
                    placeholder="Descrição do Chat"
                    value={newChatDescription}
                    onChange={(e) => setNewChatDescription(e.target.value)}
                    required
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                  <Input
                    placeholder="URL da Imagem do Chat (opcional)"
                    value={newChatImage}
                    onChange={(e) => setNewChatImage(e.target.value)}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                  <Input
                    placeholder="URL do Fundo do Chat (opcional)"
                    value={newChatBackground}
                    onChange={(e) => setNewChatBackground(e.target.value)}
                    className="bg-black/40 border-cyan-500/30 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowCreateChat(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      Criar
                    </Button>
                  </div>
                </form>
              )}

              {chats.map((chat) => (
                <div
                  key={chat.chatId}
                  className="bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden"
                >
                  <div className="relative h-32">
                    <ImageWithFallback
                      src={chat.backgroundUrl}
                      alt={chat.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30">
                        <ImageWithFallback
                          src={chat.imageUrl}
                          alt={chat.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{chat.name}</p>
                        <p className="text-xs text-gray-400">{chat.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      onClick={() => deleteChat(chat.chatId)}
                      className="w-full bg-red-900/50 hover:bg-red-800 text-red-400 border border-red-700"
                    >
                      Excluir Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="space-y-4">
              <h2 className="text-xl text-cyan-400 mb-4">Posts em Destaque ({featuredPosts.length})</h2>
              <p className="text-gray-400 text-sm mb-4">
                Apenas 1 post pode estar em destaque por vez. Ele fica em destaque por 3 dias.
              </p>
              {featuredPosts.map((post) => (
                <div
                  key={post.postId}
                  className="bg-black/40 backdrop-blur-sm border-2 border-yellow-500/50 rounded-xl overflow-hidden"
                >
                  {post.imageUrl && (
                    <ImageWithFallback
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-yellow-500">Em Destaque</span>
                    </div>
                    <h3 className="text-white mb-2">{post.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{post.text}</p>
                    <p className="text-xs text-gray-500">
                      Por {post.username} • {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {post.featuredAt && (
                      <p className="text-xs text-yellow-500 mt-2">
                        Em destaque desde {new Date(post.featuredAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}