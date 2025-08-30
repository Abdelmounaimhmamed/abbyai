// Additional Vercel configuration
// This file provides additional settings for the Vercel deployment

module.exports = {
  // Function configuration
  functions: {
    "api/**/*.ts": {
      runtime: "@vercel/node@20.x",
      maxDuration: 30, // 30 seconds max execution time
    },
  },

  // Build configuration
  build: {
    env: {
      PRISMA_CLI_BINARY_TARGETS: "native,rhel-openssl-1.0.x",
      PRISMA_QUERY_ENGINE_BINARY: "rhel-openssl-1.0.x",
      PRISMA_INTROSPECTION_ENGINE_BINARY: "rhel-openssl-1.0.x",
      PRISMA_MIGRATION_ENGINE_BINARY: "rhel-openssl-1.0.x",
      PRISMA_FMT_BINARY: "rhel-openssl-1.0.x",
    },
  },

  // Headers for better security and performance
  headers: [
    {
      source: "/api/(.*)",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PUT, DELETE, OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization",
        },
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
      ],
    },
  ],

  // Rewrites for SPA routing
  rewrites: [
    {
      source: "/api/:path*",
      destination: "/api/:path*",
    },
    {
      source: "/((?!api/).*)",
      destination: "/",
    },
  ],

  // Environment variables that should be available at build time
  env: {
    PRISMA_CLI_BINARY_TARGETS: "native,rhel-openssl-1.0.x",
  },
};
