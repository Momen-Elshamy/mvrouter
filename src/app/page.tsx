'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe, Users, BarChart3 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">HiveRouter</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/auth/signin"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link 
            href="/admin/login"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              The Ultimate
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> AI Router</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Route your AI requests intelligently across multiple providers. 
              Get the best performance, cost, and reliability for your AI applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/signup"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Routing</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/auth/signin"
                className="border border-gray-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose HiveRouter?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Intelligent routing that adapts to your needs and optimizes for performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Routing</h3>
              <p className="text-gray-300">
                Automatically route requests to the best AI provider based on performance, cost, and availability.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise Security</h3>
              <p className="text-gray-300">
                Bank-level security with end-to-end encryption and comprehensive audit trails.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analytics & Insights</h3>
              <p className="text-gray-300">
                Detailed analytics and insights to optimize your AI usage and costs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Supported Providers
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Connect to all major AI providers through a single API
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'OpenAI', color: 'from-green-500 to-emerald-500' },
              { name: 'Anthropic', color: 'from-orange-500 to-red-500' },
              { name: 'Google', color: 'from-blue-500 to-cyan-500' },
              { name: 'Cohere', color: 'from-purple-500 to-pink-500' },
            ].map((provider) => (
              <div key={provider.name} className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${provider.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Routing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers who trust HiveRouter for their AI infrastructure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/auth/signin"
              className="border border-gray-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">HiveRouter</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
