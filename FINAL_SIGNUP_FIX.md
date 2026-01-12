# Final Signup Fix - Complete Solution

## ✅ Complete SQL to Run in Supabase SQL Editor

Run this **entire block** in your Supabase SQL Editor:

```sql
-- ============================================
-- STEP 1: Add missing columns to users table
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'company')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- ============================================
-- STEP 2: Fix RLS Policies (CORRECT SYNTAX)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create INSERT policy with correct syntax (WITH CHECK + TO authenticated)
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create SELECT policy
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create UPDATE policy
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- STEP 3: Create/Update Trigger Function
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type, date_of_birth, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'user_type',
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'date_of_birth' != ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, users.name),
    user_type = COALESCE(EXCLUDED.user_type, users.user_type),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, users.date_of_birth),
    company_name = COALESCE(EXCLUDED.company_name, users.company_name);
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## ✅ What This Does

1. **Adds missing columns**: `user_type`, `date_of_birth`, `company_name`
2. **Fixes RLS policies**: Uses correct syntax (`TO authenticated`, `WITH CHECK` for INSERT)
3. **Creates trigger**: Automatically creates user profile on signup (bypasses RLS)

## ✅ Verify It Works

After running the SQL, test signup. The trigger will automatically:
- Create the user profile
- Save user_type, date_of_birth, and company_name
- Work without RLS errors

## 🔍 Key Points

- **INSERT policies** must use `WITH CHECK` (not `USING`)
- **INSERT policies** should specify `TO authenticated`
- **Trigger uses SECURITY DEFINER** to bypass RLS (server-side)
- **Frontend code** no longer needs to insert - trigger handles it

