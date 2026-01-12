# Multitenancy & Super Admin Setup Guide

## Overview
This implementation adds:
- **Multitenancy**: User accounts require Super Admin approval
- **Super Admin Role**: Manages user approvals
- **Profile Setup**: Users complete profile after approval
- **Status Management**: pending → active/rejected workflow

## Database Migration

Run this **complete SQL** in your Supabase SQL Editor:

```sql
-- ============================================
-- STEP 1: Add multitenancy columns
-- ============================================
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- ============================================
-- STEP 2: Update RLS Policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users can insert their own profile (with pending status)
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can view their own profile
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

-- Super Admins can manage user status
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

-- ============================================
-- STEP 3: Update Trigger Function
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
    'user',
    'pending',
    FALSE
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Create Your First Super Admin

After running the migration, create your first Super Admin:

1. **Sign up** with your admin email
2. **Run this SQL** to make yourself Super Admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.users
SET 
  role = 'super_admin',
  status = 'active',
  profile_setup_completed = TRUE
WHERE email = 'your-email@example.com';
```

3. **Sign in** - you'll now have Super Admin access

## User Flow

### Signup Flow:
1. User signs up → Account created with `status='pending'`
2. User redirected to `/signup/pending`
3. Super Admin approves/rejects in `/dashboard/admin/users`
4. If approved → User can sign in → Redirected to `/setup-profile`
5. After profile setup → Access to dashboard

### Login Flow:
1. User signs in
2. System checks:
   - If `status='pending'` → Redirect to `/signup/pending`
   - If `status='rejected'` → Redirect to `/signup/rejected`
   - If `status='suspended'` → Show error
   - If `status='active'` and `profile_setup_completed=false` → Redirect to `/setup-profile`
   - If `status='active'` and `profile_setup_completed=true` → Access dashboard

## Admin Features

- **View Pending Users**: `/dashboard/admin/users` (pending view)
- **View All Users**: `/dashboard/admin/users` (all view)
- **Approve Users**: Click "Approve" button
- **Reject Users**: Click "Reject" button (with reason)

## Files Created/Updated

1. **Migration**: `supabase/migrations/20240105000000_add_multitenancy_and_approval.sql`
2. **Signup Page**: Updated to redirect to pending page
3. **Login Page**: Updated to check status and redirect accordingly
4. **Pending Page**: `/signup/pending` - Shows waiting message
5. **Rejected Page**: `/signup/rejected` - Shows rejection reason
6. **Profile Setup**: `/setup-profile` - Complete profile after approval
7. **Admin Panel**: `/dashboard/admin/users` - Manage user approvals
8. **Dashboard Layout**: Updated to check status and show admin link

## Next Steps

1. Run the migration SQL
2. Create your Super Admin account
3. Test the signup → approval → profile setup flow

