/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Zorgt voor strengere controles in React
  experimental: {
    // Geen 'appDir' nodig
  },
  webpack: (config) => {
    // Custom Webpack-configuratie als nodig
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Voeg hier eventuele custom aliasen toe
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
