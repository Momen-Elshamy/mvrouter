#!/bin/bash

echo "🔄 Generating API documentation with Kubb..."

# Generate documentation
npm run generate:docs

if [ $? -eq 0 ]; then
    echo "✅ Documentation generated successfully!"
    echo "📖 You can now view the API documentation at: http://localhost:3000/api-docs"
echo "📁 Generated files are now in: ./redoc/"
echo "📄 Main HTML file: ./redoc/redoc/redoc.html"
    echo ""
    echo "📝 To add new endpoints:"
    echo "   1. Update openapi.json with your new paths and schemas"
    echo "   2. Run: npm run generate:docs"
    echo "   3. The documentation will automatically update"
else
    echo "❌ Failed to generate documentation"
    exit 1
fi 