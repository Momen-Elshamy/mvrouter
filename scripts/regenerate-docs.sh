#!/bin/bash

# Regenerate Kubb documentation
echo "🔄 Regenerating Kubb documentation..."

# Run Kubb to generate documentation
npx kubb generate

echo "✅ Kubb documentation regenerated successfully!"
echo "📁 Documentation files updated in:"
echo "   - ./redoc/swagger.json"
echo "   - ./redoc/redoc.html"
echo "   - ./redoc/zod/"
echo "   - ./redoc/types/" 