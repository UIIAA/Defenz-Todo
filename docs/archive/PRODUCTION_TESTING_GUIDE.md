# Guia de Teste em Produção (Vercel + Neon)

Este guia descreve o passo a passo para colocar a aplicação em produção, configurar o ambiente e liberar o acesso para usuários reais.

## 1. Deploy na Vercel

Como o projeto já está configurado para Vercel, o processo é simples:

1.  **Push para o GitHub:**
    Certifique-se de que todas as alterações estão no repositório remoto.
    ```bash
    git add .
    git commit -m "chore: Prepare for production release"
    git push origin main
    ```

2.  **Importar Projeto na Vercel (Se ainda não fez):**
    *   Acesse [vercel.com/new](https://vercel.com/new).
    *   Selecione o repositório do GitHub `Defenz - To-Do`.
    *   A Vercel detectará automaticamente que é um projeto Next.js.

3.  **Configurar Variáveis de Ambiente (Environment Variables):**
    Na tela de configuração do projeto na Vercel (ou em Settings > Environment Variables), adicione:

    *   `DATABASE_URL`: URL de conexão com pooling (do Neon Console).
        *   Ex: `postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require&pgbouncer=true`
    *   `DIRECT_URL`: URL de conexão direta (do Neon Console).
        *   Ex: `postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`
    *   `NEXTAUTH_URL`: A URL da sua aplicação em produção.
        *   Ex: `https://defenz-todo.vercel.app` (ou seu domínio customizado).
    *   `NEXTAUTH_SECRET`: Uma string aleatória segura.
        *   Gere uma nova com: `openssl rand -base64 32` no terminal.
    *   `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: (Se usar login social).
    *   `GEMINI_API_KEY`: Sua chave da API do Google Gemini.

4.  **Deploy:**
    *   Clique em "Deploy".
    *   A Vercel irá construir o projeto e rodar as migrações do banco de dados automaticamente (devido ao script `postinstall` ou `vercel-build`).

## 2. Configuração do Banco de Dados (Neon)

1.  **Verificar Tabelas:**
    *   Acesse o Console do Neon.
    *   Vá em "Tables" e verifique se as tabelas (`User`, `Client`, `Opportunity`, etc.) foram criadas.
    *   Se não, rode localmente apontando para o banco de produção (cuidado!) ou use o console da Vercel para rodar `npx prisma migrate deploy`.

## 3. Configuração de Autenticação (Google Cloud)

Para que o login com Google funcione em produção:

1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  Vá em **APIs & Services > Credentials**.
3.  Edite o cliente OAuth 2.0 que você criou.
4.  Em **Authorized JavaScript origins**, adicione a URL da Vercel:
    *   `https://seu-projeto.vercel.app`
5.  Em **Authorized redirect URIs**, adicione o callback:
    *   `https://seu-projeto.vercel.app/api/auth/callback/google`
6.  Salve as alterações.

## 4. Onboarding de Usuários

Agora você pode convidar usuários para testar.

### Opção A: Cadastro Aberto (Padrão)
Se o seu sistema permite que qualquer um com conta Google entre:
1.  Envie o link `https://seu-projeto.vercel.app` para os usuários.
2.  Peça para eles clicarem em "Entrar com Google".
3.  O sistema criará a conta automaticamente.

### Opção B: Restringir Acesso (Se necessário)
Se você quiser aprovar usuários manualmente:
1.  Deixe os usuários se cadastrarem.
2.  Acesse o banco de dados (via Prisma Studio ou Neon Console).
3.  Na tabela `User`, você pode ter um campo `role` ou `active`. (Atualmente o padrão é `role: "user"`).

## 5. Roteiro de Teste para Usuários

Envie este roteiro para os usuários testarem as funcionalidades principais:

1.  **Login:**
    *   Acessar a aplicação e fazer login.
    *   Verificar se o perfil carrega corretamente.

2.  **CRM - Gestão de Clientes:**
    *   Criar um novo cliente (Empresa Teste).
    *   Editar informações do cliente.

3.  **CRM - Oportunidades:**
    *   Criar uma oportunidade para esse cliente.
    *   Mover a oportunidade entre as colunas do Kanban (Pipeline).
    *   Marcar como "Ganho" ou "Perdido".

4.  **Atividades:**
    *   Criar uma tarefa vinculada a um cliente.
    *   Concluir a tarefa.

5.  **Gráficos Executivos:**
    *   Acessar o menu **Executivo > Gráficos**.
    *   Verificar se os gráficos refletem os dados que acabaram de ser inseridos (pode haver um pequeno delay dependendo do cache, mas geralmente é instantâneo).

6.  **Importação Inteligente (Avançado):**
    *   Se tiverem uma planilha Excel de teste, tentar importar em **CRM > Importar**.

## 6. Monitoramento

*   **Logs da Vercel:** Em caso de erro 500, verifique a aba "Logs" no dashboard da Vercel.
*   **Neon Console:** Monitore o número de conexões e tamanho do banco.

---

**Dica:** Para o primeiro teste, recomendo você mesmo fazer o fluxo completo em uma aba anônima (como se fosse um usuário novo) antes de liberar para terceiros.
