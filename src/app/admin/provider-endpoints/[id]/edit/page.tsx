'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  AlertTriangle,
  Plus,
  X,
  Eye,
  Settings,
  Database,
  Zap,
  Save,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { detectUrlParameters, findRemovedParameters, getUrlParameterSummary, validateUrlParameters } from '@/lib/utils/url-parameter-detector';
import { validateAllDuplicateParameters } from '@/lib/utils/parameter-validation';

interface ProviderEndpoint {
  _id: string;
  name: string;
  path_to_api: string;
  icon: string;
  type: string;
  slug: string;
  description: string;
  isActive: boolean;
  ai_provider_id: string;
  createdAt: string;
  updatedAt: string;
  parameters?: {
    headers: Record<string, any>;
    body: {
      type: string | null;
      data: Record<string, any>;
    };
    query: Record<string, any>;
    parameters: Record<string, any>;
  };
}

interface AiProvider {
  _id: string;
  name: string;
  provider: string;
  version: string;
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export default function EditProviderEndpoint({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [endpoint, setEndpoint] = useState({
    name: '',
    path_to_api: '',
    icon: '🧠',
    type: 'text',
    slug: '',
    description: '',
    isActive: true,
    ai_provider_id: ''
  });

  // Parameters
  const [headers, setHeaders] = useState<Parameter[]>([]);
  const [bodyType, setBodyType] = useState<string>('json');
  const [bodyData, setBodyData] = useState<Parameter[]>([]);
  const [queryParams, setQueryParams] = useState<Parameter[]>([]);
  const [urlParams, setUrlParams] = useState<Parameter[]>([]);

  // Validation states
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [detectedParams, setDetectedParams] = useState<string[]>([]);
  const [removedParams, setRemovedParams] = useState<string[]>([]);
  const [urlParamSummary, setUrlParamSummary] = useState<{ urlParams: string[]; queryParams: string[]; hasUrlParams: boolean; hasQueryParams: boolean; }>({ urlParams: [], queryParams: [], hasUrlParams: false, hasQueryParams: false });
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // AI Providers for dropdown
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);

  useEffect(() => {
    if (session) {
      fetchEndpoint();
      fetchAiProviders();
    }
  }, [session, resolvedParams.id]);

  const fetchEndpoint = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider-endpoints/${resolvedParams.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const endpointData = data.data;
        
        setEndpoint({
          name: endpointData.name,
          path_to_api: endpointData.path_to_api,
          icon: endpointData.icon,
          type: endpointData.type,
          slug: endpointData.slug,
          description: endpointData.description,
          isActive: endpointData.isActive,
          ai_provider_id: endpointData.ai_provider_id
        });

        // Load parameters if they exist
        if (endpointData.parameters) {
          const params = endpointData.parameters;
          
          // Convert headers
          if (params.headers) {
            setHeaders(Object.entries(params.headers).map(([name, param]: [string, any]) => ({
              name,
              type: param.type,
              required: param.required,
              placeholder: param.placeholder,
              description: param.description
            })));
          }

          // Convert body
          if (params.body) {
            setBodyType(params.body.type || 'json');
            if (params.body.data) {
              setBodyData(Object.entries(params.body.data).map(([name, param]: [string, any]) => ({
                name,
                type: param.type,
                required: param.required,
                placeholder: param.placeholder,
                description: param.description
              })));
            }
          }

          // Convert query params
          if (params.query) {
            setQueryParams(Object.entries(params.query).map(([name, param]: [string, any]) => ({
              name,
              type: param.type,
              required: param.required,
              placeholder: param.placeholder,
              description: param.description
            })));
          }

          // Convert URL params
          if (params.parameters) {
            setUrlParams(Object.entries(params.parameters).map(([name, param]: [string, any]) => ({
              name,
              type: param.type,
              required: param.required,
              placeholder: param.placeholder,
              description: param.description
            })));
          }
        }
      } else {
        setError('Failed to fetch provider endpoint');
      }
    } catch (error) {
      console.error('Error fetching endpoint:', error);
      setError('Failed to fetch provider endpoint');
    } finally {
      setLoading(false);
    }
  };

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

  const validateAndUpdateParameters = (newUrl: string) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeout = setTimeout(() => {
      try {
        if (!isValidUrl(newUrl)) {
          setUrlValidationError('Please enter a valid URL');
          return;
        }

        const urlValidation = validateUrlParameters(newUrl);
        if (!urlValidation.isValid) {
          setUrlValidationError(`URL parameter validation failed: ${urlValidation.errors.join(', ')}`);
          return;
        }

        setUrlValidationError(null);

        const detected = detectUrlParameters(newUrl);
        const urlPathParams = detected.filter(p => p.requestType === 'parameter').map(p => p.name);
        const detectedQueryParams = detected.filter(p => p.requestType === 'query').map(p => p.name);

        const removed = findRemovedParameters(
          newUrl,
          urlParams.map(p => p.name),
          queryParams.map(p => p.name)
        );

        // Remove parameters no longer in URL
        setUrlParams(prev => prev.filter(p => !removed.removedUrlParams.includes(p.name)));
        setQueryParams(prev => prev.filter(p => !removed.removedQueryParams.includes(p.name)));

        // Add new detected parameters
        urlPathParams.forEach(paramName => {
          if (!urlParams.find(p => p.name === paramName)) {
            setUrlParams(prev => [...prev, {
              name: paramName,
              type: 'string',
              required: true,
              placeholder: `Enter ${paramName}`,
              description: `${paramName} parameter from URL path`
            }]);
          }
        });

        detectedQueryParams.forEach(paramName => {
          if (!queryParams.find(p => p.name === paramName)) {
            setQueryParams(prev => [...prev, {
              name: paramName,
              type: 'string',
              required: false,
              placeholder: `Enter ${paramName}`,
              description: `${paramName} query parameter`
            }]);
          }
        });

        setDetectedParams([...urlPathParams, ...detectedQueryParams]);
        setRemovedParams([...removed.removedUrlParams, ...removed.removedQueryParams]);

        const summary = getUrlParameterSummary(newUrl);
        setUrlParamSummary(summary);
      } catch (error) {
        console.error('Error validating URL parameters:', error);
      }
    }, 1000);

    setValidationTimeout(timeout);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setEndpoint(prev => ({ ...prev, path_to_api: newUrl }));
    validateAndUpdateParameters(newUrl);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addParameter = (type: 'headers' | 'bodyData' | 'queryParams' | 'urlParams') => {
    const newParam: Parameter = {
      name: '',
      type: 'string',
      required: false,
      placeholder: '',
      description: ''
    };

    switch (type) {
      case 'headers':
        setHeaders(prev => [...prev, newParam]);
        break;
      case 'bodyData':
        setBodyData(prev => [...prev, newParam]);
        break;
      case 'queryParams':
        setQueryParams(prev => [...prev, newParam]);
        break;
      case 'urlParams':
        setUrlParams(prev => [...prev, newParam]);
        break;
    }
  };

  const removeParameter = (type: 'headers' | 'bodyData' | 'queryParams' | 'urlParams', index: number) => {
    switch (type) {
      case 'headers':
        setHeaders(prev => prev.filter((_, i) => i !== index));
        break;
      case 'bodyData':
        setBodyData(prev => prev.filter((_, i) => i !== index));
        break;
      case 'queryParams':
        setQueryParams(prev => prev.filter((_, i) => i !== index));
        break;
      case 'urlParams':
        setUrlParams(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const updateParameter = (type: 'headers' | 'bodyData' | 'queryParams' | 'urlParams', index: number, field: keyof Parameter, value: any) => {
    switch (type) {
      case 'headers':
        setHeaders(prev => prev.map((param, i) => i === index ? { ...param, [field]: value } : param));
        break;
      case 'bodyData':
        setBodyData(prev => prev.map((param, i) => i === index ? { ...param, [field]: value } : param));
        break;
      case 'queryParams':
        setQueryParams(prev => prev.map((param, i) => i === index ? { ...param, [field]: value } : param));
        break;
      case 'urlParams':
        setUrlParams(prev => prev.map((param, i) => i === index ? { ...param, [field]: value } : param));
        break;
    }
  };

  const isParameterNameDuplicate = (name: string, type: 'headers' | 'bodyData' | 'queryParams' | 'urlParams', currentIndex: number) => {
    const allParams = [
      ...headers.map((p, i) => ({ ...p, type: 'headers' as const, index: i })),
      ...bodyData.map((p, i) => ({ ...p, type: 'bodyData' as const, index: i })),
      ...queryParams.map((p, i) => ({ ...p, type: 'queryParams' as const, index: i })),
      ...urlParams.map((p, i) => ({ ...p, type: 'urlParams' as const, index: i }))
    ];

    return allParams.some(param => 
      param.name === name && 
      (param.type !== type || param.index !== currentIndex)
    );
  };

  const checkForDuplicates = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const urlValidation = validateUrlParameters(endpoint.path_to_api);
      if (!urlValidation.isValid) {
        setError(`URL parameter validation failed: ${urlValidation.errors.join(', ')}`);
        setSaving(false);
        return;
      }

      if (!checkForDuplicates()) {
        setError('Please fix duplicate parameter names before submitting');
        setSaving(false);
        return;
      }

      // Additional validation: Check for cross-type duplicates
      const allParamNames = [
        ...headers.map(p => p.name),
        ...bodyData.map(p => p.name),
        ...queryParams.map(p => p.name),
        ...urlParams.map(p => p.name)
      ];
      const duplicateNames = allParamNames.filter((name, index) => allParamNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        setError(`Duplicate parameter names found: ${[...new Set(duplicateNames)].join(', ')}`);
        setSaving(false);
        return;
      }

      const paramter = {
        headers: headers.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
        body: {
          type: bodyType,
          data: bodyData.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
        },
        query: queryParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
        parameters: urlParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
      };

      const response = await fetch(`/api/provider-endpoints/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...endpoint,
          paramter
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Provider endpoint updated successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update provider endpoint');
      }
    } catch (error) {
      console.error('Error updating provider endpoint:', error);
      setError('Failed to update provider endpoint');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Provider Endpoint</h1>
        </div>

        {/* Error/Success Messages */}
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={endpoint.name}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="Enter endpoint name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">AI Provider</label>
                <select
                  value={endpoint.ai_provider_id}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, ai_provider_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                  required
                >
                  <option value="">Select AI Provider</option>
                  {aiProviders.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
                <input
                  type="text"
                  value={endpoint.icon}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="🧠"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={endpoint.type}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
                <input
                  type="text"
                  value={endpoint.slug}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="auto-generated"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={endpoint.isActive}
                  onChange={(e) => setEndpoint(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">Active</label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">API Path</label>
              <input
                type="url"
                value={endpoint.path_to_api}
                onChange={handleUrlChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 ${
                  urlValidationError ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="https://api.example.com/endpoint/:id"
                required
              />
              {urlValidationError && (
                <p className="mt-2 text-sm text-red-600">{urlValidationError}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={endpoint.description}
                onChange={(e) => setEndpoint(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                placeholder="Enter endpoint description"
                required
              />
            </div>
          </div>

          {/* Parameters Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Parameters</h2>

            {/* Headers */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-slate-600" />
                  Headers
                </h3>
                <button
                  type="button"
                  onClick={() => addParameter('headers')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Header</span>
                </button>
              </div>
              
              {headers.map((param, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter('headers', index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-500 ${
                          isParameterNameDuplicate(param.name, 'headers', index) ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="header-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter('headers', index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter('headers', index, 'required', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                      />
                      <label className="ml-2 block text-sm text-slate-700">Required</label>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => removeParameter('headers', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={param.placeholder || ''}
                        onChange={(e) => updateParameter('headers', index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Enter value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={param.description || ''}
                        onChange={(e) => updateParameter('headers', index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Header description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Body Parameters */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-slate-600" />
                  Body Parameters
                </h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                  >
                    <option value="json">JSON</option>
                    <option value="form">Form Data</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => addParameter('bodyData')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Body Parameter</span>
                  </button>
                </div>
              </div>
              
              {bodyData.map((param, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter('bodyData', index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-500 ${
                          isParameterNameDuplicate(param.name, 'bodyData', index) ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="parameter-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter('bodyData', index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter('bodyData', index, 'required', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                      />
                      <label className="ml-2 block text-sm text-slate-700">Required</label>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => removeParameter('bodyData', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={param.placeholder || ''}
                        onChange={(e) => updateParameter('bodyData', index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Enter value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={param.description || ''}
                        onChange={(e) => updateParameter('bodyData', index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Parameter description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Query Parameters */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-slate-600" />
                  Query Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => addParameter('queryParams')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Query Parameter</span>
                </button>
              </div>
              
              {queryParams.map((param, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter('queryParams', index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-500 ${
                          isParameterNameDuplicate(param.name, 'queryParams', index) ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="query-param"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter('queryParams', index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter('queryParams', index, 'required', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                      />
                      <label className="ml-2 block text-sm text-slate-700">Required</label>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => removeParameter('queryParams', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={param.placeholder || ''}
                        onChange={(e) => updateParameter('queryParams', index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Enter value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={param.description || ''}
                        onChange={(e) => updateParameter('queryParams', index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Query parameter description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* URL Parameters */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-slate-600" />
                  URL Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => addParameter('urlParams')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add URL Parameter</span>
                </button>
              </div>
              
              {urlParams.map((param, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter('urlParams', index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-500 ${
                          isParameterNameDuplicate(param.name, 'urlParams', index) ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="url-param"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter('urlParams', index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => updateParameter('urlParams', index, 'required', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                      />
                      <label className="ml-2 block text-sm text-slate-700">Required</label>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => removeParameter('urlParams', index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={param.placeholder || ''}
                        onChange={(e) => updateParameter('urlParams', index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="Enter value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={param.description || ''}
                        onChange={(e) => updateParameter('urlParams', index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-500"
                        placeholder="URL parameter description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Endpoint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 