import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, X, Sparkles, Clock, Trophy, Ticket, Heart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { RouletteWheel } from './RouletteWheel';
import { supabase, projectId } from '../utils/supabase/client';

interface RouletteScreenProps {
  onClose: () => void;
}

interface Prize {
  id: string;
  type: 'money' | 'voucher' | 'disease';
  label: string;
  value?: number;
  color: string;
  data?: any;
}

interface Disease {
  id: string;
  name: string;
  description: string;
  health_loss: number;
  cure_cost: number;
}

export function RouletteScreen({ onClose }: RouletteScreenProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<string>('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winningIndex, setWinningIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouletteData();
    checkCooldown();

    // Update cooldown timer every second
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkCooldown = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        const lastSpin = profile.last_roulette_spin;

        if (!lastSpin) {
          setCanSpin(true);
          setCooldownTime('');
          return;
        }

        const lastSpinTime = new Date(lastSpin).getTime();
        const now = Date.now();
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        const timeSinceLastSpin = now - lastSpinTime;

        if (timeSinceLastSpin >= cooldownMs) {
          setCanSpin(true);
          setCooldownTime('');
        } else {
          setCanSpin(false);
          const timeLeft = cooldownMs - timeSinceLastSpin;
          const hours = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
          setCooldownTime(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const loadRouletteData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch diseases from database
      const { data: diseases, error } = await supabase
        .from('diseases')
        .select('*');

      if (error) throw error;

      // Build prizes array with probabilities
      const moneyPrizes: Prize[] = [
        { id: 'money-500', type: 'money', label: 'R$ 500', value: 500, color: '#10b981' },
        { id: 'money-750', type: 'money', label: 'R$ 750', value: 750, color: '#059669' },
        { id: 'money-1000', type: 'money', label: 'R$ 1.000', value: 1000, color: '#047857' },
        { id: 'money-2500', type: 'money', label: 'R$ 2.500', value: 2500, color: '#065f46' },
        { id: 'money-5000', type: 'money', label: 'R$ 5.000', value: 5000, color: '#064e3b' },
      ];

      const voucherPrizes: Prize[] = [
        { id: 'voucher-restaurant', type: 'voucher', label: 'Vale Restaurante', color: '#3b82f6', data: { establishment: 'Restaurante Medieval – O Banquete do Rei' } },
        { id: 'voucher-bar', type: 'voucher', label: 'Vale Bar', color: '#2563eb', data: { establishment: 'Bar Medieval – A Caneca do Dragão' } },
        { id: 'voucher-bakery', type: 'voucher', label: 'Vale Padaria', color: '#1d4ed8', data: { establishment: 'Padaria Medieval – O Pão do Reino' } },
      ];

      const diseasePrizes: Prize[] = (diseases || []).map((disease: Disease, index: number) => ({
        id: `disease-${disease.id}`,
        type: 'disease',
        label: disease.name,
        color: `hsl(${(index * 360) / (diseases?.length || 1)}, 70%, 40%)`,
        data: disease
      }));

      // Combine all prizes with proper distribution
      // For visual: show all types, but weighted internally
      const allPrizes = [
        ...moneyPrizes,  // 5 prizes (10% total = 2% each)
        ...voucherPrizes, // 3 prizes (20% total = 6.67% each)
        ...diseasePrizes.slice(0, 12) // Limit to 12 diseases for visual clarity
      ];

      setPrizes(allPrizes);
      setLoading(false);
    } catch (error) {
      console.error('Error loading roulette data:', error);
      toast.error('Erro ao carregar roleta');
      setLoading(false);
    }
  };

  const selectWinningPrize = (): { prize: Prize; index: number } => {
    const random = Math.random() * 100;

    let selectedPrize: Prize;

    if (random < 10) {
      // 10% chance - Money
      const moneyPrizes = prizes.filter(p => p.type === 'money');
      selectedPrize = moneyPrizes[Math.floor(Math.random() * moneyPrizes.length)];
    } else if (random < 30) {
      // 20% chance - Vouchers
      const voucherPrizes = prizes.filter(p => p.type === 'voucher');
      selectedPrize = voucherPrizes[Math.floor(Math.random() * voucherPrizes.length)];
    } else {
      // 70% chance - Diseases
      const diseasePrizes = prizes.filter(p => p.type === 'disease');
      selectedPrize = diseasePrizes[Math.floor(Math.random() * diseasePrizes.length)];
    }

    const index = prizes.findIndex(p => p.id === selectedPrize.id);
    return { prize: selectedPrize, index };
  };

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);

    // Select winning prize
    const { prize, index } = selectWinningPrize();
    setWinningIndex(index);
    setWonPrize(prize);

    // Update cooldown immediately
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/update-roulette-spin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      setCanSpin(false);
    } catch (error) {
      console.error('Error updating cooldown:', error);
    }
  };

  const handleSpinComplete = async () => {
    setIsSpinning(false);
    
    if (!wonPrize) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Process prize
      if (wonPrize.type === 'money') {
        // Add money to wallet
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/add-money`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount: wonPrize.value })
        });
        
        setShowResult(true);
        toast.success(`🎉 Você ganhou ${wonPrize.label}!`);
      } else if (wonPrize.type === 'voucher') {
        // Create voucher
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/create-voucher`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            establishment: wonPrize.data.establishment 
          })
        });
        
        setShowResult(true);
        toast.success(`🎫 Você ganhou um ${wonPrize.label}!`);
      } else if (wonPrize.type === 'disease') {
        // Contract disease
        const disease = wonPrize.data;
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/contract-disease`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            disease_id: disease.id 
          })
        });
        
        setShowResult(true);
        toast.error(`😷 Você contraiu ${disease.name}! Saúde reduzida em ${disease.health_loss}.`);
      }
    } catch (error) {
      console.error('Error processing prize:', error);
      toast.error('Erro ao processar prêmio');
    }
  };

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'money':
        return <Trophy className="w-12 h-12 text-green-400" />;
      case 'voucher':
        return <Ticket className="w-12 h-12 text-blue-400" />;
      case 'disease':
        return <Heart className="w-12 h-12 text-red-400" />;
      default:
        return <Sparkles className="w-12 h-12 text-cyan-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-gradient-to-b from-[#0a0a0f] to-black rounded-t-3xl overflow-y-auto border-t border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-cyan-500/20 backdrop-blur-xl bg-black/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                <Dices className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 
                  className="text-white text-xl"
                  style={{
                    textShadow: '0 0 20px rgba(34,211,238,0.6)'
                  }}
                >
                  Roleta da Sorte 🎡
                </h2>
                <p className="text-sm text-gray-400">Teste sua sorte diariamente</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-cyan-500/20 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 flex flex-col items-center justify-center space-y-8">
          {loading ? (
            <div className="text-gray-400">Carregando...</div>
          ) : (
            <>
              {/* Roulette Wheel */}
              <div className="relative">
                <RouletteWheel
                  prizes={prizes}
                  spinning={isSpinning}
                  winningIndex={winningIndex}
                  onSpinComplete={handleSpinComplete}
                />
              </div>

              {/* Prize Info */}
              <div className="w-full max-w-md space-y-3">
                <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">💰 Dinheiro: 10% de chance</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Ticket className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">🎫 Vouchers: 20% de chance</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">😷 Doenças: 70% de chance</span>
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <motion.button
                whileHover={canSpin ? { scale: 1.05 } : {}}
                whileTap={canSpin ? { scale: 0.95 } : {}}
                onClick={handleSpin}
                disabled={!canSpin || isSpinning}
                className={`px-8 py-4 rounded-2xl text-white flex items-center gap-3 shadow-lg transition-all ${
                  canSpin && !isSpinning
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-cyan-500/50 cursor-pointer'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                {canSpin ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg">
                      {isSpinning ? 'Girando...' : 'Girar Roleta'}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">
                      Cooldown: {cooldownTime}
                    </span>
                  </>
                )}
              </motion.button>

              <p className="text-gray-400 text-sm text-center max-w-md">
                Gire a roleta uma vez por dia para ganhar prêmios em dinheiro, vouchers para estabelecimentos ou... contrair doenças! 🎲
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && wonPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-b from-[#0a0a0f] to-black rounded-3xl p-8 max-w-md w-full border-2"
              style={{
                borderColor: wonPrize.type === 'money' ? '#10b981' : wonPrize.type === 'voucher' ? '#3b82f6' : '#ef4444',
                boxShadow: `0 0 40px ${wonPrize.type === 'money' ? 'rgba(16,185,129,0.5)' : wonPrize.type === 'voucher' ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.5)'}`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  {getPrizeIcon(wonPrize.type)}
                  <div className="absolute inset-0 blur-xl opacity-50">
                    {getPrizeIcon(wonPrize.type)}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl text-white">
                    {wonPrize.type === 'money' && '🎉 Parabéns!'}
                    {wonPrize.type === 'voucher' && '🎫 Você ganhou!'}
                    {wonPrize.type === 'disease' && '😷 Que azar...'}
                  </h3>
                  <p className="text-xl text-gray-300">
                    {wonPrize.label}
                  </p>
                  {wonPrize.type === 'disease' && wonPrize.data && (
                    <p className="text-sm text-gray-400">
                      {wonPrize.data.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowResult(false)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:scale-105 transition-all"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
