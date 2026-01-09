/** @type {import('next').NextConfig} */
const nextConfig = {
    // Output standalone for Docker production builds
    output: 'standalone',

    // External packages that should be included in the standalone output
    // bcryptjs is required for password comparison in auth.ts
    experimental: {
        serverComponentsExternalPackages: ['bcryptjs', '@prisma/client'],
    },

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

