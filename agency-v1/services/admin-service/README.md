# admin-service

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

## Architecture & Technical Overview
The `admin-service` is a microservice responsible for specific business domain operations. It is built using Node.js, Express, and TypeScript, following standard architectural patterns.

## Responsibilities & Business Domain
- Handles domain-specific operations and logic for admin-service.
- Exposes RESTful endpoints for internal and external consumption.
- Integrates with database and necessary third-party services.

## Directory Structure
```
.
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│       ├── response.utils.ts
│       ├── logger.utils.ts
│       ├── async-handler.utils.ts
│       └── validation.utils.ts
├── package.json
└── README.md
```

## Endpoints Specification (REST API v1)
- **Base URL:** `/api/v1/admin`
- **Port:** `4014`

### GET `/health`
Returns the health status of the service.

## Environment Variables & Config
- `PORT=4014`
- `NODE_ENV=development`
- `DATABASE_URL=mongodb://localhost:27017/admin-service`

## Database & Dependency Mapping
- **Database:** MongoDB
- **Dependencies:** Express, Mongoose, TypeScript

## Local Development & Testing Instructions
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
