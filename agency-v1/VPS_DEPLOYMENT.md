# VPS Deployment Guide - Hostinger KVM 2

## 📋 Especificaciones del Servidor

**Plan:** Hostinger KVM 2  
**Recursos:**
- 2 vCPU cores
- 8 GB RAM
- 100 GB NVMe SSD
- 8 TB ancho de banda

**Costo:** ~$7 USD/mes

---

## 🚀 Setup Inicial (Primera Vez)

### 1. Conectar al VPS

```bash
ssh ssh root@187.77.195.9
```

### 2. Ejecutar Script de Setup

```bash
# Descargar script
wget https://raw.githubusercontent.com/tu-repo/legacymark/main/scripts/setup/vps-setup.sh

# Dar permisos
chmod +x vps-setup.sh

# Ejecutar
sudo bash vps-setup.sh
```

**Tiempo estimado:** 10-15 minutos

---

## 📦 Deployment de la Aplicación

### 1. Clonar Repositorio

```bash
# Como appuser
su - appuser

# Clonar
git clone https://github.com/tu-usuario/legacymark.git /var/www/legacymark
cd /var/www/legacymark
```

### 2. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env.production

# Editar con tus valores
nano .env.production
```

**Variables críticas:**
```bash
# Database
DATABASE_URL="postgresql://legacyuser:TU_PASSWORD@localhost:5432/legacymark"

# Auth
AUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="https://tudominio.com"

# OpenAI (para agentes IA)
OPENAI_API_KEY="sk-..."
```

### 3. Primer Deploy

```bash
# Dar permisos al script
chmod +x scripts/setup/deploy.sh
# 2. Ejecutar (como tú mismo, no sudo)
bash scripts/setup/deploy.sh
```

---

## 🌐 Configurar Dominio y SSL

### 1. Apuntar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

```
Tipo: A
Host: @
Valor: IP_DE_TU_VPS
TTL: 1 hora

Tipo: A
Host: www
Valor: IP_DE_TU_VPS
TTL: 1 hora
```

### 2. Configurar Nginx

```bash
# Copiar configuración
sudo cp /var/www/legacymark/deployment/nginx.conf /etc/nginx/sites-available/legacymark

# Editar con tu dominio
sudo nano /etc/nginx/sites-available/legacymark
# Reemplazar "tudominio.com" con "legacymarksas.com"

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/legacymark /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 3. Obtener SSL (HTTPS)

```bash
# Instalar certificado SSL gratis con Let's Encrypt
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Responder las preguntas:
# Email: tu@email.com
# Aceptar términos: Yes
# Redirect HTTP to HTTPS: 2 (Yes)
```

**¡Listo! Tu sitio está en HTTPS** 🔒

---

## 🤖 Configurar Agentes de IA

### Opción 1: API Routes (Recomendado)

Ya está configurado en Nginx con timeouts extendidos:
- `/api/ai/*` routes tienen 10 minutos de timeout
- Soporta streaming con SSE

### Opción 2: Servicio Separado (Avanzado)

Si necesitas procesamiento más pesado:

```bash
# Crear servicio de agentes en puerto 3001
pm2 start ai-agents.js --name "ai-agents"
```

---

## 📊 Monitoreo y Mantenimiento

### Ver Estado

```bash
# PM2 status
pm2 status

# Logs en tiempo real
pm2 logs legacymark

# Métricas
pm2 monit
```

### Comandos Útiles

```bash
# Reiniciar app
pm2 reload legacymark

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Ver logs de Nginx
sudo tail -f /var/log/nginx/legacymark_access.log
sudo tail -f /var/log/nginx/legacymark_error.log
```

---

## 🔄 Updates y Deploy Continuo

### Deploy Manual

```bash
cd /var/www/legacymark
bash scripts/setup/deploy.sh
```

### Deploy Automático (GitHub Actions)

Ya está configurado en `.github/workflows/deploy.yml`.

**Agregar secreto SSH:**
1. Generar SSH key en VPS: `ssh-keygen -t ed25519`
2. Agregar a GitHub Secrets:
   - `VPS_HOST`: IP del VPS
   - `VPS_USER`: appuser
   - `VPS_SSH_KEY`: contenido de `~/.ssh/id_ed25519`

---

## 🛡️ Seguridad

### Checklist Post-Deployment

- [ ] Cambiar password de PostgreSQL
- [ ] Configurar fail2ban
- [ ] Habilitar backups automáticos
- [ ] Rotar logs
- [ ] Actualizar dependencias regularmente

### Fail2Ban (Protección contra ataques)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Backups de Base de Datos

```bash
# Crear backup manual
pg_dump -U legacyuser legacymark > backup_$(date +%Y%m%d).sql

# Automatizar con cron (diario a las 2 AM)
crontab -e
# Agregar:
0 2 * * * pg_dump -U legacyuser legacymark > /var/backups/db_$(date +\%Y\%m\%d).sql
```

---

## 🚨 Troubleshooting

### Aplicación no inicia

```bash
# Ver logs
pm2 logs legacymark --lines 100

# Verificar espacio en disco
df -h

# Verificar memoria
free -h
```

### SSL no funciona

```bash
# Renovar certificado manualmente
sudo certbot renew

# Ver estado
sudo certbot certificates
```

### Performance lento

```bash
# Ver uso de recursos
htop

# Optimizar PostgreSQL (si necesario)
sudo nano /etc/postgresql/15/main/postgresql.conf
# shared_buffers = 2GB (25% de RAM)
# effective_cache_size = 6GB (75% de RAM)
```

---

## 💰 Costos Estimados

| Servicio | Costo/mes |
|----------|-----------|
| Hostinger VPS KVM 2 | $7 |
| Dominio (.com) | $1-2 |
| **Total** | **$8-9/mes** |

**APIs adicionales:**
- OpenAI (agentes): $10-50/mes (según uso)
- Supabase (opcional): Gratis hasta 500MB

**Total con AI:** ~$18-60/mes

---

## ✅ Checklist Final

- [ ] VPS setup completado
- [ ] Aplicación deployada
- [ ] DNS configurado
- [ ] SSL/HTTPS activo
- [ ] PM2 funcionando
- [ ] Nginx configurado
- [ ] Database migraciones ejecutadas
- [ ] Variables de entorno configuradas
- [ ] Backups configurados
- [ ] Monitoreo activo

**¡Tu aplicación está en producción!** 🎉
