-- Add multitenancy and approval workflow to users table
-- This enables Super Admin approval before user activation

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'company')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- Create Super Admin user (you'll need to manually set this after creating your first admin)
-- This is a placeholder - you'll need to update it with actual admin user ID
-- Example: UPDATE public.users SET role = 'super_admin', status = 'active' WHERE email = 'admin@shootsuite.com';

-- Update RLS policies to handle pending/active status
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users can view their own profile (even if pending)
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
-- Note: Role and status changes are prevented by application logic
-- RLS WITH CHECK cannot reference OLD, so we rely on app-level validation
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Super Admins can view all users
CREATE POLICY "Super admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND status = 'active'
        )
    );

-- Super Admins can update user status (approve/reject)
CREATE POLICY "Super admins can manage users"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
            AND status = 'active'
        )
    );

-- Update trigger function to set default status as pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    user_type, 
    date_of_birth, 
    company_name,
    role,
    status,
    profile_setup_completed
  )
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
    NEW.raw_user_meta_data->>'company_name',
    'user',  -- Default role
    'pending',  -- Default status - requires approval
    FALSE  -- Profile setup not completed
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

