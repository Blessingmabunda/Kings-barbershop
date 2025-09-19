import React, { useState } from 'react';
import { Eye, EyeOff, Scissors, Lock, User, Mail } from 'lucide-react';
import Button from '../components/Button';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      if (onLogin) {
        onLogin();
      }
    }, 1500);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gray-700" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 backdrop-blur-sm animate-fadeIn">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl shadow-lg mb-4 animate-pulse">
              <Scissors className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Kings Barbershop</h1>
            <p className="text-gray-400">Welcome back! Please sign in to continue.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">Remember me</span>
              </label>
              <a href="#" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors duration-200">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border border-blue-700">
            <h3 className="text-sm font-medium text-blue-300 mb-2">Demo Credentials</h3>
            <div className="text-xs text-blue-200 space-y-1">
              <div><strong>Email:</strong> admin@kingsbarbershop.com</div>
              <div><strong>Password:</strong> admin123</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200">
                Contact administrator
              </a>
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500 rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    </div>
  );
};

export default Login;