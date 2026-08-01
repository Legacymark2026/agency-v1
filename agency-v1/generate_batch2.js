const fs = require('fs');
const path = require('path');

const services = [
  { name: 'automation-service', port: 4003, desc: 'Workflow and task automation service' },
  { name: 'calendar-service', port: 4008, desc: 'Scheduling and calendar management service' },
  { name: 'crm-service', port: 4002, desc: 'Customer Relationship Management service' },
  { name: 'document-service', port: 4011, desc: 'Document management and storage service' },
  { name: 'finance-service', port: 4006, desc: 'Billing, invoicing, and financial tracking service' },
  { name: 'goldneez-rewards-service', port: 4020, desc: 'Loyalty and rewards management service' },
  { name: 'hr-service', port: 4017, desc: 'Human Resources and employee management service' }
];

const basePath = 'c:\\Users\\hboho\\.gemini\\antigravity\\scratch\\agency-v1\\services';

const responseUtilsContent = `export const formatSuccessResponse = (data: any, message = 'Success') => ({
  success: true,
  message,
  data
});

export const formatErrorResponse = (error: string, statusCode = 500) => ({
  success: false,
  error,
  statusCode
});
`;

const loggerUtilsContent = `export const logInfo = (message: string, context?: any) => {
  console.log(\`[INFO] \${new Date().toISOString()} - \${message}\`, context || '');
};

export const logError = (message: string, error?: any) => {
  console.error(\`[ERROR] \${new Date().toISOString()} - \${message}\`, error || '');
};

export const logWarn = (message: string, context?: any) => {
  console.warn(\`[WARN] \${new Date().toISOString()} - \${message}\`, context || '');
};
`;

const asyncHandlerContent = `import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
`;

const validationUtilsContent = `export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

export const validateRequiredFields = (data: any, fields: string[]): string[] => {
  const missingFields: string[] = [];
  for (const field of fields) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }
  return missingFields;
};
`;

function getReadmeContent(service) {
  return \`# \${service.name}

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## Overview
\${service.desc} for the Agency Platform.

## Architecture
This microservice follows a standard layered architecture with Controllers, Services, and Repositories.

## Directory Structure
\`\`\`text
src/
├── controllers/
├── services/
├── routes/
├── models/
└── utils/
\`\`\`

## Endpoints Specification
- **Base URL:** \`/api/v1/\${service.name.replace('-service', '')}\`
- **Port:** \${service.port}

### REST API v1
- \`GET /\` - Health check
- \`GET /api/v1/\${service.name.replace('-service', '')}/status\` - Service status

## Environment Variables
\`\`\`env
PORT=\${service.port}
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/\${service.name.replace('-', '_')}
\`\`\`

## Local Development
1. \`npm install\`
2. \`npm run dev\`
\`;
}

services.forEach(service => {
  const serviceDir = path.join(basePath, service.name);
  const utilsDir = path.join(serviceDir, 'src', 'utils');

  // Create directories
  fs.mkdirSync(utilsDir, { recursive: true });

  // Create README
  fs.writeFileSync(path.join(serviceDir, 'README.md'), getReadmeContent(service));

  // Create utils files
  fs.writeFileSync(path.join(utilsDir, 'response.utils.ts'), responseUtilsContent);
  fs.writeFileSync(path.join(utilsDir, 'logger.utils.ts'), loggerUtilsContent);
  fs.writeFileSync(path.join(utilsDir, 'async-handler.utils.ts'), asyncHandlerContent);
  fs.writeFileSync(path.join(utilsDir, 'validation.utils.ts'), validationUtilsContent);
});

console.log('All files created successfully.');
