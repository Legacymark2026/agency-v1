# Plataforma - Arquitectura Empresarial V6 (Ultimate Scale & Database Pooling)

Este diagrama representa el estado actual de la plataforma (V6), incorporando **GraphQL Federation (Supergraph)**, patrón **CQRS** (Separación de comandos y consultas), **Edge Computing** y la optimización de conexiones a base de datos mediante **PgBouncer**.

```mermaid
graph TD
    %% Estilos
    classDef client fill:#3b82f6,stroke:#1e40af,color:white,stroke-width:2px;
    classDef edge fill:#14b8a6,stroke:#0f766e,color:white,stroke-width:2px;
    classDef supergraph fill:#8b5cf6,stroke:#5b21b6,color:white,stroke-width:2px;
    classDef microservice fill:#334155,stroke:#1e293b,color:white;
    classDef eventbus fill:#ef4444,stroke:#991b1b,color:white,stroke-width:3px;
    classDef db_write fill:#f59e0b,stroke:#b45309,color:white;
    classDef db_read fill:#10b981,stroke:#047857,color:white;
    classDef datalake fill:#0ea5e9,stroke:#0369a1,color:white;
    classDef registry fill:#06b6d4,stroke:#0891b2,color:white,stroke-width:2px;
    classDef pooling fill:#ec4899,stroke:#be185d,color:white,stroke-width:2px;

    %% Clientes
    subgraph Clients ["📱 Clientes"]
        WEB["Web (Next.js)"]:::client
        APP["App Nativa"]:::client
    end

    %% Capa Edge (CDN)
    subgraph EdgeLayer ["⚡ Edge Layer (Vercel Edge)"]
        EDGE_AUTH["Edge Auth Middleware <br/>(Bloqueo en 5ms)"]:::edge
    end

    %% API Gateway (GraphQL Composition & Dynamic Registry)
    subgraph Gateway ["🌐 API Gateway & Service Discovery"]
        ROUTER["Apollo Server composition <br/> (/graphql)"]:::supergraph
        REST["REST API Proxy <br/> (/api/*)"]:::supergraph
        DISCOVERY{{"Registry (Redis service_registry:*)"}}:::registry
    end

    %% Microservicios (Service Mesh)
    subgraph Microservices ["⚙️ Microservicios / Subgrafos (Istio mTLS)"]
        AUTH["Auth Service"]:::microservice
        CRM["CRM Service"]:::microservice
        FIN["Finance Service"]:::microservice
        AIE["AI Engine"]:::microservice
        MKT["Marketing Service"]:::microservice
    end

    %% Capa de Connection Pooling (V6)
    subgraph Pooling ["🎯 Capa de Pooling (PgBouncer)"]
        PGBOUNCER["PgBouncer <br/> (Transaction Mode @pgbouncer:6432)"]:::pooling
    end

    %% Bus de Eventos (Zod Schema Validation)
    subgraph EventsBus ["🚀 Bus de Eventos & Contratos Zod"]
        REDIS_EVENTS{{"Event Bus <br/> (Redis Streams @agency/events)"}}:::eventbus
        ZOD_VALIDATION["Zod Schema Registry <br/> (Safe Payload Validation)"]:::edge
    end

    %% Patrón CQRS (Bases de datos)
    subgraph CQRS ["💾 Patrón CQRS & Transactional Outbox"]
        
        %% Bases de Escritura (Write DBs)
        subgraph WriteDB ["Bases de Escritura (PostgreSQL)"]
            W_AUTH[("schema.auth.prisma")]:::db_write
            W_CRM[("schema.core.prisma")]:::db_write
            W_MEDIA[("schema.media.prisma")]:::db_write
            W_OUTBOX[("tbl_outbox_events")]:::db_write
        end

        %% Copias de seguridad (Directas a Postgres)
        BACKUP["Postgres Backup <br/> (Direct @postgres:5432)"]:::microservice

        %% Bases de Lectura (Read DBs)
        subgraph ReadDB ["Bases de Lectura en Memoria (Queries)"]
            R_REDIS[("Redis <br/> (Vistas Materializadas CQRS)")]:::db_read
        end
    end

    %% Flujo
    Clients --> |Peticiones| EdgeLayer
    EdgeLayer --> |Tráfico Validado| ROUTER
    EdgeLayer --> |Tráfico Validado| REST
    
    ROUTER --> |1. Resolve Dynamic URLs| DISCOVERY
    REST --> |1. Resolve Dynamic URLs| DISCOVERY
    
    ROUTER --> |2. Resolvers composition (Parallel)| Microservices
    REST --> |2. Dynamic Proxy Routing| Microservices

    %% Conexiones de Microservicios a PgBouncer
    AUTH --> |Conexión Pool| PGBOUNCER
    CRM --> |Conexión Pool| PGBOUNCER
    FIN --> |Conexión Pool| PGBOUNCER
    AIE --> |Conexión Pool| PGBOUNCER
    MKT --> |Conexión Pool| PGBOUNCER

    %% Conexión de PgBouncer a las bases reales
    PGBOUNCER --> |Escritura/Lectura| W_AUTH
    PGBOUNCER --> |1. Write transaction| W_CRM
    PGBOUNCER --> |1. Write transaction| W_OUTBOX
    PGBOUNCER --> |Escritura/Lectura| W_MEDIA

    %% Postgres Backup se conecta directamente a la DB física
    BACKUP --> |Direct Dump| WriteDB
    
    %% Outbox Message Relay
    W_OUTBOX -.-> |2. Poll PENDING/FAILED| PGBOUNCER
    PGBOUNCER -.-> |Poll Result| CRM
    CRM -.-> |3. Publish Event| REDIS_EVENTS
    
    %% Event Validation
    REDIS_EVENTS ===> ZOD_VALIDATION
    ZOD_VALIDATION ===> |4. Sync Materialized View| R_REDIS

    %% Lecturas rápidas
    CRM --> |Lectura Sub-milisegundo (/api/cqrs/*)| R_REDIS
```

## Características Nivel V6 Implementadas

1. **Pooling de Conexiones con PgBouncer:** Integración de un intermediario de base de datos que agrupa y optimiza las peticiones de los 21 microservicios activos hacia PostgreSQL. Utiliza el modo de transacción (`POOL_MODE: transaction`) permitiendo un soporte de hasta 500 conexiones de clientes virtuales y liberando drásticamente el consumo de memoria en PostgreSQL.
2. **Autenticación SCRAM-SHA-256 Transparente:** PgBouncer utiliza el esquema criptográfico SCRAM de PostgreSQL mediante la sincronización del archivo `userlist.txt` conteniendo los hashes SCRAM correspondientes, garantizando máxima seguridad en el handshake sin rebajar la seguridad a MD5 o texto plano.
3. **GraphQL composition real (`/graphql`):** El `api-gateway` incorpora resolutores dinámicos basados en composición HTTP que consultan los microservicios de `auth-service` y `crm-service` de forma paralela y unificada.
4. **Service Discovery Dinámico:** Las rutas de API Gateway resuelven dinámicamente la localización física de los microservicios consultando un registro dinámico en Redis (`service_registry:<serviceName>`).
5. **Registro de Esquemas de Eventos con Zod:** Toda publicación al Bus de Eventos (`@agency/events`) pasa por un registro de esquemas Zod en tiempo de ejecución.
6. **Patrón Transactional Outbox (Garantía de Entrega):** El servicio de CRM escribe los registros operativos y los eventos de outbox correspondientes de manera atómica bajo una transacción única en PostgreSQL (tabla `tbl_outbox_events`). Un worker asíncrono procesa y publica los eventos pendientes hacia Redis Streams.
7. **Trazabilidad Distribuida con Correlation IDs:** Propagación consistente de identificadores de correlación en las cabeceras HTTP, logs de base de datos y eventos de Redis Streams.