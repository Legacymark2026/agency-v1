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

    %% Clientes
    subgraph Clients ["📱 Clientes"]
        WEB["Web (Next.js)"]:::client
        APP["App Nativa"]:::client
    end

    %% Capa Edge (CDN)
    subgraph EdgeLayer ["⚡ Edge Layer (Vercel Edge)"]
        EDGE_AUTH["Edge Auth Middleware <br/>(Bloqueo en 5ms)"]:::edge
    end

    %% API Gateway (Apollo Supergraph)
    subgraph Gateway ["🌐 API Gateway & GraphQL Federation"]
        ROUTER["Apollo Server Supergraph <br/> (/graphql)"]:::supergraph
        REST["REST API Proxy <br/> (/api/*)"]:::supergraph
    end

    %% Microservicios (Service Mesh)
    subgraph Microservices ["⚙️ Microservicios / Subgrafos (Istio mTLS)"]
        AUTH["Auth Service"]:::microservice
        CRM["CRM Service (CQRS Worker)"]:::microservice
        FIN["Finance Service"]:::microservice
        AIE["AI Engine"]:::microservice
        MKT["Marketing Service"]:::microservice
    end

    %% Bus de Eventos
    REDIS_EVENTS{{"🚀 Event Bus <br/> (Redis Streams @agency/events)"}}:::eventbus

    %% Patrón CQRS (Bases de datos)
    subgraph CQRS ["💾 Patrón CQRS (Command Query Responsibility Segregation)"]
        
        %% Bases de Escritura (Write DBs)
        subgraph WriteDB ["Bases de Escritura (PostgreSQL)"]
            W_AUTH[("schema.auth.prisma")]:::db_write
            W_CRM[("schema.core.prisma")]:::db_write
            W_MEDIA[("schema.media.prisma")]:::db_write
            W_ANLY[("schema.analytics.prisma")]:::db_write
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
    
    ROUTER --> |Consultas GraphQL en Paralelo| Microservices
    REST --> |Proxy Tradicional| Microservices

    AUTH --> |Escritura| W_AUTH
    CRM --> |Escritura Lenta| W_CRM
    FIN --> |Escritura| W_CRM
    AIE --> |Escritura| W_MEDIA

    %% Event Sourcing Flow (El corazón del CQRS)
    W_CRM -.-> |Evento: lead.created| REDIS_EVENTS
    REDIS_EVENTS ===> |Sincronizador| R_REDIS

    %% Lecturas rápidas
    CRM --> |Lectura Sub-milisegundo (/api/cqrs/*)| R_REDIS
```

## Características Nivel V3 Implementadas

1. **GraphQL Supergraph (`/graphql`):** El `api-gateway` ya no solo redirige, sino que incluye un `ApolloServer`. Esto permite a Next.js pedir datos de Leads y Usuarios en una sola petición GraphQL, eliminando la sobrecarga de red.
2. **CQRS & Vistas Materializadas:** El `crm-service` divide el tráfico. Escribe los Leads en PostgreSQL de manera segura, pero las lecturas masivas las saca directamente desde una réplica en RAM (Redis) usando eventos asíncronos (`cqrs:leads:*`). Latencias inferiores a 1ms.
3. **Edge Computing Auth:** El archivo `middleware.ts` en Next.js aprovecha `next-auth` en modo Edge Runtime para bloquear peticiones maliciosas directamente desde los nodos CDN de Vercel a lo largo del mundo, antes de que el tráfico toque los microservicios.
4. **Bases de Datos Segregadas:** Mantenimiento de los 4 esquemas independientes de Prisma para aislamiento de dominios de negocio.