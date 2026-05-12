# Agency-v1 Project Structure

Generated at: 2026-05-12T14:00:34.387Z

```
├── apps
│   └── web
│       ├── .env
│       ├── .env.example
│       ├── .env.local
│       ├── .env.production.example
│       ├── .npmrc
│       ├── .vercel
│       │   ├── project.json
│       │   └── README.txt
│       ├── actions
│       │   ├── admin.ts
│       │   ├── ads.ts
│       │   ├── agent-config.ts
│       │   ├── agent-teams.ts
│       │   ├── ai-agents.ts
│       │   ├── audiences.ts
│       │   ├── auth.ts
│       │   ├── automation.ts
│       │   ├── billing.ts
│       │   ├── blog.ts
│       │   ├── chat.ts
│       │   ├── cms.ts
│       │   ├── company.ts
│       │   ├── contact.ts
│       │   ├── crm-advanced.ts
│       │   ├── crm-automation.ts
│       │   ├── crm-closing.ts
│       │   ├── crm-commissions.ts
│       │   ├── crm-goals.ts
│       │   ├── crm-sequences.ts
│       │   ├── crm.ts
│       │   ├── developer.ts
│       │   ├── email-blast.ts
│       │   ├── email-template.ts
│       │   ├── employees.ts
│       │   ├── events
│       │   │   └── event-actions.ts
│       │   ├── expenses.ts
│       │   ├── experts.ts
│       │   ├── hr-time.ts
│       │   ├── inbox-advanced.ts
│       │   ├── inbox-macros.ts
│       │   ├── inbox.ts
│       │   ├── integration-config.ts
│       │   ├── integrations
│       │   │   ├── video-assets-types.ts
│       │   │   └── video-assets.ts
│       │   ├── integrations.ts
│       │   ├── invoices.ts
│       │   ├── kanban-archive.ts
│       │   ├── kanban-audit.ts
│       │   ├── kanban-copilot.ts
│       │   ├── kanban-finance.ts
│       │   ├── kanban-projects.ts
│       │   ├── kanban-sales-sync.ts
│       │   ├── kanban-search.ts
│       │   ├── kanban-tasks.ts
│       │   ├── kanban-templates.ts
│       │   ├── kanban.ts
│       │   ├── leads.ts
│       │   ├── mailing-list.ts
│       │   ├── marketing
│       │   │   ├── ab-test-manager.ts
│       │   │   ├── analytics.ts
│       │   │   ├── automation.ts
│       │   │   ├── brand-kit.ts
│       │   │   ├── campaigns.ts
│       │   │   ├── creative-analytics.ts
│       │   │   ├── creative-assets.ts
│       │   │   ├── creative-batch.ts
│       │   │   ├── creative-collaboration.ts
│       │   │   ├── facebook-ads.ts
│       │   │   ├── facebook-dispatch.ts
│       │   │   ├── google-ads.ts
│       │   │   ├── google-dispatch.ts
│       │   │   ├── linkedin-ads.ts
│       │   │   ├── linkedin-dispatch.ts
│       │   │   ├── short-links.ts
│       │   │   ├── smart-rules.ts
│       │   │   ├── tiktok-ads.ts
│       │   │   └── tiktok-dispatch.ts
│       │   ├── marketing.ts
│       │   ├── mfa.ts
│       │   ├── notifications.ts
│       │   ├── onboarding.ts
│       │   ├── operations.ts
│       │   ├── organization.ts
│       │   ├── payroll-operations.ts
│       │   ├── payroll.ts
│       │   ├── projects.ts
│       │   ├── public-forms.ts
│       │   ├── rfm.ts
│       │   ├── role-config.ts
│       │   ├── roles.ts
│       │   ├── sales-analytics.ts
│       │   ├── sales-engine.ts
│       │   ├── sales-goals.ts
│       │   ├── search.ts
│       │   ├── settings.ts
│       │   ├── skillchains.ts
│       │   ├── social-ai.ts
│       │   ├── social-profiles.ts
│       │   ├── social-publisher.ts
│       │   ├── time-tracking.ts
│       │   ├── treasury.ts
│       │   ├── video-editor.ts
│       │   ├── vip-action.ts
│       │   └── workflow-versions.ts
│       ├── app
│       │   ├── (auth)
│       │   │   ├── auth
│       │   │   │   ├── login
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── mfa-verify
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── nueva-contrasena
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── recuperar
│       │   │   │   │   └── page.tsx
│       │   │   │   └── register
│       │   │   │       └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── register-agency
│       │   │       ├── page.tsx
│       │   │       └── register-agency-form.tsx
│       │   ├── (dashboard)
│       │   │   ├── dashboard
│       │   │   │   ├── admin
│       │   │   │   │   ├── agent-config
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── ai-insights
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── architecture
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]
│       │   │   │   │   │       ├── error.tsx
│       │   │   │   │   │       ├── loading.tsx
│       │   │   │   │   │       ├── not-found.tsx
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── automation
│       │   │   │   │   │   ├── executions
│       │   │   │   │   │   │   ├── execution-list.tsx
│       │   │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   │   └── [id]
│       │   │   │   │   │   │       ├── execution-client.tsx
│       │   │   │   │   │   │       └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── workflow-list.tsx
│       │   │   │   │   ├── blog
│       │   │   │   │   │   └── comments
│       │   │   │   │   ├── crm
│       │   │   │   │   │   ├── automation
│       │   │   │   │   │   │   ├── AutomationRuleForm.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── campaigns
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── commissions
│       │   │   │   │   │   │   ├── CommissionActions.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── deals
│       │   │   │   │   │   │   └── [id]
│       │   │   │   │   │   │       └── page.tsx
│       │   │   │   │   │   ├── goals
│       │   │   │   │   │   │   ├── GoalFormClient.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── leads
│       │   │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   │   └── [id]
│       │   │   │   │   │   │       └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── pipeline
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── reports
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── scoring
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── sequences
│       │   │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   │   └── SequenceFormClient.tsx
│       │   │   │   │   │   ├── tasks
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── templates
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── invoices
│       │   │   │   │   │   ├── invoices-client.tsx
│       │   │   │   │   │   ├── new
│       │   │   │   │   │   │   ├── invoice-form.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── marketing
│       │   │   │   │   │   ├── approvals
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── campaigns
│       │   │   │   │   │   │   ├── new
│       │   │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── creative-studio
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── links
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── settings
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── spend
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── operations
│       │   │   │   │   │   ├── kanban
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── layout.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── timesheets
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── treasury
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── payroll
│       │   │   │   │   │   ├── employees
│       │   │   │   │   │   │   ├── new
│       │   │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── expenses
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── new
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── reports
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── time-off
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── timesheets
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── [id]
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── proposals
│       │   │   │   │   │   ├── new
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── sales
│       │   │   │   │   │   └── goals
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── team
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── treasury
│       │   │   │   │       ├── accounts
│       │   │   │   │       │   └── new
│       │   │   │   │       │       └── page.tsx
│       │   │   │   │       ├── page.tsx
│       │   │   │   │       └── transactions
│       │   │   │   │           └── new
│       │   │   │   │               └── page.tsx
│       │   │   │   ├── analytics
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── client
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── projects
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── proposals
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── events
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── experts
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── inbox
│       │   │   │   │   ├── layout.tsx
│       │   │   │   │   ├── loading.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [conversationId]
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── kanban
│       │   │   │   │   ├── components
│       │   │   │   │   │   ├── KanbanBoard.tsx
│       │   │   │   │   │   ├── KanbanCard.tsx
│       │   │   │   │   │   └── KanbanColumn.tsx
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── marketing
│       │   │   │   │   ├── automation
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── calendar
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── campaigns
│       │   │   │   │   │   ├── new
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   └── [id]
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── email-blast
│       │   │   │   │   │   ├── audience
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── links
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── listening
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── pricing
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── spend
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── media
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   ├── posts
│       │   │   │   │   ├── categories
│       │   │   │   │   │   ├── categories-client.tsx
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── comments
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── create
│       │   │   │   │   │   ├── loading.tsx
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [id]
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── projects
│       │   │   │   │   ├── create
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── [id]
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── roles
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── security
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   └── _components
│       │   │   │   │       ├── logs-filter.tsx
│       │   │   │   │       ├── logs-table.tsx
│       │   │   │   │       ├── security-pagination.tsx
│       │   │   │   │       └── security-stats.tsx
│       │   │   │   ├── settings
│       │   │   │   │   ├── agents
│       │   │   │   │   │   ├── knowledge
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── new
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── page.tsx
│       │   │   │   │   │   ├── skillchains
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   ├── teams
│       │   │   │   │   │   │   └── page.tsx
│       │   │   │   │   │   └── [id]
│       │   │   │   │   │       └── page.tsx
│       │   │   │   │   ├── appearance
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── billing
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── company
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── developer
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── inbox
│       │   │   │   │   │   └── macros
│       │   │   │   │   │       ├── page.tsx
│       │   │   │   │   │       └── _components
│       │   │   │   │   │           ├── macro-form-modal.tsx
│       │   │   │   │   │           └── macros-client.tsx
│       │   │   │   │   ├── integrations
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── layout.tsx
│       │   │   │   │   ├── members
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── notifications
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── profile
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── roles
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   ├── security
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── social-profiles
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── test-analytics
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── tools
│       │   │   │   │   └── video-editor
│       │   │   │   │       └── page.tsx
│       │   │   │   ├── unauthorized
│       │   │   │   │   └── page.tsx
│       │   │   │   └── users
│       │   │   │       └── page.tsx
│       │   │   └── layout.tsx
│       │   ├── (marketing)
│       │   │   ├── blog
│       │   │   │   └── page.tsx
│       │   │   ├── contacto
│       │   │   │   └── page.tsx
│       │   │   ├── flyering
│       │   │   │   └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   ├── metodologia
│       │   │   │   └── page.tsx
│       │   │   ├── nosotros
│       │   │   │   └── page.tsx
│       │   │   ├── page.tsx
│       │   │   ├── politica-cookies
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── politica-privacidad
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── portfolio
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── servicios
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── soluciones
│       │   │   │   ├── automatizacion
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── creacion-contenido
│       │   │   │   │   ├── content-sections.tsx
│       │   │   │   │   ├── loading.tsx
│       │   │   │   │   ├── page.tsx
│       │   │   │   │   ├── pricing-client.tsx
│       │   │   │   │   └── roi-calculator-client.tsx
│       │   │   │   ├── estrategia
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── estrategia-de-marca
│       │   │   │   │   ├── layout.tsx
│       │   │   │   │   └── page.tsx
│       │   │   │   └── web-dev
│       │   │   │       ├── layout.tsx
│       │   │   │       └── page.tsx
│       │   │   ├── suscripcion
│       │   │   │   ├── cancelado
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── exito
│       │   │   │   │   └── page.tsx
│       │   │   │   └── page.tsx
│       │   │   ├── terms
│       │   │   │   ├── layout.tsx
│       │   │   │   └── page.tsx
│       │   │   └── vip
│       │   │       └── page.tsx
│       │   ├── (public)
│       │   │   └── sign
│       │   │       └── [token]
│       │   │           └── page.tsx
│       │   ├── .well-known
│       │   │   ├── apple-app-site-association
│       │   │   │   └── route.ts
│       │   │   └── ucp
│       │   │       └── route.ts
│       │   ├── actions
│       │   │   ├── auth.ts
│       │   │   ├── crm-settings.ts
│       │   │   ├── pricing.ts
│       │   │   ├── sessions.ts
│       │   │   └── settings.ts
│       │   ├── api
│       │   │   ├── admin
│       │   │   │   ├── agent-config
│       │   │   │   │   └── route.ts
│       │   │   │   ├── comments
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       ├── approve
│       │   │   │   │       │   └── route.ts
│       │   │   │   │       └── route.ts
│       │   │   │   ├── integrations
│       │   │   │   │   ├── payu
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── stripe
│       │   │   │   │       └── route.ts
│       │   │   │   ├── invoices
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       └── route.ts
│       │   │   │   ├── kanban
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── tasks
│       │   │   │   │       └── route.ts
│       │   │   │   └── proposals
│       │   │   │       ├── route.ts
│       │   │   │       └── [id]
│       │   │   │           └── route.ts
│       │   │   ├── agent
│       │   │   │   ├── alerts
│       │   │   │   │   └── route.ts
│       │   │   │   ├── daily-report
│       │   │   │   │   └── route.ts
│       │   │   │   ├── history
│       │   │   │   │   └── route.ts
│       │   │   │   └── route.ts
│       │   │   ├── agents
│       │   │   │   └── [agentId]
│       │   │   │       └── voice
│       │   │   │           └── route.ts
│       │   │   ├── ai
│       │   │   │   └── models
│       │   │   │       └── route.ts
│       │   │   ├── analytics
│       │   │   │   ├── end-session
│       │   │   │   │   └── route.ts
│       │   │   │   ├── heartbeat
│       │   │   │   │   └── route.ts
│       │   │   │   └── track
│       │   │   │       └── route.ts
│       │   │   ├── auth
│       │   │   ├── automation
│       │   │   │   ├── ai-suggest
│       │   │   │   │   └── route.ts
│       │   │   │   ├── resume
│       │   │   │   │   └── route.ts
│       │   │   │   ├── test
│       │   │   │   │   └── route.ts
│       │   │   │   └── trigger
│       │   │   │       └── route.ts
│       │   │   ├── calendar
│       │   │   │   └── sync
│       │   │   │       └── route.ts
│       │   │   ├── creative
│       │   │   │   ├── copy
│       │   │   │   │   └── route.ts
│       │   │   │   ├── image
│       │   │   │   │   └── route.ts
│       │   │   │   ├── safety
│       │   │   │   │   └── route.ts
│       │   │   │   ├── score
│       │   │   │   │   └── route.ts
│       │   │   │   └── video
│       │   │   │       └── route.ts
│       │   │   ├── crm
│       │   │   │   ├── ai-forecast
│       │   │   │   │   └── route.ts
│       │   │   │   ├── import-deals
│       │   │   │   │   └── route.ts
│       │   │   │   └── run-automation
│       │   │   │       └── route.ts
│       │   │   ├── cron
│       │   │   │   ├── process-sequences
│       │   │   │   │   └── route.ts
│       │   │   │   ├── run-automation
│       │   │   │   │   └── route.ts
│       │   │   │   ├── social-publisher
│       │   │   │   │   └── route.ts
│       │   │   │   └── subscriptions
│       │   │   │       └── route.ts
│       │   │   ├── debug
│       │   │   │   └── verify
│       │   │   │       └── route.ts
│       │   │   ├── diagnostics
│       │   │   │   ├── automation
│       │   │   │   │   └── route.ts
│       │   │   │   └── crm
│       │   │   │       └── route.ts
│       │   │   ├── email-blast
│       │   │   │   └── send
│       │   │   │       └── route.ts
│       │   │   ├── inbox
│       │   │   │   ├── copilot
│       │   │   │   │   └── route.ts
│       │   │   │   └── search
│       │   │   │       └── route.ts
│       │   │   ├── integrations
│       │   │   │   ├── facebook
│       │   │   │   │   ├── callback
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── webhook
│       │   │   │   │       └── route.ts
│       │   │   │   ├── oauth
│       │   │   │   │   ├── authorize
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── callback
│       │   │   │   │       └── route.ts
│       │   │   │   ├── tiktok
│       │   │   │   │   └── webhook
│       │   │   │   │       └── route.ts
│       │   │   │   └── whatsapp
│       │   │   │       └── webhook
│       │   │   │           └── route.ts
│       │   │   ├── invoices
│       │   │   │   └── [id]
│       │   │   │       └── pay
│       │   │   │           └── route.ts
│       │   │   ├── kb
│       │   │   │   └── upload
│       │   │   │       └── route.ts
│       │   │   ├── leads
│       │   │   │   └── capture
│       │   │   │       └── route.ts
│       │   │   ├── marketing
│       │   │   │   ├── platform-status
│       │   │   │   │   └── route.ts
│       │   │   │   └── templates
│       │   │   │       └── route.ts
│       │   │   ├── media
│       │   │   │   ├── whatsapp
│       │   │   │   │   └── [id]
│       │   │   │   │       └── route.ts
│       │   │   │   └── whatsapp-upload
│       │   │   │       └── route.ts
│       │   │   ├── proposals
│       │   │   │   └── [id]
│       │   │   │       └── sign
│       │   │   │           └── route.ts
│       │   │   ├── propuesta
│       │   │   │   └── route.ts
│       │   │   ├── public
│       │   │   │   ├── chat
│       │   │   │   │   └── upload
│       │   │   │   │       └── route.ts
│       │   │   │   ├── leads
│       │   │   │   │   └── route.ts
│       │   │   │   └── proposals
│       │   │   │       └── [token]
│       │   │   │           ├── route.ts
│       │   │   │           ├── sign
│       │   │   │           │   └── route.ts
│       │   │   │           └── view
│       │   │   │               └── route.ts
│       │   │   ├── serve
│       │   │   │   └── [...path]
│       │   │   │       └── route.ts
│       │   │   ├── test-flow
│       │   │   ├── test-marketing
│       │   │   │   └── route.ts
│       │   │   ├── track
│       │   │   │   ├── click
│       │   │   │   │   └── route.ts
│       │   │   │   └── open
│       │   │   │       └── route.ts
│       │   │   ├── upload
│       │   │   │   └── route.ts
│       │   │   ├── v1
│       │   │   │   ├── campaigns
│       │   │   │   │   └── route.ts
│       │   │   │   ├── contacts
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       └── route.ts
│       │   │   │   ├── conversations
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       └── messages
│       │   │   │   │           └── route.ts
│       │   │   │   ├── deals
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       ├── route.ts
│       │   │   │   │       └── stage
│       │   │   │   │           └── route.ts
│       │   │   │   ├── leads
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]
│       │   │   │   │       └── route.ts
│       │   │   │   ├── me
│       │   │   │   │   └── route.ts
│       │   │   │   └── webhooks
│       │   │   │       ├── route.ts
│       │   │   │       └── [id]
│       │   │   │           └── route.ts
│       │   │   ├── webhooks
│       │   │   │   ├── agent-proactive
│       │   │   │   │   └── route.ts
│       │   │   │   ├── automation
│       │   │   │   ├── channels
│       │   │   │   │   └── [provider]
│       │   │   │   │       └── route.ts
│       │   │   │   ├── cron
│       │   │   │   │   ├── audiences
│       │   │   │   │   │   └── route.ts
│       │   │   │   │   └── email-worker
│       │   │   │   │       └── route.ts
│       │   │   │   ├── external
│       │   │   │   │   └── route.ts
│       │   │   │   ├── google
│       │   │   │   │   └── route.ts
│       │   │   │   ├── google-leads
│       │   │   │   │   └── route.ts
│       │   │   │   ├── linkedin
│       │   │   │   │   └── route.ts
│       │   │   │   ├── linkedin-leads
│       │   │   │   │   └── route.ts
│       │   │   │   ├── meta
│       │   │   │   │   └── route.ts
│       │   │   │   ├── openclaw
│       │   │   │   │   └── route.ts
│       │   │   │   ├── paypal
│       │   │   │   │   └── route.ts
│       │   │   │   ├── payu
│       │   │   │   │   └── route.ts
│       │   │   │   ├── pse
│       │   │   │   │   └── route.ts
│       │   │   │   ├── resend
│       │   │   │   │   └── route.ts
│       │   │   │   ├── stripe
│       │   │   │   │   └── route.ts
│       │   │   │   ├── tiktok
│       │   │   │   │   └── route.ts
│       │   │   │   ├── video-analytics
│       │   │   │   │   └── route.ts
│       │   │   │   ├── whatsapp
│       │   │   │   │   └── route.ts
│       │   │   │   └── [workflowId]
│       │   │   │       └── route.ts
│       │   │   └── workflows
│       │   │       ├── execute
│       │   │       │   └── route.ts
│       │   │       ├── executions
│       │   │       │   └── [id]
│       │   │       │       └── route.ts
│       │   │       └── resume
│       │   │           └── [executionId]
│       │   │               └── route.ts
│       │   ├── apple-app-site-association
│       │   │   └── route.ts
│       │   ├── atom.xml
│       │   │   └── route.ts
│       │   ├── auth
│       │   │   └── pending-approval
│       │   │       └── page.tsx
│       │   ├── favicon.ico
│       │   ├── l
│       │   │   └── [slug]
│       │   │       └── route.ts
│       │   ├── layout.tsx
│       │   ├── meta.json
│       │   │   └── route.ts
│       │   ├── not-found.tsx
│       │   ├── proposal
│       │   │   └── [token]
│       │   │       └── page.tsx
│       │   ├── robots.ts
│       │   ├── rss
│       │   │   └── route.ts
│       │   ├── sitemap.ts
│       │   ├── sitemap.txt
│       │   │   └── route.ts
│       │   ├── sitemap.xml.gz
│       │   │   └── route.ts
│       │   ├── sitemaps.xml
│       │   │   └── route.ts
│       │   ├── sitemap_index.xml
│       │   │   └── route.ts
│       │   ├── test-cloudinary
│       │   │   └── page.tsx
│       │   ├── test_auth_debug
│       │   │   └── page.tsx
│       │   ├── widget
│       │   │   └── chat
│       │   │       ├── chat-widget-embed.tsx
│       │   │       └── page.tsx
│       │   └── [locale]
│       │       ├── (marketing)
│       │       │   ├── blog
│       │       │   │   ├── page.tsx
│       │       │   │   └── [slug]
│       │       │   │       └── page.tsx
│       │       │   ├── contacto
│       │       │   │   └── page.tsx
│       │       │   ├── data-deletion
│       │       │   │   ├── layout.tsx
│       │       │   │   └── page.tsx
│       │       │   ├── docs
│       │       │   │   └── api
│       │       │   │       └── page.tsx
│       │       │   ├── flyering
│       │       │   │   └── page.tsx
│       │       │   ├── layout.tsx
│       │       │   ├── metodologia
│       │       │   │   └── page.tsx
│       │       │   ├── nosotros
│       │       │   │   └── page.tsx
│       │       │   ├── page.tsx
│       │       │   ├── politica-cookies
│       │       │   │   ├── cookies-content.tsx
│       │       │   │   └── page.tsx
│       │       │   ├── politica-privacidad
│       │       │   │   ├── page.tsx
│       │       │   │   └── privacy-content.tsx
│       │       │   ├── portfolio
│       │       │   │   ├── page.tsx
│       │       │   │   └── [slug]
│       │       │   │       └── page.tsx
│       │       │   ├── recursos
│       │       │   │   └── guia-pagina-web
│       │       │   │       └── page.tsx
│       │       │   ├── servicios
│       │       │   │   ├── layout.tsx
│       │       │   │   └── page.tsx
│       │       │   ├── sitemap
│       │       │   │   ├── layout.tsx
│       │       │   │   └── page.tsx
│       │       │   ├── soluciones
│       │       │   │   ├── automatizacion
│       │       │   │   │   └── page.tsx
│       │       │   │   ├── creacion-contenido
│       │       │   │   │   └── page.tsx
│       │       │   │   ├── estrategia
│       │       │   │   │   └── page.tsx
│       │       │   │   ├── estrategia-de-marca
│       │       │   │   │   └── page.tsx
│       │       │   │   └── web-dev
│       │       │   │       └── page.tsx
│       │       │   ├── suscripcion
│       │       │   │   ├── cancelado
│       │       │   │   ├── exito
│       │       │   │   └── page.tsx
│       │       │   ├── tarifario
│       │       │   │   └── page.tsx
│       │       │   ├── terms
│       │       │   │   ├── page.tsx
│       │       │   │   └── terms-content.tsx
│       │       │   └── vip
│       │       │       └── page.tsx
│       │       └── invoice
│       │           └── [token]
│       │               └── page.tsx
│       ├── auth.config.ts
│       ├── bin
│       │   └── socket-server.js
│       ├── components
│       │   ├── agents
│       │   │   └── voice-widget.tsx
│       │   ├── ai
│       │   │   └── cognitive-agent-chat.tsx
│       │   ├── analytics
│       │   │   └── analytics-provider.tsx
│       │   ├── automation
│       │   │   ├── CustomNodes.tsx
│       │   │   ├── NodeConfigPanel.tsx
│       │   │   └── Sidebar.tsx
│       │   ├── blog
│       │   │   ├── blog-comments.tsx
│       │   │   ├── blog-content-viewer.tsx
│       │   │   ├── blog-engagement.tsx
│       │   │   ├── blog-faq.tsx
│       │   │   ├── blog-filters.tsx
│       │   │   ├── blog-post-components.tsx
│       │   │   ├── blog-search.tsx
│       │   │   ├── comments-admin-client.tsx
│       │   │   ├── index.ts
│       │   │   └── newsletter.tsx
│       │   ├── chat
│       │   │   ├── audio-player.tsx
│       │   │   ├── chat-widget.tsx
│       │   │   ├── chat-window.tsx
│       │   │   ├── emoji-picker.tsx
│       │   │   ├── file-attachment.tsx
│       │   │   ├── lead-form.tsx
│       │   │   └── sound-notifications.tsx
│       │   ├── cms
│       │   │   ├── category-selector.tsx
│       │   │   ├── character-counter.tsx
│       │   │   ├── faq-manager.tsx
│       │   │   ├── gallery-manager.tsx
│       │   │   ├── image-upload-preview.tsx
│       │   │   ├── post-form.tsx
│       │   │   ├── project-category-selector.tsx
│       │   │   ├── project-form.tsx
│       │   │   ├── project-list.tsx
│       │   │   ├── project-tag-input.tsx
│       │   │   ├── related-project-selector.tsx
│       │   │   ├── rich-text-editor.tsx
│       │   │   ├── social-preview.tsx
│       │   │   ├── tag-input.tsx
│       │   │   ├── team-member-input.tsx
│       │   │   └── tech-stack-selector.tsx
│       │   ├── content-creation
│       │   │   ├── content-hero.tsx
│       │   │   ├── content-showcase.tsx
│       │   │   ├── particles-canvas.tsx
│       │   │   ├── process-workflow.tsx
│       │   │   ├── roi-calculator.tsx
│       │   │   └── social-proof-section.tsx
│       │   ├── crm
│       │   │   ├── AiForecastWidget.tsx
│       │   │   ├── campaign-components.tsx
│       │   │   ├── convert-to-deal-dialog.tsx
│       │   │   ├── create-deal-dialog.tsx
│       │   │   ├── create-lead-dialog.tsx
│       │   │   ├── CsvImportDialog.tsx
│       │   │   ├── deal-activity-timeline.tsx
│       │   │   ├── deal-aging-alerts.tsx
│       │   │   ├── DealAssignSelect.tsx
│       │   │   ├── DealStageTimeline.tsx
│       │   │   ├── email-templates-client.tsx
│       │   │   ├── export-button.tsx
│       │   │   ├── goal-progress.tsx
│       │   │   ├── InvoicesPanel.tsx
│       │   │   ├── kpi-cards.tsx
│       │   │   ├── lead-delete-button.tsx
│       │   │   ├── lead-events-widget.tsx
│       │   │   ├── lead-profile-header.tsx
│       │   │   ├── lead-score-editor.tsx
│       │   │   ├── lead-sources.tsx
│       │   │   ├── lead-status-selector.tsx
│       │   │   ├── lead-sticky-actions.tsx
│       │   │   ├── lead-tags-editor.tsx
│       │   │   ├── lead-unified-timeline.tsx
│       │   │   ├── leads-table.tsx
│       │   │   ├── log-call-dialog.tsx
│       │   │   ├── lost-reason-chart.tsx
│       │   │   ├── object-tabs.tsx
│       │   │   ├── pipeline-velocity.tsx
│       │   │   ├── ProposalPanel.tsx
│       │   │   ├── quick-actions.tsx
│       │   │   ├── quick-note-dialog.tsx
│       │   │   ├── recent-activity.tsx
│       │   │   ├── recent-automations.tsx
│       │   │   ├── revenue-forecast.tsx
│       │   │   ├── sales-funnel.tsx
│       │   │   ├── sales-leaderboard.tsx
│       │   │   ├── scoring-rules-client.tsx
│       │   │   ├── tasks-board.tsx
│       │   │   ├── top-deals.tsx
│       │   │   ├── WhatsAppFloatingBtn.tsx
│       │   │   └── WhatsAppTemplates.tsx
│       │   ├── dashboard
│       │   │   ├── DashboardSidebar.tsx
│       │   │   ├── DashboardUI.tsx
│       │   │   ├── MobileSidebarWrapper.tsx
│       │   │   ├── notification-bell.tsx
│       │   │   ├── RoleSelector.tsx
│       │   │   ├── sidebar-client-content.tsx
│       │   │   └── sidebar-controller.tsx
│       │   ├── date-range-picker.tsx
│       │   ├── events
│       │   │   ├── CalendarBoard.tsx
│       │   │   ├── DealSelector.tsx
│       │   │   ├── EventDrawer.tsx
│       │   │   ├── EventFilters.tsx
│       │   │   ├── events-client.tsx
│       │   │   └── LeadSelector.tsx
│       │   ├── experts
│       │   │   ├── ExpertCard.tsx
│       │   │   ├── ExpertForm.tsx
│       │   │   ├── ExpertStats.tsx
│       │   │   ├── ExpertToolbar.tsx
│       │   │   ├── form-sections
│       │   │   │   ├── ExpertBasicInfo.tsx
│       │   │   │   ├── ExpertIdentitySkills.tsx
│       │   │   │   └── ExpertSocialNetworks.tsx
│       │   │   └── SortableExpertItem.tsx
│       │   ├── forms
│       │   │   └── vip-form.tsx
│       │   ├── hr
│       │   │   ├── time-off-manager.tsx
│       │   │   └── timesheet-manager.tsx
│       │   ├── inbox
│       │   │   ├── audit-timeline.tsx
│       │   │   ├── channel-icon.tsx
│       │   │   ├── chat-window.tsx
│       │   │   ├── contact-sidebar.tsx
│       │   │   ├── conversation-list.tsx
│       │   │   ├── draft-composer.tsx
│       │   │   ├── inbox-command-menu.tsx
│       │   │   ├── inbox-layout.tsx
│       │   │   ├── merge-modal.tsx
│       │   │   ├── meta-sync-button.tsx
│       │   │   ├── quick-replies.tsx
│       │   │   ├── realtime-refresher.tsx
│       │   │   ├── right-sidebar.tsx
│       │   │   ├── simulation-panel.tsx
│       │   │   ├── sla-badge.tsx
│       │   │   └── thread-view.tsx
│       │   ├── integrations-form.tsx
│       │   ├── layout
│       │   │   ├── client-decorative-elements.tsx
│       │   │   ├── custom-cursor.tsx
│       │   │   ├── decorative-elements.tsx
│       │   │   ├── footer.tsx
│       │   │   ├── header.tsx
│       │   │   ├── ia-status.tsx
│       │   │   ├── language-switcher.tsx
│       │   │   ├── top-bar.tsx
│       │   │   └── whatsapp-button.tsx
│       │   ├── marketing
│       │   │   ├── approvals
│       │   │   │   └── ApprovalsDashboardClient.tsx
│       │   │   ├── asset-library-modal.tsx
│       │   │   ├── campaign-wizard
│       │   │   │   ├── ad-group-manager.tsx
│       │   │   │   ├── ad-preview.tsx
│       │   │   │   ├── brand-manual-panel.tsx
│       │   │   │   ├── index.tsx
│       │   │   │   ├── location-map.tsx
│       │   │   │   ├── step-budget.tsx
│       │   │   │   ├── step-creative.tsx
│       │   │   │   ├── step-launch.tsx
│       │   │   │   ├── step-platform.tsx
│       │   │   │   ├── step-preflight.tsx
│       │   │   │   ├── step-targeting.tsx
│       │   │   │   ├── step-templates.tsx
│       │   │   │   └── wizard-store.ts
│       │   │   ├── CampaignMetricsCards.tsx
│       │   │   ├── CampaignsDashboardClient.tsx
│       │   │   ├── creative-studio
│       │   │   │   ├── ab-test-dashboard.tsx
│       │   │   │   ├── annotation-canvas.tsx
│       │   │   │   ├── asset-collections-panel.tsx
│       │   │   │   ├── asset-gallery.tsx
│       │   │   │   ├── batch-engine.tsx
│       │   │   │   ├── brand-kit-panel.tsx
│       │   │   │   ├── copy-generator.tsx
│       │   │   │   ├── copy-scorer.tsx
│       │   │   │   ├── creative-insights.tsx
│       │   │   │   ├── creative-studio.tsx
│       │   │   │   ├── drive-importer.tsx
│       │   │   │   ├── export-kit.tsx
│       │   │   │   ├── image-generator.tsx
│       │   │   │   ├── layer-editor.tsx
│       │   │   │   ├── platform-preview.tsx
│       │   │   │   ├── safety-badge.tsx
│       │   │   │   ├── version-history.tsx
│       │   │   │   └── video-generator.tsx
│       │   │   ├── email-blast
│       │   │   │   ├── AudienceManager.tsx
│       │   │   │   ├── EmailBlastDashboard.tsx
│       │   │   │   └── EmailBlastWizard.tsx
│       │   │   ├── hub
│       │   │   │   └── unified-metrics-dashboard.tsx
│       │   │   ├── MarketingSettingsClient.tsx
│       │   │   ├── post-analytics-card.tsx
│       │   │   ├── pricing
│       │   │   │   ├── PricingDashboard.tsx
│       │   │   │   ├── PricingFormModal.tsx
│       │   │   │   ├── PricingTable.tsx
│       │   │   │   ├── PublicPricingClient.tsx
│       │   │   │   └── TermsAndConditions.tsx
│       │   │   ├── SmartRulesDrawer.tsx
│       │   │   ├── social-calendar.tsx
│       │   │   ├── social-comments.tsx
│       │   │   ├── social-composer-drawer.tsx
│       │   │   ├── social-listening-dashboard.tsx
│       │   │   └── social-live-preview.tsx
│       │   ├── onboarding
│       │   │   └── wizard.tsx
│       │   ├── operations
│       │   │   ├── advanced-task-create-modal.tsx
│       │   │   ├── asset-proofing.tsx
│       │   │   ├── global-timer.tsx
│       │   │   ├── kanban-analytics.tsx
│       │   │   ├── kanban-global-search.tsx
│       │   │   ├── kanban-setup.tsx
│       │   │   ├── new-project-modal.tsx
│       │   │   ├── new-task-modal.tsx
│       │   │   ├── operations-dashboard-client.tsx
│       │   │   ├── project-settings-modal.tsx
│       │   │   ├── project-switcher.tsx
│       │   │   ├── swimlane-kanban.tsx
│       │   │   ├── task-detail-modal.tsx
│       │   │   └── template-picker.tsx
│       │   ├── organization
│       │   │   ├── organization-canvas.tsx
│       │   │   ├── team-config-panel.tsx
│       │   │   └── team-node.tsx
│       │   ├── portfolio
│       │   │   ├── grid-editor.tsx
│       │   │   ├── index.ts
│       │   │   ├── media-renderer.tsx
│       │   │   ├── portfolio-client.tsx
│       │   │   ├── portfolio-list.tsx
│       │   │   ├── project-gallery.tsx
│       │   │   ├── social-profile-editor.tsx
│       │   │   └── sortable-grid-item.tsx
│       │   ├── providers.tsx
│       │   ├── sales
│       │   │   ├── commission-rule-form-client.tsx
│       │   │   ├── comp-plan-panel.tsx
│       │   │   ├── goals-hierarchy-tree.tsx
│       │   │   ├── leaderboard-gamification.tsx
│       │   │   ├── sales-forecasting-chart.tsx
│       │   │   └── sales-goal-form-client.tsx
│       │   ├── search
│       │   │   └── global-search.tsx
│       │   ├── sections
│       │   │   ├── bento-services.tsx
│       │   │   ├── case-studies.tsx
│       │   │   ├── contact-form.tsx
│       │   │   ├── contact-section.tsx
│       │   │   ├── corporate-hero.tsx
│       │   │   ├── corporate-philosophy.tsx
│       │   │   ├── corporate-values.tsx
│       │   │   ├── cta.tsx
│       │   │   ├── faq-accordion.tsx
│       │   │   ├── flyering-benefits.tsx
│       │   │   ├── flyering-hero
│       │   │   │   ├── hero-background.tsx
│       │   │   │   ├── hero-dashboard.tsx
│       │   │   │   ├── use-glitch-text.ts
│       │   │   │   └── use-hero-parallax.ts
│       │   │   ├── flyering-hero.tsx
│       │   │   ├── flyering-services.tsx
│       │   │   ├── futuristic-hero.tsx
│       │   │   ├── guia-web-anatomy.tsx
│       │   │   ├── guia-web-hero.tsx
│       │   │   ├── guia-web-roadmap.tsx
│       │   │   ├── hero.tsx
│       │   │   ├── infinite-logos.tsx
│       │   │   ├── latest-posts.tsx
│       │   │   ├── lead-capture-form.tsx
│       │   │   ├── lead-magnet-form.tsx
│       │   │   ├── logo-trust.tsx
│       │   │   ├── methodology.tsx
│       │   │   ├── omnichannel-showcase.tsx
│       │   │   ├── portfolio-preview.tsx
│       │   │   ├── pricing-tables.tsx
│       │   │   ├── process-timeline.tsx
│       │   │   ├── services-preview.tsx
│       │   │   ├── services-sidebar.tsx
│       │   │   ├── services-tabs.tsx
│       │   │   ├── stats.tsx
│       │   │   ├── strategic-alliances.tsx
│       │   │   ├── team-grid.tsx
│       │   │   ├── tech-stack.tsx
│       │   │   ├── testimonial-slider.tsx
│       │   │   └── value-proposition.tsx
│       │   ├── seo
│       │   │   ├── json-ld.tsx
│       │   │   └── structured-data.tsx
│       │   ├── session-refresher.tsx
│       │   ├── settings
│       │   │   ├── active-sessions.tsx
│       │   │   ├── advanced-user-directory.tsx
│       │   │   ├── agent-skills-manager.tsx
│       │   │   ├── agent-specializations.tsx
│       │   │   ├── agent-team-manager.tsx
│       │   │   ├── ahrefs-integrations.tsx
│       │   │   ├── ai-models-integrations.tsx
│       │   │   ├── audience-sync-button.tsx
│       │   │   ├── backup-codes-modal.tsx
│       │   │   ├── billing-card.tsx
│       │   │   ├── change-password-form.tsx
│       │   │   ├── custom-domain-settings.tsx
│       │   │   ├── danger-zone.tsx
│       │   │   ├── default-company-settings.tsx
│       │   │   ├── email-domain-card.tsx
│       │   │   ├── global-agent-config.tsx
│       │   │   ├── global-email-templates.tsx
│       │   │   ├── google-integrations.tsx
│       │   │   ├── hotjar-integrations.tsx
│       │   │   ├── integration-app-card.tsx
│       │   │   ├── integration-config-dialog.tsx
│       │   │   ├── integrations-health-summary.tsx
│       │   │   ├── integrations-toast-handler.tsx
│       │   │   ├── knowledge-base-manager.tsx
│       │   │   ├── linkedin-family-config.tsx
│       │   │   ├── login-history-table.tsx
│       │   │   ├── meta-connect-button.tsx
│       │   │   ├── meta-family-config.tsx
│       │   │   ├── meta-integrations.tsx
│       │   │   ├── model-selector-panel.tsx
│       │   │   ├── new-integration-card.tsx
│       │   │   ├── password-policies.tsx
│       │   │   ├── payu-integrations.tsx
│       │   │   ├── roles-permissions-editor.tsx
│       │   │   ├── session-management-table.tsx
│       │   │   ├── settings-sidebar.tsx
│       │   │   ├── skill-templates-library.tsx
│       │   │   ├── skillchain-manager.tsx
│       │   │   ├── sla-alert-settings.tsx
│       │   │   ├── stripe-integrations.tsx
│       │   │   ├── tiktok-family-config.tsx
│       │   │   ├── two-factor-toggle.tsx
│       │   │   ├── video-asset-config-dialog.tsx
│       │   │   ├── video-assets-integrations.tsx
│       │   │   └── white-labeling-settings.tsx
│       │   ├── settings-form.tsx
│       │   ├── subscription
│       │   │   ├── plan-card.tsx
│       │   │   ├── plan-selector.tsx
│       │   │   └── pricing-toggle.tsx
│       │   ├── theme-provider.tsx
│       │   ├── tools
│       │   │   ├── project-estimator.tsx
│       │   │   └── roi-calculator.tsx
│       │   ├── ui
│       │   │   ├── accordion.tsx
│       │   │   ├── alert.tsx
│       │   │   ├── ambient-background.tsx
│       │   │   ├── avatar.tsx
│       │   │   ├── back-to-top.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── calendar.tsx
│       │   │   ├── card.tsx
│       │   │   ├── checkbox.tsx
│       │   │   ├── command-menu.tsx
│       │   │   ├── command.tsx
│       │   │   ├── context-menu.tsx
│       │   │   ├── cookie-consent.tsx
│       │   │   ├── custom-cursor.tsx
│       │   │   ├── dark-rich-text-editor.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── empty-state.tsx
│       │   │   ├── error-boundary.tsx
│       │   │   ├── exit-intent-popup.tsx
│       │   │   ├── form.tsx
│       │   │   ├── image-upload.tsx
│       │   │   ├── index.ts
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── lightbox.tsx
│       │   │   ├── loading.tsx
│       │   │   ├── magnetic-button.tsx
│       │   │   ├── media-uploader.tsx
│       │   │   ├── meteor-card.tsx
│       │   │   ├── modal.tsx
│       │   │   ├── mount-guard.tsx
│       │   │   ├── newsletter-popup.tsx
│       │   │   ├── page-transition.tsx
│       │   │   ├── pagination.tsx
│       │   │   ├── popover.tsx
│       │   │   ├── progress.tsx
│       │   │   ├── scarcity-timer.tsx
│       │   │   ├── scramble-text.tsx
│       │   │   ├── scroll-area.tsx
│       │   │   ├── scroll-progress.tsx
│       │   │   ├── select.tsx
│       │   │   ├── separator.tsx
│       │   │   ├── sheet.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── slide-over.tsx
│       │   │   ├── slider.tsx
│       │   │   ├── social-links-input.tsx
│       │   │   ├── social-share.tsx
│       │   │   ├── spotlight-card.tsx
│       │   │   ├── status-badge.tsx
│       │   │   ├── switch.tsx
│       │   │   ├── table.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── textarea.tsx
│       │   │   ├── tooltip.tsx
│       │   │   └── whatsapp-float.tsx
│       │   ├── users
│       │   │   ├── modals
│       │   │   │   └── InviteMemberModal.tsx
│       │   │   ├── table
│       │   │   │   └── UsersTable.tsx
│       │   │   ├── UserDrawer.tsx
│       │   │   └── UsersDashboardClient.tsx
│       │   └── video-editor
│       │       ├── ai-suggestions-panel.tsx
│       │       ├── audio-mixer.tsx
│       │       ├── color-grading-panel.tsx
│       │       ├── export-panel.tsx
│       │       ├── footage-analyzer.tsx
│       │       ├── project-config-panel.tsx
│       │       ├── project-progress-bar.tsx
│       │       ├── quality-checklist.tsx
│       │       ├── speed-ramping-panel.tsx
│       │       ├── text-overlays-editor.tsx
│       │       ├── timeline-generator.tsx
│       │       ├── video-editor-studio.tsx
│       │       └── video-editor-wizard.tsx
│       ├── cypress
│       │   ├── downloads
│       │   │   └── downloads.htm
│       │   ├── e2e
│       │   │   ├── 1-getting-started
│       │   │   │   └── todo.cy.js
│       │   │   └── 2-advanced-examples
│       │   │       ├── actions.cy.js
│       │   │       ├── aliasing.cy.js
│       │   │       ├── assertions.cy.js
│       │   │       ├── connectors.cy.js
│       │   │       ├── cookies.cy.js
│       │   │       ├── cypress_api.cy.js
│       │   │       ├── files.cy.js
│       │   │       ├── location.cy.js
│       │   │       ├── misc.cy.js
│       │   │       ├── navigation.cy.js
│       │   │       ├── network_requests.cy.js
│       │   │       ├── querying.cy.js
│       │   │       ├── spies_stubs_clocks.cy.js
│       │   │       ├── storage.cy.js
│       │   │       ├── traversal.cy.js
│       │   │       ├── utilities.cy.js
│       │   │       ├── viewport.cy.js
│       │   │       ├── waiting.cy.js
│       │   │       └── window.cy.js
│       │   ├── fixtures
│       │   │   ├── example.json
│       │   │   ├── profile.json
│       │   │   └── users.json
│       │   ├── screenshots
│       │   │   └── 2-advanced-examples
│       │   │       └── misc.cy.js
│       │   │           ├── Misc -- cy.exec() - execute a system command (failed).png
│       │   │           └── my-image.png
│       │   └── support
│       │       ├── commands.ts
│       │       └── e2e.ts
│       ├── cypress.config.ts
│       ├── data
│       │   └── models
│       │       └── 37ad3366-cee1-4f8e-8101-b97119f2542f_naive_bayes.json
│       ├── eslint.config.mjs
│       ├── google-credentials.json
│       ├── hooks
│       │   ├── use-exit-intent.ts
│       │   ├── use-facebook-pixel.ts
│       │   ├── use-inbox-shortcuts.ts
│       │   ├── use-inbox-socket.ts
│       │   ├── use-inbox-sync.ts
│       │   ├── use-mouse-position.ts
│       │   └── use-scroll-progress.ts
│       ├── i18n
│       │   ├── navigation.ts
│       │   ├── request.ts
│       │   └── routing.ts
│       ├── lib
│       │   ├── agent-runner.ts
│       │   ├── agent-tools.ts
│       │   ├── ai
│       │   │   ├── system-prompt.ts
│       │   │   └── tools
│       │   │       └── agency-tools.ts
│       │   ├── ai-provider.ts
│       │   ├── ai.ts
│       │   ├── analytics.ts
│       │   ├── api-v1
│       │   │   ├── auth.ts
│       │   │   ├── rate-limit.ts
│       │   │   ├── response.ts
│       │   │   └── types.ts
│       │   ├── asset-cache.ts
│       │   ├── audit.ts
│       │   ├── auth-api.ts
│       │   ├── auth-context.ts
│       │   ├── auth.ts
│       │   ├── billing
│       │   │   └── usage.ts
│       │   ├── company-utils.ts
│       │   ├── crm-charts-config.ts
│       │   ├── crm-config.ts
│       │   ├── csv-export.ts
│       │   ├── data.ts
│       │   ├── db.ts
│       │   ├── debug-guard.ts
│       │   ├── dian.ts
│       │   ├── email-templates.ts
│       │   ├── email.ts
│       │   ├── embeddings.ts
│       │   ├── errors.ts
│       │   ├── ga4-mp.ts
│       │   ├── guard.ts
│       │   ├── inbox
│       │   │   ├── audit.ts
│       │   │   ├── cache.ts
│       │   │   ├── index.ts
│       │   │   ├── merge.ts
│       │   │   ├── sla.ts
│       │   │   ├── socket.ts
│       │   │   ├── templates.ts
│       │   │   ├── threading.ts
│       │   │   └── webhooks.ts
│       │   ├── integration-config-service.ts
│       │   ├── integrations
│       │   │   ├── facebook.ts
│       │   │   ├── instagram.ts
│       │   │   ├── linkedin.ts
│       │   │   ├── mock.ts
│       │   │   ├── openclaw.ts
│       │   │   ├── providers.ts
│       │   │   ├── sync
│       │   │   │   └── hubspot.service.ts
│       │   │   ├── twitter.ts
│       │   │   ├── types.ts
│       │   │   ├── utils.ts
│       │   │   ├── whatsapp.ts
│       │   │   └── youtube.ts
│       │   ├── integrations.ts
│       │   ├── lead-source-detector.ts
│       │   ├── linkedin-capi.ts
│       │   ├── logger.ts
│       │   ├── meta-capi.ts
│       │   ├── meta-service.ts
│       │   ├── mfa.ts
│       │   ├── ml
│       │   │   ├── audience-clustering.ts
│       │   │   ├── embeddings.ts
│       │   │   ├── lead-scoring-model.ts
│       │   │   ├── mab-optimizer.ts
│       │   │   ├── markov-attribution.ts
│       │   │   ├── sentiment-analyzer.ts
│       │   │   └── video-retention-model.ts
│       │   ├── notifications.ts
│       │   ├── payment-gateway.ts
│       │   ├── paypal.ts
│       │   ├── payroll.ts
│       │   ├── payu.ts
│       │   ├── plans-config.ts
│       │   ├── prisma.ts
│       │   ├── providers
│       │   │   ├── push-provider.ts
│       │   │   └── slack-provider.ts
│       │   ├── pse.ts
│       │   ├── quotas.ts
│       │   ├── rate-limit.ts
│       │   ├── rbac-routes.ts
│       │   ├── rbac.ts
│       │   ├── role-config.ts
│       │   ├── sanitize.ts
│       │   ├── schemas.ts
│       │   ├── security.ts
│       │   ├── services
│       │   │   ├── agent-team-engine.ts
│       │   │   ├── ai-inbox.ts
│       │   │   ├── ai-tools.ts
│       │   │   ├── audiences
│       │   │   │   ├── meta.ts
│       │   │   │   └── sync.ts
│       │   │   ├── context-grader.ts
│       │   │   ├── conversions
│       │   │   │   └── dispatcher.ts
│       │   │   ├── lead-scoring.ts
│       │   │   ├── meta-sync.ts
│       │   │   ├── ml
│       │   │   │   ├── attribution.ts
│       │   │   │   ├── lead-scorer.ts
│       │   │   │   └── ltv-cluster.ts
│       │   │   ├── query-decomposer.ts
│       │   │   ├── refrag-engine.ts
│       │   │   └── skillchain-engine.ts
│       │   ├── site-config.ts
│       │   ├── stores
│       │   │   └── ui-store.ts
│       │   ├── stripe.ts
│       │   ├── tenant-prisma.ts
│       │   ├── tiktok-capi.ts
│       │   ├── token-manager.ts
│       │   ├── universal-model-registry.ts
│       │   ├── utils
│       │   │   └── crypto-hasher.ts
│       │   ├── utils.ts
│       │   ├── validators
│       │   │   └── platform-validators.ts
│       │   ├── whatsapp-service.ts
│       │   └── workflow-executor.ts
│       ├── messages
│       │   ├── en.json
│       │   └── es.json
│       ├── middleware.ts
│       ├── modules
│       │   ├── analytics
│       │   │   ├── actions
│       │   │   │   ├── analytics.ts
│       │   │   │   ├── bi-tenant.ts
│       │   │   │   └── index.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   ├── ab-test-results.tsx
│       │   │   │   ├── activity-heatmap.tsx
│       │   │   │   ├── analytics-provider.tsx
│       │   │   │   ├── annotations-timeline.tsx
│       │   │   │   ├── bi-section-skeleton.tsx
│       │   │   │   ├── bounce-trend.tsx
│       │   │   │   ├── browser-os-stats.tsx
│       │   │   │   ├── channel-attribution.tsx
│       │   │   │   ├── date-range-selector.tsx
│       │   │   │   ├── device-chart.tsx
│       │   │   │   ├── engagement-radar.tsx
│       │   │   │   ├── export-button.tsx
│       │   │   │   ├── fullscreen-button.tsx
│       │   │   │   ├── funnel-chart.tsx
│       │   │   │   ├── geo-map.tsx
│       │   │   │   ├── goals-widget.tsx
│       │   │   │   ├── index.ts
│       │   │   │   ├── kpi-alerts.tsx
│       │   │   │   ├── live-visitors-map.tsx
│       │   │   │   ├── overview.tsx
│       │   │   │   ├── page-speed-metrics.tsx
│       │   │   │   ├── performance-metrics.tsx
│       │   │   │   ├── performance-score.tsx
│       │   │   │   ├── period-comparison.tsx
│       │   │   │   ├── quick-insights.tsx
│       │   │   │   ├── realtime-indicator.tsx
│       │   │   │   ├── refresh-selector.tsx
│       │   │   │   ├── revenue-tracker.tsx
│       │   │   │   ├── schedule-dialog.tsx
│       │   │   │   ├── search-terms-cloud.tsx
│       │   │   │   ├── seo-metrics.tsx
│       │   │   │   ├── session-histogram.tsx
│       │   │   │   ├── social-media-metrics.tsx
│       │   │   │   ├── tenant-bi-dashboard.tsx
│       │   │   │   ├── tenant-bi-wrapper.tsx
│       │   │   │   ├── theme-toggle.tsx
│       │   │   │   ├── top-pages.tsx
│       │   │   │   ├── track-page-event.tsx
│       │   │   │   ├── traffic-chart.tsx
│       │   │   │   ├── traffic-sources.tsx
│       │   │   │   └── user-flow.tsx
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   └── index.ts
│       │   │   ├── TOOLTIP_MIGRATION.md
│       │   │   └── types
│       │   │       └── index.ts
│       │   ├── auth
│       │   │   ├── actions
│       │   │   │   ├── auth.ts
│       │   │   │   └── index.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   ├── auth-guard.tsx
│       │   │   │   ├── index.ts
│       │   │   │   ├── login-form.tsx
│       │   │   │   └── register-form.tsx
│       │   │   ├── hooks
│       │   │   │   ├── index.ts
│       │   │   │   └── use-auth.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   ├── auth.ts
│       │   │   │   ├── index.ts
│       │   │   │   └── validations.ts
│       │   │   └── types
│       │   │       └── index.ts
│       │   ├── blog
│       │   │   ├── actions
│       │   │   │   ├── blog.ts
│       │   │   │   └── index.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   ├── blog-comments.tsx
│       │   │   │   ├── blog-content-viewer.tsx
│       │   │   │   ├── blog-engagement.tsx
│       │   │   │   ├── blog-filters.tsx
│       │   │   │   ├── blog-post-components.tsx
│       │   │   │   ├── blog-search.tsx
│       │   │   │   ├── comment-like-button.tsx
│       │   │   │   ├── index.ts
│       │   │   │   └── newsletter.tsx
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   ├── index.ts
│       │   │   │   ├── utils.ts
│       │   │   │   └── validations.ts
│       │   │   └── types
│       │   │       └── index.ts
│       │   ├── crm
│       │   │   ├── actions
│       │   │   │   ├── crm.ts
│       │   │   │   └── index.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   ├── ActivityFeed.tsx
│       │   │   │   ├── CampaignManager.tsx
│       │   │   │   ├── create-object-dialog.tsx
│       │   │   │   ├── create-team-dialog.tsx
│       │   │   │   ├── CsvExportButton.tsx
│       │   │   │   ├── DealCard.tsx
│       │   │   │   ├── DealContextMenu.tsx
│       │   │   │   ├── DealDetailsDialog.tsx
│       │   │   │   ├── DealExport.tsx
│       │   │   │   ├── fields-manager.tsx
│       │   │   │   ├── index.ts
│       │   │   │   ├── KanbanBoard.tsx
│       │   │   │   ├── LeadDashboard.tsx
│       │   │   │   ├── LeadSourceBadge.tsx
│       │   │   │   ├── NewDealDialog.tsx
│       │   │   │   ├── object-tabs.tsx
│       │   │   │   ├── permissions-manager.tsx
│       │   │   │   ├── relationships-manager.tsx
│       │   │   │   └── team-hierarchy.tsx
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   ├── crm-config.ts
│       │   │   │   └── index.ts
│       │   │   └── types
│       │   │       └── index.ts
│       │   ├── leads
│       │   │   ├── actions
│       │   │   │   ├── index.ts
│       │   │   │   └── leads.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   └── index.ts
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   ├── index.ts
│       │   │   │   ├── lead-source-detector.ts
│       │   │   │   ├── utils.ts
│       │   │   │   └── validations.ts
│       │   │   └── types
│       │   │       └── index.ts
│       │   ├── marketing
│       │   │   ├── actions
│       │   │   │   ├── index.ts
│       │   │   │   └── marketing.ts
│       │   │   ├── api
│       │   │   ├── components
│       │   │   │   ├── attribution-chart.tsx
│       │   │   │   ├── CustomNodes.tsx
│       │   │   │   ├── date-range-picker.tsx
│       │   │   │   ├── index.ts
│       │   │   │   ├── NodeConfigPanel.tsx
│       │   │   │   └── Sidebar.tsx
│       │   │   ├── hooks
│       │   │   │   └── index.ts
│       │   │   ├── index.ts
│       │   │   ├── lib
│       │   │   │   └── index.ts
│       │   │   └── types
│       │   │       └── index.ts
│       │   └── portfolio
│       │       ├── actions
│       │       │   ├── index.ts
│       │       │   └── projects.ts
│       │       ├── components
│       │       │   ├── index.ts
│       │       │   └── portfolio-list.tsx
│       │       ├── hooks
│       │       │   └── index.ts
│       │       ├── index.ts
│       │       ├── lib
│       │       │   ├── index.ts
│       │       │   ├── utils.ts
│       │       │   └── validations.ts
│       │       └── types
│       │           └── index.ts
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── prisma
│       │   ├── migrations
│       │   │   ├── 20260202121920_analytics
│       │   │   │   └── migration.sql
│       │   │   ├── 20260209212158_add_expert_table
│       │   │   │   └── migration.sql
│       │   │   ├── 20260212164826_add_meta_inbox_constraints
│       │   │   │   └── migration.sql
│       │   │   ├── 20260309043728_add_role_config
│       │   │   │   └── migration.sql
│       │   │   ├── 20260310162515_add_email_blast_tables
│       │   │   │   └── migration.sql
│       │   │   ├── 20260322000000_init_notifications
│       │   │   │   └── migration.sql
│       │   │   ├── 20260322_add_notifications
│       │   │   │   └── migration.sql
│       │   │   ├── 20260506120000_sync_inbox_schema
│       │   │   │   └── migration.sql
│       │   │   └── migration_lock.toml
│       │   ├── schema.prisma
│       │   ├── seed.js
│       │   └── seeds
│       │       └── seedPricing.ts
│       ├── public
│       │   ├── apple-touch-icon.png
│       │   ├── favicon-16x16.png
│       │   ├── favicon.ico
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── grid.svg
│       │   ├── images
│       │   │   ├── IMG_20260305_152613.png
│       │   │   └── team
│       │   │       └── heyber.png
│       │   ├── logo.png
│       │   ├── next.svg
│       │   ├── portfolio
│       │   │   └── goldneez
│       │   │       ├── assets
│       │   │       │   ├── CAFE_FINCA.png
│       │   │       │   ├── molido.png
│       │   │       │   ├── original_bag.jpeg
│       │   │       │   ├── PROTO.png
│       │   │       │   └── tostado.png
│       │   │       ├── index.html
│       │   │       └── logo.png
│       │   ├── scripts
│       │   │   └── loader.js
│       │   ├── site.webmanifest
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── README.md
│       ├── restart-dev.ps1
│       ├── scripts
│       │   ├── check-meta-credentials.ts
│       │   ├── check-meta-status.ts
│       │   ├── check-resend.ts
│       │   ├── check_perms.ts
│       │   ├── check_roles.ts
│       │   ├── check_user.ts
│       │   ├── check_users.ts
│       │   ├── create-superadmin.ts
│       │   ├── cron-daily-report.sh
│       │   ├── db
│       │   │   ├── seed-crm.ts
│       │   │   ├── seed-demo-workflow.ts
│       │   │   ├── seed-direct.ts
│       │   │   ├── seed-inbox.ts
│       │   │   └── seed_workflow.ts
│       │   ├── debug
│       │   │   ├── debug-conversations.ts
│       │   │   ├── debug-meta-connection.ts
│       │   │   ├── debug-verify.js
│       │   │   ├── debug_integrations.js
│       │   │   ├── deep-ig-probe.ts
│       │   │   ├── diagnose-facebook.ts
│       │   │   ├── inspect-conversations.ts
│       │   │   └── meta-sync-audit.ts
│       │   ├── debug-company-sync.ts
│       │   ├── debug-fetch-services.ts
│       │   ├── debug-kanban-company.ts
│       │   ├── debug-kanban-create.ts
│       │   ├── debug-services.ts
│       │   ├── deep-debug-kanban.ts
│       │   ├── demo
│       │   │   ├── demo_full_system.ts
│       │   │   └── demo_omnichannel.ts
│       │   ├── deploy.sh
│       │   ├── diagnose-rbac.ts
│       │   ├── dns-diag.sh
│       │   ├── fix-admin-role.ts
│       │   ├── fix-company-users.ts
│       │   ├── fix-deal-stages.ts
│       │   ├── fix-font-sizes.js
│       │   ├── fix-font-sizes.py
│       │   ├── fix-schema.mjs
│       │   ├── link-users-to-company.ts
│       │   ├── migrate-services-company.ts
│       │   ├── prisma-err.txt
│       │   ├── restore-admin.ts
│       │   ├── schema-backup.prisma
│       │   ├── seed-pdf-workflow.ts
│       │   ├── seed-permissions.ts
│       │   ├── seed-tarifario.ts
│       │   ├── seed-workflow-templates.ts
│       │   ├── setup
│       │   │   ├── complete-vps-setup.sh
│       │   │   ├── create-admin.ts
│       │   │   ├── create_admin.js
│       │   │   ├── deploy.sh
│       │   │   ├── link-facebook-to-admin.ts
│       │   │   ├── link-user.ts
│       │   │   ├── link_facebook_to_admin.js
│       │   │   ├── link_user.sql
│       │   │   ├── link_user_company.js
│       │   │   ├── optimize-postgresql.sh
│       │   │   ├── promote-admin.js
│       │   │   ├── promote_admin.ts
│       │   │   ├── quick-start-vps.sh
│       │   │   ├── reset_admin_password.js
│       │   │   ├── setup-db.sh
│       │   │   ├── setup-e2e-user.ts
│       │   │   ├── setup-monitoring.sh
│       │   │   ├── setup-production-meta.ts
│       │   │   ├── setup-swap.sh
│       │   │   ├── setup_admin.sql
│       │   │   ├── setup_admin_company.js
│       │   │   └── vps-setup.sh
│       │   ├── sync-meta-env.ts
│       │   ├── test-attribution.ts
│       │   ├── test-automation.ts
│       │   ├── test-campaign-sync.ts
│       │   ├── test-capi-events.ts
│       │   ├── test-crm.ts
│       │   ├── test-e2e.ts
│       │   ├── test-email-blast.js
│       │   ├── test-flight-voice.ts
│       │   ├── test-local-limit.ts
│       │   ├── test-ltv-sync.ts
│       │   ├── test-macros-e2e.ts
│       │   ├── test-meta-credentials.ts
│       │   ├── test-notification.ts
│       │   ├── test-notifications.ts
│       │   ├── test-rate-limit.ts
│       │   ├── test-s2s-conversions.ts
│       │   ├── testing
│       │   │   ├── check-account-scope.ts
│       │   │   ├── check-app-mode.ts
│       │   │   ├── check-company-link.ts
│       │   │   ├── check-inbox.ts
│       │   │   ├── check-instagram-details.ts
│       │   │   ├── check-meta-connection.ts
│       │   │   ├── check-permissions-deep.ts
│       │   │   ├── check-pixel.js
│       │   │   ├── check-secret.ts
│       │   │   ├── check-specific-page.ts
│       │   │   ├── check_meta_account.js
│       │   │   ├── check_perms.js
│       │   │   ├── check_perms.ts
│       │   │   ├── check_roles.ts
│       │   │   ├── check_users_debug.js
│       │   │   ├── fix-custom-roles.ts
│       │   │   ├── fix-users.ts
│       │   │   ├── recheck-instagram.ts
│       │   │   ├── restore-custom-roles.ts
│       │   │   ├── seed-role-configs.ts
│       │   │   ├── simple-verify.ts
│       │   │   ├── system-check.ts
│       │   │   ├── test-ai-nodes.ts
│       │   │   ├── test-automation.ts
│       │   │   ├── test-crm-architecture.js
│       │   │   ├── test-crm-marketing.js
│       │   │   ├── test-direct-page-access.ts
│       │   │   ├── test-graph-api.ts
│       │   │   ├── test-inbox-flow.ts
│       │   │   ├── test-meta-messaging.ts
│       │   │   ├── test-meta-sync.ts
│       │   │   ├── test-permissions.ts
│       │   │   ├── test-scoring.ts
│       │   │   ├── test-tokens.ts
│       │   │   ├── test-whatsapp-webhook.js
│       │   │   ├── test-whatsapp-webhook.ts
│       │   │   ├── test_login.js
│       │   │   ├── test_posts.ts
│       │   │   ├── verify-automation.ts
│       │   │   ├── verify-chat.ts
│       │   │   ├── verify-deployment.js
│       │   │   ├── verify-execution.ts
│       │   │   ├── verify-instagram-sync.ts
│       │   │   ├── verify-instagram.ts
│       │   │   ├── verify-login-flow.ts
│       │   │   ├── verify-meta-connection.ts
│       │   │   ├── verify-password.ts
│       │   │   ├── verify-phase2.ts
│       │   │   ├── verify-pixel-professional.js
│       │   │   ├── verify-pixel.ts
│       │   │   ├── verify-public-endpoints.ts
│       │   │   ├── verify-rbac-matrix.ts
│       │   │   ├── verify-real-sync.ts
│       │   │   ├── verify-vps-setup.sh
│       │   │   ├── verify-whatsapp-data.ts
│       │   │   ├── verify_automation.py
│       │   │   ├── verify_meta_connection.js
│       │   │   └── verify_setup.js
│       │   ├── test_gemini.mjs
│       │   ├── train-lead-model.ts
│       │   └── utils
│       │       ├── cleanup-orphans.ts
│       │       ├── cleanup-phantom-user.ts
│       │       ├── clear-dummy-config.ts
│       │       ├── fix-company-access.ts
│       │       ├── force-facebook-reset.ts
│       │       ├── force-ig-fetch.ts
│       │       ├── force-link-page.ts
│       │       ├── force-specific-convo.ts
│       │       ├── force-subscribe.ts
│       │       ├── generate-secrets.js
│       │       ├── purge-simulated.ts
│       │       ├── set-pixel.ts
│       │       ├── simulate-webhook.ts
│       │       ├── suppress-any.ps1
│       │       └── trigger-meta-sync.ts
│       ├── sentry.client.config.ts
│       ├── sentry.edge.config.ts
│       ├── sentry.server.config.ts
│       ├── services
│       │   ├── capi-dispatcher.ts
│       │   └── notifications
│       │       └── event-alerts.ts
│       ├── shared
│       │   ├── components
│       │   │   ├── layout
│       │   │   ├── sections
│       │   │   └── ui
│       │   │       ├── avatar.tsx
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       ├── card.tsx
│       │   │       ├── ComponentErrorBoundary.tsx
│       │   │       ├── context-menu.tsx
│       │   │       ├── dialog.tsx
│       │   │       ├── dropdown-menu.tsx
│       │   │       ├── form.tsx
│       │   │       ├── input.tsx
│       │   │       ├── label.tsx
│       │   │       ├── lightbox.tsx
│       │   │       ├── modal.tsx
│       │   │       ├── pagination.tsx
│       │   │       ├── progress.tsx
│       │   │       ├── select.tsx
│       │   │       ├── sheet.tsx
│       │   │       ├── skeleton.tsx
│       │   │       ├── switch.tsx
│       │   │       ├── table.tsx
│       │   │       ├── tabs.tsx
│       │   │       └── textarea.tsx
│       │   ├── hooks
│       │   ├── lib
│       │   │   ├── email.ts
│       │   │   ├── prisma.ts
│       │   │   └── utils.ts
│       │   └── types
│       ├── styles
│       │   ├── content-animations.css
│       │   └── globals.css
│       ├── tailwind.config.js
│       ├── tests
│       │   ├── agent-full-test.ts
│       │   ├── email-templates.test.ts
│       │   ├── integration
│       │   │   └── billing-webhook.test.ts
│       │   ├── integration-health-check.ts
│       │   ├── meta-diagnose.ts
│       │   ├── meta-full-funnel-test.ts
│       │   ├── setup.ts
│       │   ├── unit
│       │   │   ├── lib
│       │   │   │   ├── meta-capi.test.ts
│       │   │   │   ├── rbac.test.ts
│       │   │   │   └── security.test.ts
│       │   │   ├── quotas.test.ts
│       │   │   ├── rate-limit.test.ts
│       │   │   └── tenant-prisma.test.ts
│       │   └── update-meta-config.ts
│       ├── tsconfig.json
│       ├── tsc_errors.log
│       ├── ts_check_studio.log
│       ├── ts_errors.log
│       ├── ts_errors2.log
│       ├── ts_errors3.log
│       ├── ts_errors4.log
│       ├── ts_errors5.log
│       ├── types
│       │   ├── actions.ts
│       │   ├── auth.ts
│       │   ├── experts.ts
│       │   ├── inbox.ts
│       │   ├── next-auth.d.ts
│       │   ├── pricing.ts
│       │   ├── rbac.ts
│       │   ├── recharts.ts
│       │   └── subscription.ts
│       ├── vercel.json
│       ├── vitest.config.ts
│       └── workers
│           └── ai-worker.js
├── google-credentials.json
├── legacymark.code-workspace
├── package-lock.json
├── package.json
├── packages
│   ├── rbac
│   │   ├── eslint.config.mjs
│   │   ├── package.json
│   │   ├── src
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   ├── ui
│   │   └── src
│   ├── video-agent
│   │   ├── examples
│   │   │   ├── asset-scout-demo.ts
│   │   │   └── video-agent-demo.ts
│   │   ├── package.json
│   │   ├── schema.prisma
│   │   ├── src
│   │   │   ├── actions.ts
│   │   │   ├── agents
│   │   │   │   ├── base.ts
│   │   │   │   ├── coordinator.ts
│   │   │   │   ├── croma.ts
│   │   │   │   ├── graphos.ts
│   │   │   │   ├── logos.ts
│   │   │   │   ├── phonos.ts
│   │   │   │   └── types.ts
│   │   │   ├── asset-scout
│   │   │   │   ├── audio-generator.ts
│   │   │   │   ├── credit-manager.ts
│   │   │   │   ├── image-generator.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── stock-search.ts
│   │   │   │   ├── style-matcher.ts
│   │   │   │   ├── synthesis-agent.ts
│   │   │   │   └── types.ts
│   │   │   ├── db-client.ts
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── video-editor
│       ├── examples
│       │   └── cafe-artesanal.ts
│       ├── package.json
│       ├── src
│       │   └── index.ts
│       └── tsconfig.json
├── portfolio
│   └── goldneez
│       └── index.html
├── PROJECT_STRUCTURE.md.template
├── README.md
├── scripts
│   ├── fix-workflow-agents.ts
│   ├── generate-structure.js
│   ├── run-openclaw.ps1
│   ├── run-openclaw.sh
│   ├── seed-advanced-workflows-v2.ts
│   ├── seed-agency-workflows.ts
│   ├── seed-extended-workflows.ts
│   ├── seed-master-workflows.ts
│   ├── sweeper-workflows.ts
│   └── verify-workflows.ts
├── tsconfig.base.json
├── tsconfig.json
├── turbo.json
└── vercel.json
```

---
*Auto-generated file. Run `npm run generate-structure` to update.*
