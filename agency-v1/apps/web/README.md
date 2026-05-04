# Web App

Aplicación principal de la agencia, construida con Next.js. Gestiona usuarios, deals, tareas Kanban, facturación, etc.

## Características

- CRM avanzado con secuencias y automatización.
- Kanban con auditoría y plantillas.
- Facturación con Stripe.
- RRHH: Nóminas, tiempos, gastos.
- Marketing: Campañas, analytics con IA.
- Integraciones: Email, social AI, notificaciones.

## Setup

1. Desde raíz: `npm install`
2. Configurar `.env` con variables de DB, auth, IA, etc.
3. `npx prisma generate`
4. `npm run dev`

## Estructura

- `actions/`: Server actions para lógica del backend.
- `app/`: Rutas y páginas con App Router.
- `components/`: Componentes UI.
- `lib/`: Utilidades (auth, db, etc.).
- `prisma/`: Esquema y migraciones DB.
- `types/`: Definiciones TypeScript.

## Testing

- Unitarios: `npm run test:unit`
- E2E: `npm run test:e2e`

## Despliegue

Configurado para Vercel. Ver `vercel.json` para rutas y headers.

## Notas

- Usa internacionalización con next-intl.
- Seguridad: CSP, Sentry para errores.
- IA: Embeddings vectoriales para búsqueda y recomendaciones.