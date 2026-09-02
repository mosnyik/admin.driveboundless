import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Matches the public drive-boundless site's config. Sanity CDN images are
    // already served pre-optimized, and this sidesteps Next's image proxy
    // rejecting cdn.sanity.io in environments where it resolves through NAT/CDN
    // routing that looks like a private IP.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
}

export default nextConfig
