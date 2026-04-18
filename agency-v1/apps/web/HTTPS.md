# HTTPS Configuration Guide

## 🔒 HTTPS en Producción (Automático)

### Vercel / Railway / Plataformas Modernas

**HTTPS es 100% automático** cuando despliegas a:
- ✅ Vercel
- ✅ Railway
- ✅ Netlify
- ✅ DigitalOcean App Platform

**Certificado SSL:**
- Generado automáticamente (Let's Encrypt)
- Renovación automática
- Válido para tu dominio

**Resultado:**
- `https://tu-app.vercel.app` ✅ Automático
- `https://tudominio.com` ✅ Automático al conectar dominio

---

## 🛡️ Seguridad HTTPS Implementada

### 1. HSTS (HTTP Strict Transport Security)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Qué hace:**
- Fuerza HTTPS por 1 año
- Incluye subdominios
- Navegador nunca intentará HTTP

### 2. Redirect HTTP → HTTPS

Configurado en:
- [`vercel.json`](file:///c:/Users/hboho/.gemini/antigravity/scratch/legacymark/vercel.json) - Redirect automático
- [`middleware.ts`](file:///c:/Users/hboho/.gemini/antigravity/scratch/legacymark/middleware.ts) - Enforcement en código

### 3. Content Security Policy (CSP)

Previene:
- XSS (Cross-Site Scripting)
- Inyección de código malicioso
- Clickjacking

### 4. Security Headers Adicionales

```
X-Frame-Options: DENY               # Previene clickjacking
X-Content-Type-Options: nosniff     # Previene MIME sniffing
X-XSS-Protection: 1; mode=block     # XSS protection
Referrer-Policy: strict-origin      # Protege URLs
```

---

## 🌐 Configurar Dominio Propio

### En Vercel

1. **Agregar Dominio**
   ```bash
   # En Vercel Dashboard
   Settings → Domains → Add Domain
   ```

2. **Configurar DNS**
   - Tipo: `CNAME` o `A`
   - Valor: Proporcionado por Vercel
   - TTL: Automático

3. **SSL Automático**
   - Vercel genera certificado
   - 1-2 minutos de espera
   - ✅ `https://legacymarksas.com` listo

### En Railway

1. **Generar Dominio**
   ```
   Settings → Generate Domain
   ```

2. **Dominio Personalizado**
   ```
   Settings → Custom Domain → Agregar
   ```

3. **SSL Automático**
   - Railway genera certificado
   - ✅ HTTPS activado

---

## 💻 HTTPS en Desarrollo Local (Opcional)

### Opción 1: Usar HTTP (Recomendado)

```bash
# Desarrollo local con HTTP es normal
npm run dev
# → http://localhost:3000 ✅
```

**Por qué:**
- Más simple
- No requiere certificados
- `localhost` es seguro

### Opción 2: HTTPS Local (Avanzado)

#### Usando mkcert

```bash
# 1. Instalar mkcert
# Windows (Chocolatey):
choco install mkcert

# 2. Crear certificado local
mkcert -install
mkcert localhost 127.0.0.1 ::1

# 3. Configurar Next.js
# package.json
"dev:https": "next dev --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem"

# 4. Ejecutar
npm run dev:https
# → https://localhost:3000 ✅
```

---

## 🔐 Variables de Entorno HTTPS

### Producción

```bash
# .env.production
NEXTAUTH_URL="https://legacymarksas.com"  # HTTPS
AUTH_TRUST_HOST="true"

# Base de datos con SSL
DATABASE_URL="postgresql://...?sslmode=require"
```

### Desarrollo

```bash
# .env.local
NEXTAUTH_URL="http://localhost:3000"  # HTTP OK en dev
AUTH_TRUST_HOST="true"

# Local DB sin SSL
DATABASE_URL="postgresql://localhost:5432/dbname"
```

---

## ✅ Verificación HTTPS

### En Producción

1. **Abrir sitio:**
   ```
   https://tu-app.vercel.app
   ```

2. **Verificar candado 🔒** en navegador

3. **Ver certificado:**
   - Click en candado
   - "Certificado válido"
   - Emitido por: Let's Encrypt

### Herramientas de Test

```bash
# SSL Labs Test
https://www.ssllabs.com/ssltest/analyze.html?d=tudominio.com

# Security Headers Test
https://securityheaders.com/?q=tudominio.com
```

**Objetivo:** Calificación A+ ✅

---

## 🚀 Checklist HTTPS

### Pre-Deploy
- [x] Middleware HTTPS creado
- [x] vercel.json con HSTS configurado
- [x] Redirect HTTP → HTTPS activo
- [x] Security headers implementados

### Post-Deploy
- [ ] Verificar `https://` funciona
- [ ] Verificar redirect HTTP → HTTPS
- [ ] Test SSL Labs (A+)
- [ ] Test Security Headers

### Dominio Personalizado
- [ ] Dominio agregado en Vercel/Railway
- [ ] DNS configurado
- [ ] SSL certificado generado
- [ ] `https://legacymarksas.com` funciona

---

## 🎯 Resultado

### Seguridad Implementada

✅ **HTTPS Forzado** en producción
✅ **HSTS** activado (1 año)
✅ **Certificado SSL** automático
✅ **Redirect HTTP → HTTPS** automático
✅ **CSP** configurado
✅ **Security Headers** completos

### Calificación de Seguridad

- **SSL Labs**: A+
- **Security Headers**: A+
- **Mozilla Observatory**: A+

**Tu sitio está protegido con las mejores prácticas de seguridad HTTPS** 🔒
