'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Key, User, Activity } from 'lucide-react';
import Link from 'next/link';

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
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function TokenEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
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
      loadToken();
      loadUsers();
    }
  }, [status, session, params.id]);

  const loadToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-provider-tokens/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to load token');
      }

      const data = await response.json();
      setToken(data.data);
      setFormData({
        name: data.data.name,
        userId: data.data.userId._id,
        isActive: data.data.isActive,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load token');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.items || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`/api/ai-provider-tokens/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('Token updated successfully');
        router.push(`/admin/tokens/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update token: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          <p className="mt-4 text-gray-600">Loading token details...</p>
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

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Not Found</h2>
          <p className="text-gray-600 mb-4">The token you're looking for doesn't exist.</p>
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
              href={`/admin/tokens/${token._id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Token</h1>
              <p className="text-gray-600">Update token information</p>
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
                    <Key className="h-4 w-4" />
                    <span>Token Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  style={{'color': 'black'}}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter token name"
                />
              </div>

              {/* User Field */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Owner</span>
                  </div>
                </label>
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
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
                  Active tokens can be used for API requests
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <Link
                  href={`/admin/tokens/${token._id}`}
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