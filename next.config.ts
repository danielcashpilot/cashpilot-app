import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // hide the "N" bubble so it does not cover the chat send button
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
