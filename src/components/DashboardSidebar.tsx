'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Key, 
  Settings, 
  Zap,
  LogOut,
  User
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface DashboardSidebarProps {
  className?: string;
}

export default function DashboardSidebar({ className = '' }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      current: pathname === '/dashboard'
    },
    {
      name: 'API Tokens',
      href: '/dashboard/tokens',
      icon: Key,
      current: pathname === '/dashboard/tokens'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname === '/dashboard/settings'
    }
  ];

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-gray-200">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">HiveRouter</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                item.current
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${
                item.current ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
              }`} />
              <span className={`font-medium ${
                item.current ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
} 