-- Add user type, date of birth, and company name columns to users table
-- These fields are collected during signup

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'company')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add index on user_type for faster queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- Update the trigger function to include these new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile, ignoring if it already exists
  INSERT INTO public.users (id, email, name, user_type, date_of_birth, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'user_type',
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
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

