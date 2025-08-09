'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Key,
  Zap,
  BarChart3,
  Settings
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';


interface Token {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

export default function Tokens() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [tokenName, setTokenName] = useState('');

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/ai-provider-tokens');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTokens(result.data.items.map((token: any) => ({
            id: token._id,
            name: token.name,
            createdAt: new Date(token.createdAt).toISOString().split('T')[0],
            lastUsed: token.lastUsed ? new Date(token.lastUsed).toISOString().split('T')[0] : undefined,
            status: token.isActive ? 'active' : 'revoked'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTokens();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tokens...</p>
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Token copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (error) {
      console.error('Failed to copy token:', error);
      setError('Failed to copy token to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateToken = async () => {
    if (!tokenName.trim()) return;
    
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch('/api/ai-provider-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tokenName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (result.code === 'DUPLICATE_KEY_ERROR') {
          setError('A token with this name already exists. Please choose a different name.');
        } else if (result.error) {
          setError(result.error);
        } else if (result.message) {
          setError(result.message);
        } else {
          setError('Failed to create token. Please try again.');
        }
        return;
      }
      
      if (result.success) {
        setCreatedToken(result.data.token);
        setTokenName('');
        setError(null); // Clear any error on success
        
        // Refresh tokens list
        fetchTokens();
      } else {
        setError(result.message || result.error || 'Failed to create token');
      }
    } catch (error) {
      console.error('Error creating token:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (revokingTokenId) return; // Prevent multiple requests
    
    setRevokingTokenId(tokenId);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`/api/ai-provider-tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to revoke token');
        return;
      }
      
      if (result.success) {
        // Update the token status in the UI
        setTokens(prev => prev.map(token => 
          token.id === tokenId 
            ? { ...token, status: 'revoked' as const }
            : token
        ));
      } else {
        setError(result.message || 'Failed to revoke token');
      }
    } catch (error) {
      console.error('Error revoking token:', error);
      setError('Network error. Please try again.');
    } finally {
      setRevokingTokenId(null);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (revokingTokenId) return; // Prevent multiple requests
    
    setRevokingTokenId(tokenId);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`/api/ai-provider-tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to delete token');
        return;
      }
      
      if (result.success) {
        // Remove the token from the UI
        setTokens(prev => prev.filter(token => token.id !== tokenId));
      } else {
        setError(result.message || 'Failed to delete token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      setError('Network error. Please try again.');
    } finally {
      setRevokingTokenId(null);
    }
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
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <Key className="w-5 h-5" />
                <span className="font-medium">API Tokens</span>
              </Link>
              
              <Link 
                href="/dashboard/settings"
                className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">API Tokens</h1>
                <p className="text-gray-600 mt-2">
                  Manage your API tokens for accessing HiveRouter services
                </p>
              </div>
              <button
                onClick={() => setShowCreateToken(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Token</span>
              </button>
            </div>

            {/* Tokens List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading your tokens...</p>
                </div>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Key className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No tokens yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Create your first API token to start integrating with our services</p>
                <button
                  onClick={() => setShowCreateToken(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Create Your First Token
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {tokens.map((token) => (
                  <div key={token.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-purple-200 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                            <Key className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{token.name}</h3>
                            <div className="flex items-center space-x-3">
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                                token.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                  token.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span>{token.status === 'active' ? 'Active' : 'Revoked'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Created {token.createdAt}</span>
                          </div>
                          {token.lastUsed && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>Last used {token.lastUsed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => token.status === 'active' ? revokeToken(token.id) : deleteToken(token.id)}
                        disabled={revokingTokenId === token.id}
                        className={`p-3 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          revokingTokenId === token.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title={token.status === 'active' ? 'Revoke token' : 'Delete token'}
                      >
                        {revokingTokenId === token.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-red-500"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Token Modal */}
      {showCreateToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {createdToken ? 'Token Created Successfully!' : 'Create API Token'}
            </h3>
            
            <div className="space-y-4">
              {/* Error and Success messages inside modal */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}
              
              {copySuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-green-700 text-sm">{copySuccess}</span>
                  </div>
                </div>
              )}
              
              {/* Show created token */}
              {createdToken ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-green-700 font-medium">Token created successfully!</span>
                    </div>
                    <p className="text-green-600 text-sm mb-4">
                      Copy this token now. You won't be able to see it again.
                    </p>
                    
                    {/* New compact token display */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">API Token</span>
                        <button
                          onClick={() => copyToClipboard(createdToken)}
                          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-xs font-medium">Copy</span>
                        </button>
                      </div>
                      
                      <div className="bg-black rounded border border-gray-700 p-3 max-h-32 overflow-y-auto">
                        <code className="text-xs font-mono text-green-400 break-all leading-relaxed block">
                          {createdToken.substring(0, 50)}...
                        </code>
                        <div className="text-xs text-gray-500 mt-2">
                          (Token truncated for display - copy button copies full token)
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3 text-xs text-gray-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>This token will only be shown once. Make sure to copy it now.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateToken(false);
                        setCreatedToken(null);
                        setError(null);
                        setTokenName(''); // Clear token name
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Name
                    </label>
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., Production Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ 
                        color: 'black',
                        backgroundColor: '#ffffff',
                        caretColor: '#000000'
                      }}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateToken}
                      disabled={!tokenName.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                    >
                      Create Token
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateToken(false);
                        setError(null); // Clear error when closing modal
                        setTokenName(''); // Clear token name
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 