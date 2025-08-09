'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Settings,
  Database,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface GlobalDefaultParameter {
  _id: string;
  name: string;
  requestType: 'text' | 'image' | 'audio' | 'video' | 'multimodal' | 'code' | 'other';
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

export default function GlobalDefaultParametersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [parameters, setParameters] = useState<GlobalDefaultParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated') {
      loadParameters();
    }
  }, [status, session]);

  const loadParameters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (filterType) queryParams.append('requestType', filterType);

      const response = await fetch(`/api/global-default-parameters?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load parameters');
      }

      const data = await response.json();
      setParameters(data.data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load parameters');
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete parameter');
      }

      // Reload parameters
      loadParameters();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete parameter');
    }
  };

  const getParameterCount = (parameter: GlobalDefaultParameter) => {
    const headers = Object.keys(parameter.parameters.headers || {}).length;
    const body = Object.keys(parameter.parameters.body?.data || {}).length;
    const query = Object.keys(parameter.parameters.query || {}).length;
    const urlParams = Object.keys(parameter.parameters.parameters || {}).length;
    return headers + body + query + urlParams;
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-purple-100 text-purple-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'multimodal': return 'bg-yellow-100 text-yellow-800';
      case 'code': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading global default parameters...</p>
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
          <button
            onClick={() => loadParameters()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Global Default Parameters</h1>
              <p className="mt-2 text-gray-600">
                Manage default parameters for different request types (text, image, audio, etc.)
              </p>
            </div>
            <Link
              href="/admin/global-default-parameters/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Default Parameter</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search parameters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="multimodal">Multimodal</option>
                  <option value="code">Code</option>
                  <option value="other">Other</option>
                </select>
                <button
                  onClick={loadParameters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Showing {parameters.length} global default parameter{parameters.length !== 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {parameters.map((parameter) => (
              <div key={parameter._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{parameter.name}</h3>
                        <p className="text-sm text-gray-600">{parameter.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRequestTypeColor(parameter.requestType)}`}>
                        {parameter.requestType.charAt(0).toUpperCase() + parameter.requestType.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getParameterCount(parameter)} parameters
                      </span>
                      <span className={`text-sm ${parameter.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {parameter.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/global-default-parameters/${parameter._id}`}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/global-default-parameters/${parameter._id}/edit`}
                      className="text-gray-600 hover:text-gray-700 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(parameter._id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {parameters.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No global default parameters found</h3>
              <p className="text-gray-600 mb-4">
                {search || filterType ? 'Try adjusting your search or filter criteria.' : 'Get started by creating your first global default parameter.'}
              </p>
              <Link
                href="/admin/global-default-parameters/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Default Parameter
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 