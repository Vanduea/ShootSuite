/**
 * Application Type Definitions
 */

import type { Database } from './database.types'

// Re-export database types
export type { Database }

// Extended types with relations
export interface JobWithRelations extends Database['public']['Tables']['jobs']['Row'] {
  client: Database['public']['Tables']['clients']['Row']
  invoice?: Database['public']['Tables']['invoices']['Row']
  payments?: Database['public']['Tables']['payments']['Row'][]
  expenses?: Database['public']['Tables']['expenses']['Row'][]
  tasks?: Database['public']['Tables']['tasks']['Row'][]
  deliverables?: Database['public']['Tables']['deliverables']['Row'][]
  team_members?: Database['public']['Tables']['team_members']['Row'][]
}

export interface ClientWithJobs extends Database['public']['Tables']['clients']['Row'] {
  jobs?: Database['public']['Tables']['jobs']['Row'][]
}

export interface InvoiceWithPayments extends Database['public']['Tables']['invoices']['Row'] {
  job: Database['public']['Tables']['jobs']['Row']
  payments: Database['public']['Tables']['payments']['Row'][]
}

// Form types
export interface JobFormData {
  client_id: string
  title?: string
  date: string
  start_time?: string
  end_time?: string
  timezone: string
  location?: string
  package_type?: string
  price: number
  deposit_amount?: number
  notes?: string
  shot_list?: Array<{ id: string; text: string; checked: boolean }>
  gear_checklist?: Array<{ id: string; text: string; checked: boolean }>
}

export interface ClientFormData {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
}

export interface PaymentFormData {
  invoice_id?: string
  job_id: string
  amount: number
  type?: 'Deposit' | 'Final' | 'Refund'
  date: string
  method?: 'Stripe' | 'PayPal' | 'Cash' | 'Check' | 'Bank Transfer'
  transaction_id?: string
  notes?: string
}

export interface ExpenseFormData {
  job_id: string
  category: string
  amount: number
  date: string
  notes?: string
  receipt_url?: string
}

// UI State types
export interface KanbanColumn {
  id: string
  title: string
  status: Database['public']['Tables']['jobs']['Row']['status']
  jobs: JobWithRelations[]
}

export interface FilterState {
  status?: Database['public']['Tables']['jobs']['Row']['status']
  client_id?: string
  date_from?: string
  date_to?: string
  package_type?: string
  location?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Cloud Storage types
export interface CloudFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailUrl?: string
  downloadUrl: string
  modifiedTime: string
}

export interface CloudFolder {
  id: string
  name: string
  files: CloudFile[]
}

