# notification-service

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## Architecture & Technical Overview
This is the **notification-service**, built as part of our microservices architecture. It uses Node.js, Express, and TypeScript.
It runs on port **4016**.

## Responsibilities & Business Domain
Handles real-time notifications, push, email, and SMS alerts.

## Directory Structure
```
notification-service/
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
Base URL: `/api/v1/notifications`

- `GET /` - Health check
- `GET /status` - Service status

## Environment Variables & Config
- `PORT` - Service port (default: 4016)
- `NODE_ENV` - Environment
- `DATABASE_URL` - Database connection string

## Database & Dependency Mapping
- Database: PostgreSQL
- Event Bus: RabbitMQ/Kafka

## Local Development & Testing Instructions
1. `npm install`
2. `npm run dev`
3. `npm test`
