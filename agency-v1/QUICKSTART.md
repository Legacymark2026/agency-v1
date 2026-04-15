# Quick Start - Deployment

## 🚀 Setup Rápido (5 minutos)

### 1. Generar Secrets
```bash
npm run generate:secrets
```
Copia los valores generados.

### 2. Configurar Variables Locales
```bash
cp .env.example .env
# Edita .env con tus valores
```

### 3. Verificar Proyecto
```bash
npm run verify:deployment
```

### 4. Deploy a Vercel

**Opción A: Via CLI**
```bash
npm i -g vercel
vercel
```

**Opción B: Via Dashboard**
1. Ir a [vercel.com](https://vercel.com)
2. Conectar GitHub repo
3. Agregar variables de entorno
4. Click "Deploy"

---

## 📋 Variables de Entorno Requeridas

### Esenciales
```bash
DATABASE_URL=""           # PostgreSQL connection string
AUTH_SECRET=""            # Genera con: npm run generate:secrets
NEXTAUTH_URL=""           # https://tudominio.com
```

### Opcionales (según features activas)
```bash
# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Meta/Facebook
META_APP_ID=""
META_APP_SECRET=""
META_ACCESS_TOKEN=""

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## 🗄️ Database Setup

### Opción 1: Supabase (Recomendado)
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar connection string
3. Agregar a `DATABASE_URL`

### Opción 2: Neon
1. Crear proyecto en [neon.tech](https://neon.tech)
2. Copiar connection string  
3. Agregar a `DATABASE_URL`

### Opción 3: Railway (DB incluido)
1. Conectar repo en [railway.app](https://railway.app)
2. Railway crea PostgreSQL automático
3. Variables auto-configuradas

---

## ✅ Checklist Pre-Deploy

```bash
# 1. Verificar proyecto
npm run verify:deployment

# 2. Generar secrets
npm run generate:secrets

# 3. Build local (opcional)
npm run build

# 4. Type check
npm run type-check
```

Si todo pasa ✅ → Listo para deploy!

---

## 🔄 Workflow Post-Deploy

```bash
# 1. Hacer cambios
git checkout -b feature/nueva-feature

# 2. Si modificas DB
npm run db:migrate:dev --name descripcion

# 3. Commit y push
git add .
git commit -m "feat: descripción"
git push

# 4. Merge a main
# → Deploy automático vía GitHub Actions
```

---

## 🆘 Ayuda Rápida

Ver documentación completa en:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa
- [SECURITY.md](./SECURITY.md) - Seguridad
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribuir

¿Problemas? Revisa [DEPLOYMENT.md](./DEPLOYMENT.md) sección Troubleshooting.
