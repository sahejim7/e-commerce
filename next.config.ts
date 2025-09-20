import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
        "3000-01k55xhg2prk1s3dcw95d93n16.cloudspaces.litng.ai",
        "35.184.78.201:3000", // Added missing IP
        "34.31.89.161:3000",
        "35.224.111.72:3000",
        "104.197.66.167:3000",
        "34.67.214.67:3000",
        "34.123.95.61:3000",
        "10.128.0.61:3000",
        "10.128.0.61:3001",
        "10.128.0.7:3000", // Added network IP from terminal
        "35.188.45.240:3000", // Added current request IP
        "35.188.45.240:3001", // Added current request IP for port 3001
        "35.239.177.113:3000", // Added the IP causing the current error
        "35.239.177.113:3001", // Added the IP for port 3001
        "35.238.147.174:3000", // Added the current error IP
        "35.238.147.174:3001", // Added the current error IP for port 3001
        "34.9.212.104:3000", // Added the IP from the current error
        "34.9.212.104:3001", // Added the IP for port 3001
        "34.133.25.127:3000", // Added the IP from the current Server Actions error
        "34.133.25.127:3001", // Added the IP for port 3001
        "35.225.56.52:3000", // Added the IP from the current Server Actions error
        "35.225.56.52:3001" // Added the IP for port 3001
      ],
      bodySizeLimit: "10mb",
    },
  },
  // Configure allowedDevOrigins to handle cross-origin requests in development
  allowedDevOrigins: [
    "3000-01k55xhg2prk1s3dcw95d93n16.cloudspaces.litng.ai",
    "35.239.177.113:3000",
    "35.239.177.113:3001",
    "35.238.147.174:3000",
    "35.238.147.174:3001",
    "10.128.0.234:3000",
    "10.128.0.234:3001",
    "34.133.25.127:3000", // Added the IP from the current Server Actions error
    "34.133.25.127:3001", // Added the IP for port 3001
    "35.225.56.52:3000", // Added the IP from the current Server Actions error
    "35.225.56.52:3001" // Added the IP for port 3001
  ],
  images: {
    unoptimized: true,
  },
  // Add headers to handle cross-origin issues
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-forwarded-host',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
