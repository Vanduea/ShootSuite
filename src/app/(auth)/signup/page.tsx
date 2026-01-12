/**
 * Sign Up Page
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { Mail, Lock, User } from 'lucide-react'
import Image from 'next/image'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState<'freelancer' | 'company'>('freelancer')
  const [companyName, setCompanyName] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Validate password requirements
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      // Validate DOB if freelancer
      if (userType === 'freelancer' && !dob) {
        throw new Error('Date of birth is required for freelancers')
      }

      // Validate company name if company
      if (userType === 'company' && !companyName) {
        throw new Error('Company name is required')
      }

      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userType === 'company' ? companyName : name,
            user_type: userType,
            date_of_birth: userType === 'freelancer' && dob ? dob : null,
            company_name: userType === 'company' ? companyName : null,
          },
        },
      })

      if (signUpError) throw signUpError

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // User profile is automatically created by database trigger with status='pending'
      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update profile with signup form data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userType === 'company' ? companyName : name,
          user_type: userType,
          date_of_birth: userType === 'freelancer' && dob ? dob : null,
          company_name: userType === 'company' ? companyName : null,
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.warn('Profile update warning:', updateError.message)
      }

      // Sign out the user (they need approval before accessing the app)
      await supabase.auth.signOut()

      // Redirect to pending approval page
      router.push('/signup/pending')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
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
          <p className="text-body text-muted-text">Create your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-body text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-card-title text-dark-text mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="freelancer"
                    checked={userType === 'freelancer'}
                    onChange={(e) => setUserType(e.target.value as 'freelancer' | 'company')}
                    disabled={isLoading}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="text-body text-dark-text">Freelancer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="company"
                    checked={userType === 'company'}
                    onChange={(e) => setUserType(e.target.value as 'freelancer' | 'company')}
                    disabled={isLoading}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="text-body text-dark-text">Company</span>
                </label>
              </div>
            </div>

            {userType === 'company' ? (
              <Input
                type="text"
                label="Company Name"
                placeholder="Acme Photography Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={isLoading}
              />
            ) : (
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            )}

            {userType === 'freelancer' && (
              <div>
                <label className="block text-card-title text-dark-text mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body text-dark-text focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  disabled={isLoading}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                <p className="text-caption text-muted-text mt-1">Must be 18 or older</p>
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
              minLength={8}
              disabled={isLoading}
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body text-muted-text">
              Already have an account?{' '}
              <Link href="/login" className="text-secondary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

