'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface AiProvider {
  _id: string;
  name: string;
  provider: string;
  version: string;
  slug: string;
}

export default function CreateModel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([]);
  const [fetchingProviders, setFetchingProviders] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    model_id: '',
    ai_provider_id: '',
    description: '',
    isActive: true,
    slug: '',
  });

  // Fetch AI Providers for dropdown
  useEffect(() => {
    const fetchAiProviders = async () => {
      try {
        setFetchingProviders(true);
        const response = await fetch('/api/ai-providers?limit=100');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAiProviders(data.data.items || data.data);
          } else {
            setError('Failed to fetch AI providers');
          }
        } else {
          setError('Failed to fetch AI providers');
        }
      } catch (error) {
        console.error('Error fetching AI providers:', error);
        setError('Failed to fetch AI providers');
      } finally {
        setFetchingProviders(false);
      }
    };

    fetchAiProviders();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Update slug when name changes
  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setFormData({ ...formData, name, slug });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-provider-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('AI Model created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(`Failed to create AI model: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      setError(`Error creating AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
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
          <h1 className="text-3xl font-bold text-slate-900">Create AI Model</h1>
          <p className="text-slate-600 mt-2">Configure a new AI model and associate it with an AI provider</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">AI Provider *</label>
                <select
                  name="ai_provider_id"
                  value={formData.ai_provider_id}
                  onChange={handleChange}
                  required
                  disabled={fetchingProviders}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">
                    {fetchingProviders ? 'Loading providers...' : 'Select AI Provider'}
                  </option>
                  {aiProviders.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} ({provider.provider} {provider.version})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Choose which AI provider this model belongs to</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Model Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., GPT-4, Claude-3, Gemini Pro"
                />
                <p className="mt-1 text-xs text-slate-500">A descriptive name for this AI model</p>
              </div>

              {/* Model ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Model ID *</label>
                <input
                  type="text"
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., gpt-4, claude-3-sonnet, gemini-pro"
                />
                <p className="mt-1 text-xs text-slate-500">The unique identifier for this model in the provider's API</p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                  placeholder="e.g., gpt-4, claude-3-sonnet, gemini-pro"
                />
                <p className="mt-1 text-xs text-slate-500">URL-friendly identifier (auto-generated from name)</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-400 rounded bg-white"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active Model
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-500"
                placeholder="Describe this AI model, its capabilities, use cases, and features..."
              />
              <p className="mt-1 text-xs text-slate-500">A detailed description of this AI model and its capabilities</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || fetchingProviders}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2 font-medium"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create AI Model'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 