import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ImagePlus, Type, Sparkles, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId } from '../utils/supabase/client';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, accessToken, onPostCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
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
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('text', text);
      formData.append('isFeatured', isFeatured.toString());
      if (imageFile) {
        formData.append('file', imageFile);
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/create-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar post');
        setLoading(false);
        return;
      }

      // Reset form
      setTitle('');
      setText('');
      setImageFile(null);
      setImagePreview(null);
      setIsFeatured(false);
      
      onPostCreated();
      onClose();
    } catch (err) {
      console.error('Create post error:', err);
      setError('Erro ao criar post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-[#0a0a0f] to-black border-purple-500/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle 
            className="text-white"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(236,72,153,0.6), 0 0 30px rgba(168,85,247,0.4)'
            }}
          >
            Criar Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Título</label>
            <Input
              type="text"
              placeholder="Título do post"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Texto</label>
            <Textarea
              placeholder="O que você quer compartilhar?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-pink-500/50 focus:ring-pink-500/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Imagem</label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-purple-500/30">
                <ImageWithFallback
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-purple-500/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-pink-500/50 transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-purple-400" />
                <span className="text-sm text-gray-400">Clique para adicionar imagem</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500/30 bg-black/40 text-pink-500 focus:ring-pink-500/20"
            />
            <label htmlFor="featured" className="text-sm text-gray-400">
              Marcar como destaque
            </label>
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white hover:from-pink-600 hover:via-purple-600 hover:to-cyan-500 shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80 transition-all group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? 'Postando...' : 'Postar'}
                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}