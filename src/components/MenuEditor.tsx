import { useState } from 'react';
import { Plus, Sparkles, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/client';

interface MenuEditorProps {
  chatId: string;
  accessToken: string;
}

export function MenuEditor({ chatId, accessToken }: MenuEditorProps) {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemFome, setItemFome] = useState('0');
  const [itemSede, setItemSede] = useState('0');
  const [itemAlcoolismo, setItemAlcoolismo] = useState('0');
  const [itemImage, setItemImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerateDescription = async () => {
    if (!itemName.trim()) {
      toast.error('Digite um nome para o item primeiro');
      return;
    }

    setLoading(true);
    try {
      // Simular geração de descrição com IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const descriptions = [
        'Delicioso prato preparado com ingredientes frescos e selecionados.',
        'Uma experiência gastronômica única que combina sabores autênticos.',
        'Receita tradicional com um toque moderno e especial.',
        'Preparado com carinho e dedicação para o seu prazer.',
        'Ingredientes premium em uma combinação perfeita de sabores.'
      ];
      
      setItemDescription(descriptions[Math.floor(Math.random() * descriptions.length)]);
      toast.success('Descrição gerada!');
    } catch (err) {
      toast.error('Erro ao gerar descrição');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!itemName.trim()) {
      toast.error('Digite um nome para o item primeiro');
      return;
    }

    setGeneratingImage(true);
    try {
      // Simular geração de imagem com IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Usar Unsplash como placeholder
      const searchQuery = itemName.toLowerCase().replace(/\s+/g, '-');
      const imageUrl = `https://source.unsplash.com/400x300/?${searchQuery},food`;
      
      setItemImage(imageUrl);
      toast.success('Imagem gerada!');
    } catch (err) {
      toast.error('Erro ao gerar imagem');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      toast.error('Preencha nome e preço do item');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/create-menu-item`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            chatId,
            name: itemName,
            price: itemPrice,
            description: itemDescription,
            imageUrl: itemImage,
            stats: {
              fome: parseInt(itemFome) || 0,
              sede: parseInt(itemSede) || 0,
              alcoolismo: parseInt(itemAlcoolismo) || 0
            }
          })
        }
      );

      if (response.ok) {
        toast.success('Item criado com sucesso!');
        // Reset form
        setItemName('');
        setItemPrice('');
        setItemDescription('');
        setItemFome('0');
        setItemSede('0');
        setItemAlcoolismo('0');
        setItemImage('');
      } else {
        toast.error('Erro ao criar item');
      }
    } catch (err) {
      toast.error('Erro ao criar item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-purple-400" />
          <h3 className="text-white">Criar Novo Item</h3>
        </div>

        {/* Item Image Preview */}
        {itemImage && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-purple-500/30">
            <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Nome do Item</label>
            <Input
              type="text"
              placeholder="Ex: Burger Especial"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-black/60 border-purple-500/40 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Preço</label>
            <Input
              type="text"
              placeholder="Ex: 50"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-full bg-black/60 border-purple-500/40 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Descrição</label>
            <div className="flex gap-2">
              <textarea
                placeholder="Descrição do item..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className="flex-1 bg-black/60 border border-purple-500/40 text-white placeholder:text-gray-500 rounded-xl px-4 py-3 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/30 transition-all resize-none"
              />
            </div>
            <button
              onClick={handleGenerateDescription}
              disabled={loading}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar com IA
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">URL da Imagem</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="https://..."
                value={itemImage}
                onChange={(e) => setItemImage(e.target.value)}
                className="flex-1 bg-black/60 border-purple-500/40 text-white placeholder:text-gray-500"
              />
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {generatingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 bg-black/40 border border-purple-500/20 rounded-xl space-y-4">
          <h4 className="text-white text-sm">Efeitos nos Stats</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fome</label>
              <Input
                type="number"
                placeholder="0"
                value={itemFome}
                onChange={(e) => setItemFome(e.target.value)}
                className="w-full bg-black/60 border-purple-500/40 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sede</label>
              <Input
                type="number"
                placeholder="0"
                value={itemSede}
                onChange={(e) => setItemSede(e.target.value)}
                className="w-full bg-black/60 border-purple-500/40 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Alcoolismo</label>
              <Input
                type="number"
                placeholder="0"
                value={itemAlcoolismo}
                onChange={(e) => setItemAlcoolismo(e.target.value)}
                className="w-full bg-black/60 border-purple-500/40 text-white"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Valores positivos aumentam o stat, negativos diminuem
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveItem}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Salvar Item
        </button>
      </div>
    </div>
  );
}
