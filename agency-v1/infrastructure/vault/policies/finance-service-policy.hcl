# Policy: finance-service-policy
# Least-privilege access for the Colombian accounting & finance microservice

path "secret/data/legacymark/finance-service" {
  capabilities = ["read"]
}

path "secret/metadata/legacymark/finance-service" {
  capabilities = ["read", "list"]
}

path "database/creds/finance-service-role" {
  capabilities = ["read"]
}

path "secret/*" {
  capabilities = ["deny"]
}
