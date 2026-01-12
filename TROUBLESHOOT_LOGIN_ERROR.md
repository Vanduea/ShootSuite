# Troubleshooting "Failed to load user profile" Error

## Issue
Getting "Failed to load user profile" error when trying to login.

## Possible Causes

### 1. RLS Policy Issue (Most Common)
The Row Level Security (RLS) policy might be blocking the query.

**Fix:** Run this SQL in Supabase SQL Editor:

```sql
-- Ensure "Users can view own profile" policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Fix Super Admin policy to not conflict
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.status = 'active'
        )
    );
```

### 2. Profile Doesn't Exist
The user profile might not have been created by the trigger.

**Check:**
```sql
SELECT id, email, role, status 
FROM public.users 
WHERE email = 'your-email@example.com';
```

**Fix:** If profile doesn't exist, create it:
```sql
INSERT INTO public.users (id, email, name, role, status, profile_setup_completed)
VALUES (
    'user-id-from-auth-users',
    'your-email@example.com',
    'Your Name',
    'user',
    'pending',
    false
);
```

Or use the script:
```bash
node scripts/create-super-admin.js your-email@example.com Password123
```

### 3. Missing Columns
The migration might not have been applied.

**Check:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('status', 'profile_setup_completed', 'role');
```

**Fix:** Run the migration:
```sql
-- From supabase/migrations/20240105000000_add_multitenancy_and_approval.sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE;
```

### 4. Check Browser Console
Open browser DevTools (F12) → Console tab and look for:
- Network errors (500, 401, 403)
- RLS policy errors
- Missing column errors

## Step-by-Step Debugging

1. **Check if user exists in auth.users:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. **Check if profile exists in public.users:**
   ```sql
   SELECT * FROM public.users WHERE email = 'your-email@example.com';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

4. **Test query as authenticated user:**
   ```sql
   -- This should work if RLS is correct
   SET request.jwt.claim.sub = 'your-user-id';
   SELECT * FROM public.users WHERE id = 'your-user-id';
   ```

## Quick Fix Script

If nothing works, run this comprehensive fix:

```sql
-- 1. Ensure columns exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE;

-- 2. Fix RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- 3. Create missing profile (replace with your user ID and email)
-- Get user ID first:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- Then:
INSERT INTO public.users (id, email, name, role, status, profile_setup_completed)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email),
    'user',
    'pending',
    false
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO NOTHING;
```

## After Fixing

1. Clear browser cache and cookies
2. Log out completely
3. Try logging in again
4. Check browser console for any remaining errors

