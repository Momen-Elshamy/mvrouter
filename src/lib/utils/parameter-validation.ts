import { z } from 'zod';

export interface ParameterField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface StructuredParameters {
  headers: Record<string, any>;
  body: {
    type: string | null;
    data: Record<string, any>;
  };
  query: Record<string, any>;
  parameters: Record<string, any>;
}

/**
 * Checks for duplicate parameter names across all parameter types
 * @param parameters - The structured parameters object
 * @returns Array of duplicate parameter names found
 */
export function findDuplicateParameters(parameters: StructuredParameters): string[] {
  const allParamNames: string[] = [];
  const duplicates: string[] = [];

  // Collect all parameter names
  Object.keys(parameters.headers || {}).forEach(name => allParamNames.push(name));
  Object.keys(parameters.body?.data || {}).forEach(name => allParamNames.push(name));
  Object.keys(parameters.query || {}).forEach(name => allParamNames.push(name));
  Object.keys(parameters.parameters || {}).forEach(name => allParamNames.push(name));

  // Find duplicates
  const seen = new Set<string>();
  allParamNames.forEach(name => {
    if (seen.has(name)) {
      if (!duplicates.includes(name)) {
        duplicates.push(name);
      }
    } else {
      seen.add(name);
    }
  });

  return duplicates;
}

/**
 * Checks for duplicate parameter names within the same parameter type
 * @param parameters - The structured parameters object
 * @returns Object with duplicate information for each type
 */
export function findDuplicateParametersWithinTypes(parameters: StructuredParameters): {
  headers: string[];
  body: string[];
  query: string[];
  parameters: string[];
} {
  const result = {
    headers: [] as string[],
    body: [] as string[],
    query: [] as string[],
    parameters: [] as string[]
  };

  // Check headers
  const headerNames = Object.keys(parameters.headers || {});
  const headerDuplicates = headerNames.filter((name, index) => headerNames.indexOf(name) !== index);
  result.headers = [...new Set(headerDuplicates)];

  // Check body
  const bodyNames = Object.keys(parameters.body?.data || {});
  const bodyDuplicates = bodyNames.filter((name, index) => bodyNames.indexOf(name) !== index);
  result.body = [...new Set(bodyDuplicates)];

  // Check query
  const queryNames = Object.keys(parameters.query || {});
  const queryDuplicates = queryNames.filter((name, index) => queryNames.indexOf(name) !== index);
  result.query = [...new Set(queryDuplicates)];

  // Check parameters (URL parameters)
  const paramNames = Object.keys(parameters.parameters || {});
  const paramDuplicates = paramNames.filter((name, index) => paramNames.indexOf(name) !== index);
  result.parameters = [...new Set(paramDuplicates)];

  return result;
}

/**
 * Validates that no parameter names are duplicated within the same type
 * @param parameters - The structured parameters object
 * @returns Validation result with errors if duplicates found
 */
export function validateNoDuplicateParametersWithinTypes(parameters: StructuredParameters): {
  isValid: boolean;
  errors: string[];
} {
  const duplicates = findDuplicateParametersWithinTypes(parameters);
  const errors: string[] = [];

  if (duplicates.headers.length > 0) {
    errors.push(`Duplicate parameter names in headers: ${duplicates.headers.join(', ')}`);
  }
  if (duplicates.body.length > 0) {
    errors.push(`Duplicate parameter names in body: ${duplicates.body.join(', ')}`);
  }
  if (duplicates.query.length > 0) {
    errors.push(`Duplicate parameter names in query: ${duplicates.query.join(', ')}`);
  }
  if (duplicates.parameters.length > 0) {
    errors.push(`Duplicate parameter names in URL parameters: ${duplicates.parameters.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that no parameter names are duplicated across different types
 * @param parameters - The structured parameters object
 * @returns Validation result with errors if duplicates found
 */
export function validateNoDuplicateParameters(parameters: StructuredParameters): {
  isValid: boolean;
  errors: string[];
} {
  const duplicates = findDuplicateParameters(parameters);
  
  if (duplicates.length === 0) {
    return { isValid: true, errors: [] };
  }

  const errors = duplicates.map(name => 
    `Parameter name '${name}' is used in multiple parameter types (headers, body, query, or parameters). Each parameter name must be unique.`
  );

  return { isValid: false, errors };
}

/**
 * Comprehensive validation that checks both cross-type and within-type duplicates
 * @param parameters - The structured parameters object
 * @returns Validation result with errors if duplicates found
 */
export function validateAllDuplicateParameters(parameters: StructuredParameters): {
  isValid: boolean;
  errors: string[];
} {
  const crossTypeValidation = validateNoDuplicateParameters(parameters);
  const withinTypeValidation = validateNoDuplicateParametersWithinTypes(parameters);
  
  const allErrors = [...crossTypeValidation.errors, ...withinTypeValidation.errors];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Creates a Zod schema that validates against duplicate parameters
 * @param schema - The base schema to extend
 * @returns Zod schema with duplicate validation
 */
export function createNoDuplicateParametersSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: any) => {
      if (!data.paramter) return true;
      
      const validation = validateNoDuplicateParameters(data.paramter);
      return validation.isValid;
    },
    {
      message: "Duplicate parameter names found across different parameter types",
      path: ["paramter"]
    }
  );
}

/**
 * Validates parameters array for duplicates (for legacy parameter format)
 * @param parameters - Array of parameter objects
 * @returns Validation result with errors if duplicates found
 */
export function validateParametersArrayNoDuplicates(parameters: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const paramNames = parameters.map(p => p.name).filter(Boolean);
  const duplicates = paramNames.filter((name, index) => paramNames.indexOf(name) !== index);
  
  if (duplicates.length === 0) {
    return { isValid: true, errors: [] };
  }

  const uniqueDuplicates = [...new Set(duplicates)];
  const errors = uniqueDuplicates.map(name => 
    `Parameter name '${name}' is used multiple times. Each parameter name must be unique.`
  );

  return { isValid: false, errors };
}

/**
 * Creates a Zod schema for parameters array with duplicate validation
 * @param schema - The base array schema to extend
 * @returns Zod schema with duplicate validation
 */
export function createParametersArrayNoDuplicatesSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (data: any) => {
      // Ensure parameters is an array before validation
      if (!data.parameters || !Array.isArray(data.parameters)) {
        return true; // Skip validation if parameters is not an array
      }
      
      const validation = validateParametersArrayNoDuplicates(data.parameters);
      return validation.isValid;
    },
    {
      message: "Duplicate parameter names found in parameters array",
      path: ["parameters"]
    }
  );
} 