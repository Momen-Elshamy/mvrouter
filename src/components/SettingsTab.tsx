'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, 
  Key, 
  Shield, 
  Mail,
  Save,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

// Custom session type with createdAt
interface CustomSession {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export default function SettingsTab() {
  const { data: session } = useSession();
  const customSession = session as CustomSession | null;
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: customSession?.user?.name || '',
    email: customSession?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = async () => {
    // Mock API call - replace with real implementation
    console.log('Saving settings:', formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-800">Settings saved successfully!</span>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
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
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Account Type</p>
                <p className="text-sm text-gray-500">Standard User</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Member Since</p>
                <p className="text-sm text-gray-500">
                  {customSession?.user?.createdAt ? new Date(customSession.user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Login</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 