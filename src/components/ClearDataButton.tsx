import { Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/client';

export default function ClearDataButton() {
  const handleClearAll = async () => {
    const confirm1 = window.confirm('⚠️ ATENÇÃO: Isso vai deletar TODAS as contas, posts e chats! Tem certeza?');
    if (!confirm1) return;
    
    const confirm2 = window.confirm('🚨 ÚLTIMA CHANCE: Essa ação não pode ser desfeita! Continuar?');
    if (!confirm2) return;
    
    try {
      console.log('🗑️ Iniciando limpeza completa...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-531a6b8c/admin/clear-all-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dados limpos:', result);
        alert(`✅ Sucesso!\n\n${result.authUsersDeleted} contas deletadas\n${result.kvItemsDeleted} registros limpos\n\nA página será recarregada.`);
        
        // Limpar localStorage e recarregar
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('❌ Erro ao limpar:', error);
        alert('❌ Erro ao limpar dados: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('💥 Erro:', error);
      alert('💥 Erro de conexão: ' + error);
    }
  };

  return (
    <button
      onClick={handleClearAll}
      className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      title="Limpar todos os dados"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}