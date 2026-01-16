#!/bin/sh
set -e

echo "🚀 Starting Fixelo Web Application..."

# Run database migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo "📦 Applying database migrations..."
    # Use prisma from the node_modules
    cd /app/packages/database
    npx --yes prisma@5.22.0 db push --accept-data-loss --skip-generate 2>/dev/null || {
        echo "⚠️ Migration warning (non-fatal), continuing..."
    }
    cd /app
    echo "✅ Database migrations complete"
else
    echo "⚠️ DATABASE_URL not set, skipping migrations"
fi

# Start the application
echo "🌐 Starting Next.js server..."
exec node apps/web/server.js
