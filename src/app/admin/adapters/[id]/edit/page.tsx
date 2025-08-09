'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';

interface ProviderEndpoint {
  _id: string;
  name: string;
  parameters: Record<string, unknown>;
}

interface GlobalDefaultParameter {
  _id: string;
  name: string;
  parameters: Record<string, unknown>;
}



interface Mapping {
  fromField: string;
  toField: string;
  fieldType: 'parameter' | 'header' | 'body' | 'query';
  transformation?: string;
}

interface SchemaField {
  type?: string;
  required?: boolean;
  description?: string;
}

interface SchemaStructure {
  headers?: Record<string, SchemaField>;
  parameters?: Record<string, SchemaField>;
  body?: {
    data?: Record<string, SchemaField>;
    properties?: Record<string, SchemaField>;
    required?: string[];
  };
  query?: Record<string, SchemaField>;
}

interface SchemaFieldItem {
  name: string;
  path: string;
  type: string;
  required: boolean;
  description?: string;
}

export default function EditAdapter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const adapterId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Data for dropdowns
  const [providerEndpoints, setProviderEndpoints] = useState<ProviderEndpoint[]>([]);
  const [defaultParameters, setDefaultParameters] = useState<GlobalDefaultParameter[]>([]);
  const [providerEndpointParameters, setProviderEndpointParameters] = useState<Record<string, unknown> | null>(null);
  const [defaultParameterParameters, setDefaultParameterParameters] = useState<Record<string, unknown> | null>(null);

  // Selected values
  const [selectedProviderEndpoint, setSelectedProviderEndpoint] = useState('');
  const [selectedDefaultParameter, setSelectedDefaultParameter] = useState('');

  // Mappings
  const [mappings, setMappings] = useState<Mapping[]>([]);

  // Drag and drop state
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/admin/login');
      return;
    }

    // Check if user is admin
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(userData => {
        if (userData.data?.role?.name !== 'admin') {
          router.push('/admin/login');
          return;
        }
        loadAdapter();
        fetchData();
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [session, status, router, adapterId]);

  const loadAdapter = useCallback(async () => {
    try {
      const response = await fetch(`/api/provider-adapters/${adapterId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Adapter not found');
        } else {
          setError('Failed to load adapter');
        }
        return;
      }

      const result = await response.json();
      console.log('ADAPTER DATA:', result.data);
      if (result.success) {
        const adapter = result.data;
        setName(adapter.name);
        setDescription(adapter.description || '');
        setIsActive(adapter.isActive);
        
        // Extract clean IDs from the object strings
        let providerEndpointId = adapter.providerEndpointId;
        let defaultParameterId = adapter.defaultParameterId;
        
        // If they're object strings, extract the _id
        if (typeof providerEndpointId === 'string' && providerEndpointId.includes('ObjectId')) {
          const match = providerEndpointId.match(/ObjectId\('([^']+)'\)/);
          if (match) {
            providerEndpointId = match[1];
          }
        }
        
        if (typeof defaultParameterId === 'string' && defaultParameterId.includes('ObjectId')) {
          const match = defaultParameterId.match(/ObjectId\('([^']+)'\)/);
          if (match) {
            defaultParameterId = match[1];
          }
        }
        
        console.log('EXTRACTED IDS:', { providerEndpointId, defaultParameterId });
        
        // Set the selected values
        setSelectedProviderEndpoint(providerEndpointId);
        setSelectedDefaultParameter(defaultParameterId);
        setMappings(adapter.mappings || []);
        
        // Load the parameters for the selected items
        if (providerEndpointId) {
          console.log('FETCHING PROVIDER PARAMETERS FOR:', providerEndpointId);
          fetchProviderEndpointParameters(providerEndpointId);
        }
        if (defaultParameterId) {
          console.log('FETCHING DEFAULT PARAMETERS FOR:', defaultParameterId);
          fetchDefaultParameterParameters(defaultParameterId);
        }
      } else {
        setError(result.message || 'Failed to load adapter');
      }
    } catch (error) {
      console.error('Error loading adapter:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [adapterId]);

  const fetchData = async () => {
    console.log('FETCHING DATA...');
    try {
      // Fetch provider endpoints
      const endpointsResponse = await fetch('/api/provider-endpoints');
      const endpointsData = await endpointsResponse.json();
      console.log('PROVIDER ENDPOINTS FULL:', endpointsData);
      if (endpointsData.success) {
        // Try different possible data structures
        let endpoints = [];
        if (Array.isArray(endpointsData.data)) {
          endpoints = endpointsData.data;
        } else if (endpointsData.data?.data && Array.isArray(endpointsData.data.data)) {
          endpoints = endpointsData.data.data;
        } else if (endpointsData.data?.items && Array.isArray(endpointsData.data.items)) {
          endpoints = endpointsData.data.items;
        }
        console.log('SETTING PROVIDER ENDPOINTS:', endpoints);
        setProviderEndpoints(endpoints);
      }

      // Fetch default parameters
      const parametersResponse = await fetch('/api/global-default-parameters');
      const parametersData = await parametersResponse.json();
      console.log('DEFAULT PARAMETERS FULL:', parametersData);
      if (parametersData.success) {
        // Try different possible data structures
        let parameters = [];
        if (Array.isArray(parametersData.data)) {
          parameters = parametersData.data;
        } else if (parametersData.data?.data && Array.isArray(parametersData.data.data)) {
          parameters = parametersData.data.data;
        } else if (parametersData.data?.items && Array.isArray(parametersData.data.items)) {
          parameters = parametersData.data.items;
        }
        console.log('SETTING DEFAULT PARAMETERS:', parameters);
        setDefaultParameters(parameters);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  const fetchProviderEndpointParameters = async (endpointId: string) => {
    try {
      console.log('FETCHING PROVIDER ENDPOINT:', endpointId);
      const response = await fetch(`/api/provider-endpoints/${endpointId}`);
      const data = await response.json();
      console.log('PROVIDER ENDPOINT RESPONSE:', data);
      if (data.success) {
        setProviderEndpointParameters(data.data.parameters);
        console.log('SET PROVIDER PARAMETERS:', data.data.parameters);
      }
    } catch (error) {
      console.error('Error fetching provider endpoint parameters:', error);
    }
  };

  const fetchDefaultParameterParameters = async (parameterId: string) => {
    try {
      console.log('FETCHING DEFAULT PARAMETER:', parameterId);
      const response = await fetch(`/api/global-default-parameters/${parameterId}`);
      const data = await response.json();
      console.log('DEFAULT PARAMETER RESPONSE:', data);
      if (data.success) {
        setDefaultParameterParameters(data.data.parameters);
        console.log('SET DEFAULT PARAMETERS:', data.data.parameters);
      }
    } catch (error) {
      console.error('Error fetching default parameter parameters:', error);
    }
  };

  useEffect(() => {
    if (selectedProviderEndpoint) {
      fetchProviderEndpointParameters(selectedProviderEndpoint);
    }
  }, [selectedProviderEndpoint]);

  useEffect(() => {
    if (selectedDefaultParameter) {
      fetchDefaultParameterParameters(selectedDefaultParameter);
    }
  }, [selectedDefaultParameter]);

  const normalizeType = (type: string): string => {
    // Standardize type names to ensure consistency
    const typeMap: { [key: string]: string } = {
      'json': 'object',
      'object': 'object',
      'array': 'array',
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'any': 'any',
      'integer': 'number',
      'float': 'number',
      'double': 'number',
      'text': 'string',
      'email': 'string',
      'url': 'string',
      'date': 'string',
      'datetime': 'string',
      'timestamp': 'string'
    };
    
    const normalizedType = typeMap[type.toLowerCase()] || 'string';
    return normalizedType;
  };

  const getSchemaStructure = (schema: SchemaStructure | null): { headers: SchemaFieldItem[]; parameters: SchemaFieldItem[]; body: SchemaFieldItem[]; query: SchemaFieldItem[] } => {
    if (!schema) return { headers: [], parameters: [], body: [], query: [] };

    const structure = {
      headers: [] as SchemaFieldItem[],
      parameters: [] as SchemaFieldItem[],
      body: [] as SchemaFieldItem[],
      query: [] as SchemaFieldItem[]
    };

    if (schema.headers) {
      Object.keys(schema.headers).forEach(key => {
        const field = schema.headers![key];
        structure.headers.push({
          name: key,
          path: `headers.${key}`,
          type: normalizeType(field.type || 'string'),
          required: field.required || false,
          description: field.description
        });
      });
    }

    if (schema.parameters) {
      Object.keys(schema.parameters).forEach(key => {
        const field = schema.parameters![key];
        structure.parameters.push({
          name: key,
          path: `parameters.${key}`,
          type: normalizeType(field.type || 'string'),
          required: field.required || false,
          description: field.description
        });
      });
    }

    if (schema.body) {
      // Handle the nested data structure
      if (schema.body.data) {
        Object.keys(schema.body.data).forEach(key => {
          const field = schema.body!.data![key];
          structure.body.push({
            name: key,
            path: `body.data.${key}`,
            type: normalizeType(field.type || 'string'),
            required: field.required || false,
            description: field.description
          });
        });
      } else if (schema.body.properties) {
        Object.keys(schema.body.properties).forEach(key => {
          const field = schema.body!.properties![key];
          structure.body.push({
            name: key,
            path: `body.properties.${key}`,
            type: normalizeType(field.type || 'string'),
            required: schema?.body?.required?.includes(key) || false,
            description: field.description
          });
        });
      }
    }

    if (schema.query) {
      Object.keys(schema.query).forEach(key => {
        const field = schema.query![key];
        structure.query.push({
          name: key,
          path: `query.${key}`,
          type: normalizeType(field.type || 'string'),
          required: field.required || false,
          description: field.description
        });
      });
    }

    return structure;
  };

  const handleDragStart = (e: React.DragEvent, field: unknown, fieldType: string) => {
    const fieldPath = typeof field === 'string' ? field : (field as { path: string }).path;
    e.dataTransfer.setData('text/plain', `${fieldType}:${fieldPath}`);
  };

  const handleDragOver = (e: React.DragEvent, targetField: string, targetType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(`${targetType}:${targetField}`);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetField: string, targetType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const draggedData = e.dataTransfer.getData('text/plain');
    const [sourceType, sourceField] = draggedData.split(':');

    // Get source and target field types for validation
    let sourceFieldType = 'string';
    let targetFieldType = 'string';

    // Find source field type
    if (sourceType === 'provider') {
      const structure = getSchemaStructure(providerEndpointParameters);
      const allFields = [...structure.headers, ...structure.parameters, ...structure.body, ...structure.query];
      const sourceFieldData = allFields.find(f => f.path === sourceField);
      sourceFieldType = sourceFieldData?.type || 'string';
    } else {
      const structure = getSchemaStructure(defaultParameterParameters);
      const allFields = [...structure.headers, ...structure.parameters, ...structure.body, ...structure.query];
      const sourceFieldData = allFields.find(f => f.path === sourceField);
      sourceFieldType = sourceFieldData?.type || 'string';
    }

    // Find target field type
    if (targetType === 'provider') {
      const structure = getSchemaStructure(providerEndpointParameters);
      const allFields = [...structure.headers, ...structure.parameters, ...structure.body, ...structure.query];
      const targetFieldData = allFields.find(f => f.path === targetField);
      targetFieldType = targetFieldData?.type || 'string';
    } else {
      const structure = getSchemaStructure(defaultParameterParameters);
      const allFields = [...structure.headers, ...structure.parameters, ...structure.body, ...structure.query];
      const targetFieldData = allFields.find(f => f.path === targetField);
      targetFieldType = targetFieldData?.type || 'string';
    }

    // Type validation - allow "any" type to match with any other type
    const normalizedSourceType = normalizeType(sourceFieldType);
    const normalizedTargetType = normalizeType(targetFieldType);
    
    // Allow mapping if either type is "any" or if both types match
    const isValidMapping = normalizedSourceType === 'any' || normalizedTargetType === 'any' || normalizedSourceType === normalizedTargetType;
    
    if (!isValidMapping) {
      setError(`Type mismatch: Cannot map ${sourceFieldType} to ${targetFieldType}. Both fields must have the same type or one must be "any".`);
      return;
    }

    // Determine field type for mapping
    let fieldType: 'parameter' | 'header' | 'body' | 'query' = 'parameter';
    if (sourceType === 'provider') {
      const structure = getSchemaStructure(providerEndpointParameters);
      if (structure.headers.find(f => f.path === sourceField)) fieldType = 'header';
      else if (structure.body.find(f => f.path === sourceField)) fieldType = 'body';
      else if (structure.query.find(f => f.path === sourceField)) fieldType = 'query';
    } else {
      const structure = getSchemaStructure(defaultParameterParameters);
      if (structure.headers.find(f => f.path === sourceField)) fieldType = 'header';
      else if (structure.body.find(f => f.path === sourceField)) fieldType = 'body';
      else if (structure.query.find(f => f.path === sourceField)) fieldType = 'query';
    }

    // Create mapping
    const newMapping: Mapping = {
      fromField: sourceField,
      toField: targetField,
      fieldType
    };

    // Check if mapping already exists
    const existingIndex = mappings.findIndex(m => m.fromField === targetField && m.toField === sourceField);
    if (existingIndex >= 0) {
      setMappings(prev => prev.map((m, i) => i === existingIndex ? newMapping : m));
    } else {
      setMappings(prev => [...prev, newMapping]);
    }

    setError(null);
  };

  const handleDragEnd = () => {
    // Drag ended, no action needed
  };

  const removeMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!selectedProviderEndpoint || !selectedDefaultParameter) {
      setError('Please select both Provider Endpoint and Default Parameter');
      return;
    }

    // Validate that all required fields are mapped
    const providerStructure = getSchemaStructure(providerEndpointParameters);
    const allProviderFields = [
      ...providerStructure.headers,
      ...providerStructure.parameters,
      ...providerStructure.body,
      ...providerStructure.query
    ];

    const requiredFields = allProviderFields.filter(field => field.required);
    const mappedRequiredFields = requiredFields.filter(field => 
      mappings.some(mapping => mapping.toField === field.path)
    );

    if (requiredFields.length > 0 && mappedRequiredFields.length !== requiredFields.length) {
      const unmappedRequiredFields = requiredFields.filter(field => 
        !mappings.some(mapping => mapping.toField === field.path)
      );
      setError(`All required fields must be mapped. Missing mappings for: ${unmappedRequiredFields.map(f => f.name).join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/provider-adapters/${adapterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          providerEndpointId: selectedProviderEndpoint,
          defaultParameterId: selectedDefaultParameter,
          mappings,
          isActive
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Adapter updated successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard?tab=adapters');
        }, 1500);
      } else {
        setError(result.message || 'Failed to update adapter');
      }
    } catch (error) {
      console.error('Error updating adapter:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard?tab=adapters"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Adapters
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Adapter</h1>
                <p className="mt-2 text-gray-600">Update adapter configuration and mappings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-md ${
            error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex">
              <div className="flex-1">
                <p className={`text-sm ${
                  error ? 'text-red-800' : 'text-green-800'
                }`}>
                  {error || success}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Provider Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Endpoint *
                </label>
                <select
                  value={selectedProviderEndpoint}
                  onChange={(e) => setSelectedProviderEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  required
                >
                  <option value="">Select Provider Endpoint</option>
                  {providerEndpoints.map((endpoint) => (
                    <option key={endpoint._id} value={endpoint._id}>
                      {endpoint.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Parameters *
                </label>
                <select
                  value={selectedDefaultParameter}
                  onChange={(e) => setSelectedDefaultParameter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  required
                >
                  <option value="">Select Default Parameters</option>
                  {defaultParameters.map((param) => (
                    <option key={param._id} value={param._id}>
                      {param.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mapping Section */}
          {selectedProviderEndpoint && selectedDefaultParameter && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Parameter Mapping</h2>
              <p className="text-sm text-gray-600 mb-6">
                Drag fields from the Provider Endpoint to the Default Parameters to create mappings.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Provider Endpoint Fields */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-800 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Provider Endpoint Fields
                  </h3>
                                    {providerEndpointParameters && (
                    <div className="space-y-4">
                      {(() => {
                        const structure = getSchemaStructure(providerEndpointParameters);
                        console.log('PROVIDER STRUCTURE:', structure);
                        return Object.keys(structure).map((section) => {
                          const fields = structure[section as keyof ReturnType<typeof getSchemaStructure>];
                          console.log(`PROVIDER ${section}:`, fields);


                          return (
                            <div key={section} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">{section}</h4>
                              <div className="space-y-2">
                                {fields.map((field: SchemaFieldItem) => {
                                  // Check if this field is already mapped
                                  const existingMapping = mappings.find(m => m.fromField === field.path);
                                  return (
                                    <div
                                      key={field.name}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, field, 'provider')}
                                      onDragEnd={handleDragEnd}
                                      className={`p-2 border rounded cursor-move transition-colors ${
                                        existingMapping 
                                          ? 'bg-blue-100 border-blue-400' 
                                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                      }`}
                                      style={{ userSelect: 'none' }}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-blue-900 text-sm">{field.name}</span>
                                          {field.required && (
                                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full font-medium">
                                              Required
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                                          {field.type}
                                        </span>
                                      </div>
                                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                        Path: {field.path}
                                      </div>
                                      {field.description && (
                                        <div className="text-xs text-blue-500 mt-1">
                                          {field.description}
                                        </div>
                                      )}
                                      {existingMapping ? (
                                        <div className="mt-1 p-2 bg-blue-200 rounded text-xs text-blue-800 font-medium">
                                          ✓ Mapped to: {existingMapping.toField.split('.').pop()}
                                        </div>
                                      ) : (
                                        <div className="mt-1 text-xs text-blue-500 flex items-center">
                                          <span className="mr-1">↖</span>
                                          Drag to map (Type: {field.type})
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Default Parameters Fields */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-800 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Default Parameters Fields
                  </h3>
                  {defaultParameterParameters && (
                    <div className="space-y-4">
                                             {Object.keys(getSchemaStructure(defaultParameterParameters)).map((section) => {
                         const fields = getSchemaStructure(defaultParameterParameters)[section as keyof ReturnType<typeof getSchemaStructure>];

                        return (
                          <div key={section} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">{section}</h4>
                                                        <div className="space-y-2">
                              {fields.map((field: SchemaFieldItem) => {
                                // Check if this field is already mapped
                                const existingMapping = mappings.find(m => m.toField === field.path);
                                  return (
                                  <div
                                    key={field.name}
                                                                      onDragOver={(e) => handleDragOver(e, field.path, 'default')}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, field.path, 'default')}
                                    data-drop-target="true"
                                    className={`p-2 border rounded cursor-pointer transition-colors ${
                                      existingMapping 
                                        ? 'bg-green-100 border-green-400'
                                        : dragOverTarget === `default:${field.name}`
                                          ? 'bg-green-100 border-green-400'
                                          : 'bg-green-50 border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                                                          <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-semibold text-green-900 text-sm">{field.name}</span>
                                          {field.required && (
                                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full font-medium">
                                              Required
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-green-700 bg-green-200 px-2 py-1 rounded-full font-medium">
                                          {field.type}
                                        </span>
                                      </div>
                                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Path: {field.path}
                                      </div>
                                      {field.description && (
                                        <div className="text-xs text-green-500 mt-1">
                                          {field.description}
                                        </div>
                                      )}
                                      {existingMapping ? (
                                        <div className="mt-1 p-2 bg-green-200 rounded text-xs text-green-800 font-medium">
                                          ✓ Mapped from: {existingMapping.fromField.split('.').pop()}
                                        </div>
                                      ) : (
                                        <div className="mt-1 text-xs text-green-500 flex items-center">
                                          <span className="mr-1">↓</span>
                                          Drop here to map (Type: {field.type})
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Mappings */}
          {mappings.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Mappings</h2>
              <div className="space-y-3">
                {mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-sm font-medium text-gray-900">{mapping.fromField}</span>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span className="text-sm font-medium text-gray-900">{mapping.toField}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mapping.fieldType === 'header' ? 'bg-blue-100 text-blue-800' :
                        mapping.fieldType === 'body' ? 'bg-purple-100 text-purple-800' :
                        mapping.fieldType === 'query' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.fieldType}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMapping(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Updating...' : 'Update Adapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 