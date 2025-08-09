'use client';

import { useState, useEffect } from 'react';
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

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export default function CreateGlobalDefaultParameter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Parameters
  const [headers, setHeaders] = useState<Parameter[]>([]);
  const [bodyType, setBodyType] = useState<string>('json');
  const [bodyData, setBodyData] = useState<Parameter[]>([]);
  const [queryParams, setQueryParams] = useState<Parameter[]>([]);
  const [urlParams, setUrlParams] = useState<Parameter[]>([]);

  // Validation states
  const [duplicateErrors, setDuplicateErrors] = useState<string[]>([]);

  useEffect(() => {
    if (session) {
      setLoading(false);
    }
  }, [session]);

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
    const allParamNames = [
      ...headers.map(p => p.name),
      ...bodyData.map(p => p.name),
      ...queryParams.map(p => p.name),
      ...urlParams.map(p => p.name)
    ];
    const duplicateNames = allParamNames.filter((name, index) => allParamNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      setDuplicateErrors([`Duplicate parameter names found: ${[...new Set(duplicateNames)].join(', ')}`]);
      return false;
    }
    
    setDuplicateErrors([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!checkForDuplicates()) {
        setError('Please fix duplicate parameter names before submitting');
        setSaving(false);
        return;
      }

      const parameters = {
        headers: headers.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
        body: {
          type: bodyType,
          data: bodyData.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
        },
        query: queryParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {}),
        parameters: urlParams.reduce((acc, param) => ({ ...acc, [param.name]: param }), {})
      };

      const response = await fetch('/api/global-default-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parameters
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Global default parameter created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create global default parameter');
      }
    } catch (error) {
      console.error('Error creating global default parameter:', error);
      setError('Failed to create global default parameter');
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
          <h1 className="text-3xl font-bold text-slate-900">Create Global Default Parameter</h1>
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
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="Enter parameter name"
                  required
                />
              </div>



              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">Active</label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                placeholder="Enter parameter description"
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
                  <span>Create Parameter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 