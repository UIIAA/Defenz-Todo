# Bundle "registrar e usar" — defenz-mcp

`defenz-mcp.mjs` é o servidor MCP **inteiro num único arquivo** (MCP SDK + zod embutidos).
Serve para distribuir a quem **não vai clonar o repo nem buildar** — basta Node ≥18, o arquivo e um token.

## Gerar/atualizar o bundle (quem tem o repo)

```bash
cd mcp/defenz-mcp
npm install        # 1ª vez
npm run build:bundle   # gera bundle/defenz-mcp.mjs
```

## Entregar a alguém (ex.: Leonardo)

1. **Gere o token DELE** (não o seu): Defenz → Configurações → Usuários → linha do usuário → 🔑 **API Tokens** → gerar → copiar o plaintext (mostrado 1× só). O token herda o escopo do dono (empresas/equipes/role) — tenant isolation no servidor.
2. **Mande os 2 itens** por canal seguro: o arquivo `defenz-mcp.mjs` e o token.

## Ele registra (só Node, sem install/build)

**Opção A — comando:**
```bash
claude mcp add defenz \
  --env DEFENZ_API_URL=https://defenz-todo.vercel.app \
  --env DEFENZ_API_TOKEN=defz_xxxxxxxx... \
  -- node /caminho/absoluto/defenz-mcp.mjs
```

**Opção B — editar o JSON do Claude** (`~/.claude.json`, dentro do projeto desejado em `projects[...]` ou global em `mcpServers`):
```json
{
  "mcpServers": {
    "defenz": {
      "command": "node",
      "args": ["/caminho/absoluto/defenz-mcp.mjs"],
      "env": {
        "DEFENZ_API_URL": "https://defenz-todo.vercel.app",
        "DEFENZ_API_TOKEN": "defz_xxxxxxxx..."
      }
    }
  }
}
```

3. **Reinicia o Claude Code** → as 8 tools aparecem (list/create/update/move_demanda, add/complete/list_subtask, list_user_tasks).

## Notas
- O `.mjs` não vai no git (é regenerável). Distribua o arquivo direto.
- Revogar o token na UI corta o acesso na hora.
- Mudou o código do MCP? Rode `npm run build:bundle` e reenvie o `.mjs`.
