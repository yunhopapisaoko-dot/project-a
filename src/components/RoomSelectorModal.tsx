import { X, Building2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomSelectorModalProps {
  onClose: () => void;
  onSelectRoom: (roomName: string) => void;
  type: 'hospital' | 'bank';
  locationName: string;
}

export function RoomSelectorModal({ onClose, onSelectRoom, type, locationName }: RoomSelectorModalProps) {
  const hospitalRooms = [
    { name: '🏥 Sala 1', description: 'Atendimento geral' },
    { name: '🏥 Sala 2', description: 'Consultas especializadas' },
    { name: '🏥 Sala 3', description: 'Emergências' }
  ];

  const bankRooms = [
    { name: '🏦 Atendimento 1', description: 'Caixa e serviços gerais' },
    { name: '🏦 Atendimento 2', description: 'Investimentos' },
    { name: '🏦 Gerência', description: 'Atendimento especial' }
  ];

  const rooms = type === 'hospital' ? hospitalRooms : bankRooms;
  const icon = type === 'hospital' ? Heart : Building2;
  const Icon = icon;
  const gradientFrom = type === 'hospital' ? 'from-red-500' : 'from-yellow-500';
  const gradientTo = type === 'hospital' ? 'to-pink-500' : 'to-amber-500';
  const borderColor = type === 'hospital' ? 'border-red-500/30' : 'border-yellow-500/30';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" 
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className={`bg-gradient-to-br from-gray-900 via-purple-950/20 to-gray-900 rounded-3xl max-w-md w-full overflow-hidden border ${borderColor} shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-6 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-2xl">Escolha uma Sala</h2>
                  <p className="text-white/80 text-sm">{locationName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Rooms List */}
          <div className="p-6 space-y-3">
            {rooms.map((room, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectRoom(room.name);
                  onClose();
                }}
                className={`w-full bg-black/40 backdrop-blur-sm rounded-2xl p-4 border ${borderColor} hover:border-opacity-60 transition-all group hover:shadow-lg text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white group-hover:text-purple-300 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{room.description}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-20 group-hover:opacity-40 transition-all flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
