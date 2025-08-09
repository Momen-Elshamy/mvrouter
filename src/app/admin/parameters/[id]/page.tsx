'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Settings, Calendar, Link as LinkIcon, Hash } from 'lucide-react';
import Link from 'next/link';

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
}

export default function ParameterViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [parameter, setParameter] = useState<AiProviderParameter | null>(null);
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load parameter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this parameter configuration? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/ai-provider-parameters/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Parameter configuration deleted successfully');
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete parameter configuration: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error deleting parameter configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderParameterSection = (title: string, params: Record<string, any> | null | undefined, type: string) => {
    if (!params || typeof params !== 'object') return null;
    const entries = Object.entries(params);
    if (entries.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">{title}</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          {entries.map(([key, value]) => (
            <div key={key} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {value.required ? 'Required' : 'Optional'}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {value.type}
                  </span>
                </div>
              </div>
              {value.placeholder && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Placeholder:</span> {value.placeholder}
                </p>
              )}
              {value.description && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Description:</span> {value.description}
                </p>
              )}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Parameter Configuration</h1>
                <p className="text-gray-600">View and manage AI provider parameter configuration</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/parameters/${parameter._id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Parameters
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Parameters
              </button>
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parameter Configuration */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parameter Configuration</h3>
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Structured parameter configuration for API requests</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Headers */}
              {renderParameterSection('Headers', parameter.paramter.headers, 'header')}

              {/* Body */}
              {parameter.paramter.body?.type && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Body Configuration</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="font-medium text-gray-900">Body Type: </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {parameter.paramter.body.type}
                      </span>
                    </div>
                    {renderParameterSection('Body Data', parameter.paramter.body?.data, 'body')}
                  </div>
                </div>
              )}

              {/* Query Parameters */}
              {renderParameterSection('Query Parameters', parameter.paramter.query, 'query')}

              {/* URL Parameters */}
              {renderParameterSection('URL Parameters', parameter.paramter.parameters, 'parameter')}


            </div>

            {/* Timestamps */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(parameter.createdAt).toLocaleDateString()} at {new Date(parameter.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(parameter.updatedAt).toLocaleDateString()} at {new Date(parameter.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Hash className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Parameter ID</p>
                    <p className="text-sm text-gray-900 font-mono">{parameter._id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 