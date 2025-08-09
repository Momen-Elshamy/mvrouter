'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Settings, Plus, Trash2, Link as LinkIcon, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { detectUrlParameters, hasUrlParameters, isValidUrl, findRemovedParameters, getUrlParameterSummary } from '@/lib/utils/url-parameter-detector';
import { findDuplicateParameters, validateAllDuplicateParameters } from '@/lib/utils/parameter-validation';

interface AiProviderParameter {
  _id: string;
  ai_provider_id: string;
  paramter: {
    headers: Record<string, any>;
    body: {
      type: string | null;
      data: Record<string, any>;
    };
    query: Record<string, any>;
    parameters: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

interface AiProvider {
  _id: string;
  name: string;
  icon: string;
  type: string;
  slug: string;
  path_to_api: string;
}

interface ParameterField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export default function ParameterEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [parameter, setParameter] = useState<AiProviderParameter | null>(null);
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);
  const [detectedParams, setDetectedParams] = useState<string[]>([]);
  const [removedParams, setRemovedParams] = useState<{ removedUrlParams: string[], removedQueryParams: string[] }>({ removedUrlParams: [], removedQueryParams: [] });
  const [urlParamSummary, setUrlParamSummary] = useState<{ urlParams: string[], queryParams: string[], hasUrlParams: boolean, hasQueryParams: boolean }>({ urlParams: [], queryParams: [], hasUrlParams: false, hasQueryParams: false });
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Validate URL parameters when provider URL changes
  useEffect(() => {
    if (provider?.path_to_api) {
      // Clear previous timeout
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
      
      // Set new timeout for lazy validation
      const timeout = setTimeout(() => {
        validateAndUpdateUrlParameters();
      }, 500); // 500ms delay for lazy validation
      
      setValidationTimeout(timeout);
    }
  }, [provider?.path_to_api]);

  // Form state - flattened parameters for easier editing
  const [headers, setHeaders] = useState<ParameterField[]>([]);
  const [bodyType, setBodyType] = useState<string>('');
  const [bodyData, setBodyData] = useState<ParameterField[]>([]);
  const [queryParams, setQueryParams] = useState<ParameterField[]>([]);
  const [urlParams, setUrlParams] = useState<ParameterField[]>([]);


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    if (params.id) {
      loadParameter();
    }
  }, [status, session, params.id]);

  const loadParameter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-provider-parameters/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to load parameter');
      }

      const data = await response.json();
      setParameter(data.data);
      
      // Load provider information
      if (data.data.ai_provider_id) {
        const providerResponse = await fetch(`/api/ai-providers/${data.data.ai_provider_id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        });
        
        if (providerResponse.ok) {
          const providerData = await providerResponse.json();
          setProvider(providerData.data);
        }
      }

      // Flatten the structured parameters for editing
      const param = data.data.paramter;
      
      // Headers
      const headerFields: ParameterField[] = Object.entries(param.headers || {}).map(([name, value]) => ({
        name,
        type: (value as any).type,
        required: (value as any).required,
        placeholder: (value as any).placeholder,
        description: (value as any).description,
      }));
      setHeaders(headerFields);

      // Body
      setBodyType(param.body?.type || '');
      const bodyFields: ParameterField[] = Object.entries(param.body?.data || {}).map(([name, value]) => ({
        name,
        type: (value as any).type,
        required: (value as any).required,
        placeholder: (value as any).placeholder,
        description: (value as any).description,
      }));
      setBodyData(bodyFields);

      // Query
      const queryFields: ParameterField[] = Object.entries(param.query || {}).map(([name, value]) => ({
        name,
        type: (value as any).type,
        required: (value as any).required,
        placeholder: (value as any).placeholder,
        description: (value as any).description,
      }));
      setQueryParams(queryFields);

      // URL Parameters
      const urlFields: ParameterField[] = Object.entries(param.parameters || {}).map(([name, value]) => ({
        name,
        type: (value as any).type,
        required: (value as any).required,
        placeholder: (value as any).placeholder,
        description: (value as any).description,
      }));
      setUrlParams(urlFields);


    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load parameter');
    } finally {
      setLoading(false);
    }
  };

  // Lazy validation function for URL parameters
  const validateAndUpdateUrlParameters = () => {
    if (!provider?.path_to_api) return;
    
    // Get current parameters from URL
    const currentParams = detectUrlParameters(provider.path_to_api);
    const currentUrlParamNames = currentParams.filter(p => p.requestType === 'parameter').map(p => p.name);
    const currentQueryParamNames = currentParams.filter(p => p.requestType === 'query').map(p => p.name);
    
    // Remove URL parameters that no longer exist in the URL
    const updatedUrlParams = urlParams.filter(param => currentUrlParamNames.includes(param.name));
    if (updatedUrlParams.length !== urlParams.length) {
      setUrlParams(updatedUrlParams);
    }
    
    // Remove query parameters that no longer exist in the URL
    const updatedQueryParams = queryParams.filter(param => currentQueryParamNames.includes(param.name));
    if (updatedQueryParams.length !== queryParams.length) {
      setQueryParams(updatedQueryParams);
    }
    
    // Update URL parameter summary
    const summary = getUrlParameterSummary(provider.path_to_api);
    setUrlParamSummary(summary);
    
    // Check for removed parameters for display
    const existingUrlParamNames = urlParams.map(p => p.name);
    const existingQueryParamNames = queryParams.map(p => p.name);
    const removed = findRemovedParameters(provider.path_to_api, existingUrlParamNames, existingQueryParamNames);
    setRemovedParams(removed);
  };

  // Check for duplicate parameters
  const checkForDuplicates = () => {
    const allParameters = {
      headers: headers.reduce((acc, field) => {
        if (field.name.trim()) {
          acc[field.name] = field;
        }
        return acc;
      }, {} as Record<string, any>),
      body: {
        type: bodyType,
        data: bodyData.reduce((acc, field) => {
          if (field.name.trim()) {
            acc[field.name] = field;
          }
          return acc;
        }, {} as Record<string, any>),
      },
      query: queryParams.reduce((acc, field) => {
        if (field.name.trim()) {
          acc[field.name] = field;
        }
        return acc;
      }, {} as Record<string, any>),
      parameters: urlParams.reduce((acc, field) => {
        if (field.name.trim()) {
          acc[field.name] = field;
        }
        return acc;
      }, {} as Record<string, any>)
    };

    const validation = validateAllDuplicateParameters(allParameters);
    setDuplicateErrors(validation.errors);
    
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates before submitting
    if (!checkForDuplicates()) {
      setError('Please fix duplicate parameter names before submitting.');
      return;
    }
    
    try {
      setSaving(true);
      setDuplicateErrors([]);

      // Reconstruct the structured parameter object
      const structuredParam = {
        headers: headers.reduce((acc, field) => {
          if (field.name.trim()) { // Only add if name is not empty
            acc[field.name] = {
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              description: field.description,
            };
          }
          return acc;
        }, {} as Record<string, any>),
        body: {
          type: bodyType,
          data: bodyData.reduce((acc, field) => {
            if (field.name.trim()) { // Only add if name is not empty
              acc[field.name] = {
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                description: field.description,
              };
            }
            return acc;
          }, {} as Record<string, any>),
        },
        query: queryParams.reduce((acc, field) => {
          if (field.name.trim()) { // Only add if name is not empty
            acc[field.name] = {
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              description: field.description,
            };
          }
          return acc;
        }, {} as Record<string, any>),
        parameters: urlParams.reduce((acc, field) => {
          if (field.name.trim()) { // Only add if name is not empty
            acc[field.name] = {
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              description: field.description,
            };
          }
          return acc;
        }, {} as Record<string, any>),
      };

      const requestBody = {
        ai_provider_id: parameter?.ai_provider_id,
        paramter: structuredParam,
      };

      console.log('Sending parameter update:', requestBody);

      const response = await fetch(`/api/ai-provider-parameters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Parameter configuration updated successfully');
        router.push(`/admin/parameters/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update parameter configuration: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating parameter configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const addParameter = (type: 'headers' | 'body' | 'query' | 'url') => {
    const newField: ParameterField = {
      name: '',
      type: 'string',
      required: false,
      placeholder: '',
      description: '',
    };

    switch (type) {
      case 'headers':
        setHeaders([...headers, newField]);
        break;
      case 'body':
        setBodyData([...bodyData, newField]);
        break;
      case 'query':
        setQueryParams([...queryParams, newField]);
        break;
      case 'url':
        setUrlParams([...urlParams, newField]);
        break;
    }
  };

  // Check if parameter name already exists in the same type
  const isParameterNameDuplicate = (type: 'headers' | 'body' | 'query' | 'url', name: string, excludeIndex?: number) => {
    let existingNames: string[] = [];
    
    switch (type) {
      case 'headers':
        existingNames = headers.map((h, i) => excludeIndex === i ? '' : h.name).filter(Boolean);
        break;
      case 'body':
        existingNames = bodyData.map((b, i) => excludeIndex === i ? '' : b.name).filter(Boolean);
        break;
      case 'query':
        existingNames = queryParams.map((q, i) => excludeIndex === i ? '' : q.name).filter(Boolean);
        break;
      case 'url':
        existingNames = urlParams.map((u, i) => excludeIndex === i ? '' : u.name).filter(Boolean);
        break;
    }
    
    return existingNames.includes(name);
  };

  const removeParameter = (type: 'headers' | 'body' | 'query' | 'url', index: number) => {
    switch (type) {
      case 'headers':
        setHeaders(headers.filter((_, i) => i !== index));
        break;
      case 'body':
        setBodyData(bodyData.filter((_, i) => i !== index));
        break;
      case 'query':
        setQueryParams(queryParams.filter((_, i) => i !== index));
        break;
      case 'url':
        setUrlParams(urlParams.filter((_, i) => i !== index));
        break;
    }
  };

  const updateParameter = (type: 'headers' | 'body' | 'query' | 'url', index: number, field: Partial<ParameterField>) => {
    switch (type) {
      case 'headers':
        setHeaders(headers.map((item, i) => i === index ? { ...item, ...field } : item));
        break;
      case 'body':
        setBodyData(bodyData.map((item, i) => i === index ? { ...item, ...field } : item));
        break;
      case 'query':
        setQueryParams(queryParams.map((item, i) => i === index ? { ...item, ...field } : item));
        break;
      case 'url':
        setUrlParams(urlParams.map((item, i) => i === index ? { ...item, ...field } : item));
        break;
    }
    
    // Check for duplicate names within the same type when name is being updated
    if (field.name !== undefined) {
      const isDuplicate = isParameterNameDuplicate(type, field.name, index);
      if (isDuplicate) {
        // Add a temporary error for this specific field
        console.warn(`Duplicate parameter name '${field.name}' in ${type}`);
      }
    }
    
    // Check for duplicates after update
    setTimeout(() => {
      const allParameters = {
        headers: headers.reduce((acc, field) => {
          if (field.name.trim()) {
            acc[field.name] = field;
          }
          return acc;
        }, {} as Record<string, any>),
        body: {
          type: bodyType,
          data: bodyData.reduce((acc, field) => {
            if (field.name.trim()) {
              acc[field.name] = field;
            }
            return acc;
          }, {} as Record<string, any>),
        },
        query: queryParams.reduce((acc, field) => {
          if (field.name.trim()) {
            acc[field.name] = field;
          }
          return acc;
        }, {} as Record<string, any>),
        parameters: urlParams.reduce((acc, field) => {
          if (field.name.trim()) {
            acc[field.name] = field;
          }
          return acc;
        }, {} as Record<string, any>)
      };

      const validation = validateAllDuplicateParameters(allParameters);
      setDuplicateErrors(validation.errors);
    }, 100);
  };

  const renderParameterSection = (
    title: string,
    type: 'headers' | 'body' | 'query' | 'url',
    fields: ParameterField[],
    showBodyType = false
  ) => {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">{title}</h4>
          <button
            type="button"
            onClick={() => addParameter(type)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Parameter
          </button>
        </div>

        {showBodyType && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select body type</option>
              <option value="body-json">JSON</option>
              <option value="body-form">Form Data</option>
              <option value="body-x-www-form-urlencoded">URL Encoded</option>
            </select>
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parameter Name</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateParameter(type, index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter parameter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateParameter(type, index, { type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                    <option value="any">Any</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateParameter(type, index, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter placeholder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => updateParameter(type, index, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateParameter(type, index, { required: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Required</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeParameter(type, index)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parameter details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/admin/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!parameter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parameter Not Found</h2>
          <p className="text-gray-600 mb-4">The parameter configuration you're looking for doesn't exist.</p>
          <Link
            href="/admin/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={`/admin/parameters/${parameter._id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Parameters</h1>
              <p className="text-gray-600">Update AI provider parameter configuration</p>
            </div>
          </div>
        </div>

        {/* Provider Information */}
        {provider && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <LinkIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{provider.icon}</span>
                    <span className="text-lg text-gray-900">{provider.name}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.type === 'image' ? 'bg-purple-100 text-purple-800' :
                      provider.type === 'text' ? 'bg-blue-100 text-blue-800' :
                      provider.type === 'video' ? 'bg-red-100 text-red-800' :
                      provider.type === 'audio' ? 'bg-green-100 text-green-800' :
                      provider.type === 'multimodal' ? 'bg-yellow-100 text-yellow-800' :
                      provider.type === 'code' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.type.charAt(0).toUpperCase() + provider.type.slice(1)}
                    </span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-900">
                      {provider.slug}
                    </code>
                  </div>
                  {provider.path_to_api && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">API Path:</p>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                        {provider.path_to_api}
                      </code>
                                            {(hasUrlParameters(provider.path_to_api) || provider.path_to_api.includes('?')) && (
                        <div className="mt-2">
                          {/* URL Parameter Summary */}
                          {(() => {
                            const summary = getUrlParameterSummary(provider.path_to_api);
                            const existingUrlParamNames = urlParams.map(p => p.name);
                            const existingQueryParamNames = queryParams.map(p => p.name);
                            const removed = findRemovedParameters(provider.path_to_api, existingUrlParamNames, existingQueryParamNames);
                            
                            return (
                              <div className="space-y-2">
                                {/* Current URL Parameters */}
                                {(summary.hasUrlParams || summary.hasQueryParams) && (
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="space-y-1">
                                      {summary.hasUrlParams && (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                          <span className="text-sm text-blue-700">
                                            URL Parameters: {summary.urlParams.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                      {summary.hasQueryParams && (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                          <span className="text-sm text-blue-700">
                                            Query Parameters: {summary.queryParams.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Removed Parameters Warning */}
                                {(removed.removedUrlParams.length > 0 || removed.removedQueryParams.length > 0) && (
                                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-700 font-medium">
                                          Parameters removed from URL:
                                        </span>
                                      </div>
                                      {removed.removedUrlParams.length > 0 && (
                                        <div className="ml-6 text-sm text-yellow-700">
                                          • URL Parameters: {removed.removedUrlParams.join(', ')}
                                        </div>
                                      )}
                                      {removed.removedQueryParams.length > 0 && (
                                        <div className="ml-6 text-sm text-yellow-700">
                                          • Query Parameters: {removed.removedQueryParams.join(', ')}
                                        </div>
                                      )}
                                      <div className="ml-6 text-xs text-yellow-600">
                                        These parameters are still in your configuration but no longer exist in the URL.
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Auto-detect and Validate Buttons */}
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                    <Zap className="w-3 h-3 inline mr-1" />
                                    Parameters detected in URL
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const detectedParams = detectUrlParameters(provider.path_to_api);
                                      if (detectedParams.length > 0) {
                                        // Separate path parameters and query parameters
                                        const pathParams = detectedParams.filter(p => p.requestType === 'parameter');
                                        const queryParams = detectedParams.filter(p => p.requestType === 'query');
                                        
                                        // Add path parameters to URL parameters section
                                        const existingUrlParamNames = urlParams.map(p => p.name);
                                        const newPathParams = pathParams.filter(param => !existingUrlParamNames.includes(param.name));
                                        
                                        if (newPathParams.length > 0) {
                                          const newUrlParams = newPathParams.map(param => ({
                                            name: param.name,
                                            type: param.type,
                                            required: param.required,
                                            placeholder: param.placeholder,
                                            description: param.description
                                          }));
                                          setUrlParams([...urlParams, ...newUrlParams]);
                                        }
                                        
                                        // Add query parameters to query parameters section
                                        const existingQueryParamNames = queryParams.map(p => p.name);
                                        const newQueryParams = queryParams.filter(param => !existingQueryParamNames.includes(param.name));
                                        
                                        if (newQueryParams.length > 0) {
                                          const newQueryParamFields = newQueryParams.map(param => ({
                                            name: param.name,
                                            type: param.type,
                                            required: param.required,
                                            placeholder: param.placeholder,
                                            description: param.description
                                          }));
                                          setQueryParams([...queryParams, ...newQueryParamFields]);
                                        }
                                        
                                        // Show detected parameters message
                                        const allDetected = [...pathParams, ...queryParams];
                                        setDetectedParams(allDetected.map(p => p.name));
                                      }
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Auto-detect all parameters
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      validateAndUpdateUrlParameters();
                                    }}
                                    className="text-xs text-orange-600 hover:text-orange-800 underline"
                                  >
                                    Validate & Remove
                                  </button>
                                </div>
                                {detectedParams.length > 0 && (
                                  <div className="text-xs text-green-700">
                                    Detected: {detectedParams.join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="px-6 py-8">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parameter Configuration</h3>
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Configure parameters for API requests</span>
              </div>
              
              {/* Duplicate Error Display */}
              {duplicateErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <span className="text-red-700 font-medium">Duplicate Parameter Names Found:</span>
                      <ul className="text-red-600 text-sm mt-2 space-y-1">
                        {duplicateErrors.map((error, index) => (
                          <li key={index} className="ml-4">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Headers */}
              {renderParameterSection('Headers', 'headers', headers)}

              {/* Body */}
              {renderParameterSection('Body Parameters', 'body', bodyData, true)}

              {/* URL Parameters */}
              {renderParameterSection('URL Parameters', 'url', urlParams)}

              {/* Query Parameters */}
              {renderParameterSection('Query Parameters', 'query', queryParams)}


            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6">
              <Link
                href={`/admin/parameters/${parameter._id}`}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 