'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Shield } from 'lucide-react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: {
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
}

export default function UserEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
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
      loadUser();
      loadRoles();
    }
  }, [status, session, params.id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to load user');
      }

      const data = await response.json();
      setUser(data.data);
      setFormData({
        name: data.data.name,
        email: data.data.email,
        roleId: data.data.role._id,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.data?.items || []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('User updated successfully');
        router.push(`/admin/users/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
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
              href={`/admin/users/${user._id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information</p>
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
                    <User className="h-4 w-4" />
                    <span>Name</span>
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter user name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter user email"
                />
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Role</span>
                  </div>
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <Link
                  href={`/admin/users/${user._id}`}
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