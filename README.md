# Defenz - Gestão Estratégica de Atividades

Uma aplicação completa para gerenciamento de atividades estratégicas do projeto Defenz, desenvolvida com Next.js 15, TypeScript e tecnologias modernas.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação com NextAuth**: Sistema completo de autenticação com NextAuth.js
- **Dashboard Interativo**: Visualização completa das atividades com gráficos e KPIs
- **CRUD Completo**: Criação, leitura, atualização e exclusão de atividades
- **Análises Avançadas**: Gráficos detalhados e insights estratégicos
- **Importação de Dados**: Carregamento automático das atividades da planilha
- **Design Responsivo**: Interface moderna que funciona em todos os dispositivos
- **Filtros Inteligentes**: Busca e filtragem por área, prioridade e status
- **Sistema de Notificações por Email**: Notificações configuráveis para eventos de atividades
- **Preferências de Notificação**: Controle granular de notificações e horário de silêncio
- **Audit Log**: Rastreamento completo de todas as alterações no sistema

### 📊 Visualizações
- Cards com KPIs principais
- Gráficos de distribuição por área
- Análise de prioridades
- Timeline de progresso
- Insights estratégicos personalizados
- Calendário de atividades

### 📧 Sistema de Email
- **Notificações de Atividade Atribuída**: Email quando uma atividade é atribuída
- **Lembretes de Prazo**: Avisos 24h antes do prazo
- **Mudanças de Status**: Notificação quando status é alterado
- **Atividades Deletadas**: Confirmação de exclusão
- **Resumo Diário**: Digest com atividades pendentes (opcional)
- **Relatório Semanal**: Estatísticas semanais (opcional)
- **Horário de Silêncio**: Configure períodos sem notificações
- **Email de Teste**: Teste sua configuração de email

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 15 com App Router
- **Linguagem**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Banco de Dados**: SQLite (dev) / PostgreSQL (produção) com Prisma ORM
- **Autenticação**: NextAuth.js
- **Email**: Resend com React Email
- **Ícones**: Lucide React
- **Gráficos**: Componentes customizados com CSS
- **Notificações**: Sonner (toast notifications)

## 📋 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── activities/          # API endpoints para atividades
│   │   ├── auth/                # NextAuth endpoints
│   │   └── notifications/       # API de notificações e preferências
│   ├── dashboard/               # Dashboard e páginas internas
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── activities/         # Gestão de atividades
│   │   ├── analytics/          # Análises e gráficos
│   │   ├── calendar/           # Calendário de atividades
│   │   └── settings/
│   │       └── notifications/  # Configurações de notificação
│   └── page.tsx                # Tela de login
├── components/ui/               # Componentes UI (shadcn)
├── emails/                      # Templates de email
│   ├── layouts/                # Layout base de emails
│   ├── ActivityAssigned.tsx    # Template de atribuição
│   ├── DeadlineReminder.tsx    # Template de lembrete
│   ├── StatusChanged.tsx       # Template de mudança de status
│   └── DailyDigest.tsx         # Template de resumo diário
├── lib/                        # Utilitários e configurações
│   ├── db.ts                   # Configuração Prisma
│   ├── auth.ts                 # Utilitários NextAuth
│   ├── email.ts                # Serviço de email
│   └── audit.ts                # Sistema de auditoria
└── prisma/                     # Schema do banco de dados
```

## 🎯 Como Usar

### 1. Instalação

```bash
npm install
```

### 2. Configuração do Banco de Dados

```bash
# Para desenvolvimento com SQLite
npx prisma db push

# Para produção com PostgreSQL
# Configure DATABASE_URL e DIRECT_URL no .env
npx prisma db push
```

### 3. Configuração de Email (Opcional)

Obtenha uma API key gratuita no [Resend](https://resend.com/api-keys) e configure no `.env`:

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@seudominio.com"
EMAIL_FROM_NAME="Defenz To-Do"
```

### 4. Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

### 5. Usando o Sistema

#### Login e Registro
- Crie uma conta ou faça login
- Sistema usa NextAuth com credenciais

#### Dashboard
- Visualize o resumo das atividades
- Veja KPIs e estatísticas em tempo real
- Navegue pelas diferentes seções

#### Gestão de Atividades
- Crie novas atividades estratégicas
- Edite atividades existentes
- Filtre e busque atividades
- Atualize status e prioridades
- Receba notificações por email

#### Análises
- Visualize gráficos detalhados
- Analise distribuição por áreas
- Acompanhe progresso e custos
- Obtenha insights estratégicos

#### Calendário
- Visualize atividades por data
- Veja prazos próximos
- Navegue por mês

#### Configurações de Notificação
- Acesse Dashboard > Notificações
- Configure quais notificações receber
- Defina horário de silêncio
- Teste o envio de email

## 📊 Modelo de Dados

### Activity
- **Título**: O Quê? (Nome da atividade)
- **Descrição**: Por Quê? (Justificativa)
- **Área**: Marketing, Vendas, Gestão, etc.
- **Prioridade**: Alta (0), Média (1), Baixa (2)
- **Status**: Pendente, Em Andamento, Concluído
- **Responsável**: Quem?
- **Prazo**: Quando?
- **Local**: Onde?
- **Como**: Método de execução
- **Custo**: Quanto?

### NotificationPreferences
- Controles individuais para cada tipo de notificação
- Horário de silêncio configurável
- Vinculado ao usuário

### EmailLog
- Histórico completo de emails enviados
- Status de envio (sucesso/falha)
- Rastreamento de erros

### AuditLog
- Registro de todas as ações (CREATE, UPDATE, DELETE)
- Informações do usuário que realizou a ação
- Snapshot das mudanças realizadas

## 🎨 Design

- **Cores**: Gradientes modernos com azul e roxo
- **Tipografia**: Inter, limpa e profissional
- **Layout**: Cards organizados com espaçamento adequado
- **Responsividade**: Mobile-first design
- **Acessibilidade**: Componentes semânticos e navegação por teclado
- **Dark Theme**: Interface elegante e moderna

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Database Configuration
DATABASE_URL="file:./dev.db"  # SQLite para dev
DIRECT_URL="file:./dev.db"

# Para PostgreSQL (produção):
# DATABASE_URL="postgresql://user:password@host/db?pgbouncer=true"
# DIRECT_URL="postgresql://user:password@host/db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-secret-key-aqui"

# Email Configuration (Opcional)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@seudominio.com"
EMAIL_FROM_NAME="Defenz To-Do"

# Server Configuration
NODE_ENV="development"
PORT="3000"
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Conecte com Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

### Outras Plataformas

Compatível com qualquer plataforma que suporte Next.js 15:
- Railway
- Render
- AWS
- Digital Ocean

## 📱 Funcionalidades Futuras

- [ ] Notificações push no navegador
- [ ] Webhooks para integrações
- [ ] API pública
- [ ] Mobile app (React Native)
- [ ] Gestão de equipe e permissões
- [ ] Anexos e documentos
- [ ] Comentários em atividades
- [ ] Integração com calendário (Google/Outlook)
- [ ] Exportação de relatórios PDF

## 🤝 Contribuição

Este é um projeto para gestão estratégica de atividades. Sinta-se à vontade para contribuir ou adaptar conforme suas necessidades.

## 📄 Licença

MIT License - Copyright (c) 2024 Defenz

---

**Desenvolvido com ❤️ para o projeto Defenz**
