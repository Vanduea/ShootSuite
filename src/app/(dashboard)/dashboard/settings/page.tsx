/**
 * Settings Page
 * User profile and branding management
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { User, Palette, Upload, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'branding'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_url: '',
    branding_logo: '',
    branding_primary_color: '#261A54',
    branding_secondary_color: '#345EBE',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url || '',
        branding_logo: profile.branding_logo || '',
        branding_primary_color: profile.branding_primary_color || '#261A54',
        branding_secondary_color: profile.branding_secondary_color || '#345EBE',
      })
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setFormData({ ...formData, avatar_url: urlData.publicUrl })
      setSuccess('Avatar uploaded successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars') // Using same bucket for now
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setFormData({ ...formData, branding_logo: urlData.publicUrl })
      setSuccess('Logo uploaded successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          branding_logo: formData.branding_logo || null,
          branding_primary_color: formData.branding_primary_color,
          branding_secondary_color: formData.branding_secondary_color,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-app-title text-primary">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-gray">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-body font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-secondary text-primary'
              : 'border-transparent text-text-muted hover:text-text-dark'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 text-body font-medium border-b-2 transition-colors ${
            activeTab === 'branding'
              ? 'border-secondary text-primary'
              : 'border-transparent text-text-muted hover:text-text-dark'
          }`}
        >
          <Palette className="w-4 h-4 inline mr-2" />
          Branding
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-body text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-body text-green-600">{success}</p>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="text-section-header text-primary mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isSaving}
                  />
                  <Button variant="secondary" type="button">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Avatar
                  </Button>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Email</label>
              <Input
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-caption text-text-muted mt-1">Email cannot be changed</p>
            </div>
          </div>
        </Card>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card>
          <h2 className="text-section-header text-primary mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {formData.branding_logo && (
                  <img
                    src={formData.branding_logo}
                    alt="Logo"
                    className="h-16 object-contain"
                  />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isSaving}
                  />
                  <Button variant="secondary" type="button">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Logo
                  </Button>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-card-title text-text-dark mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.branding_primary_color}
                    onChange={(e) => setFormData({ ...formData, branding_primary_color: e.target.value })}
                    className="w-16 h-10 rounded border border-border-gray"
                  />
                  <Input
                    value={formData.branding_primary_color}
                    onChange={(e) => setFormData({ ...formData, branding_primary_color: e.target.value })}
                    placeholder="#261A54"
                  />
                </div>
              </div>

              <div>
                <label className="block text-card-title text-text-dark mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.branding_secondary_color}
                    onChange={(e) => setFormData({ ...formData, branding_secondary_color: e.target.value })}
                    className="w-16 h-10 rounded border border-border-gray"
                  />
                  <Input
                    value={formData.branding_secondary_color}
                    onChange={(e) => setFormData({ ...formData, branding_secondary_color: e.target.value })}
                    placeholder="#345EBE"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

