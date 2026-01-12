-- Quick Fix for 500 Error on User Profile Query
-- Run this in Supabase SQL Editor

-- Drop and recreate Super Admin policy to exclude own profile
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;

CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Only apply when viewing OTHER users (own profile handled by separate policy)
        id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
            AND u.status = 'active'
        )
    );

-- Verify "Users can view own profile" exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
            ON public.users
            FOR SELECT
            TO authenticated
            USING (auth.uid() = id);
    END IF;
END $$;

