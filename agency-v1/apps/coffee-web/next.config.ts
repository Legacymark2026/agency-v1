import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Forzar que @prisma/client no sea bundleado (debe ser un módulo externo del servidor)
  serverExternalPackages: ["@prisma/client"],
  transpilePackages: ["gsap"],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ],
  },
};

export default withNextIntl(nextConfig);
