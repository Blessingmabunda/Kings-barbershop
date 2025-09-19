import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Clock, Palette, Shield, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Settings = () => {
  const [settings, setSettings] = useState({
    businessName: 'Elite Barber Shop',
    businessHours: {
      open: '09:00',
      close: '18:00'
    },
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    queueSettings: {
      maxWaitTime: 30,
      autoAssign: true,
      allowWalkIns: true
    },
    appearance: {
      theme: 'light',
      primaryColor: 'blue'
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <Button onClick={handleSave} className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card title="Business Information" icon={User} className="animate-slideIn" style={{animationDelay: '0.1s'}}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={settings.businessHours.open}
                  onChange={(e) => handleSettingChange('businessHours', 'open', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={settings.businessHours.close}
                  onChange={(e) => handleSettingChange('businessHours', 'close', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card title="Notifications" icon={Bell} className="animate-slideIn" style={{animationDelay: '0.2s'}}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Email Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">SMS Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Push Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Queue Settings */}
        <Card title="Queue Management" icon={Clock} className="animate-slideIn" style={{animationDelay: '0.3s'}}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Maximum Wait Time (minutes)
              </label>
              <input
                type="number"
                value={settings.queueSettings.maxWaitTime}
                onChange={(e) => handleSettingChange('queueSettings', 'maxWaitTime', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Auto-assign to Staff</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.queueSettings.autoAssign}
                  onChange={(e) => handleSettingChange('queueSettings', 'autoAssign', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Allow Walk-ins</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.queueSettings.allowWalkIns}
                  onChange={(e) => handleSettingChange('queueSettings', 'allowWalkIns', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card title="Appearance" icon={Palette} className="animate-slideIn" style={{animationDelay: '0.4s'}}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Theme
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Primary Color
              </label>
              <select
                value={settings.appearance.primaryColor}
                onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Settings */}
      <Card title="Security & Privacy" icon={Shield} className="animate-slideIn" style={{animationDelay: '0.5s'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Password Settings</h3>
            <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black">
              Change Password
            </Button>
            <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black">
              Enable Two-Factor Authentication
            </Button>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Data Management</h3>
            <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black">
              Export Data
            </Button>
            <Button variant="outline" size="sm" className="text-red-400 border-red-500 hover:bg-red-500 hover:text-white">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;