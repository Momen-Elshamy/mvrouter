'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface AiModel {
  _id: string;
  name: string;
  model_id: string;
  description: string;
  ai_provider_id: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: {
    _id: string;
    name: string;
    provider: string;
    version: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ModelsTab() {
  const [models, setModels] = useState<AiModel[]>([]);
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

  useEffect(() => {
    fetchModels();
  }, [pagination.page, searchTerm]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/ai-provider-models?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setModels(data.data.items || data.data);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI model?')) return;

    try {
      const response = await fetch(`/api/ai-provider-models/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchModels();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete model'}`);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Models</h2>
          <p className="text-slate-600">Manage your AI models and their configurations</p>
        </div>
        <Link
          href="/admin/models/create"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add AI Model</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search models..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Models List */}
      {models.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No AI Models Yet</h3>
            <p className="text-slate-600 mb-6">
              Get started by adding your first AI model. You can configure different models for each AI provider.
            </p>
            <Link
              href="/admin/models/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 inline-flex items-center space-x-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add your first AI model</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {models.map((model) => (
                  <tr key={model._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{model.name}</div>
                        <div className="text-sm text-slate-500">{model.model_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {model.provider ? `${model.provider.name} (${model.provider.provider} ${model.provider.version})` : 'Unknown Provider'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        model.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {model.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/models/${model._id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/models/${model._id}/edit`}
                          className="text-slate-600 hover:text-slate-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(model._id)}
                          className="text-red-600 hover:text-red-900 p-1"
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 