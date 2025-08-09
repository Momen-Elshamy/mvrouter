import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const jsonPath = join(process.cwd(), 'openapi.json');
    const jsonContent = readFileSync(jsonPath, 'utf-8');
    const spec = JSON.parse(jsonContent);
    
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Failed to read OpenAPI spec:', error);
    // Fallback to the manual spec
    const { openApiSpec } = await import('@/lib/api-docs/openapi-base');
    return NextResponse.json(openApiSpec);
  }
} 