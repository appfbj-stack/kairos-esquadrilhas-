/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  transpilePackages: ['three'],

  // Headers anti-cache para evitar o "Failed to find Server Action" apos deploys.
  // O problema: o Next.js 14 gera hash diferente para cada server action a cada build.
  // Se o usuario tem a pagina antiga em cache e clica num botao, o hash nao bate.
  // Solucao: forcar no-store em todas as rotas HTML, deixando cache apenas para assets estaticos.
  async headers() {
    return [
      {
        // Aplica a todas as rotas EXCETO assets estaticos, API de auth, e imagens
        source: '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|api/auth|api/files).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
      // Assets estaticos do Next podem ficar em cache (1 ano)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
