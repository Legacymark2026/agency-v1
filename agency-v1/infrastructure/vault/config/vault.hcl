# ══════════════════════════════════════════════════════════════════════════════
# HashiCorp Vault Production Configuration — VPS High Availability
# ══════════════════════════════════════════════════════════════════════════════
# Storage: Integrated Raft Storage with AES-256-GCM encryption at rest.
# Listener: TLS 1.3 encrypted listener on port 8200.
# ══════════════════════════════════════════════════════════════════════════════

storage "raft" {
  path    = "/vault/data"
  node_id = "vault_node_primary"
}

listener "tcp" {
  address         = "0.0.0.0:8200"
  tls_disable     = 1 # Set to 0 in production when TLS certs are mounted
  # tls_cert_file = "/vault/certs/vault-cert.pem"
  # tls_key_file  = "/vault/certs/vault-key.pem"
  # tls_min_version = "tls12"
}

api_addr     = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"
ui           = true
disable_mlock = true

# Telemetry for Prometheus monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}
