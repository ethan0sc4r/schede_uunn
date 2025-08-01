import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Ship, 
  Users, 
  Search, 
  LogOut, 
  User,
  Shield,
  Menu,
  X,
  Palette,
  Brain,
  Briefcase
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Naval Units', href: '/units', icon: Ship },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Templates', href: '/templates', icon: Palette },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Search', href: '/search', icon: Search },
  ];

  if (isAdmin) {
    navigationItems.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Naval Units
          </h1>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          {/* Quiz Section */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="px-4 pb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quiz & Training
              </h3>
            </div>
            <div className="space-y-2">
              <a
                href="/quiz"
                className="group flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
              >
                <Brain className="mr-3 h-5 w-5" />
                Quiz Navali
              </a>
            </div>
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </button>
          {user?.is_admin && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center px-8">
          <div className="flex-1">
            {/* Page title will be handled by individual pages */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;