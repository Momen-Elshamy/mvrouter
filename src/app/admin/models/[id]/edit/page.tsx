'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Database, Link as LinkIcon, FileText } from 'lucide-react';
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

export default function ModelEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [model, setModel] = useState<AiProviderModel | null>(null);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ai_provider_id: '',
    isActive: true,
  });

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
      loadProviders();
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
      setFormData({
        name: data.data.name,
        description: data.data.description,
        ai_provider_id: data.data.ai_provider_id,
        isActive: data.data.isActive,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load model');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.data?.items || []);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`/api/ai-provider-models/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Model updated successfully');
        router.push(`/admin/models/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update model: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={`/admin/models/${model._id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Model</h1>
              <p className="text-gray-600">Update AI model information</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="px-6 py-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Model Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter model name"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Description</span>
                  </div>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter model description"
                />
              </div>

              {/* Provider Field */}
              <div>
                <label htmlFor="ai_provider_id" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Provider</span>
                  </div>
                </label>
                <select
                  id="ai_provider_id"
                  name="ai_provider_id"
                  value={formData.ai_provider_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.icon} {provider.name} ({provider.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status Field */}
              <div>
                <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active Model
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">Enable or disable this model</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <Link
                  href={`/admin/models/${model._id}`}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 