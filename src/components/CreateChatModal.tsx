import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Save, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/client';

interface CreateChatModalProps {
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
  currentUserId: string;
  currentUsername: string;
}

interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CreateChatModal({ onClose, onSuccess, accessToken, currentUserId, currentUsername }: CreateChatModalProps) {
  const [step, setStep] = useState<'type' | 'details' | 'preview'>('type');
  const [chatType, setChatType] = useState<'public' | 'private' | null>(null);
  const [secretCode, setSecretCode] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);
  
  const [chatName, setChatName] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  const [cropMode, setCropMode] = useState<'profile' | 'background' | null>(null);
  const [cropData, setCropData] = useState<ImageCrop>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectChatType = (type: 'public' | 'private') => {
    setChatType(type);
    if (type === 'public') {
      // Need to verify password
    } else {
      setStep('details');
    }
  };

  const verifyPassword = () => {
    if (secretCode === '88620787') {
      setStep('details');
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'background') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'profile') {
        setProfileImage(result);
      } else {
        setBackgroundImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCrop = (type: 'profile' | 'background') => {
    setCropMode(type);
    setCropData({ x: 0, y: 0, width: 100, height: 100 });
  };

  const applyCrop = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const imageToProcess = cropMode === 'profile' ? profileImage : backgroundImage;
    
    if (!imageToProcess) return;

    img.onload = () => {
      const scaleX = img.width / 300;
      const scaleY = img.height / 300;
      
      const sourceX = cropData.x * scaleX;
      const sourceY = cropData.y * scaleY;
      const sourceWidth = cropData.width * scaleX;
      const sourceHeight = cropData.height * scaleY;
      
      if (cropMode === 'profile') {
        canvas.width = 200;
        canvas.height = 200;
      } else {
        canvas.width = 800;
        canvas.height = 400;
      }
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, canvas.width, canvas.height
      );
      
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      
      if (cropMode === 'profile') {
        setProfileImage(croppedImage);
      } else {
        setBackgroundImage(croppedImage);
      }
      
      setCropMode(null);
    };
    
    img.src = imageToProcess;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropData.x, y: e.clientY - cropData.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(300 - cropData.width, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(300 - cropData.height, e.clientY - dragStart.y));
    setCropData({ ...cropData, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const createChat = async () => {
    if (!chatName || !chatDescription) {
      alert('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating chat with:', {
        name: chatName,
        description: chatDescription,
        hasProfileImage: !!profileImage,
        hasBackgroundImage: !!backgroundImage,
        isPublic: chatType === 'public'
      });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/chats/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: chatName,
          description: chatDescription,
          imageUrl: profileImage || '',
          backgroundUrl: backgroundImage || '',
          isPublic: chatType === 'public'
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Chat created successfully:', result);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(error.error || 'Erro ao criar chat');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Erro ao criar chat: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/20 p-6 flex items-center justify-between">
          <h2 className="text-white">Criar Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Choose Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <h3 className="text-white text-center mb-6">Escolha o tipo de chat</h3>
              
              <button
                onClick={() => selectChatType('public')}
                className="w-full p-6 rounded-2xl border-2 border-purple-500/30 hover:border-purple-500 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white">Chat Público</p>
                    <p className="text-sm text-gray-400">Todos podem ver e participar</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => selectChatType('private')}
                className="w-full p-6 rounded-2xl border-2 border-cyan-500/30 hover:border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white">Chat Privado</p>
                    <p className="text-sm text-gray-400">Apenas convidados podem participar</p>
                  </div>
                </div>
              </button>

              {chatType === 'public' && (
                <div className="mt-6 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                  <label className="text-white text-sm mb-2 block">Código de acesso para criar chat público</label>
                  <Input
                    type="password"
                    placeholder="Digite o código"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="bg-gray-800 border-purple-500/30 text-white mb-3"
                  />
                  {showPasswordError && (
                    <p className="text-red-400 text-sm mb-3">Código incorreto</p>
                  )}
                  <Button
                    onClick={verifyPassword}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Verificar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && !cropMode && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Nome do Chat</label>
                <Input
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Digite o nome"
                  className="bg-gray-800 border-purple-500/30 text-white"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Descrição</label>
                <Textarea
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  placeholder="Descreva o chat..."
                  className="bg-gray-800 border-purple-500/30 text-white min-h-[100px]"
                />
              </div>

              {/* Profile Image */}
              <div>
                <label className="text-white text-sm mb-2 block">Foto do Chat</label>
                <div className="flex gap-3 items-start">
                  {!profileImage ? (
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500 rounded-2xl p-8 text-center transition-all bg-purple-500/5">
                        <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Clique para adicionar foto</p>
                        <p className="text-xs text-gray-500 mt-1">Foto do perfil do chat</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profile')}
                      />
                    </label>
                  ) : (
                    <div className="flex-1">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-gray-800">
                        <ImageWithFallback src={profileImage} alt="Preview da foto do chat" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-4">
                          <p className="text-white text-sm">Preview da Foto</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openCrop('profile')}
                              size="sm"
                              className="rounded-full bg-purple-500 hover:bg-purple-600"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setProfileImage(null)}
                              size="sm"
                              variant="destructive"
                              className="rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Image */}
              <div>
                <label className="text-white text-sm mb-2 block">Papel de Parede do Chat</label>
                <div className="flex gap-3 items-start">
                  {!backgroundImage ? (
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-pink-500/30 hover:border-pink-500 rounded-2xl p-8 text-center transition-all bg-pink-500/5">
                        <Upload className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Clique para adicionar fundo</p>
                        <p className="text-xs text-gray-500 mt-1">Papel de parede do chat (aparecerá como fundo)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'background')}
                      />
                    </label>
                  ) : (
                    <div className="flex-1">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/50 bg-gray-800">
                        <ImageWithFallback src={backgroundImage} alt="Preview do papel de parede" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-4">
                          <p className="text-white text-sm">Preview do Papel de Parede</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openCrop('background')}
                              size="sm"
                              className="rounded-full bg-pink-500 hover:bg-pink-600"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setBackgroundImage(null)}
                              size="sm"
                              variant="destructive"
                              className="rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep('type')}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Crop Mode */}
          {cropMode && (
            <div className="space-y-4">
              <h3 className="text-white">Ajustar {cropMode === 'profile' ? 'Foto' : 'Fundo'}</h3>
              
              <div
                className="relative w-[300px] h-[300px] mx-auto border-2 border-purple-500/50 rounded-xl overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <ImageWithFallback
                  src={cropMode === 'profile' ? profileImage! : backgroundImage!}
                  alt="Crop"
                  className="w-full h-full object-contain"
                />
                <div
                  className="absolute border-2 border-white shadow-lg"
                  style={{
                    left: `${cropData.x}px`,
                    top: `${cropData.y}px`,
                    width: `${cropData.width}px`,
                    height: `${cropData.height}px`,
                    background: 'rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="absolute inset-0 border-2 border-dashed border-white/50"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm">Tamanho</label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={cropData.width}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    setCropData({
                      ...cropData,
                      width: size,
                      height: size,
                      x: Math.min(cropData.x, 300 - size),
                      y: Math.min(cropData.y, 300 - size)
                    });
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCropMode(null)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={applyCrop}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Aplicar
                </Button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <h3 className="text-white text-center">Preview do Chat</h3>

              {/* Preview Card */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg">
                <div className="relative h-48">
                  {backgroundImage ? (
                    <ImageWithFallback
                      src={backgroundImage}
                      alt="Background"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/50">
                    {profileImage ? (
                      <ImageWithFallback src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white">{chatName || 'Nome do Chat'}</p>
                    <p className="text-sm text-gray-400">{chatDescription || 'Descrição'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('details')}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:text-white"
                >
                  Editar
                </Button>
                <Button
                  onClick={createChat}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Criando...' : 'Criar Chat'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}