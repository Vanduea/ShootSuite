# Apply User Type Migration

## Issue
The users table is missing columns for:
- `user_type` (freelancer/company)
- `date_of_birth` (for freelancers)
- `company_name` (for companies)

## Solution
Apply the migration to add these columns and update the trigger function.

## Steps

### 1. Add the New Columns

Run this SQL in your Supabase SQL Editor:

```sql
-- Add user type, date of birth, and company name columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'company')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add index on user_type for faster queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
```

### 2. Update the Trigger Function

Run this SQL to update the trigger function to save the new fields:

```sql
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
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' != ''
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
```

## Verify

After applying, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('user_type', 'date_of_birth', 'company_name');
```

You should see all three columns listed.

## After Applying

Once the migration is applied:
1. The signup form will save user_type, date_of_birth, and company_name
2. The trigger will automatically populate these fields when a user signs up
3. The signup process should work without RLS errors

