# Sistema de Stats e Gerente/Funcionário

## Visão Geral

Este documento descreve o sistema completo de stats de vida e gerenciamento de estabelecimentos implementado no aplicativo.

## 1. SISTEMA DE STATS DE VIDA

### Stats do Jogador

Cada jogador possui 4 atributos que são monitorados:

- **Saúde (Health)**: 0-100 pontos
- **Fome (Hunger)**: 0-100 pontos  
- **Sede (Thirst)**: 0-100 pontos
- **Alcoolismo**: 0-100 pontos

### Decay Automático

Os stats decaem automaticamente enquanto o jogador está online:

- **Alcoolismo**: -5 pontos a cada 3 minutos
- **Fome e Sede**: -1 ponto a cada 30 minutos

### Decay Offline

Quando o jogador faz logout e retorna, o sistema calcula quanto tempo passou e aplica o decay retroativo baseado no tempo offline.

### Visualização

Os stats são visíveis no menu dos 3 pontinhos (⋮) de qualquer chat. Cada stat possui:
- Ícone colorido representativo
- Barra de progresso com gradiente (verde→amarelo→vermelho)
- Valor numérico (X/100)
- Animação shimmer nas barras

## 2. SISTEMA DE GERENTE E FUNCIONÁRIOS

### Estrutura dos Estabelecimentos

Existem 3 estabelecimentos principais:
- **Neon Tap House** (Bar)
- **Urban Leaf** (Restaurante)
- **PãoLab Bakery** (Padaria)

### Roles (Papéis)

Cada estabelecimento pode ter:
- **1 Gerente (Manager)**: Controle total
- **Múltiplos Funcionários (Employees)**: Preparam pedidos

### Como Tornar-se Gerente/Funcionário

Os papéis são atribuídos através da área administrativa "Secreto" (código: 88620787).

### 2.1 GERENTE (Manager)

O gerente tem acesso a 2 painéis via botão "Entrar no Gerente":

#### A) Painel de Pedidos (ManagerPanel)

Funcionalidades:
- Ver todos os pedidos (pendentes, preparando, completos)
- Ver preparações dos funcionários em tempo real
- Aceitar/Rejeitar pedidos pendentes
- Servir pedidos completos (paga o funcionário automaticamente)
- Pedir demissão
- Demitir funcionário
- Usar "Rancho dos Trabalhadores" (restaura 100% dos stats por 1000 moedas)
- Abrir/Fechar estabelecimento

#### B) Painel de Criação (MenuEditor)

Funcionalidades:
- Criar novos itens customizados para o cardápio
- Definir nome, preço, descrição
- Gerar descrições com IA (botão Sparkles)
- Gerar imagens com IA (botão Image)
- Definir efeitos nos stats (Fome, Sede, Alcoolismo)
- Editar itens existentes

### 2.2 FUNCIONÁRIO (Employee)

Responsabilidades:
- Preparar pedidos aprovados pelo gerente

#### Fluxo de Preparação:

1. Cliente faz pedido
2. Gerente aceita o pedido
3. Funcionário coleta itens do inventário pessoal
4. Timer de preparo começa (baseado no item)
5. Aguarda timer terminar
6. Gerente serve o pedido ao cliente
7. Funcionário recebe pagamento automaticamente

## 3. ESTRUTURA DO BANCO DE DADOS (Supabase)

### Tabelas Necessárias

#### `player_stats`
```sql
CREATE TABLE player_stats (
  user_id TEXT PRIMARY KEY,
  health INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 100,
  thirst INTEGER DEFAULT 100,
  alcoholism INTEGER DEFAULT 0,
  last_update TIMESTAMP DEFAULT NOW(),
  last_logout TIMESTAMP
);
```

#### `establishment_roles`
```sql
CREATE TABLE establishment_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'manager' ou 'employee'
  hired_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);
```

#### `orders`
```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  total_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'completed', 'rejected'
  prepared_by TEXT,
  preparer_username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `employee_preparations`
```sql
CREATE TABLE employee_preparations (
  preparation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id),
  chat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  item_name TEXT NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'in_progress' -- 'in_progress', 'completed'
);
```

#### `inventory_items`
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW()
);
```

#### `establishment_inventory`
```sql
CREATE TABLE establishment_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  last_restock TIMESTAMP DEFAULT NOW()
);
```

#### `menu_items`
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  image_url TEXT,
  stat_fome INTEGER DEFAULT 0,
  stat_sede INTEGER DEFAULT 0,
  stat_alcoolismo INTEGER DEFAULT 0,
  prep_time INTEGER DEFAULT 60, -- segundos
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_coins`
```sql
CREATE TABLE user_coins (
  user_id TEXT PRIMARY KEY,
  balance NUMERIC DEFAULT 1000,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. ENDPOINTS DO BACKEND

Todos os endpoints estão em: `https://{projectId}.supabase.co/functions/v1/make-server-531a6b8c/`

### Stats Endpoints

- **GET** `/player-stats` - Busca stats do jogador
- **POST** `/apply-stats-decay` - Aplica decay automático
- **POST** `/use-rancho` - Usa Rancho dos Trabalhadores (1000 moedas)

### Role Endpoints

- **GET** `/user-role/:chatId` - Busca papel do usuário no estabelecimento
- **POST** `/assign-role` - Atribui papel (admin only)

### Order Endpoints

- **GET** `/orders/:chatId` - Lista pedidos do estabelecimento
- **POST** `/create-order` - Cria novo pedido
- **POST** `/accept-order` - Gerente aceita pedido
- **POST** `/reject-order` - Gerente rejeita pedido
- **POST** `/serve-order` - Gerente serve pedido completo

### Preparation Endpoints

- **GET** `/preparations/:chatId` - Lista preparações em andamento
- **POST** `/start-preparation` - Funcionário inicia preparo

### Employee Management

- **POST** `/quit-job` - Funcionário pede demissão
- **POST** `/fire-employee` - Gerente demite funcionário

### Establishment Endpoints

- **POST** `/toggle-establishment` - Abre/fecha estabelecimento

### Menu Endpoints

- **POST** `/create-menu-item` - Cria item no cardápio (gerente)
- **PUT** `/update-menu-item` - Atualiza item (gerente)
- **GET** `/menu-items/:chatId` - Lista itens do cardápio

## 5. FUNCIONALIDADES ESPECIAIS

### Rancho dos Trabalhadores

- Custa 1000 moedas
- Restaura todos os stats para 100
- Disponível para gerentes e funcionários
- Útil para manter produtividade

### Reestoque Automático

- Estabelecimento reestoca automaticamente
- Gerente pode configurar reestoque manual

### Sistema de Pagamento

- Funcionários recebem automaticamente ao servir pedidos
- Valor baseado no preço do item
- Moedas adicionadas ao saldo do funcionário

## 6. UI/UX

### Cores e Temas

- **Gerente**: Gradiente rosa→roxo
- **Funcionário**: Gradiente roxo→ciano
- **Stats bons**: Verde→esmeralda
- **Stats médios**: Amarelo→laranja
- **Stats ruins**: Vermelho→vermelho escuro

### Animações

- Shimmer nas barras de progresso
- Pulse em elementos importantes
- Fade-in em dicas e mensagens
- Hover effects em botões

### Responsividade

- Layout adaptável para mobile e desktop
- Scroll suave em listas
- Modais centralizados

## 7. PRÓXIMOS PASSOS

Para ativar completamente o sistema:

1. Criar as tabelas no Supabase conforme especificado
2. Implementar os endpoints no backend (`/supabase/functions/make-server/`)
3. Configurar permissões RLS (Row Level Security)
4. Testar fluxo completo de pedidos
5. Adicionar notificações em tempo real
6. Implementar sistema de conquistas/badges

## 8. SEGURANÇA

- Apenas gerentes podem aceitar/rejeitar pedidos
- Apenas gerentes podem demitir funcionários
- Validação de saldo antes de usar Rancho
- Validação de permissões em todos os endpoints
- RLS habilitado em todas as tabelas
