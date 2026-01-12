/**
 * API Route: Generate Invoice PDF
 * Uses pdfkit to generate PDF server-side
 */

import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id

    // Create server-side Supabase client
    const supabaseClient = createServerClient()

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*, jobs(*, clients(*), users(*))')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk))

    // Header
    doc.fontSize(28).text('INVOICE', { align: 'left' })
    doc.fontSize(12).fillColor('#475569').text(`Invoice #: ${invoice.invoice_number || 'N/A'}`, { align: 'left' })
    doc.moveDown(2)

    // Bill To section
    doc.fontSize(10).fillColor('#475569').text('Bill To:', { continued: false })
    doc.fontSize(12).fillColor('#0F172A').text(invoice.jobs?.clients?.name || 'N/A', { continued: false })
    if (invoice.jobs?.clients?.email) {
      doc.fontSize(10).fillColor('#475569').text(invoice.jobs.clients.email, { continued: false })
    }

    // Date section (right aligned)
    const dateY = doc.y - 60
    doc.fontSize(10).fillColor('#475569').text('Date:', 350, dateY, { continued: false })
    doc.fontSize(12).fillColor('#0F172A').text(new Date(invoice.created_at).toLocaleDateString(), 350, dateY - 15, { continued: false })
    
    if (invoice.due_date) {
      doc.fontSize(10).fillColor('#475569').text('Due Date:', 350, dateY - 40, { continued: false })
      doc.fontSize(12).fillColor('#0F172A').text(new Date(invoice.due_date).toLocaleDateString(), 350, dateY - 55, { continued: false })
    }

    doc.moveDown(4)

    // Amounts section
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke()
    doc.moveDown(2)

    doc.fontSize(12).fillColor('#0F172A').text('Subtotal:', { continued: false })
    doc.text(`$${parseFloat(invoice.total_amount || '0').toFixed(2)}`, { align: 'right' })
    doc.moveDown(1)

    doc.text('Paid:', { continued: false })
    doc.text(`$${parseFloat(invoice.paid_amount || '0').toFixed(2)}`, { align: 'right' })
    doc.moveDown(2)

    // Total line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#261A54').lineWidth(2).stroke()
    doc.moveDown(1)

    doc.fontSize(16).fillColor('#261A54').text('Balance Due:', { continued: false })
    doc.text(`$${parseFloat(invoice.balance || '0').toFixed(2)}`, { align: 'right' })

    // Finalize PDF
    doc.end()

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', reject)
    })

    // Upload to Supabase Storage
    const fileName = `invoices/${invoiceId}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (!uploadError && uploadData) {
      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('invoices')
        .getPublicUrl(fileName)

      // Update invoice record
      await supabaseClient
        .from('invoices')
        .update({ pdf_url: urlData.publicUrl })
        .eq('id', invoiceId)
    }

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number || invoiceId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

