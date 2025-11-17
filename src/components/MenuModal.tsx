import { useState } from 'react';
import { X, UtensilsCrossed, Beer, Coffee, ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/client';

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

interface CartItem extends MenuItem {
  quantity: number;
  category: string;
}

interface MenuModalProps {
  onClose: () => void;
  menuData: {
    bebidas: MenuItem[];
    comidas: MenuItem[];
    alcoolicas: MenuItem[];
  };
  chatId: string;
  userId: string;
  userName: string;
  accessToken: string;
}

export function MenuModal({ onClose, menuData, chatId, userId, userName, accessToken }: MenuModalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);

  const getStatColor = (value: number, type: 'fome' | 'sede' | 'alcoolismo') => {
    if (type === 'alcoolismo' && value > 0) return 'text-red-400';
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-cyan-400';
    return 'text-gray-400';
  };

  // Prepare categories with correct structure
  const categories = [];
  if (menuData.bebidas && menuData.bebidas.length > 0) {
    categories.push({ icon: '💧', title: 'Bebidas', items: menuData.bebidas });
  }
  if (menuData.comidas && menuData.comidas.length > 0) {
    categories.push({ icon: '🍽️', title: 'Comidas', items: menuData.comidas });
  }
  if (menuData.alcoolicas && menuData.alcoolicas.length > 0) {
    categories.push({ icon: '🍷', title: 'Bebidas Alcóolicas', items: menuData.alcoolicas });
  }

  const addToCart = (item: MenuItem, category: string) => {
    const existingItem = cart.find(cartItem => cartItem.name === item.name && cartItem.category === category);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.name === item.name && cartItem.category === category ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, category }]);
    }
  };

  const removeFromCart = (item: CartItem) => {
    if (item.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.name === item.name && cartItem.category === item.category ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.name !== item.name || cartItem.category !== item.category));
    }
  };

  const sendOrder = async () => {
    setSendingOrder(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chatId,
          userId,
          userName,
          items: cart.map(item => ({ 
            name: item.name, 
            quantity: item.quantity, 
            price: parseFloat(item.price.replace('R$', '').replace(',', '.')) 
          }))
        })
      });
      if (response.ok) {
        toast.success('Pedido enviado com sucesso!');
        setCart([]);
        setShowCart(false);
      } else {
        toast.error('Erro ao enviar o pedido. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro ao enviar o pedido. Tente novamente.');
    } finally {
      setSendingOrder(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" 
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="bg-gradient-to-br from-gray-900 via-purple-950/20 to-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/20"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white text-2xl">Cardápio</h2>
                <p className="text-white/80 text-sm">Veja todos os itens disponíveis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              {cart.length > 0 && (
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs">
                    {cart.length}
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-8">
          {categories.map((category, catIndex) => (
            <div key={catIndex} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-purple-500/20">
                <span className="text-2xl">{category.icon}</span>
                <h3 
                  className="text-white text-xl"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(168,85,247,0.5)'
                  }}
                >
                  {category.title}
                </h3>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Fome:</span>
                        <span className={getStatColor(item.stats.fome, 'fome')}>
                          {item.stats.fome > 0 ? '+' : ''}{item.stats.fome}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Sede:</span>
                        <span className={getStatColor(item.stats.sede, 'sede')}>
                          {item.stats.sede > 0 ? '+' : ''}{item.stats.sede}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Álcool:</span>
                        <span className={getStatColor(item.stats.alcoolismo, 'alcoolismo')}>
                          {item.stats.alcoolismo > 0 ? '+' : ''}{item.stats.alcoolismo}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item, category.title)}
                      className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-full hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 transition-all"
                    >
                      Adicionar ao Carrinho
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cart */}
        {showCart && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xl">Carrinho</h3>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all group hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Fome:</span>
                      <span className={getStatColor(item.stats.fome, 'fome')}>
                        {item.stats.fome > 0 ? '+' : ''}{item.stats.fome}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Sede:</span>
                      <span className={getStatColor(item.stats.sede, 'sede')}>
                        {item.stats.sede > 0 ? '+' : ''}{item.stats.sede}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Álcool:</span>
                      <span className={getStatColor(item.stats.alcoolismo, 'alcoolismo')}>
                        {item.stats.alcoolismo > 0 ? '+' : ''}{item.stats.alcoolismo}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white text-sm">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item, item.category)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-all"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <h4 className="text-white text-xl">Total: R$ {cart.reduce((total, item) => total + parseFloat(item.price.replace('R$', '').replace(',', '.')) * item.quantity, 0).toFixed(2)}</h4>
              <button
                onClick={sendOrder}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-full hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 transition-all"
                disabled={sendingOrder}
              >
                {sendingOrder ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          </div>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}