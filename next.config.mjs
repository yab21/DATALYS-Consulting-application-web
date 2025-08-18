/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8082',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '82.112.253.137',
        port: '8081',
      },
      {
        protocol: 'http',
        hostname: '82.112.253.137',
        port: '8082',
        pathname: '/files/serve/**',
      },
      {
        protocol: 'http',
        hostname: '82.112.253.137',
        port: '8082',
      },
      {
        protocol: 'http',
        hostname: '82.112.253.137',
      },
      {
        protocol: 'https',
        hostname: '82.112.253.137',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      // En développement, autoriser tous les domaines
      ...(process.env.NODE_ENV === 'development' ? [{
        protocol: 'http',
        hostname: '**',
        port: '',
      }, {
        protocol: 'https',
        hostname: '**',
        port: '',
      }] : [])
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001', '82.112.253.137'],
      bodySizeLimit: '2mb'
    }
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Allow service worker to be accessible
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
};

// Add webpack configuration for browser compatibility
const configWithWebpack = {
  ...nextConfig,
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config, { dev, isServer }) => {
    // Add polyfills and fallbacks for older browsers
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      module: false,
    };

    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        mergeDuplicateChunks: true,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          minRemainingSize: 0,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default configWithWebpack;
