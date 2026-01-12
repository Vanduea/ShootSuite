-- Comprehensive Fix for "Failed to load user profile" Error
-- Run this in Supabase SQL Editor

-- Step 1: Ensure all required columns exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'company')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Step 2: Fix RLS Policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Users can ALWAYS view their own profile (highest priority)
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Super Admins can view OTHER users (not themselves - that's covered above)
CREATE POLICY "Super admins can view all users"
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

-- Step 3: Ensure INSERT policy exists (for fallback profile creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Step 4: Verify policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- Step 5: Check if your user profile exists (replace email)
-- SELECT id, email, role, status, profile_setup_completed 
-- FROM public.users 
-- WHERE email = 'vanduea@yahoo.com';

-- If profile doesn't exist, create it manually:
-- INSERT INTO public.users (id, email, name, role, status, profile_setup_completed)
-- SELECT 
--     id,
--     email,
--     COALESCE(raw_user_meta_data->>'name', email),
--     'super_admin',
--     'active',
--     true
-- FROM auth.users
-- WHERE email = 'vanduea@yahoo.com'
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'super_admin', status = 'active', profile_setup_completed = true;

