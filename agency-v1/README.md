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

## Documentación y Desarrollo Reciente

### Rutas y Localización (next-intl)
- El middleware está configurado para omitir prefijos locales en rutas específicas como `/dashboard` y `/admin`. 
- Se agregaron bloques de control (`try/catch`) robustos en los layouts (`layout.tsx` principal y layout del dashboard) alrededor de las llamadas de contexto de `next-intl` para evitar caídas en rutas no localizadas.

### Serialización de Datos y React Server Components (RSC)
- Los componentes interactivos del cliente (como `AnalyticsOverview`) se declaran explícitamente con `'use client'` y reciben objetos de datos planos ya resueltos a través de Server Actions (`getAnalyticsOverview`) en lugar de pasar directamente promesas o consultas de base de datos complejas para cumplir con las restricciones de serialización de Next.js.

### Calidad y Estilo de Código (Linting)
- El linter (`npm run lint`) valida estrictamente las variables y parámetros de todos los paquetes. Por ejemplo, en `@agency/video-editor`, el método `checkSafeZones` fue refactorizado para calcular dinámicamente las zonas seguras de los textos usando los argumentos provistos, eliminando advertencias y errores de compilación.

### API Docs
- Documentación interactiva de la API pública en `/es/docs/api` (rutas para leads, contactos, deals, campañas, webhooks, motor de flujos de trabajo `workflows`, y callback de video render).
- Ver `apps/web/actions/` para server actions de Next.js.
- Esquema DB disponible en `apps/web/prisma/schema.prisma`.

## Licencia

Privado.