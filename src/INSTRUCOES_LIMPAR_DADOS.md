# 🗑️ Como Limpar Todos os Dados

## ✅ Implementação Completa

Foi adicionado um **botão vermelho "🗑️ Limpar Tudo"** no canto inferior esquerdo da tela de login.

### Como Usar:

1. **Abra o aplicativo** - Você verá a tela de login
2. **Clique no botão vermelho** "🗑️ Limpar Tudo" no canto inferior esquerdo
3. **Confirme duas vezes** - O sistema pedirá confirmação dupla para evitar exclusões acidentais
4. **Aguarde** - O sistema irá:
   - ✅ Deletar TODAS as contas de usuários do Supabase Auth
   - ✅ Limpar TODOS os posts
   - ✅ Limpar TODOS os chats (incluindo o chat "Pousada")
   - ✅ Limpar TODAS as mensagens
   - ✅ Limpar TODAS as notificações
   - ✅ Limpar localStorage e sessionStorage
5. **Página recarrega automaticamente** - Banco de dados totalmente limpo!

---

## 🔐 Sistema de Autenticação - Como Funciona

### ✅ Criar Conta (Signup)

1. Usuário preenche **email** e **senha** (mínimo 8 caracteres)
2. Sistema cria conta no **Supabase Auth** com `email_confirm: true`
3. Sistema salva a senha no KV store para recuperação (se necessário)
4. Sistema faz **login automático**
5. Usuário é redirecionado para escolher um **username**
6. Após escolher username, os dados são salvos no KV store: `user:${userId}`
7. **✅ CONTA SALVA PERMANENTEMENTE**

### ✅ Fazer Login

1. Usuário preenche **email** e **senha**
2. Sistema usa `supabase.auth.signInWithPassword()`
3. Supabase cria uma **sessão** (access_token)
4. Sessão é salva **automaticamente no localStorage** do navegador
5. Sistema busca o perfil do usuário no KV store
6. **✅ USUÁRIO LOGADO COM SUCESSO**

### ✅ Persistência de Sessão

- O **Supabase Client** persiste sessões automaticamente no `localStorage`
- Quando o usuário recarrega a página, o sistema verifica se há sessão ativa:
  ```typescript
  const { data: { session } } = await supabase.auth.getSession();
  ```
- Se houver sessão, o usuário é **automaticamente logado**
- **✅ NÃO PRECISA FAZER LOGIN TODA VEZ**

### ✅ Estrutura de Dados

**Supabase Auth:**
- Armazena: `email`, `password` (hash), `userId`

**KV Store:**
- `user:${userId}` → Armazena perfil completo:
  ```json
  {
    "userId": "uuid",
    "email": "usuario@email.com",
    "username": "nomedousuario",
    "avatarUrl": "url_da_foto",
    "bio": "biografia",
    "createdAt": "2025-11-16T..."
  }
  ```

---

## ⚠️ Importante

- **O botão só aparece na tela de login**
- **Requer confirmação dupla** para evitar exclusões acidentais
- **Não há volta** - Todos os dados são deletados permanentemente
- **Perfeito para testes** - Comece do zero sempre que precisar!

---

## 🚀 Fluxo Completo

```
1. Criar Conta → 2. Escolher Username → 3. Conta Salva ✅
4. Fazer Login → 5. Sessão Persistida ✅ → 6. Usar App ✅
7. Recarregar Página → 8. Login Automático ✅
```

**✅ TUDO FUNCIONANDO PERFEITAMENTE!**
