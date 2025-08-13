#!/bin/bash

echo "🚀 Starting application startup process..."

# Function to wait for database connection
wait_for_database() {
    echo "⏳ Waiting for database connection..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts: Checking database connection..."
        
        # Try to run a simple database operation
        if node -e "
            const Connection = require('../src/Database/Connection').default;
            Connection.getInstance().connect()
                .then(() => {
                    console.log('Database connected successfully');
                    process.exit(0);
                })
                .catch(err => {
                    console.log('Database connection failed:', err.message);
                    process.exit(1);
                });
        " > /dev/null 2>&1; then
            echo "✅ Database connection established"
            return 0
        fi
        
        echo "❌ Database connection failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "💥 Failed to connect to database after $max_attempts attempts"
    return 1
}

# Function to run database seeder
run_seeder() {
    echo "🌱 Running database seeder..."
    if npm run seed; then
        echo "✅ Database seeding completed successfully"
        return 0
    else
        echo "❌ Database seeding failed"
        return 1
    fi
}

# Main startup sequence
main() {
    # Wait for database to be ready
    if ! wait_for_database; then
        echo "💥 Cannot proceed without database connection"
        exit 1
    fi
    
    # Run seeder
    if ! run_seeder; then
        echo "💥 Cannot proceed without database seeding"
        exit 1
    fi
    
    # Start the application
    echo "🚀 Starting application..."
    if [ "$NODE_ENV" = "production" ]; then
        exec node server.js
    else
        exec npm run start
    fi
}

# Run main function
main
