/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // PWA Configuration
  // Note: next-pwa will be added in a separate step if needed
  // For now, we'll use manual service worker setup
  
  // Image optimization
  images: {
    domains: [
      'supabase.co',
      'storage.supabase.io',
      'drive.google.com',
      'www.dropbox.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig

