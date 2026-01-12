# Fix Database Trigger for User Profile Creation

## Issue
Even after applying the trigger, the error persists. This might be because:

1. The trigger function needs proper permissions
2. The trigger might conflict with RLS policies
3. The function might need to handle edge cases

## Solution: Enhanced Trigger

Run this SQL in your Supabase SQL Editor to replace/update the trigger:

```sql
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Enhanced function to create user profile
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile, ignoring if it already exists
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Key Changes

1. **`SECURITY DEFINER`**: Runs with the privileges of the function owner (bypasses RLS)
2. **`SET search_path = public`**: Ensures correct schema resolution
3. **`ON CONFLICT DO NOTHING`**: Prevents errors if profile already exists
4. **Better NULL handling**: Uses COALESCE for safer defaults

## Verify the Trigger

After applying, test by checking if the function exists:

```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

You should see `prosecdef = true` (meaning SECURITY DEFINER is set).

## Test the Trigger

Create a test user and verify the profile is created:

```sql
-- This should automatically create a profile in public.users
-- Check if it worked:
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 1;
```

