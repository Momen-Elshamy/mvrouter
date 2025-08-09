import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple environment configuration
export const env = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};

export default env; 