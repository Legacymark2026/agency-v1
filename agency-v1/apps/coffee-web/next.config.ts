import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Variables de entorno del servidor (accesibles en Server Actions y API routes)
  env: {
    GOLDNEEZ_DB_URL: process.env.GOLDNEEZ_DB_URL || process.env.DATABASE_URL || "",
    JWT_SECRET: process.env.JWT_SECRET || "goldneez-coffee-exclusive-jwt-secret-2026",
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  },
  // Forzar que @prisma/client no sea bundleado (debe ser un módulo externo del servidor)
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'gsap',
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
