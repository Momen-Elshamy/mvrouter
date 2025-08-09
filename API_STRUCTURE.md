# HiveRouter API Structure

## Overview

This document outlines the comprehensive API structure for the HiveRouter AI Provider Management System, following strict requirements for security, validation, documentation, and best practices.

## Architecture Principles

### 1. DTOs with Zod Validation
- **DRY Principle**: All DTOs use Zod schemas with TypeScript inference
- **Type Safety**: Automatic TypeScript types from Zod schemas
- **Validation**: Request/response validation with detailed error messages

### 2. Security & Authentication
- **JWT Authentication**: NextAuth.js integration with role-based access
- **Role-Based Access Control**: Admin and User roles with specific permissions
- **Token Security**: AI provider tokens are hashed after first display

### 3. Database Transactions
- **ACID Compliance**: All write operations use MongoDB transactions
- **Cascade Operations**: Proper cleanup when deleting referenced data
- **Data Integrity**: Consistent state across all operations

### 4. API Documentation
- **RESTful Design**: Standard REST API patterns
- **Schema Validation**: Complete request/response schemas
- **Error Handling**: Consistent error responses

### 5. Pagination & Search
- **Consistent Pagination**: All GET endpoints support pagination
- **Search Functionality**: Text search across relevant fields
- **Sorting**: Configurable sorting by any field

## API Endpoints

### Authentication
All endpoints require JWT authentication via Bearer token in Authorization header.

### AI Providers (`/api/ai-providers`)

#### GET `/api/ai-providers`
- **Access**: User, Admin
- **Features**: Pagination, search, sorting
- **Response**: Paginated list of AI providers

#### POST `/api/ai-providers`
- **Access**: Admin only
- **Features**: Create new AI provider
- **Validation**: Zod schema validation

#### GET `/api/ai-providers/{id}`
- **Access**: User, Admin
- **Features**: Get specific provider details

#### PUT `/api/ai-providers/{id}`
- **Access**: Admin only
- **Features**: Update provider details

#### DELETE `/api/ai-providers/{id}`
- **Access**: Admin only
- **Features**: Delete provider with cascade cleanup

### AI Provider Tokens (`/api/ai-provider-tokens`)

#### GET `/api/ai-provider-tokens`
- **Access**: User (own tokens only)
- **Features**: Pagination, search, sorting
- **Security**: Users can only see their own tokens

#### POST `/api/ai-provider-tokens`
- **Access**: User
- **Features**: Create new token
- **Security**: Token is hashed after first display
- **Response**: Token shown once, then hashed

#### GET `/api/ai-provider-tokens/{id}`
- **Access**: User (own tokens only)
- **Features**: Get specific token details

#### PUT `/api/ai-provider-tokens/{id}`
- **Access**: User (own tokens only)
- **Features**: Revoke/activate token
- **Note**: No DELETE operation (as per requirements)

### AI Provider Parameters (`/api/ai-provider-parameters`)

#### GET `/api/ai-provider-parameters`
- **Access**: Admin only
- **Features**: Pagination, search, sorting
- **Purpose**: Manage provider configuration parameters

#### POST `/api/ai-provider-parameters`
- **Access**: Admin only
- **Features**: Create provider parameters
- **Data**: Flexible JSON parameters for each provider

#### GET `/api/ai-provider-parameters/{id}`
- **Access**: Admin only
- **Features**: Get specific parameters

#### PUT `/api/ai-provider-parameters/{id}`
- **Access**: Admin only
- **Features**: Update parameters

#### DELETE `/api/ai-provider-parameters/{id}`
- **Access**: Admin only
- **Features**: Delete parameters

### Users (`/api/users`)

#### GET `/api/users`
- **Access**: Admin only
- **Features**: Pagination, search, sorting
- **Security**: Passwords excluded from responses

#### GET `/api/users/{id}`
- **Access**: Admin only
- **Features**: Get specific user details

#### PUT `/api/users/{id}`
- **Access**: Admin only
- **Features**: Update user details
- **Security**: Password hashing on update

#### Note: No CREATE or DELETE operations (as per requirements)

## Data Models

### AI Provider
```typescript
{
  _id: string;
  name: string;
  description: string;
  baseUrl: string;
  status: 'active' | 'inactive';
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AI Provider Token
```typescript
{
  _id: string;
  name: string;
  userId: ObjectId;
  providerId: ObjectId;
  hashToken: string; // select: false
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### AI Provider Parameters
```typescript
{
  _id: string;
  providerId: ObjectId;
  paramter: Record<string, any>; // Flexible JSON
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### User
```typescript
{
  _id: string;
  name: string;
  email: string;
  password: string; // select: false
  role: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

### Authentication Middleware
- **JWT Validation**: Secure token validation
- **Role Checking**: Admin/User role verification
- **Error Handling**: Proper error responses

### Token Security
- **One-Time Display**: Tokens shown only once during creation
- **Hashing**: bcrypt hashing with salt rounds
- **Access Control**: Users can only access their own tokens

### Data Protection
- **Password Exclusion**: Passwords never returned in responses
- **Input Validation**: All inputs validated with Zod
- **SQL Injection Prevention**: Mongoose ODM protection

## Error Handling

### Standard Error Response
```typescript
{
  success: false;
  message: string;
  error: string;
  code?: string;
}
```

### Error Codes
- `VALIDATION_ERROR`: Zod validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Pagination

### Standard Pagination Response
```typescript
{
  success: true;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: 'asc' or 'desc' (default: 'desc')
- `search`: Search term

## API Documentation

### API Features
- **RESTful Design**: Standard REST API patterns
- **Authentication**: JWT Bearer token authentication
- **Validation**: Zod schema validation
- **Error Handling**: Consistent error responses

### Documentation Features
- **Complete Schemas**: All request/response schemas
- **Authentication**: Bearer token documentation
- **Examples**: Request/response examples
- **Error Codes**: Complete error documentation

## Development Setup

### Prerequisites
```bash
npm install zod bcryptjs next-auth
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/hiverouter
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Database Seeding
```bash
npm run seed:roles
```

## Best Practices Implemented

### 1. Type Safety
- Zod schemas for all validation
- TypeScript inference from schemas
- Strict typing throughout

### 2. Security
- JWT authentication
- Role-based access control
- Input validation and sanitization
- Password hashing

### 3. Performance
- Database transactions
- Proper indexing
- Pagination for large datasets
- Efficient queries with population

### 4. Maintainability
- Consistent error handling
- Comprehensive logging
- Clear separation of concerns
- DRY principle adherence

### 5. Documentation
- RESTful API design
- Complete API documentation
- Clear code comments
- Standard error handling

## Testing

### Manual Testing
1. Start the development server: `npm run dev`
2. Test API endpoints using Postman, Insomnia, or cURL
3. Verify authentication and authorization
4. Check error handling and validation

### API Testing
- Use Postman, Insomnia, or cURL for endpoint testing
- Verify pagination functionality
- Test error scenarios
- Validate response schemas

## Deployment Considerations

### Production Setup
- Secure MongoDB connection
- Environment variable configuration
- SSL/TLS for HTTPS
- Rate limiting implementation
- Monitoring and logging

### Security Checklist
- [ ] JWT secret rotation
- [ ] Database connection security
- [ ] Input validation
- [ ] Error message sanitization
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] HTTPS enforcement

This API structure provides a robust, secure, and well-documented foundation for the HiveRouter AI Provider Management System, following all specified requirements and best practices. 