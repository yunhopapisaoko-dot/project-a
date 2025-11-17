import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, DollarSign, FileText, ChevronRight, Users, User as UserIcon, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/client';

interface BankChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  accessToken: string;
  chatImage: string;
}

interface BankDocument {
  code: string;
  userId: string;
  username: string;
  name: string;
  age: number;
  gender: string;
  pronouns: string;
  photoUrl: string;
  createdAt: string;
  assignedTable?: string;
}

export function BankChatSystem({ isOpen, onClose, currentUserId, accessToken, chatImage }: BankChatSystemProps) {
  const [showElevator, setShowElevator] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [showEmployeeLogin, setShowEmployeeLogin] = useState(false);
  const [employeePassword, setEmployeePassword] = useState('');
  const [showDocumentQueue, setShowDocumentQueue] = useState(false);
  const [documents, setDocuments] = useState<BankDocument[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [myDocument, setMyDocument] = useState<BankDocument | null>(null);

  // Load documents from server
  useEffect(() => {
    if (isOpen && isEmployee) {
      loadDocuments();
      const interval = setInterval(loadDocuments, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, isEmployee]);

  // Load user's own document
  useEffect(() => {
    if (isOpen) {
      loadMyDocument();
      const interval = setInterval(loadMyDocument, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/bank-documents`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const loadMyDocument = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/my-bank-document`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyDocument(data.document || null);
      }
    } catch (err) {
      console.error('Error loading my document:', err);
    }
  };

  const handleEmployeeLogin = () => {
    if (employeePassword === 'Banco1211') {
      setIsEmployee(true);
      setShowEmployeeLogin(false);
      setEmployeePassword('');
      toast.success('✅ Você agora é um funcionário do banco!');
    } else {
      toast.error('❌ Senha incorreta!');
      setEmployeePassword('');
    }
  };

  const handleNextDocument = async (table: string) => {
    const pendingDocs = documents.filter(doc => !doc.assignedTable);
    if (pendingDocs.length > 0) {
      const doc = pendingDocs[0];
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/assign-bank-table`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            code: doc.code,
            table
          })
        });
        
        if (response.ok) {
          setDocuments(docs => docs.map(d => 
            d.code === doc.code ? { ...d, assignedTable: table } : d
          ));
          toast.success(`📋 Código ${doc.code} - Direcionado para ${table}`);
          loadDocuments(); // Reload to get updated data
        } else {
          toast.error('❌ Erro ao atribuir mesa');
        }
      } catch (err) {
        console.error('Error assigning table:', err);
        toast.error('❌ Erro ao atribuir mesa');
      }
    } else {
      toast.error('Nenhum documento pendente na fila');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-b from-[#0a0a0f] to-black border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl flex items-center gap-2" style={{ textShadow: '0 0 20px rgba(234,179,8,0.6)' }}>
              <Building2 className="w-6 h-6 text-yellow-500" />
              Sistema do Banco
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Menu */}
          <div className="space-y-3">
            {/* Elevador (Salas) */}
            <button
              onClick={() => setShowElevator(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500/50">
                  <ImageWithFallback
                    src={chatImage}
                    alt="Banco"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Elevador</p>
                  <p className="text-xs text-gray-400">Acessar salas</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Funcionário */}
            {!isEmployee ? (
              <button
                onClick={() => setShowEmployeeLogin(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <UserIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Área do Funcionário</p>
                    <p className="text-xs text-gray-400">Faça login</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => setShowDocumentQueue(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Fila de Documentos</p>
                    <p className="text-xs text-gray-400">{documents.filter(d => !d.assignedTable).length} pendentes</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Elevator Modal */}
          {showElevator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-b from-[#0a0a0f] to-black border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg">🛗 Elevador - Selecione a Sala</h3>
                  <button onClick={() => setShowElevator(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {['Mesa 1', 'Mesa 2', 'Mesa 3'].map((room) => (
                    <button
                      key={room}
                      onClick={() => {
                        setSelectedRoom(room);
                        toast.success(`🛗 Você entrou na ${room}`);
                        setShowElevator(false);
                      }}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 text-white transition-all"
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Employee Login Modal */}
          {showEmployeeLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-b from-[#0a0a0f] to-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg">🔐 Login de Funcionário</h3>
                  <button onClick={() => {
                    setShowEmployeeLogin(false);
                    setEmployeePassword('');
                  }} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-400 text-sm mb-4">
                  Digite a senha para acessar a área de funcionário
                </p>

                <div className="space-y-4">
                  <input
                    type="password"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmployeeLogin()}
                    placeholder="Digite a senha..."
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleEmployeeLogin}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Document Queue Modal */}
          {showDocumentQueue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-b from-[#0a0a0f] to-black border border-green-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Fila de Documentos
                  </h3>
                  <button onClick={() => setShowDocumentQueue(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  Atribua uma mesa para cada documento
                </p>
                
                <div className="space-y-3">
                  {documents.filter(d => !d.assignedTable).length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhum documento na fila</p>
                  ) : (
                    documents.filter(d => !d.assignedTable).map((doc) => (
                      <div key={doc.code} className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold">Código: {doc.code}</p>
                            <p className="text-sm text-gray-400">{doc.name}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {['Mesa 1', 'Mesa 2', 'Mesa 3'].map((table) => (
                            <button
                              key={table}
                              onClick={() => handleNextDocument(table)}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/40 text-yellow-400 text-sm transition-all"
                            >
                              {table}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Assigned Documents */}
                {documents.filter(d => d.assignedTable).length > 0 && (
                  <>
                    <h4 className="text-white mt-6 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />
                      Documentos Atribuídos
                    </h4>
                    <div className="space-y-2">
                      {documents.filter(d => d.assignedTable).map((doc) => (
                        <div key={doc.code} className="p-3 rounded-lg bg-black/40 border border-green-500/20 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm">{doc.code}</p>
                            <p className="text-xs text-gray-400">{doc.name}</p>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs">
                            {doc.assignedTable}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* My Document Status */}
          {myDocument && myDocument.assignedTable && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <FileText className="w-5 h-5 text-green-400" />
                <p className="text-white font-semibold">Seu Documento foi Processado!</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 space-y-1">
                <p className="text-yellow-400 text-center">
                  📋 Código: <span className="font-bold">{myDocument.code}</span>
                </p>
                <p className="text-cyan-400 text-center">
                  🪑 Dirija-se para: <span className="font-bold">{myDocument.assignedTable}</span>
                </p>
              </div>
            </div>
          )}

          {/* Pending Document Status */}
          {myDocument && !myDocument.assignedTable && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
                <p className="text-white font-semibold">Aguardando Atendimento</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-yellow-400 text-center">
                  📋 Seu Código: <span className="font-bold">{myDocument.code}</span>
                </p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Por favor, aguarde ser chamado...
                </p>
              </div>
            </div>
          )}

          {/* Selected Room Info */}
          {selectedRoom && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40">
              <p className="text-white text-center">
                📍 Você está na <span className="font-semibold">{selectedRoom}</span>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}