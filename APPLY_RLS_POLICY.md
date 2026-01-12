# Apply RLS Policy for Users Table

## Issue
When signing up, you're getting the error: "new row violates row-level security policy for table 'users'"

## Solution
You need to apply the INSERT policy to your Supabase database.

## Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);
```

6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations, including the new INSERT policy.

## Verify the Policy

After applying, you can verify it exists by running:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

You should see three policies:
- "Users can insert own profile" (INSERT)
- "Users can view own profile" (SELECT)
- "Users can update own profile" (UPDATE)

## After Applying

Once the policy is applied, try signing up again. The signup process should work correctly.

