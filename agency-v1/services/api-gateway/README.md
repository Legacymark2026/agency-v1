# 🌐 API Gateway & Service Mesh Proxy (v2.0)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![Port](https://img.shields.io/badge/Port-8080-purple.svg)](#environment-variables--config)

---

## 📌 Resumen Arquitectónico

El **`api-gateway`** es el punto de entrada unificado y proxy inverso resorte para la arquitectura de microservicios de **LegacyMark**. Enruta las peticiones de los clientes frontend, móviles e integraciones de terceros hacia los 22 microservices distribuidos.

Cuenta con descubrimiento dinámico de servicios respaldado por **Redis**, patrón **Circuit Breaker** resiliente con auto-recuperación y estado `HALF-OPEN`, limitación de tasa de peticiones (Rate Limiting), observabilidad distribuida con **OpenTelemetry**, y manejo uniforme de cabeceras de proxy (`x-forwarded-host`, `x-company-id`).

---

## ⚙️ Puertos y Rutas de Acceso

- **Puerto HTTP Interno**: `8080`
- **Ruta Proxy Principal**: `/api/*` y `/graphql`
- **Puertos Backend Enrutados**: `4001` a `4020`

---

## 💼 Responsabilidades y Funcionalidades

1. **Proxy Inverso Resiliente (`resilientProxy`)**: Enrutamiento transparente con reintentos y tolerancia a fallos.
2. **Circuit Breaker con Recuperación Rápida**: Cooldown configurable (3s), umbral de fallos (25) y 3 intentos de prueba en estado `HALF-OPEN`.
3. **Descubrimiento Dinámico de Servicios (`resolveServiceUrl`)**: Consulta dinámica de registros en Redis (`service_registry:<serviceName>`).
4. **Rate Limiting Defensivo**: Protección contra ataques de fuerza bruta y saturación de API.
5. **Normalización de Rutas Versionadas**: Redirección transparente de `/api/*` a `/api/v1/*`.

---

## 📡 Mapeo de Servicios Enrutados

| Prefijo de Ruta | Microservicio Destino | Puerto Interno |
|---|---|---|
| `/api/v1/auth` | `auth-service` | `4001` |
| `/api/crm`, `/api/leads`, `/api/deals` | `crm-service` | `4002` |
| `/api/workflows`, `/api/automation` | `automation-service` | `4003` |
| `/api/agents`, `/api/ai` | `ai-engine` | `4004` |
| `/api/inbox`, `/api/webhooks/whatsapp` | `inbox-service` | `4005` |
| `/api/invoices`, `/api/payments` | `finance-service` | `4006` |
| `/api/video` | `video-service` | `4007` |
| `/api/calendar`, `/api/scheduling` | `calendar-service` | `4008` |
| `/api/marketing`, `/api/email-blast`, `/api/analytics` | `marketing-service` | `4009` |
| `/api/integrations` | `integration-service` | `4010` |
| `/api/proposals` | `document-service` | `4011` |
| `/api/agent` | `agent-team-engine` | `4012` |
| `/api/analytics`, `/api/track` | `analytics-service` | `4013` |
| `/api/admin` | `admin-service` | `4014` |
| `/api/v1`, `/api/public` | `public-api-service` | `4015` |
| `/api/notifications` | `notification-service` | `4016` |
| `/api/employees`, `/api/hr` | `hr-service` | `4017` |
| `/api/projects`, `/api/tasks` | `project-service` | `4018` |
| `/r`, `/api/affiliates` | `affiliate-service` | `4019` |
| `/api/goldneez-rewards`, `/api/pos` | `goldneez-rewards-service` / `pos-service` | `4020` |

---

## 🛠️ Desarrollo Local y Pruebas

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo
npm run dev

# Probar la suite completa de infraestructura
npm run test:infrastructure
```
