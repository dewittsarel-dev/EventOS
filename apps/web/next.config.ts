import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/simulation/eventos-synthetic-catalogue.csv',
        destination: '/marketplace/simulation',
        permanent: false,
      },
      {
        source: '/simulation/eventos-synthetic-catalogue.xlsx',
        destination: '/marketplace/simulation',
        permanent: false,
      },
      {
        source: '/simulation/eventos-synthetic-catalogue-with-images.xlsx',
        destination: '/marketplace/simulation',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
