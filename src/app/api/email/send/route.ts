/**
 * API Route: Send Email
 * Server-side email sending endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendApprovalEmail, sendRejectionEmail, sendInvoiceEmail, sendPaymentReceivedEmail, sendDeliverableReadyEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { type, ...data } = await request.json()

    switch (type) {
      case 'approval':
        await sendApprovalEmail(data.email, data.name)
        break
      
      case 'rejection':
        await sendRejectionEmail(data.email, data.name, data.reason)
        break
      
      case 'invoice':
        await sendInvoiceEmail(
          data.clientEmail,
          data.clientName,
          data.invoiceNumber,
          data.amount,
          data.portalUrl
        )
        break
      
      case 'payment_received':
        await sendPaymentReceivedEmail(
          data.clientEmail,
          data.clientName,
          data.amount,
          data.invoiceNumber
        )
        break
      
      case 'deliverable_ready':
        await sendDeliverableReadyEmail(
          data.clientEmail,
          data.clientName,
          data.portalUrl
        )
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

