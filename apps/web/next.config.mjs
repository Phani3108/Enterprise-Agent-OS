/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@agentos/sdk', '@agentos/output-schemas', '@agentos/streaming'],
};

export default nextConfig;
