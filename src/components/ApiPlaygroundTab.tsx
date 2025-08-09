'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Zap,
  Globe,
  Shield,
  Database,
  AlertCircle,
  Info,
  Key,
  ChevronRight,
  Send,
  Code,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Terminal
} from 'lucide-react';

interface GlobalDefaultParameter {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  parameters: {
    headers: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
    body: {
      type: string | null;
      data: Record<string, {
        type: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }>;
    };
    query: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
    parameters: Record<string, {
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface Token {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed?: string;
}

interface ApiPlaygroundTabProps {
  onNavigateToTokens?: () => void;
}

export default function ApiPlaygroundTab({ onNavigateToTokens }: ApiPlaygroundTabProps) {
  const [activeParameter, setActiveParameter] = useState<GlobalDefaultParameter | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'python' | 'nodejs'>('curl');
  
  // Playground state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [requestBody, setRequestBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveParameter();
    fetchProviders();
    fetchTokens();
  }, []);

  const fetchActiveParameter = async () => {
    try {
      const response = await fetch('/api/global-default-parameters/public?isActive=true&limit=1');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.items && result.data.items.length > 0) {
          setActiveParameter(result.data.items[0]);
          // Set default request body
          console.log('result.data.items[0] :: ',result.data.items[0]);
          
          setRequestBody(generateDefaultRequestBody(result.data.items[0]));
        }
      }
    } catch (error) {
      console.error('Error fetching active parameter:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/ai-providers');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const providersData = Array.isArray(result.data) ? result.data : (result.data?.items || []);
          setProviders(providersData);
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/ai-provider-tokens');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const tokensData = result.data.items.map((token: any) => ({
            id: token._id,
            name: token.name,
            token: token.token,
            createdAt: new Date(token.createdAt).toISOString().split('T')[0],
            lastUsed: token.lastUsed ? new Date(token.lastUsed).toISOString().split('T')[0] : undefined
          }));
          setTokens(tokensData);
        }
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const generateDefaultRequestBody = (parameter: GlobalDefaultParameter) => {
    const baseBody: any = {
      provider: "openai",
      provider_function: "reponses",
      model: "gpt-4.1"
    };

    if (parameter?.parameters.body.data) {
      Object.entries(parameter.parameters.body.data).forEach(([key, config]) => {
        if (key === 'messages') {
          baseBody[key] = [
            {
              role: "user",
              content: "hello"
            }
          ];
        } else {
          baseBody[key] = config.placeholder || getDefaultPlaceholder(config.type);
        }
      });
    }

    return JSON.stringify(baseBody, null, 2);
  };

  const getDefaultPlaceholder = (type: string) => {
    switch (type) {
      case 'string': return 'your_text_here';
      case 'number': return 123;
      case 'boolean': return true;
      case 'json': return {"key": "value"};
      case 'array': return ["item1", "item2"];
      case 'object': return {"property": "value"};
      default: return 'value';
    }
  };



  const handleSubmit = async () => {
    if (!apiKey?.trim()) {
      setError('API key is required');
      return;
    }

    if (!requestBody?.trim()) {
      setError('Request body is required');
      return;
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (error) {
      setError('Invalid JSON in request body');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch('/api/v1/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(parsedBody)
      });

      const data = await response.json();

      if (response.ok) {
        setResponse(data);
      } else {
        setError(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode('response');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCurrentCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    
    switch (activeLanguage) {
      case 'curl':
        return `curl -X POST "${baseUrl}/api/v1/ai" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '${requestBody}'`;
      case 'python':
        return `import requests

API_URL = "${baseUrl}/api/v1/ai"
API_KEY = "${apiKey || 'YOUR_API_KEY'}"

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

payload = ${requestBody}

response = requests.post(API_URL, headers=headers, json=payload)
print(response.status_code)
print(response.json())`;
      case 'nodejs':
        return `const axios = require('axios');

const API_URL = "${baseUrl}/api/v1/ai";
const API_KEY = "${apiKey || 'YOUR_API_KEY'}";

const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
};

const payload = ${requestBody};

async function callAPI() {
    try {
        const response = await axios.post(API_URL, payload, { headers });
        console.log(response.status);
        console.log(response.data);
    } catch (error) {
        console.error(error.response?.status, error.response?.data);
    }
}

callAPI();`;
      default:
        return '';
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'curl':
        return 'text-emerald-300';
      case 'python':
        return 'text-cyan-300';
      case 'nodejs':
        return 'text-amber-300';
      default:
        return 'text-emerald-300';
    }
  };

  const renderCodeLine = (line: string, language: string, lineIndex: number) => {
    if (language === 'curl') {
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      if (currentLine.includes('curl')) {
        const curlIndex = currentLine.indexOf('curl');
        if (curlIndex > 0) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(0, curlIndex)}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-purple-400 font-semibold">curl</span>);
        currentLine = currentLine.substring(curlIndex + 4);
      }
      
      const flagMatch = currentLine.match(/(-[A-Z])/);
      if (flagMatch) {
        const beforeFlag = currentLine.substring(0, flagMatch.index!);
        if (beforeFlag) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{beforeFlag}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-cyan-400">{flagMatch[0]}</span>);
        currentLine = currentLine.substring(flagMatch.index! + flagMatch[0].length);
      }
      
      if (currentLine) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine}</span>);
      }
      
      return parts.length > 0 ? parts : [<span key={`${lineIndex}-0`}>{line}</span>];
    } else if (language === 'python') {
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      const keywords = ['import', 'from', 'def', 'async', 'await', 'if', 'else', 'elif', 'try', 'except', 'finally', 'with', 'as', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'];
      let lastIndex = 0;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = [...currentLine.matchAll(regex)];
        if (matches.length > 0) {
          matches.forEach((match) => {
            if (match.index! > lastIndex) {
              parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex, match.index)}</span>);
            }
            parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-purple-400 font-semibold">{keyword}</span>);
            lastIndex = match.index! + keyword.length;
          });
        }
      });
      
      if (lastIndex < currentLine.length) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex)}</span>);
      }
      
      const commentIndex = currentLine.indexOf('#');
      if (commentIndex !== -1) {
        parts.length = 0;
        partIndex = 0;
        
        if (commentIndex > 0) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(0, commentIndex)}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-gray-500 italic">{currentLine.substring(commentIndex)}</span>);
      } else if (parts.length === 0) {
        parts.push(<span key={`${lineIndex}-0`}>{line}</span>);
      }
      
      return parts;
    } else if (language === 'nodejs') {
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'if', 'else', 'try', 'catch', 'finally', 'return', 'console'];
      let lastIndex = 0;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = [...currentLine.matchAll(regex)];
        if (matches.length > 0) {
          matches.forEach((match) => {
            if (match.index! > lastIndex) {
              parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex, match.index)}</span>);
            }
            parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-purple-400 font-semibold">{keyword}</span>);
            lastIndex = match.index! + keyword.length;
          });
        }
      });
      
      if (lastIndex < currentLine.length) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex)}</span>);
      }
      
      const commentIndex = currentLine.indexOf('//');
      if (commentIndex !== -1) {
        parts.length = 0;
        partIndex = 0;
        
        if (commentIndex > 0) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(0, commentIndex)}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-gray-500 italic">{currentLine.substring(commentIndex)}</span>);
      } else if (parts.length === 0) {
        parts.push(<span key={`${lineIndex}-0`}>{line}</span>);
      }
      
      return parts;
    }
    
    return [<span key={`${lineIndex}-0`}>{line}</span>];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Introduction Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">API Playground</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Test Your API</h3>
              <p className="text-sm text-gray-600">Send requests to the /api/v1/ai endpoint</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Real-time Results</h3>
              <p className="text-sm text-gray-600">See responses and errors instantly</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Database className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Code Generation</h3>
              <p className="text-sm text-gray-600">Get code snippets for your requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-2">How to use the playground</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Enter your API key, modify the JSON request body, and click "Send Request" to test the API. 
            You can also generate code snippets in different languages for your requests.
          </p>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
        
        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Enter your API key to test the playground. You can create API keys in the Tokens section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Body Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Body</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON Payload
            </label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="Enter your JSON request body"
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !apiKey?.trim() || !requestBody?.trim()}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Sending...' : 'Send Request'}</span>
            </button>
            
            <button
              onClick={() => setRequestBody(generateDefaultRequestBody(activeParameter!))}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Section */}
      {(response || error) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Error</span>
              </div>
              <p className="text-red-800 mt-2">{error}</p>
            </div>
          )}
          
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Response Data</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 text-sm"
                >
                  {copiedCode === 'response' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedCode === 'response' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Generation Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Code</h3>
        
        {/* Language Tabs */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveLanguage('curl')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeLanguage === 'curl'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveLanguage('python')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeLanguage === 'python'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLanguage('nodejs')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeLanguage === 'nodejs'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Node.js
            </button>
          </div>
          
          <button
            onClick={() => copyToClipboard(getCurrentCode())}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 text-sm"
          >
            {copiedCode === activeLanguage ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedCode === activeLanguage ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        
        {/* Code Display */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl">
            {/* Code Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                <div className="ml-4 text-sm text-gray-300 font-medium">
                  {activeLanguage === 'curl' ? 'Terminal' : activeLanguage === 'python' ? 'Python' : 'JavaScript'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              </div>
            </div>
            
            {/* Code Content */}
            <div className="p-8">
              <div className="relative">
                {/* Line Numbers */}
                <div className="absolute left-0 top-0 bottom-0 w-12 text-right pr-4 text-xs text-gray-500 font-mono select-none">
                  {getCurrentCode().split('\n').map((_, index) => (
                    <div key={index} className="leading-7">{index + 1}</div>
                  ))}
                </div>
                
                {/* Code */}
                <div className={`overflow-x-auto text-sm leading-7 pl-16 ${getLanguageColor(activeLanguage)}`}>
                  <div className="font-mono">
                    {getCurrentCode().split('\n').map((line, index) => (
                      <div key={index} className="whitespace-pre">
                        {renderCodeLine(line, activeLanguage, index)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Playground Tips</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Make sure your API key is valid and has the necessary permissions</li>
              <li>• The request body must be valid JSON format</li>
              <li>• Include required fields like <code className="bg-yellow-100 px-1 rounded">provider</code> and <code className="bg-yellow-100 px-1 rounded">provider_function</code></li>
              <li>• Use the "Reset to Default" button to get a sample request</li>
              <li>• Copy the generated code to use in your applications</li>
              <li>• Check the response for success/error status and data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 