# Agency v1

Un monorepo para herramientas de agencia basado en Next.js, diseñado para gestionar CRM, Kanban, facturación, RRHH, marketing y más. Incluye integraciones de IA avanzadas para automatización y análisis.

## Arquitectura

- **apps/web**: Aplicación principal Next.js con App Router, server actions y Prisma.
- **packages/rbac**: Control de acceso basado en roles.
- **packages/ui**: Componentes UI compartidos con Radix UI y Tailwind CSS.
- **portfolio**: Sitios estáticos de ejemplo.

## Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Prisma ORM, PostgreSQL (con extensión vector para IA).
- **Autenticación**: NextAuth con MFA y rate limiting.
- **IA**: Integraciones con Gemini, OpenAI para embeddings y automatización.
- **Testing**: Vitest (unitarios), Cypress (E2E).
- **Despliegue**: Vercel con optimización de paquetes.

## Setup

1. Instalar dependencias: `npm install`
2. Configurar DB: Copiar `.env.example` a `.env` y configurar PostgreSQL.
3. Migrar DB: `npx prisma migrate dev`
4. Ejecutar: `npm run dev` (usa Turbo para monorepo).

## Scripts

- `npm run build`: Construir todo el monorepo.
- `npm run test`: Ejecutar tests con Vitest.
- `npm run lint`: Verificar linting.
- `npm run db:seed`: Sembrar datos de ejemplo.

## Contribución

- Seguir ESLint y TypeScript estrictos.
- Cobertura de tests >80%.
- Usar conventional commits.

## API Docs

Ver `apps/web/actions/` para server actions. Esquema DB en `apps/web/prisma/schema.prisma`.

## Licencia

Privado.