'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Settings,
  Database,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

interface GlobalDefaultParameter {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  parameters: {
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function GlobalDefaultParametersTab() {
  const [parameters, setParameters] = useState<GlobalDefaultParameter[]>([]);
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
    fetchParameters();
  }, [pagination.page, searchTerm]);

  const fetchParameters = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/global-default-parameters?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setParameters(data.data.items || data.data);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch parameters');
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global default parameter? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/global-default-parameters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchParameters();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete parameter'}`);
      }
    } catch (error) {
      console.error('Error deleting parameter:', error);
      alert('Failed to delete parameter');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getParameterCount = (parameter: GlobalDefaultParameter) => {
    const headers = Object.keys(parameter.parameters.headers || {}).length;
    const body = Object.keys(parameter.parameters.body?.data || {}).length;
    const query = Object.keys(parameter.parameters.query || {}).length;
    const urlParams = Object.keys(parameter.parameters.parameters || {}).length;
    return headers + body + query + urlParams;
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global Default Parameters</h2>
          <p className="text-slate-600">Manage default parameters for different request types</p>
        </div>
        <Link
          href="/admin/global-default-parameters/create"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Default Parameter</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search parameters by name or description..."
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

      {/* Parameters Table */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading parameters...</p>
          </div>
        ) : parameters.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No global default parameters found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating your first global default parameter.'}
            </p>
            <Link
              href="/admin/global-default-parameters/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 inline-flex items-center space-x-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Create your first parameter</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Parameter Details
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Parameters Count
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
                {parameters.map((parameter) => (
                  <tr key={parameter._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{parameter.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{parameter.description}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-900">
                      {getParameterCount(parameter)} parameters
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        parameter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {parameter.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/global-default-parameters/${parameter._id}`}
                          className="text-slate-600 hover:text-slate-900 transition-colors duration-150"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/global-default-parameters/${parameter._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                          title="Edit parameter"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(parameter._id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150"
                          title="Delete parameter"
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