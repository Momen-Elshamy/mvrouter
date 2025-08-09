'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, AlertCircle, X } from 'lucide-react';

interface AiProvider {
  _id: string;
  name: string;
  provider: string;
  version: string;
  description: string;
  isActive: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    version: '',
    description: '',
    isActive: true,
    slug: '',
  });

  useEffect(() => {
    fetchProviders();
  }, [pagination.page, searchTerm]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/ai-providers?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setProviders(data.data.items || data.data);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI provider?')) return;

    try {
      const response = await fetch(`/api/ai-providers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProviders();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete provider'}`);
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Failed to delete provider');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/ai-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          provider: '',
          version: '',
          description: '',
          isActive: true,
          slug: '',
        });
        fetchProviders();
      } else {
        const errorData = await response.json();
        setCreateError(errorData.message || errorData.error || 'Failed to create AI provider');
      }
    } catch (error) {
      console.error('Error creating AI provider:', error);
      setCreateError('Failed to create AI provider. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Providers</h1>
            <p className="text-slate-600">Manage your AI service providers and their configurations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add AI Provider</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input
              type="text"
              placeholder="Search providers by name, provider, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 shadow-sm transition-all duration-200"
            />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Providers Table */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading providers...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No AI providers found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Get started by adding your first AI provider. You can configure different providers like OpenAI, Anthropic, Google, and more.
              </p>
              <Link
                href="/admin/providers/create"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 inline-flex items-center space-x-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add your first AI provider</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Provider Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {providers.map((provider) => (
                    <tr key={provider._id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{provider.name}</div>
                          <div className="text-sm text-slate-500 mt-1">{provider.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {provider.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {provider.version}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            provider.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/admin/providers/${provider._id}`}
                            className="text-slate-600 hover:text-slate-900 transition-colors duration-150"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/providers/${provider._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                            title="Edit provider"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(provider._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            title="Delete provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-150"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-700 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-150"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create AI Provider</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Error Display */}
            {createError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{createError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="modal-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  id="modal-name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 shadow-sm transition-all duration-200"
                  placeholder="e.g., OpenAI GPT-4, Anthropic Claude, Google Gemini"
                />
                <p className="mt-1 text-xs text-slate-500">A descriptive name for this AI provider</p>
              </div>

              {/* Provider */}
              <div>
                <label htmlFor="modal-provider" className="block text-sm font-semibold text-slate-700 mb-2">
                  Service Provider *
                </label>
                <input
                  type="text"
                  id="modal-provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 shadow-sm transition-all duration-200"
                  placeholder="e.g., OpenAI, Anthropic, Google, Microsoft"
                />
                <p className="mt-1 text-xs text-slate-500">The company or service providing the AI</p>
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="modal-slug" className="block text-sm font-semibold text-slate-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  id="modal-slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 shadow-sm transition-all duration-200"
                  placeholder="e.g., openai-gpt-4, anthropic-claude"
                />
                <p className="mt-1 text-xs text-slate-500">URL-friendly identifier (auto-generated from name)</p>
              </div>

              {/* Version */}
              <div>
                <label htmlFor="modal-version" className="block text-sm font-semibold text-slate-700 mb-2">
                  API Version *
                </label>
                <select
                  id="modal-version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 shadow-sm transition-all duration-200"
                >
                  <option value="">Select API version</option>
                  <option value="v1">v1</option>
                  <option value="v2">v2</option>
                  <option value="v3">v3</option>
                  <option value="v4">v4</option>
                  <option value="beta">Beta</option>
                  <option value="alpha">Alpha</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">The version of the API you're using</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="modal-description" className="block text-sm font-semibold text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="modal-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500 shadow-sm transition-all duration-200 resize-none"
                  placeholder="Describe this AI provider, its capabilities, and use cases..."
                />
                <p className="mt-1 text-xs text-slate-500">A detailed description of this AI provider and its features</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="modal-isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded bg-white"
                />
                <div>
                  <label htmlFor="modal-isActive" className="text-sm font-semibold text-slate-800">
                    Active Provider
                  </label>
                  <p className="text-xs text-slate-600 mt-1">Enable this provider for use in your system</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>{createLoading ? 'Creating...' : 'Create AI Provider'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 