/**
 * Supabase Edge Function: Generate Invoice PDF
 * 
 * This function generates a PDF invoice server-side using pdfkit
 * 
 * Usage:
 * POST /functions/v1/generate-invoice-pdf
 * Body: { invoice_id: "uuid" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get invoice ID from request
    const { invoice_id } = await req.json()

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'invoice_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch invoice data with related job and client
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*, jobs(*, clients(*), users(*))')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate PDF using pdf-lib (works in Deno)
    // Import pdf-lib for Deno
    const { PDFDocument, rgb, StandardFonts } = await import('https://cdn.skypack.dev/pdf-lib@^1.17.1')
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // Add fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Colors
    const primaryColor = rgb(0.149, 0.102, 0.329) // #261A54
    const textColor = rgb(0.059, 0.090, 0.165) // #0F172A
    const mutedColor = rgb(0.278, 0.341, 0.412) // #475569
    
    let yPosition = height - 50
    
    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 28,
      font: boldFont,
      color: primaryColor,
    })
    
    yPosition -= 30
    page.drawText(`Invoice #: ${invoice.invoice_number || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: mutedColor,
    })
    
    yPosition -= 60
    
    // Bill To section
    page.drawText('Bill To:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: mutedColor,
    })
    yPosition -= 15
    page.drawText(invoice.jobs?.clients?.name || 'N/A', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: textColor,
    })
    if (invoice.jobs?.clients?.email) {
      yPosition -= 12
      page.drawText(invoice.jobs.clients.email, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: mutedColor,
      })
    }
    
    // Date section (right side)
    const dateY = height - 80
    page.drawText('Date:', {
      x: width - 200,
      y: dateY,
      size: 10,
      font: font,
      color: mutedColor,
    })
    page.drawText(new Date(invoice.created_at).toLocaleDateString(), {
      x: width - 200,
      y: dateY - 15,
      size: 12,
      font: boldFont,
      color: textColor,
    })
    
    if (invoice.due_date) {
      page.drawText('Due Date:', {
        x: width - 200,
        y: dateY - 40,
        size: 10,
        font: font,
        color: mutedColor,
      })
      page.drawText(new Date(invoice.due_date).toLocaleDateString(), {
        x: width - 200,
        y: dateY - 55,
        size: 12,
        font: boldFont,
        color: textColor,
      })
    }
    
    yPosition -= 80
    
    // Amounts section
    const amountsStartY = yPosition
    page.drawLine({
      start: { x: 50, y: amountsStartY },
      end: { x: width - 50, y: amountsStartY },
      thickness: 1,
      color: rgb(0.898, 0.906, 0.922),
    })
    
    yPosition -= 30
    
    page.drawText('Subtotal:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    })
    page.drawText(`$${parseFloat(invoice.total_amount || '0').toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    })
    
    yPosition -= 20
    
    page.drawText('Paid:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    })
    page.drawText(`$${parseFloat(invoice.paid_amount || '0').toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    })
    
    yPosition -= 30
    
    // Total line
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: primaryColor,
    })
    
    yPosition -= 20
    
    page.drawText('Balance Due:', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    })
    page.drawText(`$${parseFloat(invoice.balance || '0').toFixed(2)}`, {
      x: width - 150,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    })
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    
    // Upload to Supabase Storage
    const fileName = `invoices/${invoice_id}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Still return PDF even if upload fails
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('invoices')
      .getPublicUrl(fileName)
    
    // Update invoice record with PDF URL
    await supabaseClient
      .from('invoices')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', invoice_id)
    
    // Return PDF as binary
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number || invoice_id}.pdf"`,
      },
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

