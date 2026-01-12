-- Fix Infinite Recursion in Super Admin RLS Policy
-- The previous policy caused infinite recursion because it queried the users table
-- which triggered the same policy check

-- Create a function to check if user is super admin (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND role = 'super_admin'
    AND status = 'active'
  );
END;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Recreate the policy using the function (no recursion)
CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Only apply when viewing OTHER users (own profile handled by separate policy)
        id != auth.uid()
        AND public.is_super_admin(auth.uid())
    );

-- Ensure "Users can view own profile" policy exists and is correct
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

