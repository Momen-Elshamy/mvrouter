# URL Parameter Detection Feature

## Overview

The AI Provider creation and editing system now includes automatic URL parameter detection. When users enter an API path that contains URL parameters (e.g., `/users/:userId/posts/:postId`), the system will automatically detect these parameters and offer to add them to the parameter configuration.

## How It Works

### 1. Automatic Detection
- When a user enters an API path in the provider creation or editing form, the system automatically scans for URL parameters
- URL parameters are identified by the `:parameterName` pattern
- The system shows a visual indicator when parameters are detected

### 2. Parameter Generation
For each detected URL parameter, the system automatically generates:
- **Name**: The parameter name (e.g., `userId` from `:userId`)
- **Type**: Defaults to `string`
- **Required**: Defaults to `true` (URL parameters are typically required)
- **Placeholder**: Auto-generated descriptive placeholder (e.g., "Enter user id")
- **Description**: Auto-generated description (e.g., "user id parameter from URL path")

### 3. Integration Points

#### Provider Creation Page (`/admin/providers/create`)
- URL parameter detection happens automatically when the API path field changes
- Detected parameters are automatically added to the query parameters section
- Visual indicator shows when parameters are detected
- Manual "Add to parameters" button for additional control

#### Provider Edit Page (`/admin/providers/[id]/edit`)
- Shows visual indicator when URL parameters are detected in the API path
- Helps users understand what parameters are available

#### Parameters Edit Page (`/admin/parameters/[id]/edit`)
- Shows the provider's API path
- Detects URL parameters from the provider's API path
- Provides a button to manually add detected parameters to the query parameters section

## Example Usage

### Input API Path:
```
https://api.example.com/users/:userId/posts/:postId/comments/:commentId
```

### Automatically Detected Parameters:
1. **userId**
   - Type: string
   - Required: true
   - Placeholder: "Enter user id"
   - Description: "user id parameter from URL path"

2. **postId**
   - Type: string
   - Required: true
   - Placeholder: "Enter post id"
   - Description: "post id parameter from URL path"

3. **commentId**
   - Type: string
   - Required: true
   - Placeholder: "Enter comment id"
   - Description: "comment id parameter from URL path"

## Technical Implementation

### Utility Functions (`src/lib/utils/url-parameter-detector.ts`)

- `detectUrlParameters(urlPath: string)`: Returns array of detected parameter objects
- `hasUrlParameters(urlPath: string)`: Returns boolean indicating if parameters were found
- `extractParameterNames(urlPath: string)`: Returns array of parameter names

### Supported Parameter Patterns
- `:parameterName` - Standard parameter format
- `:user123Id` - Parameters with numbers
- `:userId` - Camel case parameters

### Integration
- All parameter detection is non-destructive (doesn't overwrite existing parameters)
- Duplicate detection prevents adding the same parameter multiple times
- Visual feedback helps users understand what's happening

## Benefits

1. **Time Saving**: Automatically detects and configures URL parameters
2. **Error Reduction**: Prevents manual entry errors
3. **Consistency**: Ensures all URL parameters are properly configured
4. **User Experience**: Clear visual indicators and manual controls
5. **Flexibility**: Users can still manually add or modify parameters as needed 