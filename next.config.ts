import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
  //   webpack: (config) => {
  //   config.optimization.splitChunks = {
  //     chunks: 'all',
  //     cacheGroups: {
  //       settings: {
  //         name: 'settings',
  //         test: /[\\/]components[\\/]Settings[\\/]/,
  //         priority: 20,
  //       },
  //     },
  //   }
  //   return config
  // },
};

export default nextConfig;
