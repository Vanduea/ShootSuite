-- Fix Infinite Recursion in RLS Policy
-- The "Super admins can view all users" policy causes infinite recursion
-- because it queries the users table, which triggers the same policy

-- Step 1: Create a function to check if user is super admin (bypasses RLS)
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

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

-- Step 3: Recreate the policy using the function (no recursion)
CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Only apply when viewing OTHER users (own profile handled by separate policy)
        id != auth.uid()
        AND public.is_super_admin(auth.uid())
    );

-- Step 4: Ensure "Users can view own profile" policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Step 5: Verify policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as policy_details
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

