import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // O gerador de PDF da Proposta usa binário nativo do Chromium e `require`
  // dinâmico. Empacotar isso quebra em runtime — e quebraria só EM PRODUÇÃO,
  // porque em dev o Next não faz o bundle do lado servidor da mesma forma.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],

  // ⚠️ `serverExternalPackages` sozinho NÃO basta, e a diferença custou um 500 em
  // produção. Ele impede o bundler de reescrever o pacote — e isso funcionou: o JS
  // do @sparticuz/chromium foi rastreado normalmente. Mas o Chromium de verdade são
  // 66 MB de `bin/*.br` que o pacote abre POR CAMINHO em runtime, nunca por
  // `require`. O rastreador do Next segue imports, então nunca os viu, e a função
  // subiu sem o navegador: "the input directory /var/task/.../bin does not exist".
  //
  // Só as rotas da proposta carregam esse peso — a chave é estreita de propósito.
  // Conferir depois de mexer aqui, SEM precisar deployar:
  //   grep -c "chromium.br" .next/server/app/api/portal/propostas/route.js.nft.json
  outputFileTracingIncludes: {
    '/api/portal/propostas/**': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
};

export default nextConfig;
