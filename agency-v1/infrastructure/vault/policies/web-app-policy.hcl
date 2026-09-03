# Policy: web-app-policy
# Least-privilege access for Next.js web dashboard and BFF layer

path "secret/data/legacymark/web" {
  capabilities = ["read"]
}

path "secret/data/legacymark/auth" {
  capabilities = ["read"]
}

path "secret/metadata/legacymark/web" {
  capabilities = ["read", "list"]
}

path "secret/*" {
  capabilities = ["deny"]
}
