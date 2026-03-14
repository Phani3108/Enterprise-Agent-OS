/**
 * Next.js config for AgentOS web app.
 * Marketing UI can be deployed under marketing.* subdomain — set
 * NEXT_PUBLIC_GATEWAY_URL to main AgentOS backend (e.g. https://api.agentos.com).
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@agentos/sdk', '@agentos/output-schemas', '@agentos/streaming', '@agentos/gateway'],
    // Marketing subdomain: build with basePath when deploying to marketing.agentos.com
    // basePath: process.env.MARKETING_SUBDOMAIN === 'true' ? '/marketing' : undefined,
};

export default nextConfig;
