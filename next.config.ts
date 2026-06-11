import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['nodemailer'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.vekto.nl' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'zonnigewinkel.nl' },
      { protocol: 'https', hostname: 'cdn.webshopapp.com' },
      { protocol: 'https', hostname: 'cdn.prod.website-files.com' },
      { protocol: 'https', hostname: 'www.aircozonderstek.nl' },
    ],
  },
};

export default nextConfig;
