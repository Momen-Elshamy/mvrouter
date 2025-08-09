'use client';

import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Zap,
  Globe,
  Shield,
  Database,
  AlertCircle,
  Info,
  Key,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

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

interface QuickStartTabProps {
  onNavigateToTokens?: () => void;
}

export default function QuickStartTab({ onNavigateToTokens }: QuickStartTabProps) {
  const [activeParameter, setActiveParameter] = useState<GlobalDefaultParameter | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'python' | 'nodejs'>('curl');

  useEffect(() => {
    fetchActiveParameter();
    fetchProviders();
  }, []);

  const fetchActiveParameter = async () => {
    try {
      const response = await fetch('/api/global-default-parameters/public?isActive=true&limit=1');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.items && result.data.items.length > 0) {
          setActiveParameter(result.data.items[0]);
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



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(activeLanguage);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCurrentCode = () => {
    switch (activeLanguage) {
      case 'curl':
        return generateCurlExample();
      case 'python':
        return generatePythonExample();
      case 'nodejs':
        return generateNodeJSExample();
      default:
        return generateCurlExample();
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
      // Simple curl highlighting
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      // Highlight curl command
      if (currentLine.includes('curl')) {
        const curlIndex = currentLine.indexOf('curl');
        if (curlIndex > 0) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(0, curlIndex)}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-purple-400 font-semibold">curl</span>);
        currentLine = currentLine.substring(curlIndex + 4);
      }
      
      // Highlight flags
      const flagMatch = currentLine.match(/(-[A-Z])/);
      if (flagMatch) {
        const beforeFlag = currentLine.substring(0, flagMatch.index!);
        if (beforeFlag) {
          parts.push(<span key={`${lineIndex}-${partIndex++}`}>{beforeFlag}</span>);
        }
        parts.push(<span key={`${lineIndex}-${partIndex++}`} className="text-cyan-400">{flagMatch[0]}</span>);
        currentLine = currentLine.substring(flagMatch.index! + flagMatch[0].length);
      }
      
      // Add remaining text
      if (currentLine) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine}</span>);
      }
      
      return parts.length > 0 ? parts : [<span key={`${lineIndex}-0`}>{line}</span>];
    } else if (language === 'python') {
      // Simple Python highlighting
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      // Highlight keywords
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
      
      // Add remaining text after keywords
      if (lastIndex < currentLine.length) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex)}</span>);
      }
      
      // Handle comments
      const commentIndex = currentLine.indexOf('#');
      if (commentIndex !== -1) {
        // Clear existing parts and rebuild with comment handling
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
      // Simple JavaScript highlighting
      const parts = [];
      let currentLine = line;
      let partIndex = 0;
      
      // Highlight keywords
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
      
      // Add remaining text after keywords
      if (lastIndex < currentLine.length) {
        parts.push(<span key={`${lineIndex}-${partIndex++}`}>{currentLine.substring(lastIndex)}</span>);
      }
      
      // Handle comments
      const commentIndex = currentLine.indexOf('//');
      if (commentIndex !== -1) {
        // Clear existing parts and rebuild with comment handling
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
    
    // Fallback - no highlighting
    return [<span key={`${lineIndex}-0`}>{line}</span>];
  };

  const generateCurlExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    
    let curlCommand = `curl -X POST "${baseUrl}/api/v1/ai" \\\n`;
    curlCommand += `  -H "Content-Type: application/json" \\\n`;
    curlCommand += `  -H "x-api-key: YOUR_API_KEY" \\\n`;
    curlCommand += `  -d '{\n`;
    
    // Add required provider fields
    curlCommand += `    "provider": "openai",\n`;
    curlCommand += `    "provider_function": "reponses",\n`;
    
    if (activeParameter?.parameters.body.data) {
      const bodyData = Object.entries(activeParameter.parameters.body.data);
      bodyData.forEach(([key, config], index) => {
        const placeholder = config.placeholder || getDefaultPlaceholder(config.type);
        curlCommand += `    "${key}": "${placeholder}"`;
        if (index < bodyData.length - 1) curlCommand += ',';
        curlCommand += '\n';
      });
    }
    
    curlCommand += `  }'`;
    
    return curlCommand;
  };

  const generatePythonExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    
    let pythonCode = `import requests\n\n`;
    pythonCode += `# API Configuration\n`;
    pythonCode += `API_URL = "${baseUrl}/api/v1/ai"\n`;
    pythonCode += `API_KEY = "YOUR_API_KEY"\n\n`;
    pythonCode += `# Request headers\n`;
    pythonCode += `headers = {\n`;
    pythonCode += `    "Content-Type": "application/json",\n`;
    pythonCode += `    "x-api-key": API_KEY\n`;
    pythonCode += `}\n\n`;
    pythonCode += `# Request payload\n`;
    pythonCode += `payload = {\n`;
    
    // Add required provider fields
    pythonCode += `    "provider": "openai",\n`;
    pythonCode += `    "provider_function": "responses",\n`;
    
    if (activeParameter?.parameters.body.data) {
      const bodyData = Object.entries(activeParameter.parameters.body.data);
      bodyData.forEach(([key, config], index) => {
        const placeholder = config.placeholder || getDefaultPlaceholder(config.type);
        pythonCode += `    "${key}": "${placeholder}"`;
        if (index < bodyData.length - 1) pythonCode += ',';
        pythonCode += '\n';
      });
    }
    
    pythonCode += `}\n\n`;
    pythonCode += `# Make the request\n`;
    pythonCode += `response = requests.post(API_URL, headers=headers, json=payload)\n\n`;
    pythonCode += `# Handle response\n`;
    pythonCode += `if response.status_code == 200:\n`;
    pythonCode += `    result = response.json()\n`;
    pythonCode += `    print("Success:", result)\n`;
    pythonCode += `else:\n`;
    pythonCode += `    print("Error:", response.status_code, response.text)\n`;
    
    return pythonCode;
  };

  const generateNodeJSExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    
    let nodeCode = `const axios = require('axios');\n\n`;
    nodeCode += `// API Configuration\n`;
    nodeCode += `const API_URL = "${baseUrl}/api/v1/ai";\n`;
    nodeCode += `const API_KEY = "YOUR_API_KEY";\n\n`;
    nodeCode += `// Request headers\n`;
    nodeCode += `const headers = {\n`;
    nodeCode += `    "Content-Type": "application/json",\n`;
    nodeCode += `    "x-api-key": API_KEY\n`;
    nodeCode += `};\n\n`;
    nodeCode += `// Request payload\n`;
    nodeCode += `const payload = {\n`;
    
    // Add required provider fields
    nodeCode += `    "provider": "openai",\n`;
    nodeCode += `    "provider_function": "reponses",\n`;
    
    if (activeParameter?.parameters.body.data) {
      const bodyData = Object.entries(activeParameter.parameters.body.data);
      bodyData.forEach(([key, config], index) => {
        const placeholder = config.placeholder || getDefaultPlaceholder(config.type);
        nodeCode += `    "${key}": "${placeholder}"`;
        if (index < bodyData.length - 1) nodeCode += ',';
        nodeCode += '\n';
      });
    }
    
    nodeCode += `};\n\n`;
    nodeCode += `// Make the request\n`;
    nodeCode += `async function callAI() {\n`;
    nodeCode += `    try {\n`;
    nodeCode += `        const response = await axios.post(API_URL, payload, { headers });\n`;
    nodeCode += `        console.log("Success:", response.data);\n`;
    nodeCode += `    } catch (error) {\n`;
    nodeCode += `        console.error("Error:", error.response?.status, error.response?.data);\n`;
    nodeCode += `    }\n`;
    nodeCode += `}\n\n`;
    nodeCode += `callAI();\n`;
    
    return nodeCode;
  };

  const getDefaultPlaceholder = (type: string) => {
    switch (type) {
      case 'string': return 'your_text_here';
      case 'number': return '123';
      case 'boolean': return 'true';
      case 'json': return '{"key": "value"}';
      case 'array': return '["item1", "item2"]';
      case 'object': return '{"property": "value"}';
      default: return 'value';
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
    <div className="space-y-8">
      {/* Introduction Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Quick Start Guide</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Unified API</h3>
              <p className="text-sm text-gray-600">One endpoint for all AI providers and models</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Simple Schema</h3>
              <p className="text-sm text-gray-600">Learn one schema, use many providers</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Database className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Easy Integration</h3>
              <p className="text-sm text-gray-600">Quick setup with your existing code</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-900 mb-2">About the /api/v1/ai Endpoint</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            The <code className="bg-gray-100 px-1 rounded">/api/v1/ai</code> endpoint provides a unified interface to access all supported AI providers and models. 
            Instead of learning different APIs for each provider, you only need to understand one schema. 
            This abstraction layer makes it easy to switch between providers or add new ones without changing your application code.
          </p>
        </div>
      </div>

      {/* API Token Hint Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">API Key Required</h3>
            <p className="text-blue-800 text-sm mb-3">
              You'll need an API key to use the examples above. Create your first API key to get started.
            </p>
            <button
              onClick={onNavigateToTokens}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <span>Create API Key</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Code Examples</h3>
        
        {/* Unified Code Example Container */}
        <div className="bg-white rounded-lg shadow-sm border">
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
      </div>

      {/* Schema Information */}
      {activeParameter && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Schema</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Active Parameter Set: {activeParameter.name}</span>
              </div>
              <p className="text-sm text-blue-800">{activeParameter.description}</p>
            </div>

            {/* Headers */}
            {Object.keys(activeParameter.parameters.headers).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Headers</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="font-medium text-gray-700">Name</div>
                    <div className="font-medium text-gray-700">Type</div>
                    <div className="font-medium text-gray-700">Required</div>
                    <div className="font-medium text-gray-700">Description</div>
                    {Object.entries(activeParameter.parameters.headers).map(([key, config], index) => (
                      <React.Fragment key={`header-${key}-${index}`}>
                        <div className="font-mono text-gray-900">{key}</div>
                        <div className="text-gray-600">{config.type}</div>
                        <div className="text-gray-600">{config.required ? 'Yes' : 'No'}</div>
                        <div className="text-gray-600">{config.description || '-'}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Provider Fields */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Provider Configuration</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="font-medium text-gray-700">Name</div>
                  <div className="font-medium text-gray-700">Type</div>
                  <div className="font-medium text-gray-700">Required</div>
                  <div className="font-medium text-gray-700">Description</div>
                  <React.Fragment key="provider-field">
                    <div className="font-mono text-gray-900">provider</div>
                    <div className="text-gray-600">string</div>
                    <div className="text-gray-600">Yes*</div>
                    <div className="text-gray-600">AI provider name (e.g., "openai", "gemini")</div>
                  </React.Fragment>
                  <React.Fragment key="provider-function-field">
                    <div className="font-mono text-gray-900">provider_function</div>
                    <div className="text-gray-600">string</div>
                    <div className="text-gray-600">Yes*</div>
                    <div className="text-gray-600">Function type (e.g., "chat", "responses")</div>
                  </React.Fragment>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  <p>* Not required when <code className="bg-gray-100 px-1 rounded">model</code> is set to "auto" (fields will be ignored)</p>
                </div>
              </div>
            </div>

            {/* Body */}
            {activeParameter.parameters.body.data && Object.keys(activeParameter.parameters.body.data).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Body Parameters</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="font-medium text-gray-700">Name</div>
                    <div className="font-medium text-gray-700">Type</div>
                    <div className="font-medium text-gray-700">Required</div>
                    <div className="font-medium text-gray-700">Description</div>
                    {Object.entries(activeParameter.parameters.body.data).map(([key, config], index) => (
                      <React.Fragment key={`body-${key}-${index}`}>
                        <div className="font-mono text-gray-900">{key}</div>
                        <div className="text-gray-600">{config.type}</div>
                        <div className="text-gray-600">{config.required ? 'Yes' : 'No'}</div>
                        <div className="text-gray-600">{config.description || '-'}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Providers Table */}
      {providers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Providers & Endpoints</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to use this information:</p>
                <ul className="space-y-1">
                  <li>• Use the <strong>Provider Slug</strong> as the value for the <code className="bg-blue-100 px-1 rounded">provider</code> field</li>
                  <li>• Use the <strong>Endpoint Slug</strong> as the value for the <code className="bg-blue-100 px-1 rounded">provider_function</code> field</li>
                  <li>• Choose from the <strong>Available Models</strong> for the <code className="bg-blue-100 px-1 rounded">model</code> field</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider._id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    {provider.icon || '🤖'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Provider Slug */}
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">provider</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <code className="text-sm font-mono text-gray-900">{provider.slug || provider.name?.toLowerCase()}</code>
                    </div>
                  </div>
                  
                  {/* Available Models */}
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">models</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {provider.models && provider.models.length > 0 ? (
                        <div className="space-y-1">
                          {provider.models.map((model: any, index: number) => (
                            <div key={index} className="text-sm">
                              <code className="font-mono text-gray-900">{model.name || model.slug}</code>
                              {model.description && (
                                <span className="text-gray-600 ml-2">- {model.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No models available</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Available Endpoints */}
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">provider functions</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {provider.endpoints && provider.endpoints.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {provider.endpoints.map((endpoint: any, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <code className="text-sm font-mono text-gray-900">{endpoint.slug || endpoint.name}</code>
                            {endpoint.description && (
                              <span className="text-xs text-gray-600">- {endpoint.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No endpoints available</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider Fields Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Provider Configuration</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">Required Fields:</p>
                <ul className="space-y-1 ml-4">
                  <li>• <code className="bg-blue-100 px-1 rounded">provider</code> - Specify the AI provider (e.g., "openai", "gemini")</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">provider_function</code> - Specify the function type (e.g., "chat", "responses")</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Auto Mode:</p>
                <p>If you set <code className="bg-blue-100 px-1 rounded">"model": "auto"</code>, the system will automatically choose the best provider and model for your request.</p>
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
            <h3 className="font-semibold text-yellow-900 mb-2">Pro Tips</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Replace placeholders with your actual data</li>
              <li>• Keep your API token secure and never expose it in client-side code</li>
              <li>• Check the response status code to handle errors properly</li>
              <li>• Use the schema information to understand required and optional parameters</li>
              <li>• The endpoint automatically routes your request to the appropriate AI provider</li>
              <li>• Include <code className="bg-yellow-100 px-1 rounded">provider</code> and <code className="bg-yellow-100 px-1 rounded">provider_function</code> fields (not required when model is "auto")</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 