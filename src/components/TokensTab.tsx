'use client';

import { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';

interface Token {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

export default function TokensTab() {
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
    fetchTokens();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Token copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      setError('Token name is required');
      return;
    }

    try {
      const response = await fetch('/api/ai-provider-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: tokenName }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCreatedToken(result.data.token);
          setTokenName('');
          setShowCreateToken(false);
          fetchTokens();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create token');
      }
    } catch (error) {
      setError('Failed to create token');
    }
  };

  const revokeToken = async (tokenId: string) => {
    setRevokingTokenId(tokenId);
    try {
      const response = await fetch(`/api/ai-provider-tokens/${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (response.ok) {
        fetchTokens();
      } else {
        setError('Failed to revoke token');
      }
    } catch (error) {
      setError('Failed to revoke token');
    } finally {
      setRevokingTokenId(null);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/ai-provider-tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTokens();
      } else {
        setError('Failed to delete token');
      }
    } catch (error) {
      setError('Failed to delete token');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Tokens</h1>
          <p className="text-gray-600 mt-1">Manage your API tokens for accessing the HiveRouter API</p>
        </div>
        <button
          onClick={() => setShowCreateToken(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Token</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {copySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-800">{copySuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Create Token Modal */}
      {showCreateToken && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Token</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Name
              </label>
              <input
                type="text"
                style={{'color': 'black'}}

                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Enter token name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateToken}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Token
              </button>
              <button
                onClick={() => setShowCreateToken(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Created Token Display */}
      {createdToken && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Token Created Successfully!</h3>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600 mb-3">Copy your token and keep it secure:</p>
            
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
                  {createdToken}
                </code>
              </div>
              
              <div className="flex items-center space-x-2 mt-3 text-xs text-gray-400">
                <AlertTriangle className="w-3 h-3" />
                <span>This token will only be shown once. Make sure to copy it now.</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCreatedToken(null)}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Tokens List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tokens</h3>
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tokens created yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first token to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{token.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          token.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {token.status === 'active' ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {token.createdAt}</span>
                        </div>
                        {token.lastUsed && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Last used: {token.lastUsed}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {token.status === 'active' ? (
                        <button
                          onClick={() => revokeToken(token.id)}
                          disabled={revokingTokenId === token.id}
                          className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                        >
                          {revokingTokenId === token.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteToken(token.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 