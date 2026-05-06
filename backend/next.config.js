/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/esbuild',
    ],
  },
}

module.exports = nextConfig
