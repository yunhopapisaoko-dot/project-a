import { useState } from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface BankDocumentModalProps {
  onClose: () => void;
  userId: string;
  userName: string;
  accessToken: string;
}

export function BankDocumentModal({ onClose, userId, userName, accessToken }: BankDocumentModalProps) {
  const [formData, setFormData] = useState({
    documentType: 'Extrato',
    reason: '',
    amount: '',
    description: ''
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateDocument = async () => {
    if (!formData.reason.trim()) {
      toast.error('Por favor, preencha o motivo do documento');
      return;
    }

    setLoading(true);
    try {
      // Generate unique code
      const code = `BANCO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Save to database
      const response = await fetch('/api/bank-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId,
          userName,
          documentType: formData.documentType,
          reason: formData.reason,
          amount: formData.amount,
          description: formData.description,
          code
        })
      });

      if (response.ok) {
        setGeneratedCode(code);
        toast.success('Documento gerado com sucesso!');
      } else {
        toast.error('Erro ao gerar documento');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Erro ao gerar documento');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

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
          className="bg-gradient-to-br from-gray-900 via-yellow-950/20 to-gray-900 rounded-3xl max-w-lg w-full overflow-hidden border border-yellow-500/30 shadow-2xl shadow-yellow-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-2xl">Criar Documento</h2>
                  <p className="text-white/80 text-sm">Preencha os dados necessários</p>
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

          {/* Content */}
          <div className="p-6 space-y-4">
            {!generatedCode ? (
              <>
                {/* Document Type */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo de Documento</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full bg-black/60 border border-yellow-500/30 text-white rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all"
                  >
                    <option value="Extrato">Extrato Bancário</option>
                    <option value="Comprovante">Comprovante de Transferência</option>
                    <option value="Saldo">Consulta de Saldo</option>
                    <option value="Historico">Histórico de Transações</option>
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Motivo *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Ex: Comprovante de pagamento"
                    className="w-full bg-black/60 border border-yellow-500/30 text-white rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valor (opcional)</label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="R$ 0,00"
                    className="w-full bg-black/60 border border-yellow-500/30 text-white rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all placeholder:text-gray-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                    className="w-full bg-black/60 border border-yellow-500/30 text-white rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateDocument}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl px-6 py-4 hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
                >
                  {loading ? 'Gerando...' : 'Gerar Documento'}
                </button>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-white text-xl mb-2">Documento Gerado!</h3>
                    <p className="text-gray-400 text-sm">Seu código de acesso:</p>
                  </div>

                  {/* Code Display */}
                  <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-yellow-400 break-all">{generatedCode}</code>
                      <button
                        onClick={copyCode}
                        className="flex-shrink-0 p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm">
                    Guarde este código para acessar seu documento posteriormente
                  </p>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl px-6 py-4 hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
