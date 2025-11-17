import { useState, useEffect } from 'react';
import { Check, X, Clock, DollarSign, Users, LogOut, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface Order {
  orderId: string;
  userId: string;
  username: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'preparing' | 'completed' | 'rejected';
  createdAt: string;
  preparedBy?: string;
  preparerUsername?: string;
}

interface Preparation {
  preparationId: string;
  orderId: string;
  userId: string;
  username: string;
  itemName: string;
  startTime: string;
  endTime: string;
  status: 'in_progress' | 'completed';
}

interface ManagerPanelProps {
  chatId: string;
  chatName: string;
  accessToken: string;
  currentUserId: string;
  isManager: boolean;
}

export function ManagerPanel({ 
  chatId, 
  chatName, 
  accessToken, 
  currentUserId, 
  isManager 
}: ManagerPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [preparations, setPreparations] = useState<Preparation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadOrders();
    loadPreparations();
    
    const interval = setInterval(() => {
      loadOrders();
      loadPreparations();
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId]);

  const loadOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/orders/${chatId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadPreparations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/preparations/${chatId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreparations(data.preparations || []);
      }
    } catch (err) {
      console.error('Error loading preparations:', err);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/accept-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ orderId })
        }
      );

      if (response.ok) {
        toast.success('Pedido aceito!');
        loadOrders();
      } else {
        toast.error('Erro ao aceitar pedido');
      }
    } catch (err) {
      toast.error('Erro ao aceitar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/reject-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ orderId })
        }
      );

      if (response.ok) {
        toast.success('Pedido rejeitado');
        loadOrders();
      } else {
        toast.error('Erro ao rejeitar pedido');
      }
    } catch (err) {
      toast.error('Erro ao rejeitar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleServeOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/serve-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ orderId })
        }
      );

      if (response.ok) {
        toast.success('Pedido servido! Funcionário recebeu pagamento.');
        loadOrders();
      } else {
        toast.error('Erro ao servir pedido');
      }
    } catch (err) {
      toast.error('Erro ao servir pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleQuit = async () => {
    if (!confirm('Tem certeza que deseja pedir demissão?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/quit-job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ chatId })
        }
      );

      if (response.ok) {
        toast.success('Você pediu demissão');
        window.location.reload();
      } else {
        toast.error('Erro ao pedir demissão');
      }
    } catch (err) {
      toast.error('Erro ao pedir demissão');
    } finally {
      setLoading(false);
    }
  };

  const handleFireEmployee = async (userId: string) => {
    if (!confirm('Tem certeza que deseja demitir este funcionário?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/fire-employee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ chatId, employeeId: userId })
        }
      );

      if (response.ok) {
        toast.success('Funcionário demitido');
        loadPreparations();
      } else {
        toast.error('Erro ao demitir funcionário');
      }
    } catch (err) {
      toast.error('Erro ao demitir funcionário');
    } finally {
      setLoading(false);
    }
  };

  const handleUseRancho = async () => {
    if (!confirm('Usar Rancho dos Trabalhadores? Custa 1000 moedas e restaura 100% dos stats.')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/use-rancho`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        toast.success('Stats restaurados!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao usar rancho');
      }
    } catch (err) {
      toast.error('Erro ao usar rancho');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstablishment = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/toggle-establishment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ chatId, isOpen: !isOpen })
        }
      );

      if (response.ok) {
        setIsOpen(!isOpen);
        toast.success(isOpen ? 'Estabelecimento fechado' : 'Estabelecimento aberto');
      } else {
        toast.error('Erro ao alternar status');
      }
    } catch (err) {
      toast.error('Erro ao alternar status');
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Manager Controls */}
      {isManager && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleUseRancho}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
          >
            <Heart className="w-4 h-4" />
            Rancho (1000💰)
          </button>
          <button
            onClick={handleToggleEstablishment}
            disabled={loading}
            className={`px-4 py-3 rounded-xl text-white transition-all shadow-lg ${
              isOpen
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            {isOpen ? 'Fechar' : 'Abrir'} Estabelecimento
          </button>
        </div>
      )}

      {/* Quit Button */}
      <button
        onClick={handleQuit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
      >
        <LogOut className="w-4 h-4" />
        Pedir Demissão
      </button>

      {/* Preparations */}
      {preparations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Preparações em Andamento
          </h3>
          {preparations.map((prep) => (
            <div key={prep.preparationId} className="p-4 bg-black/40 border border-purple-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white">{prep.username}</p>
                  <p className="text-sm text-gray-400">{prep.itemName}</p>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleFireEmployee(prep.userId)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Termina em {new Date(prep.endTime).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Orders */}
      {pendingOrders.length > 0 && isManager && (
        <div className="space-y-3">
          <h3 className="text-white">Pedidos Pendentes</h3>
          {pendingOrders.map((order) => (
            <div key={order.orderId} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white">{order.username}</p>
                  <p className="text-sm text-gray-400">{order.itemName} x{order.quantity}</p>
                  <p className="text-sm text-yellow-400 flex items-center gap-1 mt-1">
                    <DollarSign className="w-3 h-3" />
                    {order.totalPrice}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptOrder(order.orderId)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Aceitar
                </button>
                <button
                  onClick={() => handleRejectOrder(order.orderId)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  <X className="w-4 h-4" />
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && isManager && (
        <div className="space-y-3">
          <h3 className="text-white">Prontos para Servir</h3>
          {completedOrders.map((order) => (
            <div key={order.orderId} className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white">{order.username}</p>
                  <p className="text-sm text-gray-400">{order.itemName} x{order.quantity}</p>
                  <p className="text-xs text-gray-500 mt-1">Preparado por: {order.preparerUsername}</p>
                </div>
              </div>
              <button
                onClick={() => handleServeOrder(order.orderId)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                <Check className="w-4 h-4" />
                Servir Pedido
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
