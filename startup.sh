#!/bin/sh

echo "🚀 Starting Hive Router application..."

# Function to check database connection
check_db_connection() {
    echo "⏳ Checking database connection..."
    npx tsx -e "
        import Connection from './src/Database/Connection';
        try {
            await Connection.getInstance().connect();
            console.log('✅ Database connection successful');
            process.exit(0);
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            process.exit(1);
        }
    "
}

# Wait for database to be ready with retries
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: Checking database connection..."
    
    if check_db_connection; then
        echo "✅ Database is ready!"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Failed to connect to database after $max_attempts attempts"
            echo "⚠️ Starting application anyway, but seeding may fail..."
            break
        fi
        
        echo "⏳ Database not ready yet, waiting 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

# Run the database seeder
echo "🌱 Running database seeder..."
if npx tsx src/Database/seeders/index.ts; then
    echo "✅ Database seeding completed successfully"
else
    echo "⚠️ Database seeding failed, but continuing with application startup..."
fi

# Start the Next.js application
echo "🚀 Starting Next.js application..."
exec node server.js
