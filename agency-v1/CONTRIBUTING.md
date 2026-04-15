# Contributing to LegacyMark

## Development Workflow

### 1. Setup Local Environment

```bash
# Clone repository
git clone <repo-url>
cd legacymark

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your local values

# Setup database
npm run db:push

# Start development server
npm run dev
```

### 2. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# If you modify schema.prisma:
npm run db:migrate:dev --name description_of_change

# Test your changes
npm run type-check
npm run lint
```

### 3. Commit Guidelines

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### 4. Pull Request

1. Push your branch
2. Open PR against `develop` branch
3. Ensure CI passes
4. Request review from team

## Project Structure

```
legacymark/
├── app/              # Next.js App Router
├── components/       # React components
├── modules/          # Business logic modules
│   ├── crm/
│   ├── marketing/
│   ├── analytics/
│   └── ...
├── actions/          # Server actions
├── lib/              # Utilities
├── prisma/           # Database schema & migrations
└── public/           # Static assets
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code

## Testing

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Database
npm run db:studio  # View database
```

## Questions?

Open a discussion or contact the team.
