#!/bin/bash

###############################################################################
# PostgreSQL Optimization Script - KVM 4 (16 GB RAM)
# Optimiza PostgreSQL para máximo rendimiento
###############################################################################

set -e

echo "🗄️  Optimizando PostgreSQL para 16 GB RAM..."

# Backup de configuración original
sudo cp /etc/postgresql/15/main/postgresql.conf /etc/postgresql/15/main/postgresql.conf.backup

# Calcular valores óptimos basados en 16 GB RAM
TOTAL_RAM_GB=16
SHARED_BUFFERS=$((TOTAL_RAM_GB * 1024 / 4))  # 25% of RAM = 4GB
EFFECTIVE_CACHE=$((TOTAL_RAM_GB * 1024 * 3 / 4))  # 75% of RAM = 12GB

cat << EOF | sudo tee /etc/postgresql/15/main/conf.d/performance.conf
# =============================================================================
# PostgreSQL Performance Tuning - KVM 4 (16GB RAM)
# Generated: $(date)
# =============================================================================

# Memory Settings
shared_buffers = ${SHARED_BUFFERS}MB                    # 4GB (25% of RAM)
effective_cache_size = ${EFFECTIVE_CACHE}MB             # 12GB (75% of RAM)
work_mem = 64MB                                         # Per query operation
maintenance_work_mem = 1GB                              # For VACUUM, CREATE INDEX
wal_buffers = 16MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planner
random_page_cost = 1.1                                  # For SSD
effective_io_concurrency = 200                          # For SSD

# Connection Settings
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Logging
logging_collector = on
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000                       # Log queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance Monitoring
pg_stat_statements.track = all
pg_stat_statements.max = 10000

# Autovacuum (optimized for high activity)
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.02

# Background Writer
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0

# Parallel Query Execution
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_tuple_cost = 0.1
parallel_setup_cost = 1000

# JIT Compilation (for complex queries)
jit = on
EOF

echo "✅ Configuración de performance aplicada"
echo ""
echo "📊 Reiniciando PostgreSQL..."
sudo systemctl restart postgresql

echo ""
echo "✅ PostgreSQL optimizado exitosamente!"
echo ""
echo "🔍 Verificar configuración:"
echo "   sudo -u postgres psql -c \"SHOW shared_buffers;\""
echo "   sudo -u postgres psql -c \"SHOW effective_cache_size;\""
echo ""
echo "📈 Ver estadísticas de queries:"
echo "   sudo -u postgres psql -d legacymark -c \"SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;\""
