'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Settings,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { detectUrlParameters, hasUrlParameters, isValidUrl, findRemovedParameters, getUrlParameterSummary, validateUrlParameters } from '@/lib/utils/url-parameter-detector';
import { findDuplicateParameters, validateAllDuplicateParameters } from '@/lib/utils/parameter-validation';

interface AiProvider {
  _id: string;
  name: string;
  provider: string;
  version: string;
}

interface ParameterField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export default function CreateProviderEndpoint() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [detectedParams, setDetectedParams] = useState<string[]>([]);
  const [removedParams, setRemovedParams] = useState<{ removedUrlParams: string[], removedQueryParams: string[] }>({ removedUrlParams: [], removedQueryParams: [] });
  const [urlParamSummary, setUrlParamSummary] = useState<{ urlParams: string[], queryParams: string[], hasUrlParams: boolean, hasQueryParams: boolean }>({ urlParams: [], queryParams: [], hasUrlParams: false, hasQueryParams: false });
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  useEffect(() => {
    fetchAiProviders();
  }, []);

  const fetchAiProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers?limit=100');
      const data = await response.json();
      if (data.success) {
        setAiProviders(data.data.items || data.data);
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    }
  };
  
  const [endpoint, setEndpoint] = useState({
    name: '',
    path_to_api: '',
    icon: '',
    slug: '',
    description: '',
    isActive: true,
    ai_provider_id: ''
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Update slug when name changes
  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setEndpoint({ ...endpoint, name, slug });
  };

  // Form state - flattened parameters for easier editing
  const [headers, setHeaders] = useState<ParameterField[]>([]);
  const [bodyType, setBodyType] = useState<string>('');
  const [bodyData, setBodyData] = useState<ParameterField[]>([]);
  const [queryParams, setQueryParams] = useState<ParameterField[]>([]);
  const [urlParams, setUrlParams] = useState<ParameterField[]>([]);

  // Lazy validation for URL parameters
  const validateAndUpdateParameters = (newUrl: string) => {
    // Clear previous timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for lazy validation
    const timeout = setTimeout(() => {
      try {
        // Validate URL
        if (!isValidUrl(newUrl)) {
          setUrlValidationError('Please enter a valid URL');
          return;
        }

        // Validate URL parameters for uniqueness
        const urlValidation = validateUrlParameters(newUrl);
        if (!urlValidation.isValid) {
          setUrlValidationError(`URL parameter validation failed: ${urlValidation.errors.join(', ')}`);
          return;
        }
        
        setUrlValidationError(null);

        // Detect URL parameters
        const detectedParams = detectUrlParameters(newUrl);
        const urlPathParams = detectedParams.filter(p => p.requestType === 'parameter');
        const detectedQueryParams = detectedParams.filter(p => p.requestType === 'query');
        
        const hasUrl = hasUrlParameters(newUrl);
        const hasQuery = newUrl.includes('?');

        setUrlParamSummary({
          urlParams: urlPathParams.map(p => p.name),
          queryParams: detectedQueryParams.map(p => p.name),
          hasUrlParams: hasUrl,
          hasQueryParams: hasQuery
        });

        // Find removed parameters
        console.log('Current URL:', newUrl);
        console.log('Current URL params:', urlParams.map(p => p.name));
        console.log('Current query params:', queryParams.map(p => p.name));
        
        const removed = findRemovedParameters(
          newUrl, 
          urlParams.map(p => p.name), // Use current state for existing URL params
          queryParams.map(p => p.name) // Use current state for existing query params
        );
        
        console.log('Removed params:', removed);

        setRemovedParams(removed);

        // Auto-add detected URL path parameters if they don't exist
        urlPathParams.forEach(param => {
          const exists = urlParams.some(p => p.name === param.name);
          if (!exists) {
            setUrlParams(prev => [...prev, {
              name: param.name,
              type: param.type,
              required: param.required,
              placeholder: param.placeholder,
              description: param.description
            }]);
          }
        });

        // Auto-add detected query parameters if they don't exist
        detectedQueryParams.forEach(param => {
          const exists = queryParams.some(p => p.name === param.name);
          if (!exists) {
            setQueryParams(prev => [...prev, {
              name: param.name,
              type: param.type,
              required: param.required,
              placeholder: param.placeholder,
              description: param.description
            }]);
          }
        });

        // Remove parameters that are no longer in the URL
        if (removed.removedUrlParams.length > 0) {
          console.log('Removing URL params:', removed.removedUrlParams);
          setUrlParams(prev => {
            const filtered = prev.filter(param => !removed.removedUrlParams.includes(param.name));
            console.log('URL params after removal:', filtered);
            return filtered;
          });
        }
        
        if (removed.removedQueryParams.length > 0) {
          console.log('Removing query params:', removed.removedQueryParams);
          setQueryParams(prev => {
            const filtered = prev.filter(param => !removed.removedQueryParams.includes(param.name));
            console.log('Query params after removal:', filtered);
            return filtered;
          });
        }

        setDetectedParams([...urlPathParams.map(p => p.name), ...detectedQueryParams.map(p => p.name)]);

      } catch (error) {
        console.error('Error validating URL parameters:', error);
      }
    }, 1000); // 1 second delay

    setValidationTimeout(timeout);
  };

  const handleUrlChange = (newUrl: string) => {
    setEndpoint({ ...endpoint, path_to_api: newUrl });
    validateAndUpdateParameters(newUrl);
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
        setHeaders(headers.map((param, i) => i === index ? { ...param, ...field } : param));
        break;
      case 'body':
        setBodyData(bodyData.map((param, i) => i === index ? { ...param, ...field } : param));
        break;
      case 'query':
        setQueryParams(queryParams.map((param, i) => i === index ? { ...param, ...field } : param));
        break;
      case 'url':
        setUrlParams(urlParams.map((param, i) => i === index ? { ...param, ...field } : param));
        break;
    }
  };

  const isParameterNameDuplicate = (type: 'headers' | 'body' | 'query' | 'url', name: string, excludeIndex?: number) => {
    const allParams = [
      ...headers.map((p, i) => ({ ...p, type: 'headers' as const, index: i })),
      ...bodyData.map((p, i) => ({ ...p, type: 'body' as const, index: i })),
      ...queryParams.map((p, i) => ({ ...p, type: 'query' as const, index: i })),
      ...urlParams.map((p, i) => ({ ...p, type: 'url' as const, index: i }))
    ];

    return allParams.some(param => 
      param.name === name && 
      param.type === type && 
      (excludeIndex === undefined || param.index !== excludeIndex)
    );
  };

  const checkForDuplicates = () => {
    // Convert component state to StructuredParameters format
    const structuredParams = {
      headers: headers.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
      body: {
        type: bodyType,
        data: bodyData.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
      },
      query: queryParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
      parameters: urlParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
    };
    
    const result = validateAllDuplicateParameters(structuredParams);
    setDuplicateErrors(result.errors);
    return result.isValid;
  };

  const renderParameterSection = (
    title: string,
    type: 'headers' | 'body' | 'query' | 'url',
    fields: ParameterField[],
    showBodyType = false
  ) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={() => addParameter(type)}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add {title.slice(0, -1)}</span>
        </button>
      </div>

      {showBodyType && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Body Type</label>
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
          >
            <option value="">Select body type</option>
            <option value="json">JSON</option>
            <option value="form">Form Data</option>
            <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
          </select>
        </div>
      )}

      {fields.length === 0 ? (
        <p className="text-slate-500 text-sm italic">No {title.toLowerCase()} configured</p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateParameter(type, index, { name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 ${
                      isParameterNameDuplicate(type, field.name, index) ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Parameter name"
                  />
                  {isParameterNameDuplicate(type, field.name, index) && (
                    <p className="text-red-500 text-xs mt-1">Duplicate parameter name</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateParameter(type, index, { type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required</label>
                  <select
                    value={field.required ? 'true' : 'false'}
                    onChange={(e) => updateParameter(type, index, { required: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                  >
                    <option value="true">Required</option>
                    <option value="false">Optional</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeParameter(type, index)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateParameter(type, index, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                    placeholder="Enter placeholder text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => updateParameter(type, index, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                    placeholder="Enter description"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate URL parameters for uniqueness
      const urlValidation = validateUrlParameters(endpoint.path_to_api);
      if (!urlValidation.isValid) {
        setError(`URL parameter validation failed: ${urlValidation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Check for duplicates across all parameter types
      if (!checkForDuplicates()) {
        setError('Please fix duplicate parameter names before submitting');
        setLoading(false);
        return;
      }

      // Additional validation: Check for duplicates within each parameter type
      const allParamNames = [
        ...headers.map(p => p.name),
        ...bodyData.map(p => p.name),
        ...queryParams.map(p => p.name),
        ...urlParams.map(p => p.name)
      ];

      const duplicateNames = allParamNames.filter((name, index) => allParamNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        setError(`Duplicate parameter names found: ${[...new Set(duplicateNames)].join(', ')}`);
        setLoading(false);
        return;
      }
      // Structure parameters
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
          type: bodyType || null,
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
        ...endpoint,
        paramter: structuredParam,
      };

      console.log('Sending endpoint creation:', requestBody);

      const response = await fetch('/api/provider-endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Provider endpoint created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(`Failed to create provider endpoint: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      setError(`Error creating provider endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create Provider Endpoint</h1>
          <p className="text-slate-600 mt-2">Configure a new API endpoint with parameters and settings</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">AI Provider *</label>
                <select
                  value={endpoint.ai_provider_id}
                  onChange={(e) => setEndpoint({ ...endpoint, ai_provider_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                >
                  <option value="">Select AI Provider</option>
                  {aiProviders.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} ({provider.provider} {provider.version})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Endpoint Name *</label>
                <input
                  type="text"
                  value={endpoint.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., OpenAI Chat Completions"
                />
              </div>

              {/* API Path */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">API Path *</label>
                <input
                  type="url"
                  value={endpoint.path_to_api}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 ${
                    urlValidationError ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., https://api.openai.com/v1/chat/completions"
                />
                {urlValidationError && (
                  <p className="text-red-500 text-sm mt-1">{urlValidationError}</p>
                )}
                {urlParamSummary.hasUrlParams && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">Detected URL Parameters:</p>
                    <p className="text-blue-700 text-sm">{urlParamSummary.urlParams.join(', ')}</p>
                  </div>
                )}
                {urlParamSummary.hasQueryParams && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">Detected Query Parameters:</p>
                    <p className="text-green-700 text-sm">{urlParamSummary.queryParams.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Icon *</label>
                <input
                  type="text"
                  value={endpoint.icon}
                  onChange={(e) => setEndpoint({ ...endpoint, icon: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., message-circle, brain, zap"
                />
              </div>



              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={endpoint.slug}
                  onChange={(e) => setEndpoint({ ...endpoint, slug: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., openai-chat-completions"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={endpoint.isActive}
                  onChange={(e) => setEndpoint({ ...endpoint, isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded bg-white"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active Endpoint
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={endpoint.description}
                onChange={(e) => setEndpoint({ ...endpoint, description: e.target.value })}
                required
                rows={4}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="Describe this endpoint, its capabilities, and use cases..."
              />
            </div>
          </div>

          {/* Parameter Configuration */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Parameter Configuration</h2>
              <button
                type="button"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-slate-600 hover:text-slate-900 text-sm"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </button>
            </div>

                    {/* Debug Info */}
        {showDebugInfo && (
          <div className="bg-slate-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p><strong>Detected Parameters:</strong> {detectedParams.join(', ') || 'None'}</p>
                <p><strong>Removed URL Params:</strong> {removedParams.removedUrlParams.join(', ') || 'None'}</p>
                <p><strong>Removed Query Params:</strong> {removedParams.removedQueryParams.join(', ') || 'None'}</p>
              </div>
              <div>
                <p><strong>URL Validation:</strong> {urlValidationError ? 'Invalid' : 'Valid'}</p>
                <p><strong>Duplicate Errors:</strong> {duplicateErrors.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Removed Parameters Warning */}
        {(removedParams.removedUrlParams.length > 0 || removedParams.removedQueryParams.length > 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">Parameters Removed</h3>
                <div className="text-sm text-orange-700 mt-1">
                  {removedParams.removedUrlParams.length > 0 && (
                    <p>URL parameters removed: {removedParams.removedUrlParams.join(', ')}</p>
                  )}
                  {removedParams.removedQueryParams.length > 0 && (
                    <p>Query parameters removed: {removedParams.removedQueryParams.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Duplicate Errors */}
            {duplicateErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Duplicate Parameter Names</h3>
                    <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                      {duplicateErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Parameter Sections */}
            {renderParameterSection('Headers', 'headers', headers)}
            {renderParameterSection('Body', 'body', bodyData, true)}
            {renderParameterSection('Query Parameters', 'query', queryParams)}
            {renderParameterSection('URL Parameters', 'url', urlParams)}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2 font-medium"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Provider Endpoint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 