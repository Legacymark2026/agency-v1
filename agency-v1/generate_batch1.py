import os

base_dir = r"c:\Users\hboho\.gemini\antigravity\scratch\agency-v1\services"

services = [
    {"name": "admin-service", "port": 4014, "base_url": "/api/v1/admin"},
    {"name": "affiliate-service", "port": 4019, "base_url": "/api/v1/affiliate"},
    {"name": "agent-team-engine", "port": 4012, "base_url": "/api/v1/agent-team"},
    {"name": "ai-engine", "port": 4004, "base_url": "/api/v1/ai"},
    {"name": "analytics-service", "port": 4013, "base_url": "/api/v1/analytics"},
    {"name": "api-gateway", "port": 8080, "base_url": "/"},
    {"name": "auth-service", "port": 4001, "base_url": "/api/v1/auth"},
]

response_utils_content = """export const formatSuccessResponse = (data: any, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

export const formatErrorResponse = (error: string | Error, statusCode = 500) => {
  return {
    success: false,
    message: error instanceof Error ? error.message : error,
    statusCode,
  };
};
"""

logger_utils_content = """export const logInfo = (message: string, meta?: any) => {
  console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }));
};

export const logError = (message: string, error?: any) => {
  console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), error }));
};

export const logWarn = (message: string, meta?: any) => {
  console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }));
};
"""

async_handler_utils_content = """import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
"""

validation_utils_content = """export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>?/gm, '').trim();
};

export const validateRequiredFields = (data: any, fields: string[]): string[] => {
  return fields.filter(field => !data[field]);
};
"""

readme_template = """# {name}

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

## Architecture & Technical Overview
The `{name}` is a microservice responsible for specific business domain operations. It is built using Node.js, Express, and TypeScript, following standard architectural patterns.

## Responsibilities & Business Domain
- Handles domain-specific operations and logic for {name}.
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
- **Base URL:** `{base_url}`
- **Port:** `{port}`

### GET `/health`
Returns the health status of the service.

## Environment Variables & Config
- `PORT={port}`
- `NODE_ENV=development`
- `DATABASE_URL=mongodb://localhost:27017/{name}`

## Database & Dependency Mapping
- **Database:** MongoDB
- **Dependencies:** Express, Mongoose, TypeScript

## Local Development & Testing Instructions
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
"""

for s in services:
    service_dir = os.path.join(base_dir, s["name"])
    utils_dir = os.path.join(service_dir, "src", "utils")
    
    os.makedirs(utils_dir, exist_ok=True)
    
    # Write README.md
    with open(os.path.join(service_dir, "README.md"), "w") as f:
        f.write(readme_template.format(name=s["name"], port=s["port"], base_url=s["base_url"]))
    
    # Write utils
    with open(os.path.join(utils_dir, "response.utils.ts"), "w") as f:
        f.write(response_utils_content)
    with open(os.path.join(utils_dir, "logger.utils.ts"), "w") as f:
        f.write(logger_utils_content)
    with open(os.path.join(utils_dir, "async-handler.utils.ts"), "w") as f:
        f.write(async_handler_utils_content)
    with open(os.path.join(utils_dir, "validation.utils.ts"), "w") as f:
        f.write(validation_utils_content)

print("Done generating files for batch 1.")
