import { useState, useEffect } from 'react';
import { X, Heart, Check, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  accessToken: string;
  currentHealth: number;
  currentBalance: number;
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

const CONSULTATION_TYPES = [
  { id: 'basic', name: '🩹 Consulta Básica', health: 20, cost: 100 },
  { id: 'advanced', name: '💊 Consulta Avançada', health: 40, cost: 200 },
  { id: 'surgery', name: '🏥 Cirurgia Menor', health: 60, cost: 400 },
  { id: 'intensive', name: '⚕️ Tratamento Intensivo', health: 80, cost: 600 },
  { id: 'complete', name: '✨ Cura Completa', health: 100, cost: 800 },
];

export function HospitalModal({ isOpen, onClose, currentUserId, accessToken, currentHealth, currentBalance, onStatsUpdate }: HospitalModalProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConsultations();
    }
  }, [isOpen]);

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

  const requestConsultation = async (type: typeof CONSULTATION_TYPES[0]) => {
    if (currentBalance < type.cost) {
      toast.error('💰 Saldo insuficiente');
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
          type: 'requestConsultation',
          accessToken,
          consultationType: type.id,
          cost: type.cost,
          healthBoost: type.health,
        }),
      });

      if (response.ok) {
        toast.success('📋 Consulta solicitada! Aguarde aprovação do gerente.');
        loadConsultations();
      } else {
        toast.error('Erro ao solicitar consulta');
      }
    } catch (error) {
      console.error('Error requesting consultation:', error);
      toast.error('Erro ao solicitar consulta');
    } finally {
      setLoading(false);
    }
  };

  const myPendingConsultation = consultations.find(c => c.userId === currentUserId && c.status === 'pending');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
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
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white text-lg" style={{ textShadow: '0 0 10px rgba(239,68,68,0.6)' }}>
                  🏥 Hospital Central
                </h3>
                <p className="text-xs text-gray-400">Consultas e Tratamentos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Health Status */}
            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-5 backdrop-blur-sm">
              <p className="text-red-400 text-sm mb-2">Saúde Atual</p>
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-8 h-8 text-red-500" />
                <span className="text-white text-3xl" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
                  {currentHealth}%
                </span>
              </div>
              <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${currentHealth}%` }}
                />
              </div>
            </div>

            {/* Balance */}
            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl">
              <p className="text-gray-400 text-sm">Saldo Disponível</p>
              <p className="text-white text-xl">💰 {currentBalance} moedas</p>
            </div>

            {/* Pending Consultation Alert */}
            {myPendingConsultation && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-500 text-sm mb-1">Consulta Pendente</p>
                  <p className="text-gray-400 text-xs">
                    Você tem uma consulta aguardando aprovação do gerente
                  </p>
                </div>
              </div>
            )}

            {/* Consultation Types */}
            <div className="space-y-3">
              <h4 className="text-white mb-3">Tipos de Consulta</h4>
              {CONSULTATION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => requestConsultation(type)}
                  disabled={loading || !!myPendingConsultation || currentBalance < type.cost}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    currentBalance >= type.cost && !myPendingConsultation
                      ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30 hover:border-red-500/50 hover:from-red-500/15 hover:to-pink-500/15'
                      : 'bg-black/20 border-gray-700/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-white">{type.name}</h5>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-green-400 text-sm">+{type.health}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Custo: 💰 {type.cost} moedas</span>
                    {currentBalance < type.cost && (
                      <span className="text-red-400 text-xs">Saldo insuficiente</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-gray-400 text-xs leading-relaxed">
                💡 Solicite uma consulta e aguarde a aprovação do gerente do hospital. 
                Após aprovação, sua saúde será restaurada e o valor será debitado.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
