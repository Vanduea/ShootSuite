# Deployment Guide

## Overview

ShootSuite can be deployed to various platforms. This guide covers deployment to Vercel (recommended for Next.js) and general deployment considerations.

## Prerequisites

- Supabase project set up and configured
- Environment variables ready
- Database migrations applied
- Stripe account configured (for payments)

## Vercel Deployment

### 1. Prepare Repository

Ensure all code is committed and pushed to GitHub/GitLab/Bitbucket.

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

Add all environment variables in Vercel dashboard:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your Vercel URL)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Optional:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DROPBOX_APP_KEY`
- `DROPBOX_APP_SECRET`

### 4. Configure Build Settings

Vercel should auto-detect, but verify:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`

### 5. Deploy

Click "Deploy" and wait for build to complete.

### 6. Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.failed`, `invoice.paid`
4. Copy webhook signing secret to environment variable

## Supabase Configuration

### 1. Database Migrations

Ensure all migrations are applied in Supabase dashboard:
- Go to SQL Editor
- Run migrations from `supabase/migrations/` in order

### 2. Row Level Security

Verify RLS policies are enabled:
- Go to Authentication → Policies
- Check all tables have appropriate policies

### 3. Edge Functions

Deploy Edge Functions to Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy stripe-webhook
supabase functions deploy drive-gallery
supabase functions deploy token-refresh
supabase functions deploy generate-invoice-pdf
```

### 4. Storage Buckets

Create storage buckets in Supabase:
- `avatars` - for user avatars
- `invoices` - for PDF invoices
- `receipts` - for expense receipts

Configure RLS policies for each bucket.

## Environment-Specific Configuration

### Development

Use `.env.local` for local development.

### Staging

Create a separate Supabase project for staging. Use Vercel preview deployments.

### Production

- Use production Supabase project
- Use production Stripe account
- Enable all security features
- Set up monitoring and error tracking

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Edge Functions deployed
- [ ] Storage buckets created
- [ ] Stripe webhook configured
- [ ] PWA manifest accessible
- [ ] Service Worker registered
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] Custom domain configured (optional)
- [ ] Analytics set up (optional)
- [ ] Error monitoring configured (optional)

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in dashboard for:
- Page views
- Performance metrics
- Real-time monitoring

### Supabase Monitoring

Monitor in Supabase dashboard:
- Database performance
- API usage
- Storage usage
- Edge Function logs

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- Vercel Analytics

## Troubleshooting

### Build Failures

- Check environment variables are set
- Verify Node.js version (18+)
- Check build logs in Vercel dashboard

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies
- Verify network access

### Service Worker Issues

- Check browser console for errors
- Verify `sw.js` is accessible
- Check manifest.json is valid

### Stripe Webhook Issues

- Verify webhook secret matches
- Check Stripe dashboard for webhook logs
- Verify Edge Function is deployed

## Rollback

If deployment fails:

1. **Vercel:** Use "Redeploy" to previous deployment
2. **Database:** Restore from backup if needed
3. **Edge Functions:** Redeploy previous version

## Scaling Considerations

- **Vercel:** Automatically scales with traffic
- **Supabase:** Upgrade plan if needed
- **Database:** Monitor query performance
- **Storage:** Monitor usage limits

## Security Checklist

- [ ] All environment variables secured
- [ ] Service role key never exposed
- [ ] RLS policies enforced
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting considered
- [ ] Input validation in place

## Support

For deployment issues:
- Check Vercel documentation
- Check Supabase documentation
- Review application logs
- Contact support if needed

