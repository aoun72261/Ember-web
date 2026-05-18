import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },           // Spotify album art
      { protocol: 'https', hostname: '*.scdn.co' },           // Spotify CDN variants
      { protocol: 'https', hostname: 'mosaic.scdn.co' },      // Spotify mosaic art
      { protocol: 'https', hostname: 'img.youtube.com' },     // YouTube thumbnails
      { protocol: 'https', hostname: 'i.ytimg.com' },         // YouTube thumbnails (CDN)
      { protocol: 'https', hostname: 'e-cdns-images.dzcdn.net' }, // Deezer album art
      { protocol: 'https', hostname: 'cdns-images.dzcdn.net' },   // Deezer album art
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile pics
    ],
  },
};

export default nextConfig;
