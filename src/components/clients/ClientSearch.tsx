/**
 * Client Search Component
 */

'use client'

import { useState, useMemo } from 'react'
import Input from '@/components/ui/Input'
import { Search, X } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
}

interface ClientSearchProps {
  clients: Client[]
  onFilteredClientsChange?: (filtered: Client[]) => void
}

export default function ClientSearch({ clients, onFilteredClientsChange }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = useMemo(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client => {
        const name = client.name?.toLowerCase() || ''
        const email = client.email?.toLowerCase() || ''
        const phone = client.phone?.toLowerCase() || ''
        const company = client.company?.toLowerCase() || ''
        const notes = client.notes?.toLowerCase() || ''
        
        return name.includes(term) || 
               email.includes(term) || 
               phone.includes(term) ||
               company.includes(term) ||
               notes.includes(term)
      })
    }

    if (onFilteredClientsChange) {
      onFilteredClientsChange(filtered)
    }

    return filtered
  }, [clients, searchTerm, onFilteredClientsChange])

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search clients by name, email, phone, company..."
          className="w-full pl-10 pr-10 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-dark"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-caption text-text-muted">
        Showing {filteredClients.length} of {clients.length} clients
      </div>
    </div>
  )
}

