# Quick Deployment Helper

This script helps you push your code to GitHub and provides deployment guidance.

## Step 1: Push to GitHub

Choose one of the following methods:

### Method A: GitHub Desktop (Easiest)
1. Download and install: https://desktop.github.com/
2. Open GitHub Desktop and login
3. File → Add Local Repository
4. Select: C:\Users\hboho\.gemini\antigravity\scratch\legacymark
5. Click "Publish repository" or "Push origin"

### Method B: Personal Access Token
1. Go to GitHub: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: "repo"
4. Copy the token

Run in terminal:
```powershell
cd C:\Users\hboho\.gemini\antigravity\scratch\legacymark
git push -u origin main
# Username: your_github_username
# Password: paste_your_token
```

### Method C: GitHub CLI
```powershell
# Install from: https://cli.github.com/
gh auth login
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select: legacymark2026/legacymarkwed
5. Configure environment variables (see .env.example)
6. Click "Deploy"

## Required Environment Variables for Vercel

Minimum (to start):
- DATABASE_URL (from Supabase/Neon/Railway)
- AUTH_SECRET (generate with: openssl rand -base64 32)
- NEXTAUTH_URL (will be auto-provided by Vercel)
- AUTH_TRUST_HOST=true

## Database Options

Choose one:
- Supabase: https://supabase.com (Recommended)
- Neon: https://neon.tech
- Railway: https://railway.app (easiest - includes DB)

## Full Guide

See DEPLOYMENT.md for complete instructions.
