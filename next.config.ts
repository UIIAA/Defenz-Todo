import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // O gerador de PDF da Proposta usa binário nativo do Chromium e `require`
  // dinâmico. Empacotar isso quebra em runtime — e quebraria só EM PRODUÇÃO,
  // porque em dev o Next não faz o bundle do lado servidor da mesma forma.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
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
