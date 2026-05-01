# run-openclaw.ps1 — OpenClaw Gateway Startup Script for Windows
# ─────────────────────────────────────────────────────────────────
# Ejecutar desde la raíz del monorepo:
#   .\scripts\run-openclaw.ps1
#
# Variables de entorno requeridas en .env o como vars de sistema:
#   OPENCLAW_GATEWAY_SECRET  — Secreto compartido con el backend
#   OPENCLAW_GATEWAY_URL     — URL donde corre el gateway (default: localhost:18789)

$ErrorActionPreference = "Stop"

# ── Configuración ──────────────────────────────────────────────────────────────
$PORT    = $env:OPENCLAW_GATEWAY_PORT ?? "18789"
$SECRET  = $env:OPENCLAW_GATEWAY_SECRET ?? "agency_v1_secret_key"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🦅 OpenClaw Gateway — agency-v1 Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Port   : $PORT" -ForegroundColor Yellow
Write-Host "  Secret : $($SECRET.Substring(0, [Math]::Min(6, $SECRET.Length)))***" -ForegroundColor Yellow
Write-Host ""

# ── Verificar si openclaw está instalado ──────────────────────────────────────
$openclaw = Get-Command openclaw -ErrorAction SilentlyContinue

if (-not $openclaw) {
    Write-Host "❌ OpenClaw no encontrado en PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala OpenClaw con:" -ForegroundColor White
    Write-Host "  npm install -g openclaw@latest" -ForegroundColor Green
    Write-Host ""
    Write-Host "Luego vuelve a ejecutar este script." -ForegroundColor White
    exit 1
}

Write-Host "✅ OpenClaw encontrado en: $($openclaw.Source)" -ForegroundColor Green
Write-Host ""

# ── Exportar variables de entorno para el proceso hijo ────────────────────────
$env:OPENCLAW_GATEWAY_SECRET = $SECRET
$env:OPENCLAW_GATEWAY_PORT   = $PORT

# ── Cargar .env.local si existe (para desarrollo) ────────────────────────────
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) "apps\web\.env.local"
if (Test-Path $envFile) {
    Write-Host "📄 Cargando variables desde $envFile" -ForegroundColor DarkGray
    Get-Content $envFile | Where-Object { $_ -match "^[A-Z_]+=.+" } | ForEach-Object {
        $parts = $_ -split "=", 2
        if ($parts.Count -eq 2) {
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Variables cargadas." -ForegroundColor Green
    Write-Host ""
}

# ── Iniciar Gateway ───────────────────────────────────────────────────────────
Write-Host "🚀 Iniciando OpenClaw Gateway en puerto $PORT..." -ForegroundColor Cyan
Write-Host ""

try {
    & openclaw gateway --port $PORT --verbose
} catch {
    Write-Host ""
    Write-Host "❌ Error iniciando OpenClaw: $_" -ForegroundColor Red
    exit 1
}
