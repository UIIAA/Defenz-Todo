#!/usr/bin/env node
/**
 * Defenz MCP Server — expõe o Kanban Defenz (Demandas) como tools MCP.
 *
 * Tools: list_demandas, create_demanda, update_demanda, move_demanda.
 * Auth: Bearer token (env DEFENZ_API_TOKEN) contra DEFENZ_API_URL.
 * Transporte: stdio (uso local via `claude mcp add`).
 *
 * A lógica fica em config.ts / client.ts / tools.ts / status.ts (todas testadas).
 * Este arquivo só faz o boot e conecta o transporte.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig } from './config.js'
import { DefenzClient } from './client.js'
import { registerTools } from './tools.js'

async function main(): Promise<void> {
  let config
  try {
    config = loadConfig(process.env)
  } catch (err) {
    console.error(`[defenz-mcp] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const client = new DefenzClient(config)
  const server = new McpServer({ name: 'defenz-mcp-server', version: '1.0.0' })
  registerTools(server, client)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stdout é o canal MCP — logs vão sempre para stderr.
  console.error(`[defenz-mcp] rodando via stdio (API: ${config.baseUrl})`)
}

main().catch((err) => {
  console.error('[defenz-mcp] erro fatal:', err)
  process.exit(1)
})
