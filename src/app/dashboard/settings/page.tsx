'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Key, 
  Shield, 
  Mail,
  Save,
  Eye,
  EyeOff,
  Zap,
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';


export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    // Mock API call - replace with real implementation
    console.log('Saving settings:', formData);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Mock API call - replace with real implementation
    console.log('Changing password');
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">HiveRouter</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              
              <Link 
                href="/dashboard/tokens"
                className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Key className="w-5 h-5" />
                <span>API Tokens</span>
              </Link>
              
              <Link 
                href="/dashboard/settings"
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    style={{
                      color: 'black',
                      backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
                      caretColor: '#000000'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                    style={{
                      color: 'black',
                      backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
                      caretColor: '#000000'
                    }}
                  />
                </div>
                
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{
                        color: 'black',
                        backgroundColor: '#ffffff',
                        caretColor: '#000000'
                      }}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{
                      color: 'black',
                      backgroundColor: '#ffffff',
                      caretColor: '#000000'
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{
                      color: 'black',
                      backgroundColor: '#ffffff',
                      caretColor: '#000000'
                    }}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handlePasswordChange}
                    disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* API Token Management */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Key className="w-6 h-6 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">API Token Management</h2>
                </div>
                <Link 
                  href="/dashboard/tokens"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Manage Tokens
                </Link>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Manage your API tokens for accessing HiveRouter services. Create, view, and revoke tokens as needed.
                </p>
                <Link 
                  href="/dashboard/tokens"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <Key className="w-4 h-4" />
                  <span>Go to Token Management</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 