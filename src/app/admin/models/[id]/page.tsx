'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Database, Calendar, Link as LinkIcon, FileText, Hash } from 'lucide-react';
import Link from 'next/link';

interface AiProviderModel {
  _id: string;
  name: string;
  description: string;
  ai_provider_id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AiProvider {
  _id: string;
  name: string;
  icon: string;
  type: string;
}

export default function ModelViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [model, setModel] = useState<AiProviderModel | null>(null);
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
      loadModel();
    }
  }, [status, session, params.id]);

  const loadModel = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-provider-models/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to load model');
      }

      const data = await response.json();
      setModel(data.data);
      
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
      setError(error instanceof Error ? error.message : 'Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/ai-provider-models/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Model deleted successfully');
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete model: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error deleting model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading model details...</p>
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

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Model Not Found</h2>
          <p className="text-gray-600 mb-4">The model you're looking for doesn't exist.</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Model Details</h1>
                <p className="text-gray-600">View and manage AI model information</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/models/${model._id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Model
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Model
              </button>
            </div>
          </div>
        </div>

        {/* Model Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Model Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Model Name</p>
                      <p className="text-lg text-gray-900">{model.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="text-sm text-gray-900">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Provider</p>
                      {provider ? (
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
                            {provider.type ? provider.type.charAt(0).toUpperCase() + provider.type.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Provider ID: {model.ai_provider_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        model.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {model.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-lg text-gray-900">
                        {new Date(model.createdAt).toLocaleDateString()} at {new Date(model.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-lg text-gray-900">
                        {new Date(model.updatedAt).toLocaleDateString()} at {new Date(model.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Model ID</p>
                      <p className="text-sm text-gray-900 font-mono">{model._id}</p>
                    </div>
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