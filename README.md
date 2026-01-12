# 📸 ShootSuite - Photographer Job Manager

A Progressive Web App (PWA) designed to streamline the workflow of freelance and studio photographers. Built with Next.js and Supabase.

## 🚀 Features

- **Job Management**: Create and manage photography jobs with detailed metadata
- **Kanban Workflow**: Visual board for tracking jobs through stages (Inquiry → Completed)
- **Finance Tracking**: Invoice generation, payment tracking, and expense management
- **Hybrid Delivery**: Two delivery methods - Link Wrapper or BYO Storage (Google Drive/Dropbox)
- **Client Portal**: Branded portal for clients to view contracts, invoices, and download deliverables
- **Offline Support**: PWA with offline viewing capabilities
- **Payment Integration**: Stripe integration for automated payment processing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **State Management**: TanStack Query with offline persistence
- **Payments**: Stripe
- **Cloud Storage**: Google Drive API, Dropbox API

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Supabase account and project
- Stripe account (for payment processing)
- Google Cloud Project (for Google Drive integration - optional)
- Dropbox App (for Dropbox integration - optional)

## 🏃 Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations (see `supabase/migrations/`)
3. Set up Row Level Security policies
4. Get your project URL and API keys

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 4. Run Database Migrations

```bash
# Using Supabase CLI (if installed locally)
supabase db reset

# Or apply migrations manually in Supabase dashboard
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
shootsuite/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/       # Edge Functions
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🗄️ Database Schema

See `docs/DATABASE_SCHEMA.md` for complete database schema documentation.

Key tables:
- `users` - Extended user profiles
- `clients` - Client information
- `jobs` - Photography jobs
- `invoices` - Invoices
- `payments` - Payment records
- `expenses` - Job expenses
- `deliverables` - Delivery links/galleries
- `tasks` - Job tasks
- `team_members` - Assistant assignments
- `integrations` - OAuth tokens for cloud storage

## 🔐 Security

- Row Level Security (RLS) policies enforce data isolation
- OAuth tokens encrypted using Supabase Vault
- All data encrypted in transit (TLS) and at rest
- Portal access via cryptographically secure UUIDs

## 📱 PWA Features

- Installable on Desktop, iOS, and Android
- Offline viewing of job data
- Service Worker for caching
- App manifest for native-like experience

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests (when implemented)
npm test
```

## 📚 Documentation

- [SRS Document](./SRS.md) - Complete Software Requirements Specification
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure and relationships
- [API Documentation](./docs/API.md) - API endpoints and usage
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup and guidelines
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions

## 🚢 Deployment

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contributing guidelines here]

## 📧 Support

[Add support contact information here]

"# ShootSuite" 
