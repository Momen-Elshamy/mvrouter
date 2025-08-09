'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  Settings,
  Database,
  Zap
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

export default function ViewGlobalDefaultParameter({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [parameter, setParameter] = useState<GlobalDefaultParameter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParameter = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/global-default-parameters/${resolvedParams.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setParameter(data.data);
        } else {
          setError('Failed to fetch global default parameter');
        }
      } catch (error) {
        console.error('Error fetching global default parameter:', error);
        setError('Failed to fetch global default parameter');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchParameter();
    }
  }, [resolvedParams.id, session]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this global default parameter?')) {
      return;
    }

    try {
      const response = await fetch(`/api/global-default-parameters/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete global default parameter');
      }
    } catch (error) {
      console.error('Error deleting global default parameter:', error);
      setError('Failed to delete global default parameter');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/admin/login');
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!parameter) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Not Found</h3>
                <p className="text-sm text-yellow-700 mt-1">Global default parameter not found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderParameterSection = (title: string, parameters: Record<string, any>, icon: any) => {
    const paramEntries = Object.entries(parameters || {});
    
    if (paramEntries.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            {icon}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="text-slate-500 text-sm italic">No {title.toLowerCase()} configured</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          {icon}
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="space-y-4">
          {paramEntries.map(([name, param]: [string, any]) => (
            <div key={name} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <p className="text-sm text-slate-900 font-medium">{name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {param.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    param.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {param.required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <p className="text-sm text-slate-600">{param.description || 'No description'}</p>
                </div>
                {param.placeholder && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
                    <p className="text-sm text-slate-600">{param.placeholder}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{parameter.name}</h1>
              <p className="text-slate-600 mt-2">{parameter.description}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/global-default-parameters/${resolvedParams.id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  parameter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {parameter.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Request Type</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRequestTypeColor(parameter.requestType)}`}>
                  {parameter.requestType.charAt(0).toUpperCase() + parameter.requestType.slice(1)}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <p className="text-slate-900">{parameter.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Created</label>
                <p className="text-slate-900">{new Date(parameter.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Updated</label>
                <p className="text-slate-900">{new Date(parameter.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Parameters</h2>
            
            {renderParameterSection('Headers', parameter.parameters.headers, <Settings className="w-5 h-5 text-slate-600" />)}
            
            {parameter.parameters.body && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Database className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Body Parameters</h3>
                </div>
                
                {parameter.parameters.body.type && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Body Type</label>
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                      {parameter.parameters.body.type}
                    </span>
                  </div>
                )}
                
                {renderParameterSection('Body Data', parameter.parameters.body.data, <Zap className="w-5 h-5 text-slate-600" />)}
              </div>
            )}
            
            {renderParameterSection('Query Parameters', parameter.parameters.query, <Eye className="w-5 h-5 text-slate-600" />)}
            {renderParameterSection('URL Parameters', parameter.parameters.parameters, <Database className="w-5 h-5 text-slate-600" />)}
          </div>
        </div>
      </div>
    </div>
  );
} 