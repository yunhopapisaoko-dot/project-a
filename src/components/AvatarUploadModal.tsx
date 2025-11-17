import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId } from '../utils/supabase/client';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

export default function AvatarUploadModal({ 
  isOpen, 
  onClose, 
  accessToken, 
  currentAvatarUrl, 
  onAvatarUpdated 
}: AvatarUploadModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Selecione uma imagem');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer upload da foto');
        setLoading(false);
        return;
      }

      onAvatarUpdated(data.avatarUrl);
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (err) {
      console.error('Upload avatar error:', err);
      setError('Erro ao fazer upload da foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#0a0a0f] to-black border-purple-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle 
            className="text-white"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6), 0 0 30px rgba(168,85,247,0.4)'
            }}
          >
            Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {/* Preview */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500/30">
                {imagePreview ? (
                  <ImageWithFallback
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : currentAvatarUrl ? (
                  <ImageWithFallback
                    src={currentAvatarUrl}
                    alt="Avatar atual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm hover:bg-purple-500/30 transition-colors"
            >
              Escolher Foto
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-purple-500/30 text-gray-400 hover:bg-purple-500/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !imageFile}
              className="flex-1 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white hover:from-pink-600 hover:via-purple-600 hover:to-cyan-500 shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80 transition-all group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? 'Salvando...' : 'Salvar'}
                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}