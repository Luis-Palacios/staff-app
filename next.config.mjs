/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
