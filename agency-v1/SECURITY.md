# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing [security@yourcompany.com].

**Please do NOT open a public GitHub issue.**

We take all security vulnerabilities seriously and will respond within 48 hours.

## Security Best Practices

This project follows these security practices:

### 1. Environment Variables
- Never commit `.env` files
- Use strong, randomly generated secrets
- Rotate secrets regularly

### 2. Database
- Use SSL/TLS connections (`sslmode=require`)
- Apply migrations in staging before production
- Regular automated backups

### 3. Authentication
- JWT tokens with secure secrets
- Session management via NextAuth.js
- Rate limiting on auth endpoints

### 4. API Security
- Input validation on all endpoints
- CORS properly configured
- Rate limiting enabled

### 5. Dependencies
- Regular updates via `npm audit`
- Automated Dependabot alerts
- Review all dependency changes

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Headers

The following security headers are configured:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

See `vercel.json` for full configuration.
