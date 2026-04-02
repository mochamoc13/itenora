/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.itenora.com",
          },
        ],
        destination: "https://itenora.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;