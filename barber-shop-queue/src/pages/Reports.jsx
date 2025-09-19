import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, Filter } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { weeklyStats, dailyStats } from '../data/mockData';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('customers');

  const metrics = [
    { id: 'customers', label: 'Customers Served', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue', icon: BarChart3 },
    { id: 'waitTime', label: 'Average Wait Time', icon: Calendar }
  ];

  const periods = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <Button variant="outline" className="flex items-center gap-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="animate-slideIn">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">Period:</span>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>{period.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Metric:</span>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              {metrics.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="animate-slideIn hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-white">247</p>
              <p className="text-sm text-green-400">+12% from last week</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="animate-slideIn hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">$3,240</p>
              <p className="text-sm text-green-400">+8% from last week</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="animate-slideIn hover:scale-105 transition-all duration-300" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg. Wait Time</p>
              <p className="text-2xl font-bold text-white">12 min</p>
              <p className="text-sm text-red-400">+2 min from last week</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Performance" className="animate-slideIn" style={{animationDelay: '0.4s'}}>
          <div className="space-y-4">
            {weeklyStats.map((day, index) => (
              <div key={index} className="flex items-center justify-between animate-fadeIn" style={{animationDelay: `${0.5 + index * 0.1}s`}}>
                <span className="text-sm font-medium text-white">{day.day}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-700 rounded-full h-3 border border-gray-600">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm transition-all duration-500" 
                      style={{ width: `${(day.customers / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-white w-8">{day.customers}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Service Distribution" className="animate-slideIn" style={{animationDelay: '0.5s'}}>
          <div className="space-y-4">
            {[
              { service: 'Haircut', count: 45, percentage: 60, color: 'from-green-500 to-green-600' },
              { service: 'Beard Trim', count: 20, percentage: 27, color: 'from-yellow-500 to-yellow-600' },
              { service: 'Hair Wash', count: 10, percentage: 13, color: 'from-purple-500 to-purple-600' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between animate-fadeIn" style={{animationDelay: `${0.6 + index * 0.1}s`}}>
                <span className="text-sm font-medium text-white">{item.service}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-700 rounded-full h-3 border border-gray-600">
                    <div 
                      className={`bg-gradient-to-r ${item.color} h-3 rounded-full shadow-sm transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-white w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card title="Detailed Analytics" className="animate-slideIn" style={{animationDelay: '0.6s'}}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Customers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Avg. Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Staff Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-r from-gray-900 to-gray-800 divide-y divide-gray-600">
              {weeklyStats.map((day, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: `${0.7 + index * 0.05}s`}}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {day.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {day.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-semibold">
                    ${day.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {day.avgWaitTime} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      day.efficiency >= 90 ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30' :
                      day.efficiency >= 80 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30'
                    }`}>
                      {day.efficiency}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;