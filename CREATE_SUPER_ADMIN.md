# Create Super Admin User

This guide shows you how to create a Super Admin user with a password directly in Supabase.

## Quick Start

### Option 1: Using the Script (Recommended)

1. **Make sure you have your `.env.local` file** with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Run the script:**
   ```bash
   npm run create-super-admin
   ```

   Or with custom values:
   ```bash
   node scripts/create-super-admin.js vanduea@yahoo.com MySecurePassword123 "Super Admin" company "Company Name"
   ```

### Option 2: Using Node.js directly

```bash
node scripts/create-super-admin.js
```

### Option 3: Using TypeScript (if you have tsx installed)

```bash
npx tsx scripts/create-super-admin.ts
```

## Script Parameters

The script accepts the following arguments (all optional):

```bash
node scripts/create-super-admin.js [email] [password] [name] [userType] [companyName] [dateOfBirth]
```

- **email** (default: `vanduea@yahoo.com`) - User's email address
- **password** (default: `Admin@123456`) - ⚠️ **CHANGE THIS!**
- **name** (default: `Super Admin`) - User's display name
- **userType** (default: `company`) - Either `freelancer` or `company`
- **companyName** (default: `ShootSuite Admin`) - Required if userType is `company`
- **dateOfBirth** (optional) - Required if userType is `freelancer` (format: `YYYY-MM-DD`)

## Examples

### Create Company Super Admin
```bash
node scripts/create-super-admin.js admin@example.com SecurePass123 "Admin User" company "My Company"
```

### Create Freelancer Super Admin
```bash
node scripts/create-super-admin.js admin@example.com SecurePass123 "Admin User" freelancer "" "1990-01-01"
```

## What the Script Does

1. ✅ Checks if user exists in `auth.users`
   - If exists: Updates password and metadata
   - If not: Creates new auth user with email and password
2. ✅ Auto-confirms the email (no verification needed)
3. ✅ Waits for the database trigger to create the profile in `public.users`
4. ✅ Updates or creates the profile to set:
   - `role = 'super_admin'`
   - `status = 'active'`
   - `profile_setup_completed = true`
   - Other user details (name, user_type, etc.)

## Troubleshooting

### Error: Missing environment variables
- Make sure `.env.local` exists in the project root
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Error: User already exists
- The user already exists in `auth.users`
- Delete the user from Supabase Dashboard → Authentication → Users first
- Or use a different email

### Error: Profile creation failed
- Check that the database trigger `handle_new_user` is working
- The script will try to create the profile manually if the trigger fails

### Error: Permission denied
- Make sure you're using the **Service Role Key** (not the anon key)
- The Service Role Key bypasses RLS policies

## Manual Alternative

If the script doesn't work, you can create the user manually:

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** → **"Create New User"**
3. Enter:
   - Email: `vanduea@yahoo.com`
   - Password: (your secure password)
   - Auto Confirm User: ✅ (checked)
4. Click **"Create User"**
5. **Then run this SQL** in Supabase SQL Editor:
   ```sql
   UPDATE public.users
   SET 
     role = 'super_admin',
     status = 'active',
     profile_setup_completed = TRUE,
     name = 'Super Admin',
     user_type = 'company',
     company_name = 'ShootSuite Admin'
   WHERE email = 'vanduea@yahoo.com';
   ```

## Security Notes

⚠️ **Important:**
- Change the default password immediately after first login
- Never commit `.env.local` to version control
- The Service Role Key has full database access - keep it secret
- Use a strong password (min 8 characters, mix of letters, numbers, symbols)

## After Creation

Once the Super Admin is created:

1. ✅ Login at `/login` with the email and password
2. ✅ You'll have access to `/dashboard/admin/users` to manage other users
3. ✅ Change your password after first login
4. ✅ Complete your profile setup if needed

