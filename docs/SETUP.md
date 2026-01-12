# Setup Guide

## Quick Start

Follow these steps to get ShootSuite running locally.

## Step 1: Prerequisites

Install the following:
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

Optional but recommended:
- **Supabase CLI** - For local development
- **VS Code** - Recommended IDE

## Step 2: Clone and Install

```bash
# Clone repository (or navigate to project directory)
cd shootsuite

# Install dependencies
npm install
```

## Step 3: Set Up Supabase

### Option A: Use Supabase Cloud (Recommended for Start)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for project to be ready (takes ~2 minutes)
4. Go to Project Settings → API
5. Copy your project URL and anon key

### Option B: Use Supabase Local (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# This will give you local credentials
```

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your values:

   ```env
   # Supabase (from Step 3)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Stripe (get from stripe.com)
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (set up later)
   ```

## Step 5: Set Up Database

### Using Supabase Cloud

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20240101000000_initial_schema.sql`
3. Copy and paste the entire file into SQL Editor
4. Click "Run" to execute
5. Repeat for `supabase/migrations/20240101000001_rls_policies.sql`

### Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Step 6: Verify Database Setup

1. Go to Supabase Dashboard → Table Editor
2. You should see these tables:
   - users
   - clients
   - jobs
   - invoices
   - payments
   - expenses
   - tasks
   - team_members
   - deliverables
   - integrations

## Step 7: Set Up Stripe (Optional for MVP)

1. Create account at [stripe.com](https://stripe.com)
2. Go to Developers → API Keys
3. Copy Test keys to `.env.local`
4. Webhook setup can be done later

## Step 8: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 9: Create Your First User

1. The app should show a sign-up page (to be implemented)
2. Or use Supabase Dashboard → Authentication → Users → Add User

## Troubleshooting

### "Missing Supabase environment variables"

- Check `.env.local` exists
- Verify variable names match exactly
- Restart dev server after changing `.env.local`

### "Database connection failed"

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies are applied

### "Module not found" errors

- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check Node.js version: `node --version` (should be 18+)

### Service Worker not registering

- Check browser console for errors
- Verify `public/sw.js` exists
- Try hard refresh (Ctrl+Shift+R)

## Next Steps

1. **Read the Documentation:**
   - [Development Guide](./DEVELOPMENT.md)
   - [API Documentation](./API.md)
   - [Database Schema](./DATABASE_SCHEMA.md)

2. **Start Building:**
   - Implement authentication
   - Create job management UI
   - Build Kanban board

3. **Set Up CI/CD:**
   - Connect to GitHub
   - Set up Vercel deployment
   - See [Deployment Guide](./DEPLOYMENT.md)

## Getting Help

- Check documentation in `docs/` folder
- Review SRS document for requirements
- Check Supabase and Next.js documentation
- Review code comments

## Development Tips

1. **Use TypeScript:** All code should be typed
2. **Follow Structure:** Keep files in appropriate folders
3. **Test Locally:** Test before committing
4. **Check Logs:** Use browser console and Supabase logs
5. **Use TanStack Query:** For all data fetching
6. **Follow RLS:** Don't bypass security policies

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Database
npm run db:generate      # Generate TypeScript types from DB
```

## Project Status

This is the initial setup. Core features to implement:
- [ ] Authentication (sign up, sign in, sign out)
- [ ] Job management (create, edit, delete)
- [ ] Kanban board
- [ ] Client management
- [ ] Invoice generation
- [ ] Payment tracking
- [ ] Client portal
- [ ] Delivery management

Happy coding! 🚀

