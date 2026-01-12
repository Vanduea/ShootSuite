/**
 * Login Page
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { Mail, Lock } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Check user status and profile setup
        let userProfile: any = null
        let profileError: any = null

        const { data: profileData, error: queryError } = await supabase
          .from('users')
          .select('status, profile_setup_completed, role')
          .eq('id', data.user.id)
          .single()

        profileError = queryError
        userProfile = profileData

        // If profile doesn't exist, try to create it (fallback)
        if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('No rows'))) {
          console.log('Profile not found, creating fallback profile...')
          
          // Profile doesn't exist - create it
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'user',
              status: 'pending',
              profile_setup_completed: false,
              user_type: data.user.user_metadata?.user_type || 'company',
              company_name: data.user.user_metadata?.company_name || null,
              date_of_birth: data.user.user_metadata?.date_of_birth || null,
            })

          if (createError) {
            console.error('Failed to create profile:', createError)
            throw new Error(`Failed to create user profile: ${createError.message}. Please contact support.`)
          }

          // Retry query after creating profile
          const { data: newProfile, error: retryError } = await supabase
            .from('users')
            .select('status, profile_setup_completed, role')
            .eq('id', data.user.id)
            .single()

          if (retryError || !newProfile) {
            throw new Error(`Failed to load user profile after creation: ${retryError?.message || 'Unknown error'}`)
          }

          userProfile = newProfile
        } else if (profileError) {
          // Other error (RLS, network, etc.)
          console.error('Profile query error:', profileError)
          throw new Error(`Failed to load user profile: ${profileError.message || profileError.code || 'Unknown error'}. Please check your database permissions.`)
        }

        if (!userProfile) {
          throw new Error('User profile not found. Please contact support.')
        }

        // Check account status
        if (userProfile.status === 'pending') {
          await supabase.auth.signOut()
          router.push('/signup/pending')
          return
        }

        if (userProfile.status === 'rejected') {
          await supabase.auth.signOut()
          router.push('/signup/rejected')
          return
        }

        if (userProfile.status === 'suspended') {
          throw new Error('Your account has been suspended. Please contact support.')
        }

        // If active, check if profile setup is needed
        if (userProfile.status === 'active') {
          if (!userProfile.profile_setup_completed) {
            router.push('/setup-profile')
          } else {
            router.push('/dashboard')
          }
        }

        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/icon300.png"
              alt="ShootSuite Logo"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <h1 className="text-app-title text-primary mb-2">
            Shoot<span style={{ color: '#345ebe' }}>Suite</span>
          </h1>
            <p className="text-body text-muted-text">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-body text-red-600">{error}</p>
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body text-muted-text">
              Don't have an account?{' '}
              <Link href="/signup" className="text-secondary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

