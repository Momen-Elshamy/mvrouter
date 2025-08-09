'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Key, 
  Server, 
  Settings, 
  Database, 
  LogOut,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  X,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import AiProvidersTab from '@/components/AiProvidersTab';
import ProviderEndpointsTab from '@/components/ProviderEndpointsTab';
import ModelsTab from '@/components/ModelsTab';
import GlobalDefaultParametersTab from '@/components/GlobalDefaultParametersTab';

interface User {
  _id: string;
  name: string;
  email: string;
  role: {
    name: string;
    description: string;
  };
  createdAt: string;
}

interface Token {
  _id: string;
  name: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface AiProvider {
  _id: string;
  name: string;
  path_to_api: string;
  icon: string;
  version: string;
  type: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface AiProviderModel {
  _id: string;
  name: string;
  description: string;
  ai_provider_id: string;
  createdAt: string;
}

interface AiProviderParameter {
  _id: string;
  ai_provider_id: string;
  paramter: {
    headers: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
    body: {
      type: string | null;
      data: Record<string, {
        type: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }>;
    };
    query: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
    parameters: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
  };
  createdAt: string;
}

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

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [] as User[],
    tokens: [] as Token[],
    providers: [] as AiProvider[],
    models: [] as AiProviderModel[],
    parameters: [] as AiProviderParameter[],
    adapters: [] as ProviderAdapter[]
  });
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [tokenPagination, setTokenPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [providerPagination, setProviderPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [modelPagination, setModelPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [parameterPagination, setParameterPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [providerEndpointsPagination, setProviderEndpointsPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [globalDefaultParametersPagination, setGlobalDefaultParametersPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [adapters, setAdapters] = useState<ProviderAdapter[]>([]);
  const [adaptersLoading, setAdaptersLoading] = useState(false);
  const [adaptersPagination, setAdaptersPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });


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
        loadData();
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [session, status, router]);

  // Load data when tabs are active
  useEffect(() => {
    if (activeTab === 'users' && session) {
      loadUsers(userPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'tokens' && session) {
      loadTokens(tokenPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'ai-providers' && session) {
      loadProviders(providerPagination.page);
    }
  }, [activeTab, session]);

  // Load AI providers data when component mounts
  useEffect(() => {
    if (session) {
      loadProviders(1);
      loadProviderEndpoints(1);
      loadGlobalDefaultParameters(1);
    }
  }, [session]);

  useEffect(() => {
    if (activeTab === 'models' && session) {
      loadModels(modelPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'parameters' && session) {
      loadParameters(parameterPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'provider-endpoints' && session) {
      loadProviderEndpoints(providerEndpointsPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'defaults' && session) {
      loadGlobalDefaultParameters(globalDefaultParametersPagination.page);
    }
  }, [activeTab, session]);

  useEffect(() => {
    if (activeTab === 'adapters' && session) {
      loadAdapters(adaptersPagination.page);
    }
  }, [activeTab, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const headers = getHeaders();
      
      const [usersRes, tokensRes, providersRes, modelsRes, parametersRes] = await Promise.all([
        fetch(`/api/users?page=${userPagination.page}&limit=${userPagination.limit}`, { headers }),
        fetch(`/api/ai-provider-tokens?page=${tokenPagination.page}&limit=${tokenPagination.limit}`, { headers }),
        fetch(`/api/ai-providers?page=${providerPagination.page}&limit=${providerPagination.limit}`, { headers }),
        fetch(`/api/ai-provider-models?page=${modelPagination.page}&limit=${modelPagination.limit}`, { headers }),
        fetch(`/api/ai-provider-parameters?page=${parameterPagination.page}&limit=${parameterPagination.limit}`, { headers })
      ]);

      const [usersData, tokensData, providersData, modelsData, parametersData] = await Promise.all([
        usersRes.json(),
        tokensRes.json(),
        providersRes.json(),
        modelsRes.json(),
        parametersRes.json()
      ]);

      setData({
        users: usersData.data?.items || [],
        tokens: tokensData.data?.items || [],
        providers: providersData.data?.items || [],
        models: modelsData.data?.items || [],
        parameters: parametersData.data?.items || [],
        adapters: []
      });

      // Update pagination info for all entities
      if (usersData.data?.pagination) {
        setUserPagination(prev => ({
          ...prev,
          total: usersData.data.pagination.total,
          totalPages: usersData.data.pagination.totalPages,
          hasNext: usersData.data.pagination.hasNext,
          hasPrev: usersData.data.pagination.hasPrev
        }));
      }
      if (tokensData.data?.pagination) {
        setTokenPagination(prev => ({
          ...prev,
          total: tokensData.data.pagination.total,
          totalPages: tokensData.data.pagination.totalPages,
          hasNext: tokensData.data.pagination.hasNext,
          hasPrev: tokensData.data.pagination.hasPrev
        }));
      }
      if (providersData.data?.pagination) {
        setProviderPagination(prev => ({
          ...prev,
          total: providersData.data.pagination.total,
          totalPages: providersData.data.pagination.totalPages,
          hasNext: providersData.data.pagination.hasNext,
          hasPrev: providersData.data.pagination.hasPrev
        }));
      }
      if (modelsData.data?.pagination) {
        setModelPagination(prev => ({
          ...prev,
          total: modelsData.data.pagination.total,
          totalPages: modelsData.data.pagination.totalPages,
          hasNext: modelsData.data.pagination.hasNext,
          hasPrev: modelsData.data.pagination.hasPrev
        }));
      }
      if (parametersData.data?.pagination) {
        setParameterPagination(prev => ({
          ...prev,
          total: parametersData.data.pagination.total,
          totalPages: parametersData.data.pagination.totalPages,
          hasNext: parametersData.data.pagination.hasNext,
          hasPrev: parametersData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  const getHeaders = (): Record<string, string> => {
    return {
      'Content-Type': 'application/json',
    };
  };

  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/users?page=${page}&limit=${userPagination.limit}`, { headers });
      const usersData = await response.json();
      
      setData(prev => ({
        ...prev,
        users: usersData.data?.items || []
      }));

      if (usersData.data?.pagination) {
        setUserPagination(prev => ({
          ...prev,
          page,
          total: usersData.data.pagination.total,
          totalPages: usersData.data.pagination.totalPages,
          hasNext: usersData.data.pagination.hasNext,
          hasPrev: usersData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTokens = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/ai-provider-tokens?page=${page}&limit=${tokenPagination.limit}`, { headers });
      const tokensData = await response.json();
      
      setData(prev => ({
        ...prev,
        tokens: tokensData.data?.items || []
      }));

      if (tokensData.data?.pagination) {
        setTokenPagination(prev => ({
          ...prev,
          page,
          total: tokensData.data.pagination.total,
          totalPages: tokensData.data.pagination.totalPages,
          hasNext: tokensData.data.pagination.hasNext,
          hasPrev: tokensData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/ai-providers?page=${page}&limit=${providerPagination.limit}`, { headers });
      const providersData = await response.json();
      
      setData(prev => ({
        ...prev,
        providers: providersData.data?.items || []
      }));

      if (providersData.data?.pagination) {
        setProviderPagination(prev => ({
          ...prev,
          page,
          total: providersData.data.pagination.total,
          totalPages: providersData.data.pagination.totalPages,
          hasNext: providersData.data.pagination.hasNext,
          hasPrev: providersData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/ai-provider-models?page=${page}&limit=${modelPagination.limit}`, { headers });
      const modelsData = await response.json();
      
      setData(prev => ({
        ...prev,
        models: modelsData.data?.items || []
      }));

      if (modelsData.data?.pagination) {
        setModelPagination(prev => ({
          ...prev,
          page,
          total: modelsData.data.pagination.total,
          totalPages: modelsData.data.pagination.totalPages,
          hasNext: modelsData.data.pagination.hasNext,
          hasPrev: modelsData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParameters = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/ai-provider-parameters?page=${page}&limit=${parameterPagination.limit}`, { headers });
      const parametersData = await response.json();
      
      setData(prev => ({
        ...prev,
        parameters: parametersData.data?.items || []
      }));

      if (parametersData.data?.pagination) {
        setParameterPagination(prev => ({
          ...prev,
          page,
          total: parametersData.data.pagination.total,
          totalPages: parametersData.data.pagination.totalPages,
          hasNext: parametersData.data.pagination.hasNext,
          hasPrev: parametersData.data.pagination.hasPrev
        }));
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderEndpoints = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/provider-endpoints?page=${page}&limit=${providerEndpointsPagination.limit}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        if (data.data.pagination) {
          setProviderEndpointsPagination(prev => ({
            ...prev,
            page,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages,
            hasNext: data.data.pagination.hasNext,
            hasPrev: data.data.pagination.hasPrev
          }));
        }
      }
    } catch (error) {
      console.error('Error loading provider endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalDefaultParameters = async (page: number = 1) => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/global-default-parameters?page=${page}&limit=${globalDefaultParametersPagination.limit}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        if (data.data.pagination) {
          setGlobalDefaultParametersPagination(prev => ({
            ...prev,
            page,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages,
            hasNext: data.data.pagination.hasNext,
            hasPrev: data.data.pagination.hasPrev
          }));
        }
      }
    } catch (error) {
      console.error('Error loading global default parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdapters = async (page: number = 1) => {
    try {
      setAdaptersLoading(true);
      const headers = getHeaders();
      const response = await fetch(`/api/provider-adapters?page=${page}&limit=${adaptersPagination.limit}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setAdapters(data.data.items || []);
        if (data.data.pagination) {
          setAdaptersPagination(prev => ({
            ...prev,
            page,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.pages,
            hasNext: data.data.pagination.page < data.data.pagination.pages,
            hasPrev: data.data.pagination.page > 1
          }));
        }
      }
    } catch (error) {
      console.error('Error loading adapters:', error);
    } finally {
      setAdaptersLoading(false);
    }
  };

  // Action handlers
  const handleView = (type: string, id: string) => {
    console.log(`View ${type} with ID: ${id}`);
    // Navigate to view pages
    switch (type) {
      case 'user':
        router.push(`/admin/users/${id}`);
        break;
      case 'token':
        router.push(`/admin/tokens/${id}`);
        break;
      case 'provider':
        router.push(`/admin/providers/${id}`);
        break;
      case 'model':
        router.push(`/admin/models/${id}`);
        break;
      case 'parameter':
        router.push(`/admin/parameters/${id}`);
        break;
      case 'provider-endpoint':
        router.push(`/admin/provider-endpoints/${id}`);
        break;
      case 'adapter':
        router.push(`/admin/adapters/${id}`);
        break;
      default:
        alert(`View ${type} with ID: ${id}`);
    }
  };

  const handleEdit = (type: string, id: string) => {
    console.log(`Edit ${type} with ID: ${id}`);
    // Navigate to edit pages
    switch (type) {
      case 'user':
        router.push(`/admin/users/${id}/edit`);
        break;
      case 'token':
        router.push(`/admin/tokens/${id}/edit`);
        break;
      case 'provider':
        router.push(`/admin/providers/${id}/edit`);
        break;
      case 'model':
        router.push(`/admin/models/${id}/edit`);
        break;
      case 'parameter':
        router.push(`/admin/parameters/${id}/edit`);
        break;
      case 'provider-endpoint':
        router.push(`/admin/provider-endpoints/${id}/edit`);
        break;
      case 'adapter':
        router.push(`/admin/adapters/${id}/edit`);
        break;
      default:
        alert(`Edit ${type} with ID: ${id}`);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      setLoading(true);
      const headers = getHeaders();
      
      let endpoint = '';
      switch (type) {
        case 'user':
          endpoint = `/api/users/${id}`;
          break;
        case 'token':
          endpoint = `/api/ai-provider-tokens/${id}`;
          break;
        case 'provider':
          endpoint = `/api/ai-providers/${id}`;
          break;
        case 'model':
          endpoint = `/api/ai-provider-models/${id}`;
          break;
        case 'parameter':
          endpoint = `/api/ai-provider-parameters/${id}`;
          break;
        case 'provider-endpoint':
          endpoint = `/api/provider-endpoints/${id}`;
          break;
        case 'adapter':
          endpoint = `/api/provider-adapters/${id}`;
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        alert(`${type} deleted successfully`);
        // Reload the current data
        loadData();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete ${type}: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Error deleting ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }



  const renderUsers = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Users</h3>
          <div className="text-sm text-gray-500">
            Showing {data.users.length} of {userPagination.total} users
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role.name === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView('user', user._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View user details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit('user', user._id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete('user', user._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {userPagination.page} of {userPagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadUsers(userPagination.page - 1)}
              disabled={!userPagination.hasPrev}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                userPagination.hasPrev
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => loadUsers(userPagination.page + 1)}
              disabled={!userPagination.hasNext}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                userPagination.hasNext
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTokens = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">All Tokens</h3>
            <div className="text-sm text-gray-500">
              Showing {data.tokens.length} of {tokenPagination.total} tokens
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tokens.map((token) => (
                <tr key={token._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{token.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.userId?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      token.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {token.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView('token', token._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View token details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit('token', token._id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit token"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete('token', token._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete token"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {tokenPagination.page} of {tokenPagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadTokens(tokenPagination.page - 1)}
              disabled={!tokenPagination.hasPrev}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                tokenPagination.hasPrev
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => loadTokens(tokenPagination.page + 1)}
              disabled={!tokenPagination.hasNext}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                tokenPagination.hasNext
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">AI Providers</h3>
            <div className="text-sm text-gray-500">
              Showing {data.providers.length} of {providerPagination.total} providers
            </div>
          </div>
          <Link
            href="/admin/providers/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Link>
        </div>



        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.providers.map((provider) => (
                <tr key={provider._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="text-2xl">{provider.icon}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-900">
                          {provider.slug}
                        </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.type === 'image' ? 'bg-purple-100 text-purple-800' :
                      provider.type === 'text' ? 'bg-blue-100 text-blue-800' :
                      provider.type === 'video' ? 'bg-red-100 text-red-800' :
                      provider.type === 'audio' ? 'bg-green-100 text-green-800' :
                      provider.type === 'multimodal' ? 'bg-yellow-100 text-yellow-800' :
                      provider.type === 'code' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.type.charAt(0).toUpperCase() + provider.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {provider.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.path_to_api}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(provider.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView('provider', provider._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View provider details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit('provider', provider._id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit provider"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete('provider', provider._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete provider"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {providerPagination.page} of {providerPagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadProviders(providerPagination.page - 1)}
              disabled={!providerPagination.hasPrev}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                providerPagination.hasPrev
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => loadProviders(providerPagination.page + 1)}
              disabled={!providerPagination.hasNext}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                providerPagination.hasNext
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">AI Models</h3>
            <div className="text-sm text-gray-500">
              Showing {data.models.length} of {modelPagination.total} models
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.models.map((model) => (
                <tr key={model._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={model.description}>
                      {model.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.ai_provider_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(model.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView('model', model._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View model details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit('model', model._id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit model"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete('model', model._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete model"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {modelPagination.page} of {modelPagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadModels(modelPagination.page - 1)}
              disabled={!modelPagination.hasPrev}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                modelPagination.hasPrev
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => loadModels(modelPagination.page + 1)}
              disabled={!modelPagination.hasNext}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                modelPagination.hasNext
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdapters = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Provider Adapters</h3>
            <div className="text-sm text-gray-500">
              Create and manage adapters to map parameters between schemas
            </div>
          </div>
          <Link
            href="/admin/adapters/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Adapter
          </Link>
        </div>
        
        {adaptersLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading adapters...</p>
          </div>
        ) : adapters.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No adapters yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first adapter to map parameters between different schemas.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/adapters/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Adapter
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Endpoint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Parameter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mappings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adapters.map((adapter) => (
                  <tr key={adapter._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{adapter.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adapter.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adapter.providerEndpoint?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adapter.defaultParameter?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adapter.mappings.length} mappings
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(adapter.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleView('adapter', adapter._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View adapter details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit('adapter', adapter._id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit adapter"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete('adapter', adapter._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete adapter"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderParameters = () => {
    // Helper function to flatten structured parameters into individual parameter objects
    const flattenParameters = (param: AiProviderParameter) => {
      const flattened: Array<{
        name: string;
        requestType: string;
        dataType: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }> = [];

      // Add headers
      if (param.paramter.headers && typeof param.paramter.headers === 'object') {
        Object.entries(param.paramter.headers).forEach(([name, config]) => {
          flattened.push({
            name,
            requestType: 'header',
            dataType: config.type,
            required: config.required,
            placeholder: config.placeholder,
            description: config.description,
          });
        });
      }

      // Add body parameters
      if (param.paramter.body && param.paramter.body.type && param.paramter.body.data && typeof param.paramter.body.data === 'object') {
        Object.entries(param.paramter.body.data).forEach(([name, config]) => {
          flattened.push({
            name,
            requestType: `body-${param.paramter.body.type}`,
            dataType: config.type,
            required: config.required,
            placeholder: config.placeholder,
            description: config.description,
          });
        });
      }

      // Add query parameters
      if (param.paramter.query && typeof param.paramter.query === 'object') {
        Object.entries(param.paramter.query).forEach(([name, config]) => {
          flattened.push({
            name,
            requestType: 'query',
            dataType: config.type,
            required: config.required,
            placeholder: config.placeholder,
            description: config.description,
          });
        });
      }

      // Add URL parameters
      if (param.paramter.parameters && typeof param.paramter.parameters === 'object') {
        Object.entries(param.paramter.parameters).forEach(([name, config]) => {
          flattened.push({
            name,
            requestType: 'parameter',
            dataType: config.type,
            required: config.required,
            placeholder: config.placeholder,
            description: config.description,
          });
        });
      }

      return flattened;
    };

    // Group parameters by provider
    const groupedParameters = data.parameters.map(param => {
      const flattenedParams = flattenParameters(param);
      
      // Handle the new Provider Endpoint → AI Provider relationship
      const providerEndpoint = (param as any).provider_endpoint_id;
      const aiProvider = typeof providerEndpoint === 'object' && providerEndpoint !== null && 'ai_provider_id' in providerEndpoint 
        ? (providerEndpoint as any).ai_provider_id 
        : null;
      
      const providerId = typeof aiProvider === 'object' && aiProvider !== null && '_id' in aiProvider 
        ? (aiProvider as any)._id 
        : providerEndpoint;
      
      const providerName = typeof aiProvider === 'object' && aiProvider !== null && 'name' in aiProvider 
        ? (aiProvider as any).name 
        : 'Unknown Provider';
        
      const endpointName = typeof providerEndpoint === 'object' && providerEndpoint !== null && 'name' in providerEndpoint 
        ? (providerEndpoint as any).name 
        : 'Unknown Endpoint';
      
      return {
        parameterId: param._id, // Add the parameter ID for actions
        providerId: providerId,
        providerName: providerName,
        endpointName: endpointName,
        createdAt: param.createdAt,
        parameters: flattenedParams,
        totalParameters: flattenedParams.length
      };
    });

    // Find provider names for display - now using the populated data
    const getProviderName = (providerId: string, groupData?: any) => {
      // First try to get from populated data if available
      if (groupData?.providerName && groupData.providerName !== 'Unknown Provider') {
        return groupData.providerName;
      }
      // Fallback to looking up in providers array
      const provider = data.providers.find(p => p._id === providerId);
      return provider ? provider.name : 'Unknown Provider';
    };

    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
                      <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">AI Provider Parameters</h3>
            <div className="text-sm text-gray-500">
              Showing {groupedParameters.length} provider parameter sets
            </div>
          </div>
          </div>

          <div className="space-y-6">
            {groupedParameters.map((group, groupIndex) => (
              <div key={group.providerId} className="border border-gray-200 rounded-lg">
                {/* Provider Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {group.providerName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Endpoint: {group.endpointName} • {group.totalParameters} parameters
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => handleView('parameter', group.parameterId)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View parameter details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit('parameter', group.parameterId)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit parameters"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete('parameter', group.parameterId)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete parameters"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parameters Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.parameters.map((param, paramIndex) => (
                        <tr key={`${group.providerId}-${paramIndex}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span>{param.name}</span>
                              {param.requestType === 'parameter' && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  URL
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              param.requestType === 'header' ? 'bg-blue-100 text-blue-800' :
                              param.requestType === 'body-json' ? 'bg-green-100 text-green-800' :
                              param.requestType === 'body-form' ? 'bg-emerald-100 text-emerald-800' :
                              param.requestType === 'body-x-www-form-urlencoded' ? 'bg-teal-100 text-teal-800' :
                              param.requestType === 'parameter' ? 'bg-purple-100 text-purple-800' :
                              param.requestType === 'query' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {param.requestType === 'body-json' ? 'Body (JSON)' :
                               param.requestType === 'body-form' ? 'Body (Form)' :
                               param.requestType === 'body-x-www-form-urlencoded' ? 'Body (URL Encoded)' :
                               param.requestType === 'parameter' ? 'URL Parameter' :
                               param.requestType.charAt(0).toUpperCase() + param.requestType.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {param.dataType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              param.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {param.required ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="max-w-xs">
                              <p className="truncate">{param.description || 'No description'}</p>
                              {param.placeholder && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Placeholder: {param.placeholder}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Body Type Indicator for this provider */}
                {(() => {
                  const bodyParameters = group.parameters.filter(param => 
                    param.requestType.startsWith('body-')
                  );
                  if (bodyParameters.length > 0) {
                    const bodyType = bodyParameters[0].requestType;
                    const bodyTypeName = bodyType === 'body-json' ? 'JSON' :
                                       bodyType === 'body-form' ? 'Form Data' :
                                       bodyType === 'body-x-www-form-urlencoded' ? 'URL Encoded' : 'Unknown';
                    
                    return (
                      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <div className="ml-2">
                            <p className="text-xs font-medium text-blue-800">
                              Body Type: {bodyTypeName} ({bodyParameters.length} parameter{bodyParameters.length > 1 ? 's' : ''})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'users', name: 'Users', icon: Users, count: userPagination.total },
    { id: 'tokens', name: 'Tokens', icon: Key, count: tokenPagination.total },
    { id: 'ai-providers', name: 'AI Providers', icon: Server, count: providerPagination.total },
    { id: 'provider-endpoints', name: 'Provider Endpoints', icon: Database, count: providerEndpointsPagination.total },
    { id: 'models', name: 'Models', icon: Database, count: modelPagination.total },
    { id: 'parameters', name: 'Parameters', icon: Settings, count: parameterPagination.total },
    { id: 'defaults', name: 'Defaults', icon: Database, count: globalDefaultParametersPagination.total }, // Global Defaults
            { id: 'adapters', name: 'Adapters', icon: LinkIcon, count: adaptersPagination.total }, // Adapters
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your AI platform</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'tokens' && renderTokens()}
          {activeTab === 'ai-providers' && <AiProvidersTab />}
          {activeTab === 'provider-endpoints' && <ProviderEndpointsTab />}
          {activeTab === 'models' && <ModelsTab />}
          {activeTab === 'defaults' && <GlobalDefaultParametersTab />}
          {activeTab === 'parameters' && renderParameters()}
          {activeTab === 'adapters' && renderAdapters()}
        </div>
      </div>
    </div>
  );
} 