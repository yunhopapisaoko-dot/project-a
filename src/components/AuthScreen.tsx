import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Mail, Lock, Sparkles, Shield } from 'lucide-react';
import { supabase, projectId, publicAnonKey } from '../utils/supabase/client';
import logoImage from 'figma:asset/d9e83882afc4ff765b094dfca93feda3b8c21c8f.png';

interface AuthScreenProps {
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onSecretAccess: () => void;
}

export default function AuthScreen({ onAuthSuccess, onSecretAccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretCode === '88620787') {
      onSecretAccess();
    } else {
      setError('Código incorreto');
      setSecretCode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          setTimeout(() => {
            onAuthSuccess(data.session.access_token, data.user.id);
          }, 100);
        }
      } else {
        // Signup
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erro ao criar conta');
          setLoading(false);
          return;
        }

        // Auto login após signup
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }

        if (loginData.session) {
          setTimeout(() => {
            onAuthSuccess(loginData.session.access_token, loginData.user.id);
          }, 100);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Erro ao processar autenticação');
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
          className="text-white text-center mb-8"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6), 0 0 30px rgba(168,85,247,0.4)'
          }}
        >
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-black/40 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input
                type="password"
                placeholder="Senha (mínimo 8 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
              <Sparkles className="w-4 h-4 group-hover:animate-spin" />
            </span>
          </Button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-purple-400 hover:text-pink-400 transition-colors block w-full"
          >
            {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>

          {/* Secret Access */}
          {!showSecretInput ? (
            <button
              type="button"
              onClick={() => setShowSecretInput(true)}
              className="text-gray-600 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 justify-center w-full"
            >
              <Shield className="w-4 h-4" />
              Secreto
            </button>
          ) : (
            <form onSubmit={handleSecretSubmit} className="space-y-2">
              <Input
                type="password"
                placeholder="Código secreto"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="bg-black/40 border-cyan-500/30 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-center"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowSecretInput(false);
                    setSecretCode('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                >
                  Entrar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}