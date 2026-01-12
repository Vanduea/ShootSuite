-- Fix Super Admin RLS Policy to prevent 500 errors
-- The issue: When super admin queries own profile, both policies apply causing conflicts

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Recreate with fix: Super admins can view OTHER users (not themselves)
-- Own profile is already covered by "Users can view own profile" policy
CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Only apply when viewing OTHER users (not own profile)
        id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.status = 'active'
        )
    );

-- Ensure "Users can view own profile" policy exists and is correct
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

