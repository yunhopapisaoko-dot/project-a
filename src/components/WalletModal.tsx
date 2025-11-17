import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  accessToken: string;
  currentBalance: number;
  chatId: string;
  onBalanceUpdate: () => void;
}

interface ChatMember {
  userId: string;
  username: string;
  avatarUrl: string | null;
  wallet?: number;
}

export function WalletModal({ 
  isOpen, 
  onClose, 
  currentUserId, 
  accessToken, 
  currentBalance, 
  chatId,
  onBalanceUpdate 
}: WalletModalProps) {
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatMember | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');

  useEffect(() => {
    if (isOpen) {
      loadChatMembers();
    }
  }, [isOpen]);

  const loadChatMembers = async () => {
    try {
      // Load all users since we don't have a specific chat members endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'getAllUsers',
          accessToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        setMembers(data.users.filter((u: ChatMember) => u.userId !== currentUserId));
      }
    } catch (error) {
      console.error('Error loading chat members:', error);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser || !amount) {
      toast.error('Selecione um destinatário e valor');
      return;
    }

    const transferAmount = parseInt(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (transferAmount > currentBalance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'transferMoney',
          accessToken,
          recipientId: selectedUser.userId,
          amount: transferAmount,
        }),
      });

      if (response.ok) {
        toast.success(`💸 ${transferAmount} moedas enviadas para ${selectedUser.username}`);
        setAmount('');
        setSelectedUser(null);
        onBalanceUpdate();
        loadChatMembers(); // Reload to update balances
      } else {
        toast.error('Erro ao transferir');
      }
    } catch (error) {
      console.error('Error transferring:', error);
      toast.error('Erro ao transferir');
    } finally {
      setLoading(false);
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
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#0a0a0f] to-black rounded-3xl border border-cyan-500/30 overflow-hidden max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
          {/* Header */}
          <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg" style={{ textShadow: '0 0 10px rgba(34,211,238,0.6)' }}>
                  💰 Carteira
                </h3>
                <p className="text-xs text-gray-400">Transferências rápidas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-cyan-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Balance Display */}
            <div className="p-5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl backdrop-blur-sm">
              <p className="text-cyan-400 text-sm mb-2">Saldo Disponível</p>
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-cyan-500" />
                <span className="text-white text-3xl" style={{ textShadow: '0 0 20px rgba(34,211,238,0.6)' }}>
                  {currentBalance}
                </span>
                <span className="text-gray-400 text-xl">moedas</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-cyan-500/20">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'send'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Enviar
              </button>
              <button
                onClick={() => setActiveTab('receive')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'receive'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Receber
              </button>
            </div>

            {/* Send Tab */}
            {activeTab === 'send' && (
              <div className="space-y-4">
                {/* User Selection */}
                <div className="space-y-3">
                  <label className="text-gray-300 text-sm">Enviar para</label>
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-cyan-500/20 rounded-xl p-2 bg-black/20">
                    {members.map((user) => (
                      <button
                        key={user.userId}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedUser?.userId === user.userId
                            ? 'bg-cyan-500/20 border border-cyan-500/40'
                            : 'bg-black/20 hover:bg-cyan-500/10 border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/30">
                          {user.avatarUrl ? (
                            <ImageWithFallback src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-white block">{user.username}</span>
                          {user.wallet !== undefined && (
                            <span className="text-xs text-cyan-400">💰 {user.wallet}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="text-gray-300 text-sm">Valor</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Digite o valor..."
                    className="w-full px-4 py-3 bg-black/40 border border-cyan-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>

                {/* Transfer Button */}
                <button
                  onClick={handleTransfer}
                  disabled={!selectedUser || !amount || loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  {loading ? 'Enviando...' : 'Enviar Moedas'}
                </button>
              </div>
            )}

            {/* Receive Tab */}
            {activeTab === 'receive' && (
              <div className="space-y-4 py-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <ArrowDownLeft className="w-10 h-10 text-purple-400" />
                </div>
                <h4 className="text-white text-lg">Receber Moedas</h4>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  Outros usuários podem enviar moedas para você através da carteira deles. 
                  Você será notificado quando receber uma transferência.
                </p>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <p className="text-cyan-400 text-sm">Seu saldo será atualizado automaticamente</p>
                </div>
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
