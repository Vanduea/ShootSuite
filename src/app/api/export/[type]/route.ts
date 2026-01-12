/**
 * API Route: Export Data
 * Exports jobs, clients, or invoices to CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    if (!['jobs', 'clients', 'invoices'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type' },
        { status: 400 }
      )
    }

    const supabaseClient = createServerClient()

    // Get user from auth header (for server-side)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, we'll use the service role key to get data
    // In production, you'd extract user ID from JWT token
    let data: any[] = []

    if (type === 'jobs') {
      const { data: jobs } = await supabaseClient
        .from('jobs')
        .select('*, clients(*), invoices(*), payments(*)')
        .order('date', { ascending: false })
      
      data = (jobs || []).map(job => ({
        'Job ID': job.id,
        'Title': job.title || '',
        'Client': job.clients?.name || '',
        'Date': job.date,
        'Location': job.location || '',
        'Package Type': job.package_type || '',
        'Status': job.status,
        'Price': job.price || 0,
        'Total Paid': job.payments?.filter((p: any) => p.status === 'Completed').reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0) || 0,
        'Balance': (job.price || 0) - (job.payments?.filter((p: any) => p.status === 'Completed').reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0) || 0),
      }))
    } else if (type === 'clients') {
      const { data: clients } = await supabaseClient
        .from('clients')
        .select('*')
        .order('name')
      
      data = (clients || []).map(client => ({
        'Client ID': client.id,
        'Name': client.name,
        'Email': client.email || '',
        'Phone': client.phone || '',
        'Company': client.company || '',
        'Address': client.address || '',
      }))
    } else if (type === 'invoices') {
      const { data: invoices } = await supabaseClient
        .from('invoices')
        .select('*, jobs(*, clients(*))')
        .order('created_at', { ascending: false })
      
      data = (invoices || []).map(invoice => ({
        'Invoice Number': invoice.invoice_number,
        'Client': invoice.jobs?.clients?.name || '',
        'Total Amount': invoice.total_amount || 0,
        'Paid Amount': invoice.paid_amount || 0,
        'Balance': invoice.balance || 0,
        'Status': invoice.status,
        'Due Date': invoice.due_date || '',
        'Created': invoice.created_at,
      }))
    }

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 404 })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        ),
      ]

      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    )
  }
}

