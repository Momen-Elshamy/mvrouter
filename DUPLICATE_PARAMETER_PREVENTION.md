# Duplicate Parameter Prevention Feature

## Overview

The AI Provider system now includes comprehensive duplicate parameter prevention to ensure that no parameter names are used across different parameter types (headers, body, query, parameters). This prevents conflicts and ensures data integrity.

## How It Works

### 1. Backend Validation

#### Schema-Level Validation
- **Zod Schemas**: All parameter schemas now include duplicate validation using custom refinements
- **Structured Parameters**: Validates across headers, body, query, and parameters sections
- **Array Parameters**: Validates within parameter arrays for legacy format

#### API Endpoints with Validation
- `POST /api/ai-providers/create-with-models` - Provider creation
- `PUT /api/ai-provider-parameters/[id]` - Parameter editing
- All parameter-related endpoints

### 2. Frontend Validation

#### Real-Time Detection
- **Live Validation**: Checks for duplicates as users type parameter names
- **Visual Feedback**: Shows error messages immediately when duplicates are detected
- **Prevent Submission**: Blocks form submission when duplicates exist

#### User Interface
- **Error Display**: Red error boxes with specific duplicate parameter names
- **Clear Messaging**: Explains which parameters are duplicated and where
- **Real-Time Updates**: Errors update as users modify parameters

## Validation Rules

### 1. Cross-Type Duplicate Prevention
Parameters cannot have the same name across different types:
- ❌ `apiKey` in headers AND `apiKey` in body
- ❌ `userId` in query AND `userId` in body
- ❌ `token` in headers AND `token` in query
- ✅ `apiKey` in headers AND `userId` in body (different names)

### 2. Same-Type Duplicate Prevention
Parameters cannot have the same name within the same type:
- ❌ Two `apiKey` parameters in headers
- ❌ Two `userId` parameters in body
- ✅ `apiKey` in headers AND `userId` in headers (different names)

## Implementation Details

### Backend Utilities (`src/lib/utils/parameter-validation.ts`)

#### Core Functions
- `findDuplicateParameters()`: Detects duplicates across all parameter types
- `validateNoDuplicateParameters()`: Validates structured parameters
- `validateParametersArrayNoDuplicates()`: Validates parameter arrays
- `createNoDuplicateParametersSchema()`: Creates Zod schemas with validation
- `createParametersArrayNoDuplicatesSchema()`: Creates array schemas with validation

#### Validation Logic
```typescript
// Collects all parameter names from all types
const allParamNames = [
  ...Object.keys(headers),
  ...Object.keys(body.data),
  ...Object.keys(query),
  ...Object.keys(parameters)
];

// Finds duplicates using Set
const seen = new Set<string>();
const duplicates = allParamNames.filter(name => {
  if (seen.has(name)) return true;
  seen.add(name);
  return false;
});
```

### Frontend Integration

#### Create Provider Page (`/admin/providers/create`)
- Real-time duplicate checking on parameter updates
- Visual error display with specific duplicate names
- Form submission prevention when duplicates exist
- Automatic error clearing when duplicates are resolved

#### Parameters Edit Page (`/admin/parameters/[id]/edit`)
- Same real-time validation as create page
- Duplicate detection across all parameter types
- Clear error messaging for users

## Error Messages

### Backend Validation Errors
```
"Duplicate parameter names found across different parameter types"
"Parameter name 'apiKey' is used in multiple parameter types (headers, body, query, or parameters). Each parameter name must be unique."
```

### Frontend Validation Errors
```
"Please fix duplicate parameter names before submitting."
"Parameter name 'apiKey' is used in multiple parameter types (headers, body, query, or parameters). Each parameter name must be unique."
```

## Example Scenarios

### Scenario 1: Valid Parameters
```json
{
  "headers": {
    "apiKey": { "type": "string", "required": true }
  },
  "body": {
    "type": "body-json",
    "data": {
      "message": { "type": "string", "required": true },
      "userId": { "type": "string", "required": true }
    }
  },
  "query": {
    "limit": { "type": "number", "required": false }
  }
}
```
✅ **Result**: All parameters have unique names

### Scenario 2: Invalid Parameters (Duplicate)
```json
{
  "headers": {
    "apiKey": { "type": "string", "required": true }
  },
  "body": {
    "type": "body-json",
    "data": {
      "apiKey": { "type": "string", "required": true }  // ❌ Duplicate
    }
  },
  "query": {
    "limit": { "type": "number", "required": false }
  }
}
```
❌ **Result**: Validation error - `apiKey` used in both headers and body

## Benefits

1. **Data Integrity**: Prevents parameter conflicts that could cause API issues
2. **User Experience**: Clear feedback about what's wrong and how to fix it
3. **Real-Time Validation**: Users don't have to wait until submission to see errors
4. **Comprehensive Coverage**: Validates both frontend and backend
5. **Consistent Messaging**: Same validation logic and error messages everywhere

## Technical Architecture

### Validation Flow
1. **User Input** → Frontend real-time validation
2. **Form Submission** → Frontend duplicate check
3. **API Request** → Backend schema validation
4. **Database Save** → Final validation before persistence

### Error Handling
- **Frontend**: Immediate feedback with specific duplicate names
- **Backend**: Structured error responses with validation details
- **API**: Proper HTTP status codes (400 for validation errors)

This ensures that no duplicate parameter names can exist in the system, maintaining data consistency and preventing potential API conflicts. 