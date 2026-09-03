# Policy: payment-service-policy
# Least-privilege access for the decoupled payment microservice (PCI DSS Scope)

path "secret/data/legacymark/payment-service" {
  capabilities = ["read"]
}

path "secret/metadata/legacymark/payment-service" {
  capabilities = ["read", "list"]
}

path "database/creds/payment-service-role" {
  capabilities = ["read"]
}

# Explicitly deny all other paths
path "secret/*" {
  capabilities = ["deny"]
}
