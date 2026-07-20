#!/usr/bin/env pwsh
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Setup Local Stack (PowerShell)
# ══════════════════════════════════════════════════════════════════════════════
# Resuelve:
#   1. Verifica que Docker Desktop este corriendo
#   2. Genera los certificados TLS en certs/db/ si no existen
#   3. Levanta la infraestructura en orden correcto
#   4. Verifica salud de todos los servicios criticos
#
# Uso:
#   .\scripts\setup-local.ps1
#   .\scripts\setup-local.ps1 -SkipCerts      # Si ya tienes los certs
#   .\scripts\setup-local.ps1 -RecreateCerts   # Fuerza regenerar certs
# ══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipCerts,
    [switch]$RecreateCerts
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root

function Write-Step { param($msg) Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  OK $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  !! $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  XX $msg" -ForegroundColor Red }

# ── PASO 1: Verificar Docker Desktop ─────────────────────────────────────────
Write-Step "PASO 1/4 -- Verificando Docker Desktop..."

$dockerVersion = $null
# Intentar con el contexto activo primero, luego con 'default' como fallback
foreach ($ctx in @($null, "default", "desktop-linux")) {
    try {
        $args = @("version", "--format", "{{.Server.Version}}")
        if ($ctx) { $args = @("--context", $ctx) + $args }
        $out = & docker @args 2>&1
        if ($LASTEXITCODE -eq 0 -and $out -match "^\d") {
            $dockerVersion = $out.Trim()
            if ($ctx) { $env:DOCKER_CONTEXT = $ctx }
            break
        }
    } catch {}
}

if (-not $dockerVersion) {
    Write-Fail "Docker Desktop NO esta corriendo."
    Write-Host ""
    Write-Host "  Opciones para iniciarlo:" -ForegroundColor Yellow
    Write-Host "  A) Abre Docker Desktop manualmente desde el menu inicio" -ForegroundColor White
    Write-Host "  B) Ejecuta este comando como Administrador:" -ForegroundColor White
    Write-Host "     Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Luego vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

$dockerVersion = docker version --format "{{.Server.Version}}" 2>&1
Write-OK "Docker Desktop activo -- Engine v$dockerVersion"

# ── PASO 2: Generar certificados TLS ──────────────────────────────────────────
Write-Step "PASO 2/4 -- Verificando certificados TLS en certs/db/..."

$certDir = Join-Path $Root "certs\db"
$requiredCerts = @("ca.crt", "ca.key", "server.crt", "server.key", "pgbouncer.crt", "pgbouncer.key")
$missingCerts = $requiredCerts | Where-Object { -not (Test-Path "$certDir\$_") }
$certsExist = (Test-Path $certDir) -and ($missingCerts.Count -eq 0)

if ($SkipCerts -and $certsExist) {
    Write-OK "Certs existentes -- omitiendo generacion (-SkipCerts)"
} elseif ($certsExist -and -not $RecreateCerts) {
    Write-OK "Certificados TLS ya existen en certs/db/"
    $requiredCerts | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
} else {
    if ($RecreateCerts -and (Test-Path $certDir)) {
        Write-Warn "RecreateCerts activado -- eliminando certs anteriores..."
        Remove-Item "$certDir\*" -Force -ErrorAction SilentlyContinue
    }

    if ($missingCerts.Count -gt 0 -and -not $RecreateCerts) {
        Write-Warn "Certificados faltantes: $($missingCerts -join ', ')"
    }

    # Buscar openssl funcional (priorizar OpenSSL-Win64 sobre el de PostgreSQL ODBC)
    $opensslCmd = $null
    $opensslPaths = @(
        "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
        "C:\Program Files\Git\usr\bin\openssl.exe",
        "C:\OpenSSL-Win64\bin\openssl.exe",
        "C:\OpenSSL-Win32\bin\openssl.exe",
        "openssl"
    )
    foreach ($path in $opensslPaths) {
        try {
            $ver = & $path version 2>&1
            if ($LASTEXITCODE -eq 0 -and "$ver" -match "OpenSSL") { $opensslCmd = $path; break }
        } catch {}
    }

    if (-not $opensslCmd) {
        Write-Fail "openssl no encontrado. Instala Git for Windows o OpenSSL."
        Write-Host "  Descarga Git (incluye openssl): https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }

    # Forzar OPENSSL_CONF al cnf correcto de OpenSSL-Win64
    # (la variable de maquina apunta a PostgreSQL ODBC que es incorrecta)
    $opensslDir = Split-Path $opensslCmd -Parent
    $possibleCnf = @(
        (Join-Path $opensslDir "cnf\openssl.cnf"),
        (Join-Path (Split-Path $opensslDir -Parent) "ssl\openssl.cnf"),
        (Join-Path (Split-Path $opensslDir -Parent) "etc\openssl.cnf")
    )
    $cnfFound = $false
    foreach ($cnf in $possibleCnf) {
        if (Test-Path $cnf) {
            $env:OPENSSL_CONF = (Resolve-Path $cnf).Path
            Write-Host "    OPENSSL_CONF=$($env:OPENSSL_CONF)" -ForegroundColor DarkGray
            $cnfFound = $true
            break
        }
    }
    if (-not $cnfFound) {
        Write-Warn "No se encontro openssl.cnf — usando config minima embebida"
        $tmpCnf = Join-Path $env:TEMP "openssl-minimal.cnf"
        "[req]`ndistinguished_name = req_distinguished_name`n[req_distinguished_name]" | Out-File $tmpCnf -Encoding ascii
        $env:OPENSSL_CONF = $tmpCnf
    }

    Write-Warn "Usando openssl: $opensslCmd"
    New-Item -ItemType Directory -Force -Path $certDir | Out-Null

    try {
        # 1. CA Root
        & $opensslCmd req -new -x509 -days 3650 -nodes -text `
            -out "$certDir\ca.crt" `
            -keyout "$certDir\ca.key" `
            -subj "/CN=db-root-ca" 2>&1 | Out-Null
        Write-OK "CA Root generada (ca.crt, ca.key)"

        # 2. Servidor Postgres
        & $opensslCmd req -new -nodes -text `
            -out "$certDir\server.req" `
            -keyout "$certDir\server.key" `
            -subj "/CN=postgres" 2>&1 | Out-Null

        & $opensslCmd x509 -req `
            -in "$certDir\server.req" `
            -CA "$certDir\ca.crt" `
            -CAkey "$certDir\ca.key" `
            -CAcreateserial `
            -out "$certDir\server.crt" `
            -days 3650 2>&1 | Out-Null
        Write-OK "Certificado Postgres Server (server.crt, server.key)"

        # 3. PgBouncer
        & $opensslCmd req -new -nodes -text `
            -out "$certDir\pgbouncer.req" `
            -keyout "$certDir\pgbouncer.key" `
            -subj "/CN=pgbouncer" 2>&1 | Out-Null

        & $opensslCmd x509 -req `
            -in "$certDir\pgbouncer.req" `
            -CA "$certDir\ca.crt" `
            -CAkey "$certDir\ca.key" `
            -CAcreateserial `
            -out "$certDir\pgbouncer.crt" `
            -days 3650 2>&1 | Out-Null
        Write-OK "Certificado PgBouncer (pgbouncer.crt, pgbouncer.key)"

        # Limpiar archivos temporales
        Remove-Item "$certDir\*.req", "$certDir\*.srl" -ErrorAction SilentlyContinue
        Write-OK "Certificados TLS generados exitosamente en $certDir"

    } catch {
        Write-Fail "Error generando certificados: $_"
        exit 1
    }
}

# ── PASO 3: Levantar infraestructura ──────────────────────────────────────────
Write-Step "PASO 3/4 -- Levantando infraestructura (postgres -> pgbouncer -> redis)..."

Write-Host "  Iniciando: postgres, pgbouncer, pgbouncer-replica, redis, redis-queue..." -ForegroundColor Gray

docker compose up -d postgres pgbouncer pgbouncer-replica redis redis-queue
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Error al iniciar infraestructura."
    Write-Host ""
    Write-Host "  Diagnostico:" -ForegroundColor Yellow
    Write-Host "    docker compose logs postgres" -ForegroundColor Gray
    Write-Host "    docker compose logs pgbouncer" -ForegroundColor Gray
    exit 1
}

Write-OK "Servicios iniciados -- esperando estado healthy (max 90s)..."

# Esperar healthcheck
$timeout = 90
$elapsed = 0
$interval = 5
$allHealthy = $false

# Detectar nombre del proyecto (puede variar)
$projectName = (Split-Path $Root -Leaf) -replace '[^a-z0-9]', '' -replace '-', ''

while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval

    $psOutput = docker compose ps --format "table {{.Service}}\t{{.Status}}" 2>&1

    $pgOk    = ($psOutput | Select-String "postgres\s") -match "healthy"
    $pqbOk   = ($psOutput | Select-String "pgbouncer\s") -match "healthy"
    $redisOk = ($psOutput | Select-String "redis\s") -match "healthy"

    $statusLine = "postgres=$( if($pgOk){'healthy'}else{'waiting'} ) | pgbouncer=$( if($pqbOk){'healthy'}else{'waiting'} ) | redis=$( if($redisOk){'healthy'}else{'waiting'} )"
    Write-Host "  [${elapsed}s] $statusLine" -ForegroundColor DarkGray

    if ($pgOk -and $pqbOk -and $redisOk) {
        $allHealthy = $true
        break
    }
}

# ── PASO 4: Verificacion final ─────────────────────────────────────────────────
Write-Step "PASO 4/4 -- Verificacion final..."

$psOutput = docker compose ps --format "table {{.Service}}\t{{.Status}}" 2>&1

$services = @(
    @{ Name = "PostgreSQL (primario)";  Pattern = "^postgres\s" },
    @{ Name = "PgBouncer (primario)";   Pattern = "^pgbouncer\s" },
    @{ Name = "PgBouncer (replica)";    Pattern = "^pgbouncer-replica" },
    @{ Name = "Redis";                  Pattern = "^redis\s" },
    @{ Name = "Redis Queue";            Pattern = "^redis-queue" }
)

$allOk = $true
foreach ($svc in $services) {
    $line = $psOutput | Select-String $svc.Pattern
    if ($line -match "healthy") {
        Write-OK "$($svc.Name) -- healthy"
    } elseif ($line -match "Up") {
        Write-Warn "$($svc.Name) -- Up (sin healthcheck confirmado)"
    } else {
        Write-Fail "$($svc.Name) -- NO disponible"
        $allOk = $false
    }
}

Write-Host ""
if ($allOk -or $allHealthy) {
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Stack listo. Proximos pasos:" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Desarrollo local (Next.js en tu maquina):" -ForegroundColor White
    Write-Host "    npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Todos los microservicios en Docker:" -ForegroundColor White
    Write-Host "    docker compose --profile all up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Ver logs de pgbouncer:" -ForegroundColor White
    Write-Host "    docker compose logs -f pgbouncer" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  Algunos servicios fallaron." -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Comandos de diagnostico:" -ForegroundColor Yellow
    Write-Host "    docker compose logs postgres" -ForegroundColor Gray
    Write-Host "    docker compose logs pgbouncer" -ForegroundColor Gray
    Write-Host "    docker compose ps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Si pgbouncer falla por SSL, regenera los certs:" -ForegroundColor Yellow
    Write-Host "    .\scripts\setup-local.ps1 -RecreateCerts" -ForegroundColor Gray
    exit 1
}
