'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Server, Tag, Activity, FileText } from 'lucide-react';
import Link from 'next/link';
import { detectUrlParameters, hasUrlParameters } from '@/lib/utils/url-parameter-detector';

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

export default function ProviderEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    slug: '',
    description: '',
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
        throw new Error('Failed to load provider');
      }

      const data = await response.json();
      setProvider(data.data);
      setFormData({
        name: data.data.name,
        icon: data.data.icon,
        slug: data.data.slug,
        description: data.data.description,
        isActive: data.data.isActive,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`/api/ai-providers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Provider updated successfully');
        router.push(`/admin/providers/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update provider: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handlePathToApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      path_to_api: value,
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
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
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={`/admin/providers/${provider._id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Provider</h1>
              <p className="text-gray-600">Update AI provider information</p>
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
                    <Server className="h-4 w-4" />
                    <span>Provider Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter provider name"
                />
              </div>

              {/* Slug Field */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Slug</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier (auto-generated from name)
                </p>
              </div>



              {/* Icon Field */}
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4">🎨</div>
                    <span>Icon</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="🤖"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Emoji or icon representation
                </p>
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
                  placeholder="Enter provider description"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </div>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Active providers can be used for API requests
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <Link
                  href={`/admin/providers/${provider._id}`}
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