# LegacyMark - CRM & Multi-Channel Platform

Professional CRM platform with multi-channel integration (WhatsApp, Facebook, Instagram), portfolio management, and advanced analytics.

## 🚀 Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Custom Components
- **Integrations**: Meta (Facebook/Instagram), WhatsApp Business, Cloudinary

## 🌐 Deployment

### Production URL
🚀 **Deploying soon**: This project is configured and ready for production deployment.

### Deploy Instructions

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy to Vercel:**
1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables (see [`.env.example`](./.env.example))
4. Deploy!

## 📚 Documentation

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Complete deployment guide
- [`SECURITY.md`](./SECURITY.md) - Security policies
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines
- [`.env.example`](./.env.example) - Required environment variables

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL

**Optional (for specific features):**
- Meta/Facebook integration
- WhatsApp Business API
- Cloudinary (image uploads)
- Resend (email)
- Google OAuth

## 📂 Project Structure

```
legacymark/
├── app/                 # Next.js app router
├── components/          # Reusable UI components
├── modules/             # Feature modules (CRM, Analytics, Portfolio)
├── lib/                 # Utilities and configurations
├── actions/             # Server actions
├── prisma/              # Database schema and migrations
└── public/              # Static assets
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:turbo        # Start dev server (Turbo mode)

# Database
npm run db:push          # Sync schema (development)
npm run db:migrate:dev   # Create migration
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Build & Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run type-check       # TypeScript check
npm run lint             # ESLint check
```

## ✨ Features

### 🎯 CRM
- Contact management
- Deal tracking with Kanban board
- Activity timeline
- Sales funnel analytics

### 💬 Multi-Channel Inbox
- WhatsApp Business integration
- Facebook Messenger
- Instagram Direct
- Unified inbox interface

### 📊 Analytics
- Real-time dashboard
- Custom reports
- Performance metrics
- Data visualization

### 🖼️ Portfolio Management
- Project showcase
- Client testimonials
- Case studies
- Image gallery

### 👥 Team Management
- Expert profiles
- Role-based access
- Activity tracking
- Social media links

## 🔒 Security

- Security headers configured in `vercel.json`
- Environment variables protection
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection (NextAuth)

See [`SECURITY.md`](./SECURITY.md) for details.

## 📝 License

Private - All Rights Reserved

## 👨‍💻 Development Team

Developed by LegacyMark Team

---

**Need help?** Check [`DEPLOYMENT.md`](./DEPLOYMENT.md) or create an issue.
.
