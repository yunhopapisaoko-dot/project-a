import { Heart, Utensils, Droplets, Wine } from 'lucide-react';

interface StatsDisplayProps {
  health: number;
  hunger: number;
  thirst: number;
  alcoholism: number;
}

export function StatsDisplay({ health, hunger, thirst, alcoholism }: StatsDisplayProps) {
  const getStatColor = (value: number, reverse: boolean = false) => {
    if (reverse) {
      // Para alcoolismo - menor é melhor
      if (value >= 70) return 'from-red-500 to-red-600';
      if (value >= 40) return 'from-yellow-500 to-orange-500';
      return 'from-green-500 to-emerald-500';
    } else {
      // Para outros stats - maior é melhor
      if (value >= 70) return 'from-green-500 to-emerald-500';
      if (value >= 40) return 'from-yellow-500 to-orange-500';
      return 'from-red-500 to-red-600';
    }
  };

  const stats = [
    { name: 'Saúde', value: health, icon: Heart, color: getStatColor(health), iconColor: 'text-red-400' },
    { name: 'Fome', value: hunger, icon: Utensils, color: getStatColor(hunger), iconColor: 'text-orange-400' },
    { name: 'Sede', value: thirst, icon: Droplets, color: getStatColor(thirst), iconColor: 'text-blue-400' },
    { name: 'Alcoolismo', value: alcoholism, icon: Wine, color: getStatColor(alcoholism, true), iconColor: 'text-purple-400' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
        <h3 className="text-white">Status de Vida</h3>
      </div>
      
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                <span className="text-sm text-gray-300">{stat.name}</span>
              </div>
              <span className="text-sm text-white">{stat.value}/100</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-purple-500/20">
              <div
                className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-500 ease-out relative overflow-hidden`}
                style={{ width: `${stat.value}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="mt-4 p-3 bg-black/40 border border-purple-500/20 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">Decay automático:</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Alcoolismo: -5 a cada 3 minutos</li>
          <li>• Fome e Sede: -1 a cada 30 minutos</li>
        </ul>
      </div>
    </div>
  );
}
