# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account and project
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shootsuite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase and Stripe credentials.

4. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run migrations:
     ```bash
     # Using Supabase CLI
     supabase db reset
     
     # Or manually in Supabase dashboard SQL editor
     # Run files in supabase/migrations/ in order
     ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
shootsuite/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── api/               # API routes
│   │   └── portal/            # Client portal routes
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── jobs/              # Job-related components
│   │   ├── kanban/            # Kanban board components
│   │   └── portal/            # Client portal components
│   ├── lib/                   # Utilities and configs
│   │   ├── supabase.ts        # Supabase client
│   │   ├── query-client.ts   # TanStack Query setup
│   │   └── utils.ts           # Helper functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
├── supabase/
│   ├── migrations/            # Database migrations
│   └── functions/            # Edge Functions
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Development Workflow

### Adding a New Feature

1. **Create database migration** (if needed)
   ```bash
   # Create new migration file
   touch supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql
   ```

2. **Update TypeScript types**
   ```bash
   npm run db:generate
   ```

3. **Create components**
   - Place in appropriate folder under `src/components/`
   - Follow component naming conventions

4. **Add API routes** (if needed)
   - Create in `src/app/api/`
   - Use Supabase client for database access

5. **Write tests** (when test setup is ready)

### Code Style

- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Use TanStack Query for data fetching
- Follow React best practices (hooks, components)

### Database Changes

1. Create migration file in `supabase/migrations/`
2. Test migration locally
3. Update TypeScript types: `npm run db:generate`
4. Commit migration file

### Environment Variables

- Never commit `.env.local`
- Add new variables to `.env.example`
- Document in this file or README

## Common Tasks

### Running Type Check

```bash
npm run type-check
```

### Running Linter

```bash
npm run lint
```

### Generating Database Types

```bash
npm run db:generate
```

### Testing Supabase Locally

```bash
# Start local Supabase (requires Docker)
supabase start

# Run migrations
supabase db reset

# Stop local Supabase
supabase stop
```

## Debugging

### Supabase Issues

- Check RLS policies in Supabase dashboard
- Verify environment variables
- Check Supabase logs in dashboard

### Next.js Issues

- Clear `.next` folder: `rm -rf .next`
- Check browser console for errors
- Use React DevTools for component debugging

### Offline Functionality

- Test in browser DevTools (Network tab → Offline)
- Check localStorage for cached queries
- Verify Service Worker registration

## Best Practices

1. **Always use TypeScript types** from `@/types`
2. **Use Supabase client** from `@/lib/supabase`
3. **Use TanStack Query** for data fetching
4. **Follow RLS policies** - don't bypass security
5. **Handle errors gracefully** with user-friendly messages
6. **Test offline functionality** regularly
7. **Keep components small** and focused
8. **Use environment variables** for configuration

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

