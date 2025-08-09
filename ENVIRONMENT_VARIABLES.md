# Environment Variables Documentation

This document describes all environment variables used by the Hive Router application.

## Required Environment Variables

### Application Environment
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Application environment | `development` | `production` |
| `PORT` | Port number for the application | `3000` | `3000` |

### NextAuth Configuration
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js | `your-nextauth-secret` | `your-super-secret-key-here` |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | `http://localhost:3000` | `https://your-domain.com` |

### Database Configuration
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MONGODB_URI` | MongoDB connection string | - | `mongodb+srv://user:pass@cluster.mongodb.net/hive-router` |

### API Keys
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | `sk-ant-...` |
| `GOOGLE_API_KEY` | Google API key | - | `AIza...` |
| `PROVIDER_API_KEY_OPENAI` | Provider-specific OpenAI key | - | `sk-...` |
| `PROVIDER_API_KEY_GEMINI` | Provider-specific Gemini key | - | `AIza...` |

## Optional Environment Variables

### Application Settings
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` | `1` |
| `HOSTNAME` | Hostname for the application | `0.0.0.0` | `0.0.0.0` |

### Logging
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |

### Performance
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MAX_CONCURRENT_REQUESTS` | Maximum concurrent requests | `100` | `200` |
| `REQUEST_TIMEOUT` | Request timeout in milliseconds | `30000` | `60000` |

### Security
| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CORS_ORIGIN` | CORS allowed origins | `*` | `https://your-domain.com` |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | `900000` | `600000` |
| `RATE_LIMIT_MAX` | Maximum requests per window | `100` | `200` |

## Environment Setup

### Local Development
Create a `.env.local` file in your project root:

```env
# Application Environment
NODE_ENV=development
PORT=3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-local-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hive-router

# API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
GOOGLE_API_KEY=AIza-your-google-api-key
PROVIDER_API_KEY_OPENAI=sk-your-provider-openai-key
PROVIDER_API_KEY_GEMINI=AIza-your-provider-gemini-key

# Application Settings
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0

# Optional: Logging
LOG_LEVEL=debug

# Optional: Performance
MAX_CONCURRENT_REQUESTS=50
REQUEST_TIMEOUT=30000

# Optional: Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

### Production Deployment
For production deployment, set these variables in your DigitalOcean droplet:

```env
# Application Environment
NODE_ENV=production
PORT=3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-production-key
NEXTAUTH_URL=https://your-domain.com

# Database Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hive-router

# API Keys
OPENAI_API_KEY=sk-your-production-openai-key
ANTHROPIC_API_KEY=sk-ant-your-production-anthropic-key
GOOGLE_API_KEY=AIza-your-production-google-key
PROVIDER_API_KEY_OPENAI=sk-your-production-provider-openai-key
PROVIDER_API_KEY_GEMINI=AIza-your-production-provider-gemini-key

# Application Settings
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0

# Optional: Logging
LOG_LEVEL=info

# Optional: Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000

# Optional: Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## Docker Environment Variables

### Docker Compose
The `docker-compose.yml` file includes all environment variables with proper defaults:

```yaml
environment:
  # Application Environment
  - NODE_ENV=production
  - PORT=3000
  
  # NextAuth Configuration
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
  - NEXTAUTH_URL=${NEXTAUTH_URL}
  
  # Database Configuration
  - MONGODB_URI=${MONGODB_URI}
  
  # API Keys
  - OPENAI_API_KEY=${OPENAI_API_KEY}
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  - GOOGLE_API_KEY=${GOOGLE_API_KEY}
  - PROVIDER_API_KEY_OPENAI=${PROVIDER_API_KEY_OPENAI}
  - PROVIDER_API_KEY_GEMINI=${PROVIDER_API_KEY_GEMINI}
  
  # Application Settings
  - NEXT_TELEMETRY_DISABLED=1
  - HOSTNAME=0.0.0.0
  
  # Optional: Logging
  - LOG_LEVEL=${LOG_LEVEL:-info}
  
  # Optional: Performance
  - MAX_CONCURRENT_REQUESTS=${MAX_CONCURRENT_REQUESTS:-100}
  - REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-30000}
  
  # Optional: Security
  - CORS_ORIGIN=${CORS_ORIGIN:-*}
  - RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-900000}
  - RATE_LIMIT_MAX=${RATE_LIMIT_MAX:-100}
```

### Docker Run
For running with Docker directly:

```bash
docker run -d \
  --name hive-router \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e MONGODB_URI=your-mongodb-uri \
  -e OPENAI_API_KEY=your-openai-key \
  -e ANTHROPIC_API_KEY=your-anthropic-key \
  -e GOOGLE_API_KEY=your-google-key \
  -e PROVIDER_API_KEY_OPENAI=your-provider-openai-key \
  -e PROVIDER_API_KEY_GEMINI=your-provider-gemini-key \
  your-dockerhub-username/hive-router:latest
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use strong secrets** for `NEXTAUTH_SECRET`
3. **Restrict CORS origins** in production
4. **Use environment-specific** configurations
5. **Rotate API keys** regularly
6. **Use secrets management** for production deployments

## Validation

The application validates required environment variables on startup. Missing required variables will cause the application to fail to start with a clear error message.

## Troubleshooting

### Common Issues

1. **Missing NEXTAUTH_SECRET**
   - Error: "NEXTAUTH_SECRET must be set"
   - Solution: Set a strong secret key

2. **Invalid MONGODB_URI**
   - Error: "MongoDB connection failed"
   - Solution: Verify connection string format

3. **Invalid API Keys**
   - Error: "API key validation failed"
   - Solution: Check API key format and permissions

4. **CORS Issues**
   - Error: "CORS policy violation"
   - Solution: Update `CORS_ORIGIN` to match your domain

### Debug Mode

Set `LOG_LEVEL=debug` to get detailed logging information for troubleshooting. 