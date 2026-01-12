# Fix 500 Error on User Query

## Issue
Getting a 500 error when querying user profile:
```
Failed to load resource: the server responded with a status of 500
/users?select=status%2Cprofile_setup_completed&id=eq.15c113b3-7ee7-4152-8eb4-5f63b5e2a07c
```

## Root Cause
The "Super admins can view all users" policy might be causing a recursive query issue, or there's a conflict between policies when a super admin queries their own profile.

## Solution

Run this SQL in Supabase SQL Editor to fix the policies:

```sql
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Recreate "Users can view own profile" policy
-- This should come first and handle all users viewing their own profile
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Super Admins can view all users (but own profile is already covered above)
-- This policy only applies when viewing OTHER users
CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Only apply this policy if NOT viewing own profile
        -- (own profile is already covered by "Users can view own profile")
        auth.uid() != id
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND status = 'active'
        )
    );
```

## Alternative: Simpler Approach

If the above still causes issues, use this simpler approach that prioritizes the "own profile" policy:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Users can ALWAYS view their own profile (highest priority)
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Super Admins can view OTHER users (not themselves, that's covered above)
CREATE POLICY "Super admins can view other users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        id != auth.uid()  -- Not own profile
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.status = 'active'
        )
    );
```

## Verify

After applying, test the query:
```sql
-- This should work for any authenticated user viewing their own profile
SELECT status, profile_setup_completed 
FROM public.users 
WHERE id = auth.uid();
```

## If Still Failing

Check Supabase logs for the exact error:
1. Go to Supabase Dashboard → Logs → Postgres Logs
2. Look for the error message when the query fails
3. Common issues:
   - Missing column (check migration was applied)
   - RLS policy syntax error
   - Recursive query timeout

