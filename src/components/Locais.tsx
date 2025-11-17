import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MessageCircle, ChevronDown, ChevronUp, Beer, UtensilsCrossed, Coffee } from 'lucide-react';
import { BottomNav } from './BottomNav';

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

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

interface Establishment {
  id: string;
  name: string;
  type: 'bar' | 'restaurant' | 'bakery' | 'bank' | 'hospital';
  description: string;
  chatId: string;
  imageUrl: string;
  backgroundUrl: string;
  menuCategories: {
    bebidas: MenuItem[];
    comidas: MenuItem[];
    alcoolicas: MenuItem[];
  };
  isSpecial?: boolean; // Para Banco e Hospital
}

interface LocaisProps {
  onChatClick: (
    chatId: string, 
    chatName: string, 
    chatImage: string, 
    chatBackground: string, 
    chatDescription: string, 
    createdBy: string,
    menuData?: {
      bebidas: MenuItem[];
      comidas: MenuItem[];
      alcoolicas: MenuItem[];
    }
  ) => void;
  onMyChatsClick: () => void;
  onRouletteClick: () => void;
  accessToken: string;
  currentUserId: string;
  currentUsername: string;
}

// Estabelecimentos hardcoded
const establishments: Establishment[] = [
  {
    id: 'neon-tap-house',
    name: 'Neon Tap House',
    type: 'bar',
    description: 'Bar moderno com drinks autorais e petiscos',
    chatId: 'chat:neon-tap-house',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    backgroundUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200',
    menuCategories: {
      bebidas: [
        { name: 'Café filtrado', price: 'R$ 7', description: 'Intenso e aromático', stats: { fome: 0, sede: 1, alcoolismo: 0 } },
        { name: 'Chá Gelado de Pêssego', price: 'R$ 8', description: 'Leve, gelado e natural', stats: { fome: 0, sede: 5, alcoolismo: 0 } },
      ],
      comidas: [
        { name: 'Burger Smash Neon', price: 'R$ 34', description: 'Smash burger com cheddar e cebola caramelizada', stats: { fome: 9, sede: -1, alcoolismo: 0 } },
        { name: 'Fries Duo', price: 'R$ 20', description: 'Batata palito + rústica com molho', stats: { fome: 7, sede: -2, alcoolismo: 0 } },
        { name: 'Tiras de Frango Crocante', price: 'R$ 24', description: 'Frango empanado temperado', stats: { fome: 6, sede: -1, alcoolismo: 0 } },
        { name: 'Nachos Neon', price: 'R$ 26', description: 'Nachos com queijo, guacamole e sour cream', stats: { fome: 8, sede: -1, alcoolismo: 0 } },
        { name: 'Brownie com Sorvete Nitro', price: 'R$ 18', description: 'Brownie quente com sorvete gelado', stats: { fome: 5, sede: 0, alcoolismo: 0 } },
        { name: 'Mini Churros Gourmet', price: 'R$ 14', description: 'Com doce de leite artesanal', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
      ],
      alcoolicas: [
        { name: 'Electric Blue', price: 'R$ 28', description: 'Vodka com curaçau azul, limão e espuma cítrica', stats: { fome: 0, sede: -2, alcoolismo: 6 } },
        { name: 'Neon Sour', price: 'R$ 32', description: 'Whisky com limão e xarope artesanal', stats: { fome: 0, sede: -3, alcoolismo: 7 } },
        { name: 'Pink Pulse', price: 'R$ 29', description: 'Gin rosa, hibisco e tônica premium', stats: { fome: 0, sede: -1, alcoolismo: 5 } },
        { name: 'Night Runner', price: 'R$ 30', description: 'Rum escuro com cold brew e baunilha', stats: { fome: 1, sede: -3, alcoolismo: 8 } },
        { name: 'IPA Turbo', price: 'R$ 20', description: 'Cítrica, forte, amarga', stats: { fome: 0, sede: -2, alcoolismo: 5 } },
        { name: 'Lager Neon', price: 'R$ 16', description: 'Leve e refrescante', stats: { fome: 0, sede: -1, alcoolismo: 3 } },
        { name: 'Stout Dark Pixel', price: 'R$ 22', description: 'Escura, cremosa, com notas de chocolate', stats: { fome: 1, sede: -2, alcoolismo: 5 } },
      ]
    }
  },
  {
    id: 'urban-leaf',
    name: 'Urban Leaf',
    type: 'restaurant',
    description: 'Restaurante contemporâneo sofisticado',
    chatId: 'chat:urban-leaf',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    backgroundUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
    menuCategories: {
      bebidas: [
        { name: 'Água Mineral', price: 'R$ 5', description: 'Gelada e refrescante', stats: { fome: 0, sede: 5, alcoolismo: 0 } },
        { name: 'Suco Natural', price: 'R$ 12', description: 'Laranja ou limonada', stats: { fome: 0, sede: 4, alcoolismo: 0 } },
      ],
      comidas: [
        { name: 'Bruschettas Modernas', price: 'R$ 19', description: 'Pão artesanal com tomate confitado', stats: { fome: 3, sede: 0, alcoolismo: 0 } },
        { name: 'Ceviche Urban', price: 'R$ 32', description: 'Peixe marinado no limão siciliano', stats: { fome: 4, sede: 3, alcoolismo: 0 } },
        { name: 'Tartar de Salmão', price: 'R$ 34', description: 'Salmão fresco cortado na faca', stats: { fome: 5, sede: 1, alcoolismo: 0 } },
        { name: 'Risoto Urbano', price: 'R$ 46', description: 'Risoto cremoso de cogumelos trufados', stats: { fome: 9, sede: -1, alcoolismo: 0 } },
        { name: 'Salmão Grelhado Citrus', price: 'R$ 54', description: 'Com purê de batata doce e toque cítrico', stats: { fome: 8, sede: 1, alcoolismo: 0 } },
        { name: 'Penne ao Pesto Verde Neon', price: 'R$ 42', description: 'Massa fresca com pesto artesanal', stats: { fome: 8, sede: 0, alcoolismo: 0 } },
        { name: 'Frango Crispy Oriental', price: 'R$ 39', description: 'Frango crocante com molho agridoce', stats: { fome: 8, sede: -1, alcoolismo: 0 } },
        { name: 'Bowl Green Life', price: 'R$ 29', description: 'Quinoa, frango, avocado e vegetais', stats: { fome: 7, sede: 2, alcoolismo: 0 } },
        { name: 'Veggie Power Plate', price: 'R$ 27', description: 'Tofu marinado e legumes grelhados', stats: { fome: 6, sede: 1, alcoolismo: 0 } },
        { name: 'Cheesecake Frutas Vermelhas', price: 'R$ 18', description: 'Leve e cremoso', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
        { name: 'Mousse Chocolate 70%', price: 'R$ 16', description: 'Intenso e aveludado', stats: { fome: 3, sede: 0, alcoolismo: 0 } },
      ],
      alcoolicas: [
        { name: 'Vinho Tinto', price: 'R$ 45', description: 'Taça de vinho tinto selecionado', stats: { fome: 0, sede: -1, alcoolismo: 4 } },
        { name: 'Vinho Branco', price: 'R$ 42', description: 'Taça de vinho branco gelado', stats: { fome: 0, sede: -1, alcoolismo: 4 } },
      ]
    }
  },
  {
    id: 'paolab-bakery',
    name: 'PãoLab Bakery',
    type: 'bakery',
    description: 'Padaria artesanal com pães frescos',
    chatId: 'chat:paolab-bakery',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    backgroundUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200',
    menuCategories: {
      bebidas: [
        { name: 'Café filtrado', price: 'R$ 7', description: 'Intenso e aromático', stats: { fome: 0, sede: 1, alcoolismo: 0 } },
        { name: 'Cappuccino', price: 'R$ 10', description: 'Cremoso e equilibrado', stats: { fome: 1, sede: 1, alcoolismo: 0 } },
        { name: 'Latte Baunilha', price: 'R$ 12', description: 'Doce e suave', stats: { fome: 1, sede: 2, alcoolismo: 0 } },
        { name: 'Matcha Latte', price: 'R$ 14', description: 'Refrescante, herbal', stats: { fome: 1, sede: 2, alcoolismo: 0 } },
        { name: 'Chá Gelado de Pêssego', price: 'R$ 8', description: 'Leve, gelado e natural', stats: { fome: 0, sede: 5, alcoolismo: 0 } },
      ],
      comidas: [
        { name: 'Sourdough', price: 'R$ 12', description: 'Crocante por fora, macio por dentro', stats: { fome: 5, sede: 0, alcoolismo: 0 } },
        { name: 'Baguete Artesanal', price: 'R$ 10', description: 'Clássica e leve', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
        { name: 'Pão Multigrãos', price: 'R$ 14', description: 'Nutrido e cheio de fibras', stats: { fome: 6, sede: 0, alcoolismo: 0 } },
        { name: 'Focaccia Alecrim', price: 'R$ 16', description: 'Com azeite e ervas frescas', stats: { fome: 6, sede: -1, alcoolismo: 0 } },
        { name: 'Croissant Presunto & Queijo', price: 'R$ 15', description: 'Amanteigado e recheado', stats: { fome: 6, sede: -1, alcoolismo: 0 } },
        { name: 'Ciabatta Caprese', price: 'R$ 18', description: 'Muçarela, tomate e pesto', stats: { fome: 7, sede: 1, alcoolismo: 0 } },
        { name: 'Empanada Argentina', price: 'R$ 12', description: 'Salgada e temperada', stats: { fome: 5, sede: -1, alcoolismo: 0 } },
        { name: 'Quiche de Alho-Poró', price: 'R$ 17', description: 'Cremosa e leve', stats: { fome: 5, sede: 0, alcoolismo: 0 } },
        { name: 'Croissant de Chocolate Belga', price: 'R$ 14', description: 'Doce, intenso e crocante', stats: { fome: 5, sede: 0, alcoolismo: 0 } },
        { name: 'Cinnamon Roll', price: 'R$ 12', description: 'Macio, doce e aromático', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
        { name: 'Mini Cheesecake Nutella', price: 'R$ 13', description: 'Cremoso com Nutella', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
        { name: 'Torta Mousse Maracujá', price: 'R$ 16', description: 'Azedinha e leve', stats: { fome: 4, sede: 0, alcoolismo: 0 } },
      ],
      alcoolicas: []
    }
  },
  {
    id: 'city-bank',
    name: 'City Bank',
    type: 'bank',
    description: 'Banco digital para transferências entre jogadores',
    chatId: 'special:bank',
    imageUrl: 'https://images.unsplash.com/photo-1760243875440-3556238664d6?w=400',
    backgroundUrl: 'https://images.unsplash.com/photo-1760243875440-3556238664d6?w=1200',
    menuCategories: { bebidas: [], comidas: [], alcoolicas: [] },
    isSpecial: true
  },
  {
    id: 'central-hospital',
    name: 'Hospital Central',
    type: 'hospital',
    description: 'Centro médico para tratamento e cura',
    chatId: 'special:hospital',
    imageUrl: 'https://images.unsplash.com/photo-1710074213379-2a9c2653046a?w=400',
    backgroundUrl: 'https://images.unsplash.com/photo-1710074213379-2a9c2653046a?w=1200',
    menuCategories: { bebidas: [], comidas: [], alcoolicas: [] },
    isSpecial: true
  }
];

export function Locais({ onChatClick, onMyChatsClick, onRouletteClick, accessToken, currentUserId, currentUsername }: LocaisProps) {
  const getEstablishmentColor = (type: 'bar' | 'restaurant' | 'bakery' | 'bank' | 'hospital') => {
    switch (type) {
      case 'bar':
        return 'cyan';
      case 'restaurant':
        return 'purple';
      case 'bakery':
        return 'orange';
      case 'bank':
        return 'blue';
      case 'hospital':
        return 'red';
    }
  };

  const getStatColor = (value: number, type: 'fome' | 'sede' | 'alcoolismo') => {
    if (type === 'alcoolismo' && value > 0) return 'text-red-400';
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-cyan-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6 px-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 
            className="text-white text-xl"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(168,85,247,0.6)'
            }}
          >
            Locais
          </h3>
          <p className="text-sm text-gray-400">Explore estabelecimentos e seus chats</p>
        </div>
      </div>

      {/* Establishments Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {establishments.map((establishment) => {
          const color = getEstablishmentColor(establishment.type);

          return (
            <div
              key={establishment.id}
              className={`relative rounded-2xl overflow-hidden border border-${color}-500/30 transition-all duration-300 hover:scale-105 cursor-pointer`}
              style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.95))`
              }}
              onClick={() => {
                // Sempre abre como chat, mesmo para locais especiais
                onChatClick(
                  establishment.chatId,
                  establishment.name,
                  establishment.imageUrl,
                  establishment.backgroundUrl,
                  establishment.description,
                  'system',
                  establishment.menuCategories
                );
              }}
            >
              {/* Header with Background */}
              <div className="relative h-32 md:h-48">
                <ImageWithFallback
                  src={establishment.backgroundUrl}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                
                {/* Top Icon */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden border-2 border-${color}-500/50 shadow-lg bg-black/40 backdrop-blur-sm`}>
                    <ImageWithFallback
                      src={establishment.imageUrl}
                      alt={establishment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4">
                  <h4 
                    className="text-white text-sm md:text-2xl mb-0.5 md:mb-1 truncate"
                    style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)'
                    }}
                  >
                    {establishment.name}
                  </h4>
                  <p className="text-gray-300 text-xs md:text-sm line-clamp-1 md:line-clamp-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    {establishment.description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 md:p-4">
                <div className={`w-full py-2 md:py-3 px-3 md:px-4 rounded-xl bg-gradient-to-r from-${color}-500/80 to-${color}-600/80 text-white flex items-center justify-center gap-2 shadow-lg`}>
                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-base">Entrar</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav 
        onMyChatsClick={onMyChatsClick}
        onCreateClick={() => {}}
        onRouletteClick={onRouletteClick}
      />
    </div>
  );
}