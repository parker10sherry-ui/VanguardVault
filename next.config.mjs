/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "*.psacard.com" },
      { protocol: "https", hostname: "i.ebayimg.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
