import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const htmlPath = join(process.cwd(), 'redoc/redoc.html');
    const htmlContent = readFileSync(htmlPath, 'utf-8');
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Failed to read Redoc HTML:', error);
    return new NextResponse(
      '<div style="padding: 20px; text-align: center;"><h2>API Documentation Not Found</h2><p>Please run "npm run generate:docs" to generate the documentation.</p></div>',
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
} 