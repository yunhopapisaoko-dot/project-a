import { useState } from 'react';
import { X, ShoppingBag, Plus } from 'lucide-react';
import { ManagerPanel } from './ManagerPanel';
import { MenuEditor } from './MenuEditor';

interface ManagerHubProps {
  chatId: string;
  chatName: string;
  accessToken: string;
  currentUserId: string;
  isManager: boolean;
  onClose: () => void;
}

export function ManagerHub({ 
  chatId, 
  chatName, 
  accessToken, 
  currentUserId, 
  isManager,
  onClose 
}: ManagerHubProps) {
  const [activePanel, setActivePanel] = useState<'orders' | 'editor'>('orders');

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-900/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-2xl" style={{
                textShadow: '0 0 20px rgba(236,72,153,0.6), 0 0 30px rgba(168,85,247,0.4)'
              }}>
                {chatName} - Gerenciamento
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isManager ? 'Painel do Gerente' : 'Painel do Funcionário'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs - Only show editor for managers */}
          <div className="flex gap-2">
            <button
              onClick={() => setActivePanel('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activePanel === 'orders'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-purple-500/20'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Pedidos
            </button>
            
            {isManager && (
              <button
                onClick={() => setActivePanel('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activePanel === 'editor'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-black/40 text-gray-400 hover:text-white border border-purple-500/20'
                }`}
              >
                <Plus className="w-4 h-4" />
                Criar Itens
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'orders' ? (
            <ManagerPanel
              chatId={chatId}
              chatName={chatName}
              accessToken={accessToken}
              currentUserId={currentUserId}
              isManager={isManager}
            />
          ) : (
            <MenuEditor
              chatId={chatId}
              accessToken={accessToken}
            />
          )}
        </div>
      </div>
    </div>
  );
}
