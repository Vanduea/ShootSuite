# Edge Function Setup Guide

## Invoice PDF Generation

The invoice PDF generation uses a Supabase Edge Function. Here's how to set it up:

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy generate-invoice-pdf
```

### 2. Environment Variables

The Edge Function needs these environment variables (set in Supabase Dashboard):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (for admin access)

### 3. Production PDF Generation

The current implementation returns HTML. For production, you'll want to use a proper PDF library:

**Option 1: Use Puppeteer (Recommended)**
```typescript
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setContent(invoiceHTML)
const pdf = await page.pdf({ format: 'A4' })
await browser.close()

return new Response(pdf, {
  headers: { 
    ...corsHeaders, 
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${invoice_id}.pdf"`
  }
})
```

**Option 2: Use pdfkit**
```typescript
import PDFDocument from 'https://cdn.skypack.dev/pdfkit'

const doc = new PDFDocument()
// Add content to PDF
const chunks: Uint8Array[] = []
doc.on('data', chunk => chunks.push(chunk))
doc.on('end', () => {
  const pdf = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  // Return PDF
})
```

### 4. Update Storage

After generating the PDF, upload it to Supabase Storage:

```typescript
const { data, error } = await supabaseClient.storage
  .from('invoices')
  .upload(`invoices/${invoice_id}.pdf`, pdfBlob, {
    contentType: 'application/pdf',
    upsert: true
  })

// Update invoice record with PDF URL
await supabaseClient
  .from('invoices')
  .update({ pdf_url: data.path })
  .eq('id', invoice_id)
```

### 5. Testing

Test the function locally:
```bash
supabase functions serve generate-invoice-pdf
```

Then call it:
```bash
curl -X POST http://localhost:54321/functions/v1/generate-invoice-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": "your-invoice-id"}'
```

### Notes

- The Edge Function uses Deno runtime
- Make sure to handle CORS properly
- Store PDFs in Supabase Storage for easy access
- Update the invoice record with the PDF URL after generation

