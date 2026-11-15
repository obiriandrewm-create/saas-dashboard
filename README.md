# SaaS Dashboard

Production-ready multi-tenant SaaS dashboard with authentication, RBAC, billing, and plugin architecture.

## 🎯 Overview

This is a complete, production-grade SaaS dashboard built with modern best practices. It includes:

- **Authentication**: Email/password, OAuth2/OIDC (Google, GitHub, Microsoft), TOTP, WebAuthn/FIDO2
- **Organizations & RBAC**: Hierarchical roles (Owner > Admin > Member > Viewer), resource-level permissions, custom roles
- **Billing**: Stripe subscriptions, usage-based billing, customer portal, webhook reconciliation
- **Plugins**: Marketplace with capability-based permissions, WASM sandbox with explicit allowlists
- **Security**: CSP with nonce, Argon2id hashing, envelope encryption, rate limiting, audit logs
- **Accessibility**: WCAG 2.2 AA compliant, semantic landmarks, focus management, reduced motion

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript 5.4 (strict mode) |
| **Database** | PostgreSQL 16 + Prisma 5 |
| **Auth** | NextAuth.js v5 (Credentials, OAuth2/OIDC, TOTP, WebAuthn) |
| **Styling** | Tailwind CSS v4 + CSS Variables (design tokens) |
| **UI** | Radix UI primitives, Lucide React icons |
| **State** | TanStack Query, Zustand, React Hook Form + Zod |
| **Payments** | Stripe (subscriptions, usage-based, customer portal) |
| **Email** | Resend |
| **Testing** | Vitest, React Testing Library, axe-core |
| **CI/CD** | GitHub Actions (Vercel deploy) |

## 📁 Project Structure

```
app/
├── (auth)/                 # Auth pages (login, register, MFA, invitations)
├── (dashboard)/            # Protected dashboard pages
│   ├── billing/            # Subscription management, invoices, usage
│   ├── members/            # Team management, invitations, roles
│   ├── plugins/            # Plugin marketplace & installed plugins
│   ├── audit-logs/         # Security audit log viewer
│   ├── api-keys/           # API key management
│   └── settings/           # User & organization settings
├── api/                    # API routes
│   ├── auth/               # Auth endpoints (register, MFA, invitations)
│   ├── billing/            # Stripe webhooks, subscriptions, invoices
│   ├── orgs/               # Organization & member management
│   └── audit-logs/         # Audit log queries
├── _components/            # Shared UI components
├── _lib/                   # Utilities (prisma, auth, crypto, stripe, email)
├── _hooks/                 # Custom React hooks
├── _styles/                # Global styles + design tokens
└── _types/                 # Shared TypeScript types

prisma/
├── schema.prisma           # Complete database schema

scripts/
├── test-contrast.ts        # WCAG contrast audit

.github/workflows/
├── ci.yml                  # Main CI pipeline
└── accessibility.yml       # Accessibility audit
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.x LTS
- **Bun** 1.1+ (or npm/yarn)
- **PostgreSQL** 16+
- **Redis** 7+

### Installation

```bash
# Clone and install
git clone <repo>
cd saas-dashboard
bun install

# Setup environment
cp .env.example .env
# Edit .env with your credentials (see below)

# Setup database
bun run db:generate
bun run db:push

# Start development server
bun run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saas_dashboard"

# Auth (NextAuth.js v5)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Encryption (for TOTP secrets, etc.)
ENCRYPTION_KEY=""          # openssl rand -base64 32
ENCRYPTION_KEY_VERSION="1"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_API_VERSION="2024-06-20"

# Stripe Price IDs
STRIPE_PRICE_FREE="price_free"
STRIPE_PRICE_PRO_MONTHLY="price_pro_monthly"
STRIPE_PRICE_TEAM_MONTHLY="price_team_monthly"
STRIPE_PRICE_ENTERPRISE_MONTHLY="price_enterprise_monthly"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# CAPTCHA (Cloudflare Turnstile)
TURNSTILE_SECRET_KEY="0x..."
TURNSTILE_SITE_KEY="0x..."

# Redis
REDIS_URL="redis://localhost:6379"
```

## 📋 Available Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Production build
bun run start            # Start production server

# Code Quality
bun run lint             # ESLint + Prettier
bun run typecheck        # TypeScript strict check
bun run test             # Run tests
bun run test:coverage    # Tests with coverage report
bun run test:contrast    # WCAG contrast audit

# Database
bun run db:generate      # Generate Prisma client
bun run db:push          # Push schema to database
bun run db:migrate       # Run migrations
bun run db:studio        # Open Prisma Studio

# Security
bun run scan:secrets     # Gitleaks secret scan
bun run scan:deps        # npm audit
```

## 🔐 Authentication Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | Argon2id (64MB memory, 3 iterations, 4 threads) |
| **Session Management** | Secure HTTP-only cookies, SHA-256 token hashing, 7-day expiry |
| **OAuth2/OIDC** | Google, GitHub, Microsoft Entra ID with PKCE |
| **TOTP** | RFC 6238, 30s window, backup codes |
| **WebAuthn** | FIDO2 CTAP2, resident keys, user verification required |
| **Rate Limiting** | 5 req/min login, 3 req/min register, exponential backoff |
| **Brute Force** | CAPTCHA after 5 failures, 15-min lockout after 10 |

## 🏢 Organizations & RBAC

### Role Hierarchy

```
OWNER > ADMIN > MEMBER > VIEWER
```

### Permissions Model

- **Role Permissions**: Global permissions per role
- **Resource Grants**: Per-user, per-resource permissions
- **Custom Roles**: Enterprise plan feature

### Member Management

- Invitations with 7-day expiry
- Role assignment on invite
- Impersonation with audit logging
- Custom statuses (PENDING, ACTIVE, SUSPENDED, REMOVED)

## 💳 Billing (Stripe)

### Plans

| Plan | Monthly | Seats | Overage | Features |
|------|---------|-------|---------|----------|
| FREE | $0 | 1 | N/A | Basic |
| PRO | $29 | 1 | $10/seat | Advanced analytics, custom domains |
| TEAM | $99 | 5 | $15/seat | SSO, audit logs, API access |
| ENTERPRISE | Custom | Custom | Custom | SLA, on-premise, custom contracts |

### Features

- Subscription management (upgrade/downgrade/cancel)
- Usage-based billing with metered pricing
- Customer portal for self-service
- Webhook reconciliation (idempotent, 7-day TTL)
- Invoice PDF generation

## 🔌 Plugin System

### Architecture

- **WASM Sandbox**: wasmtime with explicit capability allowlists
- **Capabilities**: Explicit allowlist in manifest (`network: []`, `fs: []`, `env: []`)
- **Resource Limits**: 128MB memory, 50ms CPU, 5s wall time
- **Communication**: WASI preview2 with host-provided imports

### Manifest Example

```json
{
  "name": "@org/plugin-name",
  "version": "1.0.0",
  "capabilities": ["read:projects", "write:projects"],
  "permissions": { "required": ["projects:read"], "optional": ["billing:read"] },
  "configSchema": { /* Zod JSON schema */ }
}
```

## 🛡 Security

### Headers (All Responses)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{nonce}'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

### Data Protection

| Data | Protection |
|------|------------|
| Passwords | Argon2id, never logged |
| TOTP Secrets | AES-256-GCM envelope encryption (KEK rotation every 90 days) |
| WebAuthn Keys | Never stored (user device only) |
| API Keys | SHA-256 hash stored, prefix visible |
| PII | Encrypted at rest (pgcrypto) |
| Audit Logs | Append-only, immutable, 7-year retention |

## ♿ Accessibility (WCAG 2.2 AA)

### Implemented

- ✅ Semantic landmarks (banner, main, complementary, contentinfo)
- ✅ Skip links, focus management, focus rings
- ✅ Form labels + descriptions + error messages
- ✅ Live regions for toasts (polite/assertive/off)
- ✅ Reduced motion global disable
- ✅ 44×44px minimum touch targets
- ✅ Tabular numbers for dynamic metrics
- ✅ Dark mode + high contrast support
- ✅ Screen reader tested (NVDA, VoiceOver)

### Design System Utilities

```css
/* Typography */
.tabular-nums { font-variant-numeric: tabular-nums; }
.text-wrap-balance { text-wrap: balance; }
.text-wrap-pretty { text-wrap: pretty; }

/* Surfaces */
.focus-ring { outline: none; ring: 2px solid var(--color-brand); ring-offset: 2px; }
.image-outline { outline: 1px solid var(--image-outline-light); }
.hit-area { min-height: 44px; min-width: 44px; }

/* Animations */
.press-scale:active { transform: scale(0.96); }
.stagger-enter > * { animation: fade-in-up 200ms ease-out both; }
.exit-fade { animation: fade-out-down 150ms ease-out forwards; }

/* Transitions */
.transition-colors { transition: color, background-color, border-color 100ms; }
.transition-transform { transition: transform 200ms; }
```

## 🧪 Quality Gates

All PRs must pass:

| Gate | Tool | Threshold |
|------|------|-----------|
| **Lint** | ESLint + Prettier | Zero errors |
| **Types** | TypeScript strict | Zero errors |
| **Tests** | Vitest | ≥80% coverage |
| **Security** | Gitleaks, npm audit, Trivy | Zero critical/high |
| **Contrast** | axe-core | All token pairs ≥4.5:1 (3:1 UI) |
| **WCAG** | axe-core | Zero critical/serious violations |
| **Build** | Next.js | Successful build |

## 📦 Deployment

### Docker

```bash
# Build
docker build -t saas-dashboard .

# Run with docker-compose
docker-compose up -d
```

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables
3. Deploy automatically on push to main

### Environment-Specific

- **Development**: `bun run dev` with hot reload
- **Preview**: Vercel preview deployments on PRs
- **Production**: Vercel production deployment on merge to main

## 📚 API Reference

### Authentication

```
POST   /api/auth/register          # Register
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
POST   /api/auth/mfa/totp/enable   # Enable TOTP
POST   /api/auth/mfa/totp/verify   # Verify TOTP
POST   /api/auth/mfa/webauthn/*    # WebAuthn registration/auth
```

### Organizations

```
GET    /api/orgs/current/members   # List members
POST   /api/orgs/current/members   # Invite member
PATCH  /api/orgs/current/members/:id # Update role/status
```

### Billing

```
GET    /api/billing/subscription   # Current subscription
POST   /api/billing/subscription   # Create/update/cancel
POST   /api/billing/portal         # Stripe customer portal
GET    /api/billing/invoices       # List invoices
```

### Audit Logs

```
GET    /api/audit-logs             # Query audit logs (filters: action, severity, date)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality gates locally
5. Submit PR with description

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 80% test coverage minimum

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Next.js, Prisma, Stripe, and modern web standards.