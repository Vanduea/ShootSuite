/**
 * Clients List Page
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Plus, Mail, Phone, Building } from 'lucide-react'

async function getClients() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Clients</h1>
        <Link href="/dashboard/clients/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-body text-text-muted">Loading clients...</p>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-body text-text-muted mb-4">
              No clients yet. Add your first client to get started.
            </p>
            <Link href="/dashboard/clients/new">
              <Button variant="primary">Add Your First Client</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-card-title text-primary mb-3">{client.name}</h3>
                
                <div className="space-y-2 text-caption text-text-muted">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.company && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3" />
                      <span className="truncate">{client.company}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

