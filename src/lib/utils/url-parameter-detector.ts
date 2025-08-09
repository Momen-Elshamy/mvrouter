export interface DetectedParameter {
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
  description: string;
  requestType: 'parameter' | 'query'; // URL path parameters or query parameters
}

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Remove URL parameters for validation
    const urlWithoutParams = url.split('?')[0];
    // Check if it's a valid URL structure
    const urlObj = new URL(urlWithoutParams.startsWith('http') ? urlWithoutParams : `https://example.com${urlWithoutParams}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates URL parameters for uniqueness
 * @param urlPath - The API path to validate
 * @returns Validation result with errors if duplicates found
 */
export function validateUrlParameters(urlPath: string): {
  isValid: boolean;
  errors: string[];
  duplicateParams: string[];
} {
  if (!urlPath) {
    return { isValid: true, errors: [], duplicateParams: [] };
  }

  const errors: string[] = [];
  const duplicateParams: string[] = [];

  // Extract all URL path parameters
  const parameterRegex = /:([a-zA-Z][a-zA-Z0-9]*)/g;
  const matches = urlPath.match(parameterRegex);
  
  if (matches) {
    const paramNames = matches.map(match => match.substring(1));
    const seen = new Set<string>();
    
    paramNames.forEach((paramName, index) => {
      if (seen.has(paramName)) {
        duplicateParams.push(paramName);
        errors.push(`Duplicate URL parameter ':${paramName}' found at position ${index + 1}`);
      } else {
        seen.add(paramName);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    duplicateParams
  };
}

/**
 * Detects URL parameters from an API path and returns them as parameter objects
 * @param urlPath - The API path (e.g., "/users/:userId/posts/:postId")
 * @returns Array of detected parameters
 */
export function detectUrlParameters(urlPath: string): DetectedParameter[] {
  if (!urlPath) return [];

  const parameters: DetectedParameter[] = [];

  // Match URL path parameters (e.g., :userId, :postId)
  // This regex handles both standard format (:param) and attached format (path:param)
  const pathParameterRegex = /:([a-zA-Z][a-zA-Z0-9]*)/g;
  const pathMatches = urlPath.match(pathParameterRegex);
  
  console.log('URL Path:', urlPath);
  console.log('Path matches:', pathMatches);
  
  // Test the regex with the specific URL format
  const testUrl = 'https://openrouter.ai/api/v1/chat/completions:id?limit=10&kireg=9';
  const testMatches = testUrl.match(pathParameterRegex);
  console.log('Test URL:', testUrl);
  console.log('Test matches:', testMatches);
  
  if (pathMatches) {
    pathMatches.forEach(match => {
      const paramName = match.substring(1); // Remove the colon
      const camelCaseName = paramName.charAt(0).toLowerCase() + paramName.slice(1);
      
      parameters.push({
        name: camelCaseName,
        type: 'string', // Default to string for URL parameters
        required: true, // URL parameters are typically required
        placeholder: `Enter ${camelCaseName.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        description: `${camelCaseName.replace(/([A-Z])/g, ' $1').toLowerCase()} parameter from URL path`,
        requestType: 'parameter' // URL path parameters
      });
    });
  }

  // Match query parameters from URL (e.g., ?limit=10&page=1)
  const queryMatch = urlPath.match(/\?([^#]*)/);
  if (queryMatch) {
    const queryString = queryMatch[1];
    const queryParams = new URLSearchParams(queryString);
    
    queryParams.forEach((value, key) => {
      // Skip if it's already a path parameter
      if (!parameters.some(p => p.name === key)) {
        parameters.push({
          name: key,
          type: 'string', // Default to string for query parameters
          required: false, // Query parameters are typically optional
          placeholder: `Enter ${key}`,
          description: `${key} query parameter`,
          requestType: 'query' // Query parameters
        });
      }
    });
  }

  return parameters;
}

/**
 * Compares current URL parameters with existing parameters and returns removed parameters
 * @param currentUrl - The current URL
 * @param existingUrlParams - Array of existing URL parameter names
 * @param existingQueryParams - Array of existing query parameter names
 * @returns Object with removed URL and query parameters
 */
export function findRemovedParameters(
  currentUrl: string, 
  existingUrlParams: string[], 
  existingQueryParams: string[]
): { removedUrlParams: string[], removedQueryParams: string[] } {
  const currentParams = detectUrlParameters(currentUrl);
  const currentUrlParamNames = currentParams.filter(p => p.requestType === 'parameter').map(p => p.name);
  const currentQueryParamNames = currentParams.filter(p => p.requestType === 'query').map(p => p.name);

  const removedUrlParams = existingUrlParams.filter(name => !currentUrlParamNames.includes(name));
  const removedQueryParams = existingQueryParams.filter(name => !currentQueryParamNames.includes(name));

  return { removedUrlParams, removedQueryParams };
}

/**
 * Gets a summary of parameters in the URL
 * @param urlPath - The API path
 * @returns Object with URL and query parameter information
 */
export function getUrlParameterSummary(urlPath: string): {
  urlParams: string[];
  queryParams: string[];
  hasUrlParams: boolean;
  hasQueryParams: boolean;
} {
  if (!urlPath) {
    return { urlParams: [], queryParams: [], hasUrlParams: false, hasQueryParams: false };
  }

  const parameters = detectUrlParameters(urlPath);
  const urlParams = parameters.filter(p => p.requestType === 'parameter').map(p => p.name);
  const queryParams = parameters.filter(p => p.requestType === 'query').map(p => p.name);

  return {
    urlParams,
    queryParams,
    hasUrlParams: urlParams.length > 0,
    hasQueryParams: queryParams.length > 0
  };
}

/**
 * Checks if a URL path contains parameters
 * @param urlPath - The API path to check
 * @returns boolean indicating if parameters were found
 */
export function hasUrlParameters(urlPath: string): boolean {
  if (!urlPath) return false;
  const parameterRegex = /:([a-zA-Z][a-zA-Z0-9]*)/g;
  return parameterRegex.test(urlPath);
}

/**
 * Extracts parameter names from a URL path
 * @param urlPath - The API path
 * @returns Array of parameter names (without colons)
 */
export function extractParameterNames(urlPath: string): string[] {
  if (!urlPath) return [];
  
  const parameterRegex = /:([a-zA-Z][a-zA-Z0-9]*)/g;
  const matches = urlPath.match(parameterRegex);
  
  if (!matches) return [];
  
  return matches.map(match => match.substring(1));
} 