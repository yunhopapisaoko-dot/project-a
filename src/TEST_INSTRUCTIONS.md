# Instruções de Teste - Aplicativo de Rede Social

## ✅ Conexão com Supabase
**Status:** Conectado com sucesso!
- Project ID: `rjvqirxrtnemwqipoohx`
- Anon Key: Configurado
- Edge Function: `make-server-531a6b8c`

## 🔍 Funcionalidades a Testar

### 1. Autenticação e Contas
#### Criar Conta (Sign Up)
- ✅ Rota disponível: `POST /make-server-531a6b8c/signup`
- Requisitos:
  - Email válido
  - Senha com mínimo 8 caracteres
- Comportamento:
  - Cria usuário no Supabase Auth
  - Salva senha no KV store para recuperação
  - Retorna userId e email

#### Login
- ✅ Usa Supabase Auth diretamente (`supabase.auth.signInWithPassword`)
- Retorna access_token para uso nas requisições

#### Definir Username (Após Cadastro)
- ✅ Rota: `POST /make-server-531a6b8c/set-username`
- Requisitos:
  - Username com mínimo 3 caracteres
  - Username único (verifica duplicatas)
- Cria perfil do usuário no KV store

### 2. Chats Públicos
#### Listar Chats
- ✅ Rota para usuários: `GET /make-server-531a6b8c/chats/list`
- ✅ Rota admin: `GET /make-server-531a6b8c/admin/chats`
- Retorna todos os chats públicos

#### Criar Chat (Admin)
- ✅ Rota: `POST /make-server-531a6b8c/admin/create-chat`
- Parâmetros:
  - name (obrigatório)
  - description (obrigatório)
  - imageUrl (opcional)
  - backgroundUrl (opcional)
- **PROBLEMA ATUAL:** Erro 403 - Possível problema de autenticação/permissão

#### Deletar Chat (Admin)
- ✅ Rota: `POST /make-server-531a6b8c/admin/delete-chat`
- Deleta chat e todas as mensagens relacionadas

### 3. Mensagens
#### Enviar Mensagem
- ✅ Rota: `POST /make-server-531a6b8c/send-message`
- Parâmetros:
  - chatId
  - text
  - replyTo (opcional)
  - replyToText (opcional)
  - replyToUsername (opcional)
- Requer autenticação (Bearer token)

#### Ver Mensagens
- ✅ Rota: `GET /make-server-531a6b8c/messages/:chatId`
- Retorna mensagens ordenadas por data
- Público (usa publicAnonKey)

#### Marcar como Visualizada
- ✅ Rota: `POST /make-server-531a6b8c/view-message`
- Adiciona userId ao array viewedBy

### 4. Painel Administrativo "Secreto"
- Código de acesso: `88620787`
- Funcionalidades:
  - ✅ Ver todos os usuários com credenciais
  - ✅ Alterar role de usuários (leader/helper/member)
  - ⚠️ Criar chats públicos (com erro 403)
  - ✅ Deletar chats
  - ✅ Ver posts em destaque

## 🐛 Problemas Identificados

### Erro 403 ao Criar Chat Público
**Descrição:** Ao tentar criar um chat público no painel administrativo, a requisição retorna erro 403 (Forbidden).

**Possíveis Causas:**
1. A rota `admin/create-chat` pode estar protegida por autenticação
2. O publicAnonKey pode não ter permissões suficientes
3. Falta configuração de RLS (Row Level Security) no Supabase

**Soluções Sugeridas:**
1. Usar access_token de admin ao invés de publicAnonKey
2. Verificar políticas de segurança no Supabase
3. Adicionar autenticação com service_role_key para operações admin

### Chat "off" Hardcoded
**Status:** Implementado no componente Locais.tsx
- Sempre aparece na lista de chats
- Tem descrição e imagens personalizadas
- Funcional para envio/recebimento de mensagens

## 🎯 Próximos Passos

1. **Corrigir erro 403 na criação de chats:**
   - Implementar autenticação adequada para rotas admin
   - Ou remover proteção se for intencional que seja público

2. **Testar fluxo completo:**
   - Criar conta → Definir username → Fazer login
   - Acessar chat "off" → Enviar mensagens
   - Entrar no painel Secreto → Gerenciar usuários

3. **Validar funcionalidades:**
   - Upload de avatar
   - Criar posts
   - Sistema de likes e comentários
   - Notificações

## 📝 Notas Técnicas

- **KV Store:** Usado para persistência (Deno KV)
- **Supabase Auth:** Gerenciamento de autenticação
- **Supabase Storage:** Buckets para avatars e posts
- **Polling:** Mensagens atualizadas a cada 3 segundos
- **Edge Function:** Hono.js rodando no Deno

## 🔐 Credenciais de Teste
(Para criar durante os testes)
- Email: teste@exemplo.com
- Senha: minimo8caracteres
- Username: usuario_teste
