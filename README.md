# Defenz - Gestão Estratégica de Atividades

Uma aplicação completa para gerenciamento de atividades estratégicas do projeto Defenz, desenvolvida com Next.js 15, TypeScript e tecnologias modernas.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação Simples**: Login com design moderno e seguro
- **Dashboard Interativo**: Visualização completa das atividades com gráficos e KPIs
- **CRUD Completo**: Criação, leitura, atualização e exclusão de atividades
- **Análises Avançadas**: Gráficos detalhados e insights estratégicos
- **Importação de Dados**: Carregamento automático das atividades da planilha
- **Design Responsivo**: Interface moderna que funciona em todos os dispositivos
- **Filtros Inteligentes**: Busca e filtragem por área, prioridade e status

### 📊 Visualizações
- Cards com KPIs principais
- Gráficos de distribuição por área
- Análise de prioridades
- Timeline de progresso
- Insights estratégicos personalizados

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 15 com App Router
- **Linguagem**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Banco de Dados**: SQLite com Prisma ORM
- **Ícones**: Lucide React
- **Gráficos**: Componentes customizados com CSS

## 📋 Estrutura do Projeto

```
src/
├── app/
│   ├── api/activities/          # API endpoints
│   ├── dashboard/               # Dashboard e páginas internas
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── activities/         # Gestão de atividades
│   │   └── analytics/          # Análises e gráficos
│   └── page.tsx                # Tela de login
├── components/ui/               # Componentes UI
├── lib/                        # Utilitários e configurações
└── prisma/                     # Schema do banco de dados
```

## 🎯 Como Usar

### 1. Login
- Acesse `http://localhost:3000`
- Use qualquer e-mail e senha para demonstração
- O sistema simula autenticação para demonstração

### 2. Dashboard
- Visualize o resumo das atividades
- Veja KPIs e estatísticas em tempo real
- Navegue pelas diferentes seções

### 3. Gestão de Atividades
- Crie novas atividades estratégicas
- Edite atividades existentes
- Filtre e busque atividades
- Atualize status e prioridades

### 4. Análises
- Visualize gráficos detalhados
- Analise distribuição por áreas
- Acompanhe progresso e custos
- Obtenha insights estratégicos

### 5. Importação de Dados
- Clique em "Importar Dados" no header
- Carregue automaticamente as 15 atividades do projeto Defenz
- Os dados incluem todas as informações da planilha original

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

## 🎨 Design

- **Cores**: Gradientes modernos com azul e roxo
- **Tipografia**: Inter, limpa e profissional
- **Layout**: Cards organizados com espaçamento adequado
- **Responsividade**: Mobile-first design
- **Acessibilidade**: Componentes semânticos e navegação por teclado

## 🔧 Configuração

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
npm install
```

### Banco de Dados
```bash
npm run db:push
```

### Desenvolvimento
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

## 📱 Funcionalidades Futuras

- [ ] Autenticação real com NextAuth.js
- [ ] Integração com Supabase/Neon
- [ ] Notificações em tempo real
- [ ] Exportação de relatórios
- [ ] Calendário integrado
- [ ] Gestão de equipe
- [ ] Anexos e documentos
- [ ] Histórico de alterações

## 🤝 Contribuição

Este é um projeto demonstrativo para gestão estratégica de atividades. Sinta-se à vontade para contribuir ou adaptar conforme suas necessidades.

## 📄 Licença

MIT License - Copyright (c) 2024 Defenz

---

**Desenvolvido com ❤️ para o projeto Defenz**