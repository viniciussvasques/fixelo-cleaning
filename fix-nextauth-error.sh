#!/bin/bash
# Fix NEXTAUTH_SECRET JWT Decryption Error
# This script clears old sessions that can't be decrypted with the new NEXTAUTH_SECRET

echo "🔧 Fixing NEXTAUTH_SECRET JWT Decryption Error..."

# Clear old sessions from database
echo "📊 Clearing old JWT sessions..."
docker exec fixelo-db psql -U fixelo fixelo_prod -c "DELETE FROM \"Session\" WHERE \"expires\" < NOW();"
docker exec fixelo-db psql -U fixelo fixelo_prod -c "DELETE FROM \"Session\";"

# Clear Next.js cache
echo "🗑️  Clearing Next.js cache..."
docker exec fixelo-web rm -rf /app/.next/cache

# Restart web container to apply changes
echo "🔄 Restarting web container..."
docker restart fixelo-web

echo "✅ Done! Wait 30 seconds for container to restart, then test the app."
echo ""
echo "💡 Users will need to log in again."
echo ""
echo "If error persists, check NEXTAUTH_SECRET in .env.production matches docker-compose.prod.yml"
