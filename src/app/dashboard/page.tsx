'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  Globe,
  Shield,
  BarChart3,
  Key,
  Settings,
  Rocket,
  Terminal
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import QuickStartTab from '@/components/QuickStartTab';
import TokensTab from '@/components/TokensTab';
import SettingsTab from '@/components/SettingsTab';
import ApiPlaygroundTab from '@/components/ApiPlaygroundTab';


interface Token {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed?: string;
}

interface ModelProvider {
  _id: string;
  name: string;
  description: string;
  icon: string;
  path_to_api: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'quickstart' | 'playground' | 'tokens' | 'settings'>('overview');

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/ai-provider-tokens');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTokens(result.data.items.map((token: any) => ({
            id: token._id,
            name: token.name,
            token: `hr.${token._id.substring(0, 8)}...`,
            createdAt: new Date(token.createdAt).toISOString().split('T')[0],
            lastUsed: token.lastUsed ? new Date(token.lastUsed).toISOString().split('T')[0] : undefined
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Check if result.data is an array or has an items property
          const providersData = Array.isArray(result.data) ? result.data : (result.data?.items || []);
          setProviders(providersData.map((provider: any) => ({
            _id: provider._id,
            name: provider.name,
            description: provider.description,
            icon: provider.icon,
            path_to_api: provider.path_to_api,
            isActive: provider.isActive,
            createdAt: new Date(provider.createdAt).toISOString().split('T')[0],
            updatedAt: new Date(provider.updatedAt).toISOString().split('T')[0]
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchProviders();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'text-gray-700 bg-purple-50 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveTab('quickstart')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'quickstart'
                    ? 'text-gray-700 bg-purple-50 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Rocket className="w-5 h-5" />
                <span>Quick Start</span>
              </button>
              
              <button
                onClick={() => setActiveTab('playground')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'playground'
                    ? 'text-gray-700 bg-purple-50 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Terminal className="w-5 h-5" />
                <span>API Playground</span>
              </button>
              
              <button
                onClick={() => setActiveTab('tokens')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'tokens'
                    ? 'text-gray-700 bg-purple-50 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Key className="w-5 h-5" />
                <span>API Tokens</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'settings'
                    ? 'text-gray-700 bg-purple-50 border border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Welcome Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to your Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Manage your API tokens, view model providers, and monitor your usage.
                  </p>
                </div>

                {/* Model Providers */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Model Providers</h2>
                    <Link 
                      href="/dashboard/providers"
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>View all</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers && providers.length > 0 ? (
                      providers.map((provider) => (
                        <div key={provider._id} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg">
                              {provider.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{provider.name}</h3>
                              <p className="text-sm text-gray-600">{provider.description}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              provider.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <Globe className="w-12 h-12 mx-auto" />
                        </div>
                        <p className="text-gray-500">No providers available</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'quickstart' && <QuickStartTab onNavigateToTokens={() => setActiveTab('tokens')} />}
            {activeTab === 'playground' && <ApiPlaygroundTab onNavigateToTokens={() => setActiveTab('tokens')} />}
            {activeTab === 'tokens' && <TokensTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
} 