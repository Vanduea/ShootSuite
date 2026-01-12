/**
 * Profile Setup Page
 * Users complete their profile after approval
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
// Toast notifications - using simple alerts for now

export default function SetupProfilePage() {
  const router = useRouter()
  // Toast helper function
  const showToast = (title: string, description?: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      alert(`${title}\n${description || ''}`)
    } else {
      alert(`Error: ${title}\n${description || ''}`)
    }
  }
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'freelancer' | 'company'>('freelancer')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentUser(profile)
        setUserType(profile.user_type || 'freelancer')
        setName(profile.name || '')
        setCompanyName(profile.company_name || '')
        setDob(profile.date_of_birth || '')
        
        // If profile setup already completed, redirect to dashboard
        if (profile.profile_setup_completed) {
          router.push('/dashboard')
        }
      }
    }

    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate required fields
      if (userType === 'company' && !companyName) {
        throw new Error('Company name is required')
      }

      if (userType === 'freelancer' && !name) {
        throw new Error('Name is required')
      }

      if (userType === 'freelancer' && !dob) {
        throw new Error('Date of birth is required for freelancers')
      }

      // Update user profile
      // Only update allowed fields (not role or status - those are admin-only)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userType === 'company' ? companyName : name,
          user_type: userType,
          date_of_birth: userType === 'freelancer' && dob ? dob : null,
          company_name: userType === 'company' ? companyName : null,
          profile_setup_completed: true,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      showToast('Profile Setup Complete', 'Your profile has been set up successfully.')

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <p className="text-body text-muted-text">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-app-title text-primary mb-2">Complete Your Profile</h1>
        <p className="text-body text-muted-text">
          Please provide some additional information to complete your profile setup.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type */}
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

          {/* Name Fields */}
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
            <>
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
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
            </>
          )}

          {/* Optional Fields */}
          <Input
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />

          <div>
            <label className="block text-card-title text-dark-text mb-2">Address</label>
            <textarea
              className="w-full px-3 py-2 border border-border-gray rounded-lg text-body text-dark-text placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              rows={3}
              placeholder="123 Main St, City, State, ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-card-title text-dark-text mb-2">Bio</label>
            <textarea
              className="w-full px-3 py-2 border border-border-gray rounded-lg text-body text-dark-text placeholder:text-muted-text focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              rows={4}
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Complete Profile Setup
          </Button>
        </form>
      </Card>
    </div>
  )
}

