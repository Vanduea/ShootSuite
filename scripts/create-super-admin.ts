/**
 * Script to create a Super Admin user with password
 * 
 * Usage:
 *   npx tsx scripts/create-super-admin.ts
 * 
 * Or with Node.js (if you have ts-node):
 *   npx ts-node scripts/create-super-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure .env.local exists and contains these variables.')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface CreateSuperAdminOptions {
  email: string
  password: string
  name?: string
  userType?: 'freelancer' | 'company'
  companyName?: string
  dateOfBirth?: string
}

async function createSuperAdmin(options: CreateSuperAdminOptions) {
  const {
    email,
    password,
    name = 'Super Admin',
    userType = 'company',
    companyName,
    dateOfBirth,
  } = options

  console.log('\n🚀 Creating Super Admin user...')
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${name}`)
  console.log(`   Type: ${userType}\n`)

  try {
    // Step 1: Check if user exists, create or update
    console.log('📝 Step 1: Checking if user exists...')
    
    // Try to get existing user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    let authData: { user: any }
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password and metadata...')
      
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            name,
            user_type: userType,
            company_name: companyName,
            date_of_birth: dateOfBirth,
          },
        }
      )
      
      if (updateError) {
        console.error('❌ Error updating auth user:', updateError.message)
        throw updateError
      }
      
      authData = { user: updatedUser.user }
      console.log('✅ Auth user updated successfully!')
      console.log(`   User ID: ${existingUser.id}\n`)
    } else {
      console.log('📝 Creating new auth user...')
      // Create new user
      const { data: newUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email (no email verification needed)
        user_metadata: {
          name,
          user_type: userType,
          company_name: companyName,
          date_of_birth: dateOfBirth,
        },
      })

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message)
        throw authError
      }

      if (!newUserData.user) {
        throw new Error('User creation failed: No user data returned')
      }

      authData = newUserData
      console.log('✅ Auth user created successfully!')
      console.log(`   User ID: ${authData.user.id}\n`)
    }

    // Step 2: Wait a moment for the database trigger to create the profile
    console.log('⏳ Step 2: Waiting for profile creation trigger...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 3: Update profile to super admin
    console.log('👑 Step 3: Setting user as Super Admin...')
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'super_admin',
        status: 'active',
        profile_setup_completed: true,
        name: name,
        user_type: userType,
        company_name: companyName,
        date_of_birth: dateOfBirth,
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      // If profile doesn't exist yet, create it manually
      if (profileError.code === 'PGRST116') {
        console.log('⚠️  Profile not found, creating manually...')
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            name: name,
            role: 'super_admin',
            status: 'active',
            profile_setup_completed: true,
            user_type: userType,
            company_name: companyName,
            date_of_birth: dateOfBirth,
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error creating profile:', insertError.message)
          throw insertError
        }

        console.log('✅ Profile created successfully!')
        console.log('\n🎉 Super Admin created successfully!')
        console.log('\n📋 User Details:')
        console.log(`   ID: ${newProfile.id}`)
        console.log(`   Email: ${newProfile.email}`)
        console.log(`   Name: ${newProfile.name}`)
        console.log(`   Role: ${newProfile.role}`)
        console.log(`   Status: ${newProfile.status}`)
        console.log(`   Profile Setup: ${newProfile.profile_setup_completed ? '✅ Complete' : '❌ Incomplete'}`)
        return
      }

      console.error('❌ Error updating profile:', profileError.message)
      throw profileError
    }

    console.log('✅ Profile updated successfully!')
    console.log('\n🎉 Super Admin created successfully!')
    console.log('\n📋 User Details:')
    console.log(`   ID: ${profileData.id}`)
    console.log(`   Email: ${profileData.email}`)
    console.log(`   Name: ${profileData.name}`)
    console.log(`   Role: ${profileData.role}`)
    console.log(`   Status: ${profileData.status}`)
    console.log(`   Profile Setup: ${profileData.profile_setup_completed ? '✅ Complete' : '❌ Incomplete'}`)
    console.log('\n🔐 You can now login with:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n⚠️  Remember to change the password after first login!')

  } catch (error: any) {
    console.error('\n❌ Failed to create Super Admin:', error.message)
    if (error.details) {
      console.error('   Details:', error.details)
    }
    process.exit(1)
  }
}

// Main execution
async function main() {
  // Default values - modify these or pass as arguments
  const email = process.argv[2] || 'vanduea@yahoo.com'
  const password = process.argv[3] || 'Admin@123456' // Change this!
  const name = process.argv[4] || 'Super Admin'
  const userType = (process.argv[5] as 'freelancer' | 'company') || 'company'
  const companyName = process.argv[6] || 'ShootSuite Admin'
  const dateOfBirth = process.argv[7] // Optional

  await createSuperAdmin({
    email,
    password,
    name,
    userType,
    companyName: userType === 'company' ? companyName : undefined,
    dateOfBirth: userType === 'freelancer' ? dateOfBirth : undefined,
  })
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { createSuperAdmin }

