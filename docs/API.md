# API Documentation

## Overview

ShootSuite uses Supabase for backend operations. Most data access happens through the Supabase client library with Row Level Security (RLS) policies.

## Supabase Client

### Client-Side Usage

```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('jobs')
  .select('*, clients(*)')
  .eq('user_id', userId)
```

### Server-Side Usage

```typescript
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()
// Use service role key for admin operations
```

## Database Operations

### Jobs

#### Get All Jobs
```typescript
const { data, error } = await supabase
  .from('jobs')
  .select('*, clients(*)')
  .eq('user_id', userId)
  .order('date', { ascending: false })
```

#### Create Job
```typescript
const { data, error } = await supabase
  .from('jobs')
  .insert({
    user_id: userId,
    client_id: clientId,
    date: '2024-12-20',
    price: 5000,
    status: 'Inquiry'
  })
  .select()
  .single()
```

#### Update Job Status
```typescript
const { data, error } = await supabase
  .from('jobs')
  .update({ status: 'Booked' })
  .eq('id', jobId)
  .select()
  .single()
```

### Clients

#### Get All Clients
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', userId)
  .order('name')
```

#### Create Client
```typescript
const { data, error } = await supabase
  .from('clients')
  .insert({
    user_id: userId,
    name: 'John Doe',
    email: 'john@example.com'
  })
  .select()
  .single()
```

### Invoices

#### Get Invoice with Payments
```typescript
const { data, error } = await supabase
  .from('invoices')
  .select('*, payments(*)')
  .eq('job_id', jobId)
  .single()
```

#### Create Invoice
```typescript
const { data, error } = await supabase
  .from('invoices')
  .insert({
    job_id: jobId,
    total_amount: 5000,
    due_date: '2024-12-31'
  })
  .select()
  .single()
```

### Payments

#### Record Payment
```typescript
const { data, error } = await supabase
  .from('payments')
  .insert({
    invoice_id: invoiceId,
    job_id: jobId,
    amount: 2500,
    status: 'Completed',
    date: '2024-12-01',
    method: 'Stripe',
    transaction_id: 'txn_123456'
  })
  .select()
  .single()
```

### Deliverables

#### Create External Link Deliverable
```typescript
const { data, error } = await supabase
  .from('deliverables')
  .insert({
    job_id: jobId,
    method: 'external_link',
    external_url: 'https://wetransfer.com/...',
    provider: 'None',
    is_locked: true
  })
  .select()
  .single()
```

#### Create Drive Integration Deliverable
```typescript
const { data, error } = await supabase
  .from('deliverables')
  .insert({
    job_id: jobId,
    method: 'drive_integration',
    drive_folder_id: 'folder_id_123',
    provider: 'Google',
    is_locked: true
  })
  .select()
  .single()
```

## Next.js API Routes

### Stripe Webhook Handler

**Route:** `/api/webhooks/stripe`

Handles Stripe webhook events for payment processing.

```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  // Verify webhook signature
  // Process payment event
  // Update invoice and unlock deliverables
}
```

### Invoice PDF Generation

**Route:** `/api/invoices/[id]/pdf`

Generates PDF invoice via Supabase Edge Function.

```typescript
// Calls Supabase Edge Function: generate-invoice-pdf
const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
  body: { invoice_id: invoiceId }
})
```

## Supabase Edge Functions

### stripe-webhook

Handles Stripe payment webhooks.

**Trigger:** Stripe webhook events  
**Input:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 5000,
      "metadata": {
        "invoice_id": "uuid"
      }
    }
  }
}
```

### drive-gallery

Fetches file metadata from cloud storage.

**Input:**
```json
{
  "deliverable_id": "uuid",
  "user_id": "uuid"
}
```

**Output:**
```json
{
  "files": [
    {
      "id": "file_id",
      "name": "photo.jpg",
      "thumbnailUrl": "https://...",
      "downloadUrl": "https://...",
      "size": 1234567
    }
  ]
}
```

### token-refresh

Refreshes OAuth tokens for cloud storage.

**Trigger:** Scheduled cron or on-demand  
**Input:**
```json
{
  "integration_id": "uuid"
}
```

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

## Real-time Subscriptions

### Subscribe to Job Updates
```typescript
const channel = supabase
  .channel('jobs')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'jobs',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Job updated:', payload)
  })
  .subscribe()
```

## Error Handling

All Supabase operations return an error object:

```typescript
const { data, error } = await supabase.from('jobs').select()

if (error) {
  console.error('Error:', error.message)
  // Handle error
  return
}

// Use data
```

## Rate Limiting

Supabase has built-in rate limiting:
- Free tier: 500 requests/second
- Pro tier: Higher limits

Consider implementing client-side rate limiting for expensive operations.

## Security Notes

1. **Never expose service role key** in client-side code
2. **Always use RLS policies** - don't bypass security
3. **Validate user input** before database operations
4. **Use parameterized queries** (Supabase handles this)
5. **Verify webhook signatures** for Stripe

