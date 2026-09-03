# Policy: ai-engine-policy
# Least-privilege access for AI reasoning and LLM cascade engine

path "secret/data/legacymark/ai-engine" {
  capabilities = ["read"]
}

path "secret/metadata/legacymark/ai-engine" {
  capabilities = ["read", "list"]
}

path "secret/*" {
  capabilities = ["deny"]
}
