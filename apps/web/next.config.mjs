/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ignore ESLint errors during production builds
    // This allows deployment even with non-critical warnings
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Ignore TypeScript errors during builds (type-check runs separately in CI)
    typescript: {
        ignoreBuildErrors: false, // Keep TS errors as blocking
    },
};

export default nextConfig;
