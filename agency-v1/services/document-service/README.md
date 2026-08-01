# document-service

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## Overview
Document management and storage service for the Agency Platform.

## Architecture
This microservice follows a standard layered architecture with Controllers, Services, and Repositories.

## Directory Structure
```text
src/
├── controllers/
├── services/
├── routes/
├── models/
└── utils/
```

## Endpoints Specification
- **Base URL:** `/api/v1/document`
- **Port:** 4011

### REST API v1
- `GET /` - Health check
- `GET /api/v1/document/status` - Service status

## Environment Variables
```env
PORT=4011
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/document_service
```

## Local Development
1. `npm install`
2. `npm run dev`
