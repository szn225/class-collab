/** @type {import('next').NextConfig} */
const nextConfig = {
  // API routes need larger body for image uploads
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
