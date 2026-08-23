# 🏛️ LegacyMark Platform: Blueprint de Arquitectura & Monorepo

Este documento define la topología de carpetas, estándares de código, desacoplamiento y matriz de microservicios para la plataforma corporativa LegacyMark.

---

## 🗺️ Estructura del Monorepo (Turborepo)

```text
agency-v1/
├── 📱 apps/
│   ├── web/                          # Frontend Principal Next.js 16 (App Router + Server Actions)
│   │   ├── app/                      # Rutas de página y API Routes
│   │   ├── modules/                  # Módulos por dominio de negocio (Feature-Driven)
│   │   │   ├── accounting/           # Contabilidad PUC, NIIF y Retenciones
│   │   │   ├── invoicing/            # Facturación Electrónica DIAN y POS
│   │   │   ├── crm/                  # Gestión de Clientes, Tratos y Kanban
│   │   │   └── marketing/            # Campañas y Optimizadores A/B
│   │   └── lib/                      # Clientes unificados y utilidades generales
│   └── coffee-web/                   # Sub-aplicación satélite especializada
│
├── 📦 packages/                      # Librerías transversales y contratos
│   ├── database/                     # Prisma ORM & Esquema PostgreSQL
│   ├── events/                       # Bus de Eventos Redis Streams
│   ├── observability/                # Métricas Prometheus & W3C TraceContext
│   ├── rbac/                         # Control de accesos y roles corporativos
│   ├── ui/                           # Sistema de diseño y componentes UI
│   └── outbox/                       # Patrón Outbox transaccional & DLQ
│
├── ⚙️ services/                      # Red de 22 Microservicios Autónomos
│   ├── auth-service/                 # Puerto 4001 (OAuth2, JWT, CMEK)
│   ├── crm-service/                  # Puerto 4002 (Contactos, Tratos, PII)
│   ├── finance-service/              # Puerto 4006 (DIAN, Contabilidad, Facturación)
│   ├── ai-engine/                    # Puerto 4008 (RAG Vectorial, Modelos IA)
│   └── api-gateway/                  # Puerto 8080 (Enrutador inverso)
│
└── 📜 scripts/                       # Suites de pruebas y verificación técnica
```

---

## 🔒 Reglas de Oro de Desacoplamiento

1. **Aislamiento de Docker:** `apps/web` no debe importar archivos fuente de `services/*` mediante rutas relativas (`../../services/...`). Toda comunicación se realiza vía HTTP (`@/lib/microservices-client.ts`) o paquetes `@agency/*`.
2. **Partida Doble NIIF:** Todo asiento contable debe satisfacer $\sum \text{Débitos} = \sum \text{Créditos}$.
3. **Estándar DIAN Anexo 1.9:** Toda factura electrónica debe generar su correspondiente CUFE SHA-384 y código QR oficial antes de su registro definitivo.
