# Plataforma - Arquitectura Empresarial V3 (Ultimate Scale)

Este diagrama representa el estado más avanzado de la plataforma (V3), incorporando **GraphQL Federation (Supergraph)**, patrón **CQRS** (Separación de comandos y consultas) y **Edge Computing**.

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
            
            %% Outbox Table
            W_OUTBOX[("tbl_outbox_events")]:::db_write
        end

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

    AUTH --> |Escritura| W_AUTH
    CRM --> |1. Write transaction| W_CRM
    CRM --> |1. Write transaction| W_OUTBOX
    
    %% Outbox Message Relay
    W_OUTBOX -.-> |2. Poll PENDING/FAILED| CRM
    CRM -.-> |3. Publish Event| REDIS_EVENTS
    
    %% Event Validation
    REDIS_EVENTS ===> ZOD_VALIDATION
    ZOD_VALIDATION ===> |4. Sync Materialized View| R_REDIS

    %% Lecturas rápidas
    CRM --> |Lectura Sub-milisegundo (/api/cqrs/*)| R_REDIS
```

## Características Nivel V3 Implementadas

1. **GraphQL composition real (`/graphql`):** El `api-gateway` ya no usa un stub de datos estáticos. Incorpora resolutores reales basados en composición HTTP que consultan a los microservicios de `auth-service` y `crm-service` de forma paralela y unificada, decodificando los claims del usuario y propagando los correlation IDs en las cabeceras.
2. **Service Discovery Dinámico:** Las rutas del proxy y los resolvers de GraphQL de `api-gateway` resuelven la localización física de los 21 microservicios consultando dinámicamente un registro en Redis (`service_registry:<serviceName>`), permitiendo escalar instancias y redireccionar tráfico en caliente sin reiniciar el gateway.
3. **Registro de Esquemas de Eventos con Zod:** Toda publicación al Bus de Eventos (`@agency/events`) pasa por un registro de esquemas Zod en tiempo de ejecución. Esto garantiza contratos estrictos de datos entre microservicios, previniendo payloads corruptos y ofreciendo tipado TypeScript fuerte en tiempo de compilación.
4. **Patrón Transactional Outbox (Garantía de Entrega):** El servicio de CRM no publica eventos directamente en Redis de manera desorganizada. Escribe el Lead y el evento de negocio `lead.created` dentro de una transacción atómica de PostgreSQL en la tabla `tbl_outbox_events`. Un worker en segundo plano (`MessageRelayWorker`) procesa los eventos pendientes en lotes de forma asíncrona hacia Redis Streams, logrando entrega at-least-once y tolerancia a caídas.
5. **Trazabilidad Distribuida con Correlation IDs:** Propagación de identificadores de correlación en las peticiones HTTP y en el bus de eventos de Redis. Los logs estructurados del gateway y microservicios incluyen el prefijo `[Trace: <CorrelationId>]`, facilitando el rastreo end-to-end de flujos de datos.