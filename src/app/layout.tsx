/**
 * Root Layout
 * Next.js App Router root layout
 */

import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'ShootSuite - Photographer Job Manager',
  description: 'Streamline your photography workflow',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon300.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ShootSuite',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#261A54',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon300.png" />
        <link rel="icon" type="image/png" sizes="300x300" href="/icon300.png" />
      </head>
      <body className={montserrat.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

