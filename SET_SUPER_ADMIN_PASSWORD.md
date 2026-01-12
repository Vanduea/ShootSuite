# Setting Super Admin Password

Since you've already created the super admin in `public.users`, you need to set the password in `auth.users`. Here are the options:

## Option 1: Sign Up First (Recommended)

The easiest way is to have the user sign up first, then promote them:

1. **Sign up** with `vanduea@yahoo.com` at `/signup`
2. **Then run** the UPDATE query to make them super admin:
   ```sql
   UPDATE public.users
   SET role = 'super_admin', status = 'active', profile_setup_completed = TRUE
   WHERE email = 'vanduea@yahoo.com';
   ```

## Option 2: Use Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user with email `vanduea@yahoo.com`
3. Click **"..."** menu → **"Reset Password"**
4. An email will be sent to reset the password

## Option 3: Create Auth User via SQL (Advanced)

If the user doesn't exist in `auth.users` yet, you can create them:

```sql
-- First, check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'vanduea@yahoo.com';

-- If they don't exist, you'll need to create them via Supabase Auth API
-- OR use the Supabase Dashboard to invite them
```

**Note:** You cannot directly set passwords in SQL because Supabase stores hashed passwords. You must use the Auth API or Dashboard.

## Option 4: Use Supabase Auth Admin API (Programmatic)

If you have access to the Supabase Admin API, you can create/update the user:

```typescript
// This requires SUPABASE_SERVICE_ROLE_KEY (admin key)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key
)

// Create user with password
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'vanduea@yahoo.com',
  password: 'your-secure-password',
  email_confirm: true, // Auto-confirm email
  user_metadata: {
    name: 'Super Admin',
    user_type: 'company',
  }
})

// Then update to super_admin
await supabaseAdmin
  .from('users')
  .update({
    role: 'super_admin',
    status: 'active',
    profile_setup_completed: true
  })
  .eq('email', 'vanduea@yahoo.com')
```

## Option 5: Reset Password via SQL (If User Exists)

If the user already exists in `auth.users` but you don't know the password:

```sql
-- This will trigger a password reset email
-- The user will receive an email to set a new password
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'vanduea@yahoo.com';

-- Then use Supabase Dashboard to send password reset email
```

## Recommended Workflow

**Best approach for your situation:**

1. **Check if user exists in auth.users:**
   ```sql
   SELECT id, email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'vanduea@yahoo.com';
   ```

2. **If user exists:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find the user → Click "Reset Password"
   - User receives email to set password

3. **If user doesn't exist:**
   - Have them sign up at `/signup` with `vanduea@yahoo.com`
   - The trigger will create the profile with `status='pending'`
   - Then run your UPDATE query to make them super_admin:
     ```sql
     UPDATE public.users
     SET role = 'super_admin', status = 'active', profile_setup_completed = TRUE
     WHERE email = 'vanduea@yahoo.com';
     ```

## Quick Check Script

Run this to see the current state:

```sql
-- Check auth.users
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'vanduea@yahoo.com';

-- Check public.users
SELECT 
  id,
  email,
  role,
  status,
  profile_setup_completed
FROM public.users 
WHERE email = 'vanduea@yahoo.com';
```

If the user exists in `auth.users` but not in `public.users`, the trigger should have created it. If it exists in both, you just need to reset the password via Dashboard.

