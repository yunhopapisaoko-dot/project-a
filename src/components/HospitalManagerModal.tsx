import { useState, useEffect } from 'react';
import { X, Heart, Check, XIcon, Sparkles, Lock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface HospitalManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onStatsUpdate: () => void;
}

interface Consultation {
  consultationId: string;
  userId: string;
  username: string;
  consultationType: string;
  cost: number;
  healthBoost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function HospitalManagerModal({ isOpen, onClose, accessToken, onStatsUpdate }: HospitalManagerModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [ranchoUsed, setRanchoUsed] = useState(false);
  const [ranchoTimer, setRanchoTimer] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && isUnlocked) {
      loadConsultations();
      checkRanchoStatus();
    }
  }, [isOpen, isUnlocked]);

  const loadConsultations = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'getConsultations',
          accessToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
    }
  };

  const checkRanchoStatus = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'getRanchoStatus',
          accessToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lastUsed) {
          const lastUsed = new Date(data.lastUsed).getTime();
          const now = Date.now();
          const hoursPassed = (now - lastUsed) / (1000 * 60 * 60);
          
          if (hoursPassed < 24) {
            setRanchoUsed(true);
            setRanchoTimer(Math.ceil(24 - hoursPassed));
          }
        }
      }
    } catch (error) {
      console.error('Error checking rancho:', error);
    }
  };

  const handleUnlock = () => {
    if (password === 'Hospital1819') {
      setIsUnlocked(true);
      toast.success('👨‍⚕️ Modo Gerente ativado!');
    } else {
      toast.error('❌ Senha incorreta!');
      setPassword('');
    }
  };

  const handleConsultation = async (consultationId: string, approved: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          type: 'handleConsultation',
          accessToken,
          consultationId,
          approved,
        }),
      });

      if (response.ok) {
        toast.success(approved ? '✅ Consulta aprovada!' : '❌ Consulta rejeitada');
        loadConsultations();
        onStatsUpdate();
      } else {
        toast.error('Erro ao processar consulta');
      }
    } catch (error) {
      console.error('Error handling consultation:', error);
      toast.error('Erro ao processar consulta');
    } finally {
      setLoading(false);
    }
  };

  const useRancho = async () => {
    if (ranchoUsed) {
      toast.error(`⏰ Rancho em cooldown! Aguarde ${ranchoTimer}h`);
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
          type: 'useRancho',
          accessToken,
        }),
      });

      if (response.ok) {
        toast.success('🌟 Rancho dos Trabalhadores ativado! Todos os jogadores foram curados!');
        setRanchoUsed(true);
        setRanchoTimer(24);
        onStatsUpdate();
      } else {
        toast.error('Erro ao usar Rancho');
      }
    } catch (error) {
      console.error('Error using rancho:', error);
      toast.error('Erro ao usar Rancho');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsUnlocked(false);
    setPassword('');
    onClose();
  };

  const pendingConsultations = consultations.filter(c => c.status === 'pending');

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
          className="w-full max-w-lg bg-gradient-to-b from-[#0a0a0f] to-black rounded-3xl border border-red-500/30 overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-pink-500/10 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg" style={{ textShadow: '0 0 10px rgba(239,68,68,0.6)' }}>
                  👨‍⚕️ Painel do Gerente
                </h3>
                <p className="text-xs text-gray-400">Hospital Central</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-white transition-all"
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
                    <div className="absolute -inset-4 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 rounded-full opacity-50 blur-2xl animate-pulse"></div>
                    <Lock className="relative w-16 h-16 text-red-500" />
                  </div>
                  <h4 className="text-white text-xl mb-2" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
                    Acesso Restrito
                  </h4>
                  <p className="text-gray-400 text-sm text-center mb-6">
                    Digite a senha de gerente para acessar o painel
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="Digite a senha..."
                    className="w-full px-4 py-3 bg-black/40 border border-red-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/60 transition-all"
                  />
                  <button
                    onClick={handleUnlock}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rancho dos Trabalhadores */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 space-y-4">
                  <div>
                    <h3 className="text-white text-lg mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      🌾 Rancho dos Trabalhadores
                    </h3>
                    <p className="text-emerald-400 text-sm">
                      Restaura todos os stats de todos os jogadores
                    </p>
                  </div>
                  {ranchoUsed && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                      <p className="text-red-400 text-sm">⏰ Cooldown: {ranchoTimer}h restantes</p>
                    </div>
                  )}
                  <button
                    onClick={useRancho}
                    disabled={ranchoUsed || loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Ativando...' : 'Ativar Rancho'}
                  </button>
                </div>

                {/* Pending Consultations */}
                <div className="space-y-3">
                  <h4 className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    Consultas Pendentes ({pendingConsultations.length})
                  </h4>
                  
                  {pendingConsultations.length === 0 ? (
                    <div className="p-8 bg-black/20 border border-red-500/20 rounded-xl text-center">
                      <p className="text-gray-400">Nenhuma consulta pendente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingConsultations.map((consultation) => (
                        <div
                          key={consultation.consultationId}
                          className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white mb-1">{consultation.username}</p>
                              <p className="text-gray-400 text-sm">{consultation.consultationType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 text-sm">+{consultation.healthBoost}% ❤️</p>
                              <p className="text-gray-400 text-xs">💰 {consultation.cost}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConsultation(consultation.consultationId, true)}
                              disabled={loading}
                              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleConsultation(consultation.consultationId, false)}
                              disabled={loading}
                              className="flex-1 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <XIcon className="w-4 h-4" />
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
