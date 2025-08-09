'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Settings,
  Database
} from 'lucide-react';
import Link from 'next/link';

interface DefaultParameter {
  _id: string;
  name: string;
  parameters: any;
}

interface ProviderEndpoint {
  _id: string;
  name: string;
  parameters: any;
}

interface Mapping {
  fromField: string;
  toField: string;
  fieldType: 'parameter' | 'header' | 'body' | 'query';
  transformation?: string;
}

export default function CreateAdapter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [defaultParameters, setDefaultParameters] = useState<DefaultParameter[]>([]);
  const [providerEndpoints, setProviderEndpoints] = useState<ProviderEndpoint[]>([]);
  const [providerEndpointParameters, setProviderEndpointParameters] = useState<any>(null);
  const [selectedDefaultParam, setSelectedDefaultParam] = useState<string>('');
  const [selectedProviderEndpoint, setSelectedProviderEndpoint] = useState<string>('');
  const [adapterName, setAdapterName] = useState('');
  const [adapterDescription, setAdapterDescription] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    field: string;
    type: string;
    source: 'default' | 'provider';
  } | null>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    if (selectedProviderEndpoint) {
      fetchProviderEndpointParameters(selectedProviderEndpoint);
    } else {
      setProviderEndpointParameters(null);
    }
  }, [selectedProviderEndpoint]);

  const fetchData = async () => {
    try {
      // Fetch default parameters
      const defaultParamsResponse = await fetch('/api/global-default-parameters');
      if (defaultParamsResponse.ok) {
        const defaultParamsResult = await defaultParamsResponse.json();
        console.log('Default Parameters response:', defaultParamsResult);
        if (defaultParamsResult.success) {
          const params = defaultParamsResult.data.items || defaultParamsResult.data;
          console.log('Setting default parameters:', params);
          setDefaultParameters(params);
        }
      }

      // Fetch provider endpoints
      const endpointsResponse = await fetch('/api/provider-endpoints');
      if (endpointsResponse.ok) {
        const endpointsResult = await endpointsResponse.json();
        console.log('Provider Endpoints response:', endpointsResult);
        if (endpointsResult.success) {
          const endpoints = endpointsResult.data.items || endpointsResult.data;
          console.log('Setting provider endpoints:', endpoints);
          setProviderEndpoints(endpoints);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (field: string, type: string, source: 'default' | 'provider') => {
    console.log('Drag start:', { field, type, source });
    setDraggedItem({ field, type, source });
    // Add visual feedback
    document.body.style.cursor = 'grabbing';
    setError(null); // Clear any previous errors
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add visual feedback for drop target
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.borderColor = '#10b981'; // Green border when dragging over
      target.style.backgroundColor = '#f0fdf4'; // Light green background
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    document.body.style.cursor = 'default';
    
    // Reset all drop target styles
    const dropTargets = document.querySelectorAll('[data-drop-target]');
    dropTargets.forEach((target) => {
      const element = target as HTMLElement;
      element.style.borderColor = '';
      element.style.backgroundColor = '';
    });
  };

  const handleDrop = (e: React.DragEvent, targetField: string, targetType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered:', { targetField, targetType, draggedItem });
    
    if (!draggedItem) return;

    // Get the field types for validation
    const providerEndpointStructure = getSchemaStructure(providerEndpointParameters || {});
    const defaultParamStructure = getSchemaStructure(getSelectedDefaultParam()?.parameters || {});
    
    const allProviderEndpointFields = [
      ...providerEndpointStructure.headers,
      ...providerEndpointStructure.parameters,
      ...providerEndpointStructure.body,
      ...providerEndpointStructure.query
    ];
    
    const allDefaultParamFields = [
      ...defaultParamStructure.headers,
      ...defaultParamStructure.parameters,
      ...defaultParamStructure.body,
      ...defaultParamStructure.query
    ];
    
    const sourceField = allProviderEndpointFields.find((f: any) => f.path === draggedItem.field);
    const targetFieldData = allDefaultParamFields.find((f: any) => f.path === targetField);
    
    // Type validation - allow "any" type to match with any other type
    if (sourceField && targetFieldData) {
      const sourceType = normalizeType(sourceField.type);
      const targetType = normalizeType(targetFieldData.type);
      
      // Allow mapping if either type is "any" or if both types match
      const isValidMapping = sourceType === 'any' || targetType === 'any' || sourceType === targetType;
      
      if (!isValidMapping) {
        setError(`Type mismatch: Cannot map ${sourceField.type} to ${targetFieldData.type}. Both fields must have the same type or one must be "any".`);
        setDraggedItem(null);
        document.body.style.cursor = 'default';
        return;
      }
    }

    const newMapping: Mapping = {
      fromField: draggedItem.field,
      toField: targetField,
      fieldType: targetType as 'parameter' | 'header' | 'body' | 'query',
    };

    // Check if mapping already exists
    const existingIndex = mappings.findIndex(m => m.toField === targetField);
    if (existingIndex >= 0) {
      setMappings(prev => prev.map((m, i) => i === existingIndex ? newMapping : m));
    } else {
      setMappings(prev => [...prev, newMapping]);
    }

    setDraggedItem(null);
    // Reset cursor
    document.body.style.cursor = 'default';
    setError(null); // Clear any previous errors
  };

  const removeMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!adapterName || !selectedDefaultParam || !selectedProviderEndpoint) {
      setError('Please fill in all required fields');
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

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/provider-adapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adapterName,
          description: adapterDescription,
          defaultParameterId: selectedDefaultParam,
          providerEndpointId: selectedProviderEndpoint,
          mappings: mappings,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to create adapter');
        return;
      }

      if (result.success) {
        setSuccess('Adapter created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard?tab=adapters');
        }, 2000);
      } else {
        setError(result.message || 'Failed to create adapter');
      }
    } catch (error) {
      console.error('Error creating adapter:', error);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedDefaultParam = () => {
    return defaultParameters.find(p => p._id === selectedDefaultParam);
  };

  const getSelectedProviderEndpoint = () => {
    return providerEndpoints.find(p => p._id === selectedProviderEndpoint);
  };

  const fetchProviderEndpointParameters = async (endpointId: string) => {
    try {
      const response = await fetch(`/api/provider-endpoints/${endpointId}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Provider Endpoint Parameters response:', result);
        if (result.success && result.data.parameters) {
          setProviderEndpointParameters(result.data.parameters);
        } else {
          setProviderEndpointParameters(null);
        }
      }
    } catch (error) {
      console.error('Error fetching provider endpoint parameters:', error);
      setProviderEndpointParameters(null);
    }
  };

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

  const getSchemaStructure = (params: any) => {
    if (!params || typeof params !== 'object') return { headers: [], parameters: [], body: [], query: [] };
    
    const structure = {
      headers: [] as Array<{name: string, type: string, path: string, required?: boolean, description?: string}>,
      parameters: [] as Array<{name: string, type: string, path: string, required?: boolean, description?: string}>,
      body: [] as Array<{name: string, type: string, path: string, required?: boolean, description?: string}>,
      query: [] as Array<{name: string, type: string, path: string, required?: boolean, description?: string}>
    };

    // Extract headers
    if (params.headers) {
      Object.entries(params.headers).forEach(([key, value]: [string, any]) => {
        structure.headers.push({
          name: key,
          type: normalizeType(value.type || typeof value),
          path: `headers.${key}`,
          required: value.required,
          description: value.description
        });
      });
    }

    // Extract parameters
    if (params.parameters) {
      Object.entries(params.parameters).forEach(([key, value]: [string, any]) => {
        structure.parameters.push({
          name: key,
          type: normalizeType(value.type || typeof value),
          path: `parameters.${key}`,
          required: value.required,
          description: value.description
        });
      });
    }

    // Extract body
    if (params.body && params.body.data) {
      Object.entries(params.body.data).forEach(([key, value]: [string, any]) => {
        structure.body.push({
          name: key,
          type: normalizeType(value.type || typeof value),
          path: `body.data.${key}`,
          required: value.required,
          description: value.description
        });
      });
    }

    // Extract query
    if (params.query) {
      Object.entries(params.query).forEach(([key, value]: [string, any]) => {
        structure.query.push({
          name: key,
          type: normalizeType(value.type || typeof value),
          path: `query.${key}`,
          required: value.required,
          description: value.description
        });
      });
    }

    return structure;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Adapter</h1>
                <p className="text-sm text-gray-600">Map parameters between schemas</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Adapter
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error and Success Messages - Moved to top for better UX */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">{success}</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-400 hover:text-green-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adapter Name *
                </label>
                <input
                  type="text"
                  value={adapterName}
                  onChange={(e) => setAdapterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  placeholder="Enter adapter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={adapterDescription}
                  onChange={(e) => setAdapterDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                  placeholder="Enter description"
                />
              </div>
            </div>
          </div>

          {/* Schema Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schema Selection</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading schemas...</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Endpoints */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Endpoint *
                </label>
                <select
                  value={selectedProviderEndpoint}
                  onChange={(e) => setSelectedProviderEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                >
                  <option value="" className="text-gray-500">Select provider endpoint</option>
                  {providerEndpoints && providerEndpoints.length > 0 ? providerEndpoints.map((endpoint) => (
                    <option key={endpoint._id} value={endpoint._id} className="text-gray-900">
                      {endpoint.name}
                    </option>
                  )) : (
                    <option value="" disabled className="text-gray-500">Loading endpoints...</option>
                  )}
                </select>
              </div>

              {/* Default Parameters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Parameters *
                </label>
                <select
                  value={selectedDefaultParam}
                  onChange={(e) => setSelectedDefaultParam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{ backgroundColor: 'white', color: '#111827' }}
                >
                  <option value="" className="text-gray-500">Select default parameters</option>
                  {defaultParameters && defaultParameters.length > 0 ? defaultParameters.map((param) => (
                    <option key={param._id} value={param._id} className="text-gray-900">
                      {param.name}
                    </option>
                  )) : (
                    <option value="" disabled className="text-gray-500">Loading parameters...</option>
                  )}
                </select>
              </div>
            </div>
            )}
          </div>

          {/* Mapping Interface */}
                      {!loading && selectedDefaultParam && selectedProviderEndpoint && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <LinkIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-900">Parameter Mapping</h2>
                  <p className="text-sm text-purple-600">
                    Drag fields from the Provider Endpoint schema to the Default Parameters schema to create mappings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Provider Endpoint Schema */}
                <div className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">
                        {getSelectedProviderEndpoint()?.name} Schema
                      </h3>
                      <p className="text-sm text-blue-600">Drag fields from here</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const selectedEndpoint = getSelectedProviderEndpoint();
                      console.log('Selected Provider Endpoint:', selectedEndpoint);
                      console.log('Provider Endpoint Parameters:', providerEndpointParameters);
                      
                      if (!selectedEndpoint) {
                        return <div className="text-gray-500 text-sm">No endpoint selected</div>;
                      }
                      
                      if (!providerEndpointParameters) {
                        return <div className="text-gray-500 text-sm">Loading parameters...</div>;
                      }
                      
                      const structure = getSchemaStructure(providerEndpointParameters);
                      console.log('Provider Endpoint Structure:', structure);
                      
                      const allFields = [
                        ...structure.headers.map(f => ({ ...f, category: 'headers' })),
                        ...structure.parameters.map(f => ({ ...f, category: 'parameters' })),
                        ...structure.body.map(f => ({ ...f, category: 'body' })),
                        ...structure.query.map(f => ({ ...f, category: 'query' }))
                      ];
                      
                      if (allFields.length === 0) {
                        return <div className="text-gray-500 text-sm">No parameters to display</div>;
                      }
                      
                      return (
                        <>
                          {structure.headers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 mb-2 bg-blue-100 px-2 py-1 rounded">Headers</h4>
                              <div className="space-y-2">
                                {structure.headers.map((field: any, index: number) => (
                                  <div
                                    key={`headers-${index}`}
                                    draggable
                                    onDragStart={() => handleDragStart(field.path, field.type, 'provider')}
                                    onDragEnd={handleDragEnd}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-blue-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    <div className="mt-1 text-xs text-blue-500 flex items-center">
                                      <span className="mr-1">↖</span>
                                      Drag to map (Type: {field.type})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 mb-2 bg-blue-100 px-2 py-1 rounded">Parameters</h4>
                              <div className="space-y-2">
                                {structure.parameters.map((field: any, index: number) => (
                                  <div
                                    key={`parameters-${index}`}
                                    draggable
                                    onDragStart={() => handleDragStart(field.path, field.type, 'provider')}
                                    onDragEnd={handleDragEnd}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-blue-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    <div className="mt-1 text-xs text-blue-500 flex items-center">
                                      <span className="mr-1">↖</span>
                                      Drag to map (Type: {field.type})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.body.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 mb-2 bg-blue-100 px-2 py-1 rounded">Body</h4>
                              <div className="space-y-2">
                                {structure.body.map((field: any, index: number) => (
                                  <div
                                    key={`body-${index}`}
                                    draggable
                                    onDragStart={() => handleDragStart(field.path, field.type, 'provider')}
                                    onDragEnd={handleDragEnd}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-blue-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    <div className="mt-1 text-xs text-blue-500 flex items-center">
                                      <span className="mr-1">↖</span>
                                      Drag to map (Type: {field.type})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.query.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 mb-2 bg-blue-100 px-2 py-1 rounded">Query</h4>
                              <div className="space-y-2">
                                {structure.query.map((field: any, index: number) => (
                                  <div
                                    key={`query-${index}`}
                                    draggable
                                    onDragStart={() => handleDragStart(field.path, field.type, 'provider')}
                                    onDragEnd={handleDragEnd}
                                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-blue-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    <div className="mt-1 text-xs text-blue-500 flex items-center">
                                      <span className="mr-1">↖</span>
                                      Drag to map (Type: {field.type})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Default Parameters Schema */}
                <div className="border-2 border-green-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Settings className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900">
                        {getSelectedDefaultParam()?.name} Schema
                      </h3>
                      <p className="text-sm text-green-600">Drop fields here to map</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {(() => {
                      const selectedParam = getSelectedDefaultParam();
                      console.log('Selected Default Parameter:', selectedParam);
                      console.log('Parameter data:', selectedParam?.parameters);
                      
                      if (!selectedParam) {
                        return <div className="text-gray-500 text-sm">No parameter selected</div>;
                      }
                      
                      if (!selectedParam.parameters) {
                        return <div className="text-gray-500 text-sm">No parameters found for this schema</div>;
                      }
                      
                      const structure = getSchemaStructure(selectedParam.parameters);
                      console.log('Default Parameters Structure:', structure);
                      
                      const allFields = [
                        ...structure.headers.map(f => ({ ...f, category: 'headers' })),
                        ...structure.parameters.map(f => ({ ...f, category: 'parameters' })),
                        ...structure.body.map(f => ({ ...f, category: 'body' })),
                        ...structure.query.map(f => ({ ...f, category: 'query' }))
                      ];
                      
                      if (allFields.length === 0) {
                        return <div className="text-gray-500 text-sm">No parameters to display</div>;
                      }
                      
                      return (
                        <>
                          {structure.headers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">Headers</h4>
                              <div className="space-y-2">
                                {structure.headers.map((field: any, index: number) => (
                                  <div
                                    key={`headers-${index}`}
                                    data-drop-target="true"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, field.path, 'header')}
                                    className={`p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                      mappings.some(m => m.toField === field.path)
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-md'
                                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:from-gray-100 hover:to-slate-100 hover:border-green-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    {mappings.find(m => m.toField === field.path) ? (
                                      <div className="mt-1 p-2 bg-green-200 rounded text-xs text-green-800 font-medium">
                                        ✓ Mapped from: {mappings.find(m => m.toField === field.path)?.fromField}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                                        <span className="mr-1">↓</span>
                                        Drop here to map (Type: {field.type})
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">Parameters</h4>
                              <div className="space-y-2">
                                {structure.parameters.map((field: any, index: number) => (
                                  <div
                                    key={`parameters-${index}`}
                                    data-drop-target="true"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, field.path, 'parameter')}
                                    className={`p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                      mappings.some(m => m.toField === field.path)
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-md'
                                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:from-gray-100 hover:to-slate-100 hover:border-green-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    {mappings.find(m => m.toField === field.path) ? (
                                      <div className="mt-1 p-2 bg-green-200 rounded text-xs text-green-800 font-medium">
                                        ✓ Mapped from: {mappings.find(m => m.toField === field.path)?.fromField}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                                        <span className="mr-1">↓</span>
                                        Drop here to map (Type: {field.type})
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.body.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">Body</h4>
                              <div className="space-y-2">
                                {structure.body.map((field: any, index: number) => (
                                  <div
                                    key={`body-${index}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, field.path, 'body')}
                                    className={`p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                      mappings.some(m => m.toField === field.path)
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-md'
                                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:from-gray-100 hover:to-slate-100 hover:border-green-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    {mappings.find(m => m.toField === field.path) ? (
                                      <div className="mt-1 p-2 bg-green-200 rounded text-xs text-green-800 font-medium">
                                        ✓ Mapped from: {mappings.find(m => m.toField === field.path)?.fromField}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                                        <span className="mr-1">↓</span>
                                        Drop here to map (Type: {field.type})
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {structure.query.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">Query</h4>
                              <div className="space-y-2">
                                {structure.query.map((field: any, index: number) => (
                                  <div
                                    key={`query-${index}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, field.path, 'query')}
                                    className={`p-3 border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                                      mappings.some(m => m.toField === field.path)
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-md'
                                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:from-gray-100 hover:to-slate-100 hover:border-green-300 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-gray-900 text-sm">{field.name}</span>
                                      <span className="text-xs text-gray-700 bg-gray-200 px-2 py-1 rounded-full font-medium">
                                        {field.type}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      Path: {field.path}
                                    </div>
                                    {mappings.find(m => m.toField === field.path) ? (
                                      <div className="mt-1 p-2 bg-green-200 rounded text-xs text-green-800 font-medium">
                                        ✓ Mapped from: {mappings.find(m => m.toField === field.path)?.fromField}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                                        <span className="mr-1">↓</span>
                                        Drop here to map (Type: {field.type})
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Current Mappings */}
              {mappings.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="p-1 bg-purple-100 rounded">
                      <span className="text-purple-600 font-bold">✓</span>
                    </div>
                    <h3 className="text-lg font-bold text-purple-900">Current Mappings ({mappings.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {mappings.map((mapping, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-purple-900 bg-purple-100 px-2 py-1 rounded">
                              {mapping.fromField}
                            </span>
                            <span className="text-purple-400 font-bold">→</span>
                            <span className="text-sm font-semibold text-pink-900 bg-pink-100 px-2 py-1 rounded">
                              {mapping.toField}
                            </span>
                          </div>
                          <span className="text-xs text-purple-700 bg-purple-200 px-2 py-1 rounded-full font-medium">
                            {mapping.fieldType}
                          </span>
                        </div>
                        <button
                          onClick={() => removeMapping(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 