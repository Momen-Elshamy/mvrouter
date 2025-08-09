'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, AlertCircle, X } from 'lucide-react';

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
}

interface AiProvider {
  _id: string;
  name: string;
  provider: string;
  version: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ProviderEndpointsTab() {
  const [endpoints, setEndpoints] = useState<ProviderEndpoint[]>([]);
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
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
    fetchEndpoints();
    fetchAiProviders();
  }, [pagination.page, searchTerm]);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/provider-endpoints?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setEndpoints(data.data.items || data.data);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch endpoints');
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch endpoints');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider endpoint?')) return;

    try {
      const response = await fetch(`/api/provider-endpoints/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEndpoints();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete endpoint'}`);
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      alert('Failed to delete endpoint');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getProviderName = (providerId: string) => {
    const provider = aiProviders.find(p => p._id === providerId);
    return provider ? provider.name : 'Unknown Provider';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Provider Endpoints</h2>
          <p className="text-slate-600">Manage API endpoints with their configurations and settings</p>
        </div>
        <Link
          href="/admin/provider-endpoints/create"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Provider Endpoint</span>
        </Link>
      </div>

      {/* Search */}
      <div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search endpoints by name, API path, or description..."
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Endpoints Table */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading endpoints...</p>
          </div>
        ) : endpoints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No provider endpoints found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get started by adding your first provider endpoint. Configure API endpoints with their parameters and settings.
            </p>
            <Link
              href="/admin/provider-endpoints/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 inline-flex items-center space-x-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add your first provider endpoint</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Endpoint Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    API Path
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Provider
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
                {endpoints.map((endpoint) => (
                  <tr key={endpoint._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{endpoint.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{endpoint.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                        {endpoint.path_to_api}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {endpoint.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {getProviderName(endpoint.ai_provider_id)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          endpoint.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {endpoint.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/provider-endpoints/${endpoint._id}`}
                          className="text-slate-600 hover:text-slate-900 transition-colors duration-150"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/provider-endpoints/${endpoint._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                          title="Edit endpoint"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(endpoint._id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150"
                          title="Delete endpoint"
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
        <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-slate-200">
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
  );
} 