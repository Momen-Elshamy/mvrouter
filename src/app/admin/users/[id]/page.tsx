'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, User, Mail, Calendar, Shield, Hash } from 'lucide-react';
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

export default function UserViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        alert('User deleted successfully');
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                <p className="text-gray-600">View and manage user information</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/users/${user._id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-lg text-gray-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role.name === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role.name}
                        </span>
                        <span className="text-sm text-gray-500">({user.role.description})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-lg text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-lg text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString()} at {new Date(user.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">User ID</p>
                      <p className="text-sm text-gray-900 font-mono">{user._id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 