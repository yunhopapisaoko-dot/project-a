import { useState, useEffect } from 'react';
import { X, DollarSign, ArrowUpRight, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  accessToken: string;
  currentBalance: number;
  onBalanceUpdate: () => void;
}

interface User {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export function BankModal({ isOpen, onClose, currentUserId, accessToken, currentBalance, onBalanceUpdate }: BankModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && isUnlocked) {
      loadUsers();
    }
  }, [isOpen, isUnlocked]);

  const loadUsers = async () => {
    try {
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
        setUsers(data.users.filter((u: User) => u.userId !== currentUserId));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUnlock = () => {
    if (password === 'Banco1211') {
      setIsUnlocked(true);
      toast.success('🏦 Banco desbloqueado!');
    } else {
      toast.error('❌ Senha incorreta!');
      setPassword('');
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
        toast.success(`💸 ${transferAmount} moedas transferidas para ${selectedUser.username}`);
        setAmount('');
        setSelectedUser(null);
        onBalanceUpdate();
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

  const handleClose = () => {
    setIsUnlocked(false);
    setPassword('');
    setSelectedUser(null);
    setAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-gradient-to-b from-[#0a0a0f] to-black rounded-3xl border border-yellow-500/30 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg" style={{ textShadow: '0 0 10px rgba(234,179,8,0.6)' }}>
                  🏦 City Bank
                </h3>
                <p className="text-xs text-gray-400">Transferências</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-yellow-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isUnlocked ? (
              <div className="space-y-6 py-8">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full opacity-50 blur-2xl animate-pulse"></div>
                    <Lock className="relative w-16 h-16 text-yellow-500" />
                  </div>
                  <h4 className="text-white text-xl mb-2" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
                    Acesso Restrito
                  </h4>
                  <p className="text-gray-400 text-sm text-center mb-6">
                    Digite a senha para acessar o sistema bancário
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Digite a senha..."
                    className="w-full px-4 py-3 bg-black/40 border border-yellow-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/60 transition-all"
                  />
                  <button
                    onClick={handleUnlock}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Balance */}
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Saldo Atual</p>
                  <p className="text-white text-2xl" style={{ textShadow: '0 0 10px rgba(234,179,8,0.4)' }}>
                    💰 {currentBalance} moedas
                  </p>
                </div>

                {/* User Selection */}
                <div className="space-y-3">
                  <label className="text-gray-300 text-sm">Destinatário</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-yellow-500/20 rounded-xl p-2 bg-black/20">
                    {users.map((user) => (
                      <button
                        key={user.userId}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedUser?.userId === user.userId
                            ? 'bg-yellow-500/20 border border-yellow-500/40'
                            : 'bg-black/20 hover:bg-yellow-500/10 border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-500/30">
                          {user.avatarUrl ? (
                            <ImageWithFallback src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-white">{user.username}</span>
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
                    className="w-full px-4 py-3 bg-black/40 border border-yellow-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/60 transition-all"
                  />
                </div>

                {/* Transfer Button */}
                <button
                  onClick={handleTransfer}
                  disabled={!selectedUser || !amount || loading}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  {loading ? 'Transferindo...' : 'Transferir'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}