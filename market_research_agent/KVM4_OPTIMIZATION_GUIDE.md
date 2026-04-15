# KVM 4 Optimization Guide - Ultra-Professional

## 🚀 Especificaciones del Servidor

**Hostinger KVM 4**
- **vCPU**: 4 núcleos
- **RAM**: 16 GB
- **Almacenamiento**: 200 GB NVMe SSD
- **Ancho de banda**: 16 TB/mes
- **Costo**: ~$10 USD/mes

---

## 📊 Capacidades del Sistema

### Performance Estimado

| Métrica | Capacidad |
|---------|-----------|
| **Usuarios concurrentes** | 150-300 |
| **Requests HTTP/s** | 2000-3000 |
| **Agentes IA simultáneos** | 15-30 |
| **Agentes IA por día** | Ilimitado |
| **DB queries/s** | 5000-15000 |
| **WebSocket connections** | 1000+ |

---

## 🔧 Optimizaciones Implementadas

### 1. **PM2 - 4 Instancias + 2 AI Workers**

```json
{
  "instances": 4,  // Una por núcleo
  "max_memory_restart": "3G",
  "node_args": [
    "--max-old-space-size=3072",
    "--optimize-for-size"
  ]
}
```

**Beneficios:**
- ✅ Utilización completa de 4 núcleos
- ✅ Load balancing automático
- ✅ Zero-downtime deployments
- ✅ Workers dedicados para IA (aislamiento de recursos)

### 2. **Nginx - 4 Workers**

```nginx
worker_processes 4;
worker_connections 4096;  // 16,384 conexiones totales
```

**Optimizaciones:**
- Cache de 1GB para assets estáticos
- Gzip compression nivel 6
- HTTP/2 habilitado
- Rate limiting inteligente
- Timeouts extendidos para AI (600s)

### 3. **PostgreSQL - 16 GB Optimizado**

```ini
shared_buffers = 4GB         # 25% de RAM
effective_cache_size = 12GB  # 75% de RAM
work_mem = 64MB
maintenance_work_mem = 1GB
max_connections = 200
```

**Características:**
- Autovacuum optimizado
- Parallel query execution (4 workers)
- JIT compilation habilitado
- pg_stat_statements para monitoring

### 4. **Swap - 8 GB Optimizado**

```bash
SWAP_SIZE=8G  # 50% de RAM
vm.swappiness=10  # Solo usar cuando RAM esté llena
vm.vfs_cache_pressure=50
```

### 5. **Redis - 2 GB Cache**

```
maxmemory 2gb
maxmemory-policy allkeys-lru
```

**Uso:**
- Queue para AI workers (Bull)
- Caché de sesiones
- Caché de API responses

---

## 📈 Arquitectura de Agentes de IA

### Separación de Procesos

```
┌─────────────────────────────────────┐
│   Nginx (4 workers)                 │
│   Puerto 80/443                     │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼────────────────┐
│ Next.js │ │ AI Worker Queue    │
│ 4 inst. │ │ 2 workers          │
│ :3000   │ │ Bull + Redis       │
└────┬────┘ └───┬────────────────┘
     │          │
     └─────┬────┘
           │
    ┌──────▼──────┐
    │ PostgreSQL  │
    │ :5432       │
    └─────────────┘
```

### Ventajas de esta Arquitectura

1. **Aislamiento de Recursos**
   - AI workers no bloquean requests HTTP
   - Memoria dedicada por proceso

2. **Escalabilidad**
   - Fácil agregar más workers
   - Queue automático de tareas

3. **Resilencia**
   - Si un worker falla, los demás continúan
   - Auto-restart configurado

4. **Monitoreo**
   - Métricas separadas por proceso
   - Logs independientes

---

## 🛠️ Scripts de Optimización

### Setup Inicial

```bash
# 1. Setup básico del VPS
sudo bash scripts/setup/vps-setup.sh

# 2. Configurar swap
sudo bash scripts/setup/setup-swap.sh

# 3. Optimizar PostgreSQL
sudo bash scripts/setup/optimize-postgresql.sh

# 4. Configurar monitoreo
sudo bash scripts/setup/setup-monitoring.sh
```

### Comandos de Monitoreo

```bash
# Ver recursos en tiempo real
monitor-resources

# Monitor interactivo
htop

# PM2 dashboard
pm2 monit

# PostgreSQL stats
sudo -u postgres psql -d legacymark -c "
  SELECT * FROM pg_stat_statements 
  ORDER BY total_exec_time DESC 
  LIMIT 10;
"

# Redis info
redis-cli INFO memory
```

---

## 📊 Benchmarks y Limitaciones

### CPU (4 vCPU cores)

**Uso típico:**
- Next.js: 40-60% promedio
- AI Workers: 20-30% promedio
- PostgreSQL: 10-20% promedio
- Total: 70-110% (distribuido)

**Límite antes de upgrade:** 80% constante

### Memoria (16 GB)

**Distribución:**
```
Sistema Ubuntu:     800 MB
Nginx:             100 MB
Next.js (4 inst):  3.2 GB (800 MB c/u)
AI Workers (2):    2.0 GB (1 GB c/u)
PostgreSQL:        4.0 GB
Redis:             2.0 GB
Cache/Buffer:      3.9 GB
─────────────────────────
Total:            16.0 GB
```

**Headroom:** ~4 GB para spikes

### Disco (200 GB NVMe)

**Distribución estimada:**
```
SO + Apps:         20 GB
Database:          50 GB
Logs (rotados):    10 GB
Uploads/Media:     50 GB
Libre:             70 GB
```

**IOPS:** ~20,000 (NVMe SSD)

---

## 🚨 Alertas y Límites

### Configuradas Automáticamente

| Métrica | Warning | Critical |
|---------|---------|----------|
| CPU | 80% | 90% |
| RAM | 85% | 90% |
| Disco | 80% | 85% |
| Swap | 50% | 70% |
| PostgreSQL connections | 150 | 180 |

### Acciones Automáticas

1. **CPU > 90%**: Email de alerta
2. **RAM > 90%**: Restart PM2 apps
3. **Disco > 85%**: Cleanup de logs antiguos
4. **DB connections > 180%**: Cerrar conexiones idle

---

## 📈 Plan de Escalamiento

### Cuando Escalar

**Upgrade a KVM 6 (6 vCPU, 24 GB) cuando:**
- CPU constante > 80%
- Memoria constante > 90%
- > 300 usuarios concurrentes
- > 30 agentes IA simultáneos

**Upgrade a Múltiples Servidores cuando:**
- > 500 usuarios concurrentes
- > 50 agentes IA simultáneos
- Necesitas alta disponibilidad (99.99%)

### Arquitectura Multi-Servidor

```
Load Balancer (2 servidores)
    ↓
App Servers (3-5 servidores KVM 4)
    ↓
Managed PostgreSQL (dedicado)
    ↓
Redis Cluster (opcional)
```

**Costo:** ~$100-200/mes

---

## 🔒 Checklist de Seguridad

- [ ] Firewall configurado (UFW)
- [ ] Fail2ban activo
- [ ] SSH con key-only
- [ ] PostgreSQL password fuerte
- [ ] Redis protegido
- [ ] SSL/HTTPS activo
- [ ] Headers de seguridad
- [ ] Backups automáticos
- [ ] Logs rotados
- [ ] Monitoreo activo

---

## 💡 Tips de Optimización

### 1. **Caché Agresivo**

```typescript
// Cache responses de IA frecuentes
import NodeCache from 'node-cache';
const aiCache = new NodeCache({ stdTTL: 3600 });

async function getCachedAI(prompt: string) {
  const cached = aiCache.get(prompt);
  if (cached) return cached;
  
  const result = await callOpenAI(prompt);
  aiCache.set(prompt, result);
  return result;
}
```

### 2. **Connection Pooling**

```typescript
// Prisma optimizado
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool para 4 workers + background tasks
  connectionLimit: 50,
});
```

### 3. **Queue Prioritization**

```typescript
// Priorizar tareas críticas
aiQueue.add('urgent-task', data, { priority: 1 });
aiQueue.add('normal-task', data, { priority: 5 });
aiQueue.add('background-task', data, { priority: 10 });
```

---

## ✅ Verificación Post-Setup

```bash
# 1. Verificar PM2
pm2 status
# Debe mostrar 6 procesos (4 Next.js + 2 AI workers)

# 2. Verificar Nginx
sudo nginx -t
curl -I https://tudominio.com
# Debe retornar 200 OK con HTTPS

# 3. Verificar PostgreSQL
sudo -u postgres psql -c "SHOW shared_buffers;"
# Debe mostrar 4GB

# 4. Verificar Redis
redis-cli PING
# Debe retornar PONG

# 5. Verificar recursos
monitor-resources
# CPU < 50%, RAM < 70%
```

---

## 📚 Recursos Adicionales

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Optimization](https://nginx.org/en/docs/)
- [PostgreSQL Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Bull Queue](https://github.com/OptimalBits/bull)

---

**Sistema Optimizado para:**
✅ Startups medianas
✅ Aplicaciones SaaS
✅ Agentes de IA de producción
✅ 150-300 usuarios concurrentes
✅ Alto rendimiento con bajo costo

**Costo Total:** ~$10-15/mes (VPS + APIs)
