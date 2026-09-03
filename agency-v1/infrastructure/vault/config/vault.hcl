# ══════════════════════════════════════════════════════════════════════════════
# HashiCorp Vault Production Configuration — VPS Standalone / HA File Storage
# ══════════════════════════════════════════════════════════════════════════════

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr      = "http://127.0.0.1:8200"
ui            = true
disable_mlock = true

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}
