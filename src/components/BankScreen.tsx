import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, ArrowUpRight, User as UserIcon, Lock, Unlock } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface BankScreenProps {
  onBack: () => void;
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

export function BankScreen({ onBack, currentUserId, accessToken, currentBalance, onBalanceUpdate }: BankScreenProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isUnlocked) {
      loadUsers();
    }
  }, [isUnlocked]);

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
        // Filter out current user
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

  if (!isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a0f] to-black"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 border-b border-purple-500/30 bg-black/40 backdrop-blur-md">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-purple-500/20 text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl" style={{ textShadow: '0 0 20px rgba(236,72,153,0.6)' }}>
            🏦 Banco
          </h1>
          <div className="w-10" />
        </div>

        {/* Lock Screen */}
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-6">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full opacity-50 blur-2xl animate-pulse"></div>
            <Lock className="relative w-24 h-24 text-yellow-500" />
          </div>

          <h2 className="text-white text-2xl mb-2" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
            Acesso Restrito
          </h2>
          <p className="text-gray-400 text-sm mb-8">Digite a senha para acessar o banco</p>

          <div className="w-full max-w-sm space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Digite a senha..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-yellow-500/30 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 outline-none"
            />
            <button
              onClick={handleUnlock}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
            >
              Desbloquear
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a0f] to-black overflow-y-auto"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-yellow-500/30 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-yellow-500/20 text-white transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl flex items-center gap-2" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
          <Unlock className="w-5 h-5 text-yellow-500" />
          Banco Desbloqueado
        </h1>
        <div className="w-10" />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-yellow-400 text-sm mb-2">Saldo Atual</p>
          <div className="flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <span className="text-white text-4xl" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
              {currentBalance}
            </span>
          </div>
        </div>

        {/* Transfer Section */}
        <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-white text-lg mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-yellow-500" />
            Transferir Moedas
          </h3>

          {/* Select Recipient */}
          <div className="space-y-3 mb-4">
            <label className="text-sm text-gray-400">Destinatário</label>
            {selectedUser ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-500/50">
                  {selectedUser.avatarUrl ? (
                    <ImageWithFallback
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <span className="flex-1 text-white">{selectedUser.username}</span>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/40 hover:bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-500/50">
                      {user.avatarUrl ? (
                        <ImageWithFallback
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-white">{user.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-3 mb-4">
            <label className="text-sm text-gray-400">Valor</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Digite o valor..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-yellow-500/30 text-white placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 outline-none"
            />
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={!selectedUser || !amount || loading}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Transferindo...' : 'Transferir'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}