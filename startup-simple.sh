#!/bin/sh

echo "🚀 Starting Hive Router application..."

# Simple approach: wait a bit then run seeder
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run the database seeder
echo "🌱 Running database seeder..."
npx tsx src/Database/seeders/index.ts || echo "⚠️ Seeding failed, continuing anyway..."

# Start the Next.js application
echo "🚀 Starting Next.js application..."
exec node server.js
