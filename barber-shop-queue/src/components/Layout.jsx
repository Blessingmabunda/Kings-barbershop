import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Clock, 
  BarChart3, 
  Settings, 
  Scissors,
  Bell,
  User,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star
} from 'lucide-react';

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, id: 'dashboard' },
    { name: 'Queue Management', href: '/queue', icon: Clock, id: 'queue' },
    { name: 'Customer Management', href: '/customers', icon: Users, id: 'customers' },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, id: 'reports' },
    { name: 'Settings', href: '/settings', icon: Settings, id: 'settings' },
  ];

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const currentNav = navigation.find(nav => nav.href === currentPath);
    return currentNav ? currentNav.id : 'dashboard';
  };

  const currentPage = getCurrentPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-black bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-gray-900 to-black transform transition ease-in-out duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-8">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-lg">
                <Scissors className="h-8 w-8 text-black" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">Kings Barbershop</span>
            </div>
            <nav className="mt-5 px-2 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                        : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`mr-4 h-6 w-6 transition-all duration-300 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* Business Info Section */}
            <div className="mt-8 px-4 space-y-4">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Business Info
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-3 h-3 mr-2 text-yellow-400" />
                    123 Main Street, Downtown
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Phone className="w-3 h-3 mr-2 text-yellow-400" />
                    (555) 123-4567
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Mail className="w-3 h-3 mr-2 text-yellow-400" />
                    info@kingsbarbershop.com
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-4 border border-green-600">
                <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Today's Hours
                </h3>
                <div className="text-xs text-green-300">
                  <div className="flex justify-between">
                    <span>Open:</span>
                    <span className="font-medium">9:00 AM - 8:00 PM</span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 font-medium">Currently Open</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            <div className="mt-6 px-4">
              <button 
                onClick={onLogout}
                className="w-full flex items-center px-4 py-3 text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-xl transition-all duration-300 transform hover:scale-105 border border-red-600 hover:border-red-500"
              >
                <LogOut className="mr-4 h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-gray-900 to-black border-r border-gray-700 shadow-2xl">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-lg">
                <Scissors className="h-8 w-8 text-black" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">Kings Barbershop</span>
            </div>
            <nav className="mt-5 px-2 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg'
                        : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                  >
                    <Icon className={`mr-3 h-6 w-6 transition-all duration-300 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* Business Info Section */}
            <div className="mt-6 px-2 space-y-3">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-3 border border-gray-600">
                <h3 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Business Info
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-3 h-3 mr-2 text-yellow-400 flex-shrink-0" />
                    <span className="truncate">123 Main Street, Downtown</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Phone className="w-3 h-3 mr-2 text-yellow-400 flex-shrink-0" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Mail className="w-3 h-3 mr-2 text-yellow-400 flex-shrink-0" />
                    <span className="truncate">info@kingsbarbershop.com</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-xl p-3 border border-green-600">
                <h3 className="text-xs font-semibold text-green-400 mb-2 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Today's Hours
                </h3>
                <div className="text-xs text-green-300">
                  <div className="flex justify-between">
                    <span>Open:</span>
                    <span className="font-medium">9:00 AM - 8:00 PM</span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 font-medium">Currently Open</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-xl p-3 border border-blue-600">
                <h3 className="text-xs font-semibold text-blue-400 mb-2 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Quick Stats
                </h3>
                <div className="text-xs text-blue-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Today's Queue:</span>
                    <span className="font-medium text-blue-400">8 customers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Wait:</span>
                    <span className="font-medium text-blue-400">15 mins</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            <div className="mt-4 px-2 pb-4">
              <button 
                onClick={onLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-xl transition-all duration-300 transform hover:scale-105 border border-red-600 hover:border-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gradient-to-r from-gray-900 to-black">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 transition-all duration-300"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Top header */}
        <header className="bg-gradient-to-r from-gray-900 to-black shadow-2xl border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {navigation.find(item => item.id === currentPage)?.name || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-6">
                <button className="p-3 text-gray-300 hover:text-white relative transition-all duration-300 hover:bg-white hover:bg-opacity-10 rounded-xl">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-gradient-to-r from-red-400 to-red-600 ring-2 ring-black animate-pulse"></span>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-black" />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-white">John Doe</div>
                    <div className="text-xs text-gray-400">Manager</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fadeIn">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;