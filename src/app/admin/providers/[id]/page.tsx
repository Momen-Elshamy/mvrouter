'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Server, Globe, Tag, Calendar, Activity, FileText, Hash } from 'lucide-react';
import Link from 'next/link';

interface AiProvider {
  _id: string;
  name: string;
  icon: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProviderViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
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
      loadProvider();
    }
  }, [status, session, params.id]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-providers/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load provider');
      }

      const data = await response.json();
      setProvider(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load provider');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/ai-providers/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Provider deleted successfully');
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete provider: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error deleting provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provider details...</p>
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

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
          <p className="text-gray-600 mb-4">The provider you're looking for doesn't exist.</p>
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-3xl font-bold text-gray-900">Provider Details</h1>
                <p className="text-gray-600">View and manage AI provider information</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/providers/${provider._id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Provider
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Provider
              </button>
            </div>
          </div>
        </div>

        {/* Provider Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{provider.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-lg text-gray-900">{provider.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Tag className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Slug</p>
                                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-900">
                      {provider.slug}
                    </code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Description</h3>
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-900">{provider.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
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
                      {new Date(provider.createdAt).toLocaleDateString()} at {new Date(provider.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(provider.updatedAt).toLocaleDateString()} at {new Date(provider.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Hash className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Provider ID</p>
                    <p className="text-sm text-gray-900 font-mono">{provider._id}</p>
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