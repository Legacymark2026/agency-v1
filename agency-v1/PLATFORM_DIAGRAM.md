# Plataforma - Arquitectura Empresarial V7 (Ultimate Scale, Read Replicas & Hybrid Caching)

Este diagrama representa el estado actual de la plataforma (V7), incorporando **Replicación de Lectura de PostgreSQL**, **Caché Híbrida L1/L2**, **Procesamiento de Outbox en tiempo real (LISTEN/NOTIFY)**, **Limitación de Tasa (Rate Limiting) respaldada por Redis**, **Soporte HTTP/3 (QUIC)** y **Particionado Automático de Logs**.

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
    classDef cache fill:#a855f7,stroke:#6b21a8,color:white,stroke-width:2px;

    %% Clientes
    subgraph Clients ["📱 Clientes"]
        WEB["Web (Next.js)"]:::client
        APP["App Nativa"]:::client
    end

    %% Capa Edge / Proxy (Traefik V7)
    subgraph EdgeLayer ["⚡ Capa Edge & Gateway (Traefik V7)"]
        TRAEFIK["Traefik Load Balancer <br/> (HTTP/3 & HTTP/2 Secure)"]:::edge
    end

    %% API Gateway & Rate Limit
    subgraph Gateway ["🌐 API Gateway & Service Discovery"]
        ROUTER["Apollo Server composition <br/> (/graphql)"]:::supergraph
        REST["REST API Proxy <br/> (/api/*)"]:::supergraph
        RL_MIDDLEWARE["Redis Rate Limit Middleware <br/> (Max 100 req/min)"]:::cache
        DISCOVERY{{"Registry (Redis service_registry:*)"}}:::registry
    end

    %% Microservicios (Service Mesh)
    subgraph Microservices ["⚙️ Microservicios / Subgrafos (Istio mTLS)"]
        AUTH["Auth Service"]:::microservice
        CRM["CRM Service <br/> (Message Relay Worker)"]:::microservice
        FIN["Finance Service"]:::microservice
        AIE["AI Engine"]:::microservice
        ANALYTICS["Analytics Service <br/> (Auto Partition Manager)"]:::microservice
    end

    %% Capa de Connection Pooling (V7 Read/Write Splitting)
    subgraph Pooling ["🎯 Capa de Pooling (PgBouncer)"]
        PGBOUNCER_WRITE["PgBouncer Primary <br/> (Transaction Mode @pgbouncer:6432)"]:::pooling
        PGBOUNCER_READ["PgBouncer Replica <br/> (Transaction Mode @pgbouncer-replica:6433)"]:::pooling
    end

    %% Bus de Eventos (Zod Schema Validation)
    subgraph EventsBus ["🚀 Bus de Eventos & Contratos Zod"]
        REDIS_EVENTS{{"Event Bus <br/> (Redis Streams @agency/events)"}}:::eventbus
        ZOD_VALIDATION["Zod Schema Registry <br/> (Safe Payload Validation)"]:::edge
    end

    %% Patrón CQRS (Bases de datos V7)
    subgraph CQRS ["💾 Patrón CQRS & Transactional Outbox"]
        
        %% Bases de Escritura (Write DBs)
        subgraph WriteDB ["PostgreSQL Primario (Escrituras)"]
            W_AUTH[("schema.auth.prisma")]:::db_write
            W_CRM[("schema.core.prisma")]:::db_write
            W_OUTBOX[("tbl_outbox_events <br/> (notify_outbox_event trigger)")]:::db_write
        end

        %% Replicación
        REPLICATION_WAL{{"Streaming Replication <br/> (WAL Follower)"}}:::eventbus

        %% Bases de Lectura (Read DBs)
        subgraph ReadDB ["PostgreSQL Réplica (Lecturas)"]
            R_AUTH[("schema.auth.prisma (Read)")]:::db_read
            R_CRM[("schema.core.prisma (Read)")]:::db_read
            R_OUTBOX[("tbl_outbox_events (Read)")]:::db_read
        end

        %% Caché Híbrida L1/L2
        subgraph CacheLayer ["⚡ Capa de Caché Híbrida"]
            L1_CACHE["Caché L1 (Memory) <br/> (lru-cache en Microservicio)"]:::cache
            L2_CACHE["Caché L2 (Distributed) <br/> (Redis @agency/cache)"]:::cache
        end
    end

    %% Flujos de Red
    Clients --> |Peticiones HTTP/3| TRAEFIK
    TRAEFIK --> |Tráfico Balanceado| RL_MIDDLEWARE
    RL_MIDDLEWARE --> |Dentro del límite| ROUTER
    RL_MIDDLEWARE --> |Dentro del límite| REST
    
    ROUTER --> |1. Resolve Dynamic URLs| DISCOVERY
    REST --> |1. Resolve Dynamic URLs| DISCOVERY
    
    ROUTER --> |2. Resolvers composition| Microservices
    REST --> |2. Dynamic Proxy Routing| Microservices

    %% Conexiones de Escritura
    AUTH --> |Write Queries| PGBOUNCER_WRITE
    CRM --> |Write Queries| PGBOUNCER_WRITE
    FIN --> |Write Queries| PGBOUNCER_WRITE
    AIE --> |Write Queries| PGBOUNCER_WRITE
    ANALYTICS --> |Write Queries| PGBOUNCER_WRITE

    %% Conexiones de Lectura (Read Splitting)
    AUTH --> |Read Queries| PGBOUNCER_READ
    CRM --> |Read Queries| PGBOUNCER_READ
    FIN --> |Read Queries| PGBOUNCER_READ
    AIE --> |Read Queries| PGBOUNCER_READ
    ANALYTICS --> |Read Queries| PGBOUNCER_READ

    %% PgBouncer a Postgres
    PGBOUNCER_WRITE --> |Escrituras directas| WriteDB
    PGBOUNCER_READ --> |Lecturas balanceadas| ReadDB

    %% Replicación WAL
    WriteDB ===> REPLICATION_WAL ===> ReadDB

    %% Real-time Outbox con LISTEN/NOTIFY
    W_OUTBOX -.-> |1. PG NOTIFY| CRM
    CRM -.-> |2. direct connection @postgres:5432| WriteDB
    CRM -.-> |3. Publish Event| REDIS_EVENTS
    
    %% Event Validation & Cache
    REDIS_EVENTS ===> ZOD_VALIDATION
    ZOD_VALIDATION ===> |4. Sync Cache & Views| CacheLayer

    %% Acceso a Caché
    Microservices <--> |L1 Check -> L2 Fetch| CacheLayer
```

## Características Nivel V7 Implementadas

1. **División de Lectura/Escritura (Read-Write Splitting):** Despliegue de una réplica de base de datos (`postgres-replica`) y un pool de lectura dedicado (`pgbouncer-replica` en el puerto `6433`). Los queries de lectura (`findMany`, `findUnique`) se enrutan de forma segura a la réplica WAL follower, reduciendo drásticamente la carga de CPU y memoria en el primario.
2. **Procesamiento de Outbox Asíncrono por Eventos (LISTEN/NOTIFY):** Un trigger PostgreSQL en `tbl_outbox_events` emite notificaciones asíncronas inmediatas. El `Message Relay Worker` de `crm-service` se conecta directamente por sockets a PostgreSQL para escuchar (`LISTEN`), eliminando por completo el polling a base de datos y logrando una latencia de sincronización de eventos inferior a 100ms.
3. **Capa de Caché Híbrida L1/L2:** Helper `@agency/database` que expone una caché local L1 en memoria (mediante `lru-cache` para velocidad sub-milisegundo en llamadas calientes) y una caché distribuida L2 en red (mediante `Redis` para consistencia multiservicio). Soporta carga perezosa (lazy-loading) para máxima resiliencia en el arranque de microservicios.
4. **Soporte de Protocolo HTTP/3 (QUIC):** Configuración de Traefik exponiendo puertos UDP en el puerto `8443` para dar soporte nativo al protocolo de última generación HTTP/3, optimizando la latencia de red para clientes móviles o conexiones inestables.
5. **Mantenimiento y Particionamiento Automático de Tablas:** Rutina automatizada diaria en `analytics-service` que crea de forma proactiva particiones nativas por fecha en las tablas de logs (`tbl_user_activity_logs` y `tbl_usage_logs`), optimizando el rendimiento de los índices.
6. **Límite de Tasa en Gateway (Rate Limiting):** Middleware en el `api-gateway` respaldado por Redis para proteger los endpoints públicos contra ataques de denegación de servicio (DoS), limitando las llamadas concurrentes a un máximo de 100 peticiones por minuto por IP.
7. **Monitoreo de Queries con `pg_stat_statements`:** Habilitación del módulo de estadísticas de consulta nativo en PostgreSQL para auditoría detallada de tiempos de ejecución de queries y consumo de recursos.