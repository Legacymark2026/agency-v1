# pos-service

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## Architecture & Technical Overview
This is the **pos-service**, built as part of our microservices architecture. It uses Node.js, Express, and TypeScript.
It runs on port **4020**.

## Responsibilities & Business Domain
Point of Sale operations and inventory management.

## Directory Structure
```
pos-service/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│       ├── async-handler.utils.ts
│       ├── logger.utils.ts
│       ├── response.utils.ts
│       └── validation.utils.ts
├── package.json
└── tsconfig.json
```

## Endpoints Specification (REST API v1)
Base URL: `/api/v1/pos`

- `GET /` - Health check
- `GET /status` - Service status

## Environment Variables & Config
- `PORT` - Service port (default: 4020)
- `NODE_ENV` - Environment
- `DATABASE_URL` - Database connection string

## Database & Dependency Mapping
- Database: PostgreSQL
- Event Bus: RabbitMQ/Kafka

## Local Development & Testing Instructions
1. `npm install`
2. `npm run dev`
3. `npm test`
