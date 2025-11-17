import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface HospitalScreenProps {
  onBack: () => void;
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

const DISEASES = [
  '🤒 Gripe',
  '🤢 Náusea',
  '🤕 Dor de Cabeça',
  '😷 Resfriado',
  '🦠 Infecção',
  '💀 Envenenamento',
  '🩸 Hemorragia',
  '🔥 Febre',
  '❄️ Hipotermia',
  '⚡ Choque',
];

export function HospitalScreen({ onBack, currentUserId, accessToken, currentHealth, currentBalance, onStatsUpdate }: HospitalScreenProps) {
  const [isManager, setIsManager] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [ranchoUsed, setRanchoUsed] = useState(false);
  const [ranchoTimer, setRanchoTimer] = useState<number | null>(null);

  useEffect(() => {
    loadConsultations();
    checkRanchoStatus();
  }, []);

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

  const handleManagerLogin = () => {
    if (password === 'Hospital1819') {
      setIsManager(true);
      setShowPasswordPrompt(false);
      toast.success('👨‍⚕️ Modo Gerente ativado');
    } else {
      toast.error('❌ Senha incorreta');
      setPassword('');
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

  const myPendingConsultation = consultations.find(c => c.userId === currentUserId && c.status === 'pending');
  const pendingConsultations = consultations.filter(c => c.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a0f] to-black overflow-y-auto"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-red-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-red-500/30 bg-black/40 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-red-500/20 text-white transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
          🏥 Hospital
        </h1>
        <button
          onClick={() => setShowPasswordPrompt(true)}
          className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all"
        >
          👨‍⚕️
        </button>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Health Card */}
        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-red-400 text-sm mb-2">Saúde Atual</p>
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-white text-4xl" style={{ textShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
              {currentHealth}%
            </span>
          </div>
          <div className="mt-4 h-3 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
              style={{ width: `${currentHealth}%` }}
            />
          </div>
        </div>

        {/* Manager Mode */}
        {isManager ? (
          <div className="space-y-4">
            {/* Rancho Button */}
            <button
              onClick={useRancho}
              disabled={ranchoUsed || loading}
              className="w-full p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg mb-1">🌾 Rancho dos Trabalhadores</h3>
                  <p className="text-emerald-400 text-sm">Restaura todos os stats de todos os jogadores</p>
                </div>
                {ranchoUsed && <p className="text-red-400 text-sm">⏰ {ranchoTimer}h</p>}
              </div>
            </button>

            {/* Pending Consultations */}
            <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-white text-lg mb-4">📋 Consultas Pendentes ({pendingConsultations.length})</h3>
              {pendingConsultations.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhuma consulta pendente</p>
              ) : (
                <div className="space-y-3">
                  {pendingConsultations.map((consultation) => (
                    <div key={consultation.consultationId} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white">{consultation.username}</p>
                          <p className="text-red-400 text-sm">{consultation.consultationType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400">+{consultation.healthBoost}% ❤️</p>
                          <p className="text-yellow-400 text-sm">{consultation.cost} 💰</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConsultation(consultation.consultationId, true)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleConsultation(consultation.consultationId, false)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Pending Consultation Alert */}
            {myPendingConsultation && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 backdrop-blur-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Consulta Pendente</p>
                  <p className="text-yellow-400 text-sm">Aguardando aprovação do gerente</p>
                  <p className="text-gray-400 text-xs mt-1">{myPendingConsultation.consultationType}</p>
                </div>
              </div>
            )}

            {/* Consultation Options */}
            <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-white text-lg mb-4">💊 Consultas Disponíveis</h3>
              <div className="space-y-3">
                {CONSULTATION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => requestConsultation(type)}
                    disabled={!!myPendingConsultation || loading || currentBalance < type.cost}
                    className="w-full p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-white">{type.name}</p>
                        <p className="text-red-400 text-sm">+{type.health}% de saúde</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${currentBalance >= type.cost ? 'text-yellow-400' : 'text-red-400'}`}>
                          {type.cost} 💰
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Diseases Info */}
            <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-white text-lg mb-4">🦠 Doenças Possíveis</h3>
              <div className="grid grid-cols-2 gap-2">
                {DISEASES.map((disease) => (
                  <div key={disease} className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-purple-400 text-sm text-center">{disease}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-4 text-center">
                Se você contrair uma doença, só poderá acessar Hospital e Vida
              </p>
            </div>
          </>
        )}
      </div>

      {/* Manager Password Prompt */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-[#0a0a0f] to-black border border-red-500/30 rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-white text-lg mb-4">🔐 Modo Gerente</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManagerLogin()}
              placeholder="Digite a senha..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleManagerLogin}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:shadow-red-500/50 transition-all"
              >
                Entrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
