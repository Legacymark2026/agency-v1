# 🚀 Marketing Service (Mass Email & Campaign Platform v2.0)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![Port](https://img.shields.io/badge/Port-4009-teal.svg)](#environment-variables--config)

---

## 📌 Resumen Arquitectónico

El **`marketing-service`** es el microservicio encargado de la gestión integral de campañas de correo electrónico masivo, secuencias de goteo (Drip Campaigns), automatizaciones por eventos, validación de correos en tiempo real, monitoreo de reputación de dominio, segmentación dinámica de audiencias y auditoría de privacidad conforme a **GDPR / CAN-SPAM**.

Forma parte de la arquitectura distribuida de **LegacyMark**, comunicándose a través del **API Gateway** (`port 8080`), registrando eventos outbox en la base de datos y manteniendo observabilidad con **OpenTelemetry** y **Jaeger**.

---

## ⚙️ Puertos y Rutas de Acceso

- **Puerto HTTP Interno**: `4009`
- **Ruta Base Versionada (v1)**: `/api/v1/email-blast`, `/api/v1/analytics`, `/api/v1/sequences`, etc.
- **Ruta Proxy API Gateway**: `https://app.legacymarksas.com/api/email-blast`

---

## 💼 Responsabilidades y Dominio de Negocio

1. **Gestión de Campañas Masivas**: Creación, edición, clonación, programación y despacho masivo por lotes.
2. **Analítica & Reputación**: Métricas en tiempo real de aperturas, clics (CTR), rebotes, desuscripciones y **Sender Score (0-100)** con diagnóstico SPF/DKIM/DMARC y listas negras DNS.
3. **Secuencias de Goteo (Drip Automations)**: Flujos automatizados multietapa con tiempos de retardo configurables.
4. **Validación de Correos en Tiempo Real**: Verificación de sintaxis, consulta de registros MX en DNS y detección de correos temporales/desechables.
5. **Segmentación Dinámica de Audiencias**: Reglas dinámicas evaluables contra comportamiento de apertura e interacción.
6. **Galería de Plantillas**: Plantillas HTML responsivas prediseñadas con vista previa y clonación rápida.
7. **Webhooks e Integraciones**: Despacho de eventos firmados con HMAC-SHA256 (`email.sent`, `email.opened`, `email.clicked`).
8. **Cumplimiento GDPR / CAN-SPAM**: Auditoría de consentimiento (Opt-In), derecho al olvido (data erasure) y centro de preferencias.

---

## 📂 Estructura de Directorios

```text
services/marketing-service/
├── src/
│   ├── controllers/            # Controladores Express (marketing.controller.ts)
│   ├── middlewares/            # Middlewares de error, idempotencia y límites (marketing.middleware.ts)
│   ├── routes/                 # Definición de rutas Express (marketing.routes.ts, enterprise.routes.ts)
│   ├── services/               # Servicios de lógica de negocio (26 servicios enterprise)
│   │   ├── analytics.service.ts
│   │   ├── compliance.service.ts
│   │   ├── domain-reputation.service.ts
│   │   ├── drip-sequence.service.ts
│   │   ├── email-validator.service.ts
│   │   ├── integration-webhook.service.ts
│   │   ├── queue.service.ts
│   │   ├── report-export.service.ts
│   │   ├── segment-builder.service.ts
│   │   └── template-gallery.service.ts
│   └── utils/                  # Utilidades compartidas del microservicio
│       ├── async-handler.utils.ts
│       ├── logger.utils.ts
│       ├── response.utils.ts
│       └── validation.utils.ts
├── Dockerfile                  # Construcción multi-stage de producción
├── package.json
└── tsconfig.json
```

---

## 📡 Especificación de Endpoints REST (v1)

### ✉️ Campañas y Envíos (`/api/v1/email-blast`)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/email-blast` | Lista todas las campañas de la empresa |
| `POST` | `/api/v1/email-blast` | Crea una nueva campaña borrador |
| `GET` | `/api/v1/email-blast/:id` | Obtiene el detalle y métricas de una campaña |
| `POST` | `/api/v1/email-blast/:id/send` | Inicia el despacho asíncrono en segundo plano |
| `POST` | `/api/v1/email-blast/:id/retry` | Reintenta el envío a contactos fallidos |
| `DELETE` | `/api/v1/email-blast/:id` | Elimina una campaña |

### 📈 Analítica y Salud (`/api/v1/analytics` & `/api/v1/domain-reputation`)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/analytics/dashboard` | Obtiene estadísticas globales de la cuenta |
| `GET` | `/api/v1/analytics/campaign/:id` | Métricas detalladas de una campaña |
| `GET` | `/api/v1/domain-reputation/sender-score` | Calcula el Sender Score (0-100) del dominio |
| `GET` | `/api/v1/domain-reputation/check` | Verifica registros SPF, DKIM, DMARC y Blacklists |

---

## 🔐 Variables de Entorno y Configuración

```env
PORT=4009
NODE_ENV=production
PUBLIC_APP_URL=https://app.legacymarksas.com
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/legacymark_media?connection_limit=5&pgbouncer=true&sslmode=require
CORE_DATABASE_URL=postgresql://user:pass@pgbouncer:6432/legacymark_core?connection_limit=5&pgbouncer=true&sslmode=require
AUTH_DATABASE_URL=postgresql://user:pass@pgbouncer:6432/legacymark_auth?connection_limit=5&pgbouncer=true&sslmode=require
ANALYTICS_DATABASE_URL=postgresql://user:pass@pgbouncer:6432/legacymark_analytics?connection_limit=5&pgbouncer=true&sslmode=require
REDIS_URL=redis://redis:6379
```

---

## 🛠️ Desarrollo Local y Pruebas

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo con hot reload
npm run dev

# Ejecutar suite de pruebas de infraestructura
npm run test:infrastructure
```
