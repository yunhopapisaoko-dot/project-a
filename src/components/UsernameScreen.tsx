import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { User, Sparkles } from 'lucide-react';
import { projectId } from '../utils/supabase/client';
import logoImage from 'figma:asset/d9e83882afc4ff765b094dfca93feda3b8c21c8f.png';

interface UsernameScreenProps {
  accessToken: string;
  onUsernameSet: () => void;
}

export default function UsernameScreen({ accessToken, onUsernameSet }: UsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/set-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao definir nome de usuário');
        setLoading(false);
        return;
      }

      onUsernameSet();
    } catch (err) {
      console.error('Username error:', err);
      setError('Erro ao processar nome de usuário');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-gradient-to-b from-[#0a0a0f] to-black rounded-[2.5rem] border border-purple-500/20 shadow-2xl shadow-purple-900/50 overflow-hidden relative z-10 backdrop-blur-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={logoImage} 
            alt="MagicTalk" 
            className="h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
          />
        </div>

        {/* Title */}
        <h1 
          className="text-white text-center mb-2"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6), 0 0 30px rgba(168,85,247,0.4)'
          }}
        >
          Escolha seu nome de usuário
        </h1>

        <p className="text-gray-400 text-center mb-8 text-sm">
          Este nome será visível para todos os usuários
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input
                type="text"
                placeholder="Nome de usuário (mínimo 3 caracteres)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="pl-10 bg-black/40 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white hover:from-pink-600 hover:via-purple-600 hover:to-cyan-500 shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80 transition-all group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? 'Salvando...' : 'Continuar'}
              <Sparkles className="w-4 h-4 group-hover:animate-spin" />
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}