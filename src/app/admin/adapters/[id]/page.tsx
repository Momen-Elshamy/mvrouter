'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  Database,
  Server,
  Settings,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface ProviderAdapter {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  defaultParameterId: string;
  providerEndpointId: string;
  mappings: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  defaultParameter?: {
    _id: string;
    name: string;
    parameters: any;
  };
  providerEndpoint?: {
    _id: string;
    name: string;
    parameters: any;
  };
}

export default function AdapterView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const adapterId = params.id as string;

  const [adapter, setAdapter] = useState<ProviderAdapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



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
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [session, status, router, adapterId]);

  const loadAdapter = async () => {
    try {
      setLoading(true);
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
      if (result.success) {
        setAdapter(result.data);
      } else {
        setError(result.message || 'Failed to load adapter');
      }
    } catch (error) {
      console.error('Error loading adapter:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this adapter?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/provider-adapters/${adapterId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/admin/dashboard?tab=adapters');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete adapter');
      }
    } catch (error) {
      console.error('Error deleting adapter:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading adapter...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
          <Link
            href="/admin/dashboard?tab=adapters"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Adapters
          </Link>
        </div>
      </div>
    );
  }

  if (!adapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-semibold mb-4">Adapter not found</div>
          <Link
            href="/admin/dashboard?tab=adapters"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Adapters
          </Link>
        </div>
      </div>
    );
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
                <h1 className="text-3xl font-bold text-gray-900">{adapter.name}</h1>
                <p className="mt-2 text-gray-600">Adapter Details</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/adapters/${adapterId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Adapter
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Adapter
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{adapter.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{adapter.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    adapter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {adapter.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(adapter.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(adapter.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Mappings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Parameter Mappings</h2>
              {adapter.mappings.length === 0 ? (
                <p className="text-gray-500 text-sm">No mappings configured</p>
              ) : (
                <div className="space-y-3">
                  {adapter.mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">{mapping.fromField}</span>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">{mapping.toField}</span>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mapping.fieldType === 'header' ? 'bg-blue-100 text-blue-800' :
                        mapping.fieldType === 'body' ? 'bg-purple-100 text-purple-800' :
                        mapping.fieldType === 'query' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.fieldType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Endpoint */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Server className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Provider Endpoint</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{adapter.providerEndpoint?.name || 'Unknown'}</p>
                </div>
                                                 <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">{adapter.providerEndpoint?._id || adapter.providerEndpointId}</p>
                </div>
              </div>
            </div>

            {/* Default Parameter */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Default Parameter</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{adapter.defaultParameter?.name || 'Unknown'}</p>
                </div>
                                                 <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">{adapter.defaultParameter?._id || adapter.defaultParameterId}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/adapters/${adapterId}/edit`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Adapter
                </Link>
                <button
                  onClick={handleDelete}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Adapter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 