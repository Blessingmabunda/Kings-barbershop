import React from 'react';
import { 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';
import Card from '../components/Card';
import { dailyStats, weeklyStats, recentTransactions, queueData } from '../data/mockData';

const Dashboard = () => {
  const StatCard = ({ title, value, icon: Icon, change, changeType = 'positive' }) => (
    <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 animate-scaleIn">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-black" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-3xl font-bold text-white">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );

  const currentQueue = queueData.filter(item => item.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Customers"
          value={dailyStats.totalCustomers}
          icon={Users}
          change="+12%"
        />
        <StatCard
          title="Avg Wait Time"
          value={`${dailyStats.averageWaitTime}m`}
          icon={Clock}
          change="-5%"
        />
        <StatCard
          title="Today's Revenue"
          value={`$${dailyStats.totalRevenue}`}
          icon={DollarSign}
          change="+8%"
        />
        <StatCard
          title="Completed Services"
          value={dailyStats.completedServices}
          icon={CheckCircle}
          change="+15%"
        />
      </div>

      {/* Current Queue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Current Queue" subtitle={`${currentQueue.length} customers waiting`} className="animate-slideIn">
          <div className="space-y-3">
            {currentQueue.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 hover:from-gray-600 hover:to-gray-700 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.customer.name}</p>
                    <p className="text-xs text-gray-400">{item.service.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-semibold">{item.estimatedTime}m</p>
                  <p className="text-xs text-gray-400">
                    {item.status === 'in_service' ? 'In Service' : 'Waiting'}
                  </p>
                </div>
              </div>
            ))}
            {currentQueue.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No customers in queue</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Recent Transactions" subtitle="Latest completed services" className="animate-slideIn">
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border border-gray-600 hover:from-gray-600 hover:to-gray-700 transition-all duration-300">
                <div>
                  <p className="text-sm font-medium text-white">{transaction.customer}</p>
                  <p className="text-xs text-gray-400">{transaction.service} • {transaction.barber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">${transaction.amount}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly Performance Chart */}
      <Card title="Weekly Performance" subtitle="Customer count and revenue trends" className="animate-fadeIn">
        <div className="mt-4">
          <div className="flex items-end space-x-3 h-64">
            {weeklyStats.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-700 rounded-t-xl relative shadow-inner" style={{ height: '200px' }}>
                  <div 
                    className="bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl absolute bottom-0 w-full transition-all duration-700 shadow-lg"
                    style={{ height: `${(day.customers / 60) * 100}%` }}
                  />
                  <div 
                    className="bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-xl absolute bottom-0 w-full transition-all duration-700 opacity-70"
                    style={{ height: `${(day.revenue / 1500) * 100}%` }}
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-semibold text-white">{day.day}</p>
                  <p className="text-xs text-gray-400">{day.customers}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full mr-3 shadow-lg"></div>
              <span className="text-sm text-gray-300 font-medium">Customers</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full mr-3 shadow-lg opacity-70"></div>
              <span className="text-sm text-gray-300 font-medium">Revenue ($)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="animate-fadeIn">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <button className="flex items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-yellow-500 hover:bg-gradient-to-br hover:from-yellow-500 hover:to-yellow-600 hover:text-black transition-all duration-300 transform hover:scale-105 group">
            <div className="text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-black transition-colors duration-300" />
              <p className="text-sm font-semibold text-white group-hover:text-black transition-colors duration-300">Add Customer</p>
              <p className="text-xs text-gray-400 group-hover:text-black transition-colors duration-300">Add new customer to queue</p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-yellow-500 hover:bg-gradient-to-br hover:from-yellow-500 hover:to-yellow-600 hover:text-black transition-all duration-300 transform hover:scale-105 group">
            <div className="text-center">
              <Activity className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-black transition-colors duration-300" />
              <p className="text-sm font-semibold text-white group-hover:text-black transition-colors duration-300">View Reports</p>
              <p className="text-xs text-gray-400 group-hover:text-black transition-colors duration-300">Detailed analytics</p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-yellow-500 hover:bg-gradient-to-br hover:from-yellow-500 hover:to-yellow-600 hover:text-black transition-all duration-300 transform hover:scale-105 group">
            <div className="text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400 group-hover:text-black transition-colors duration-300" />
              <p className="text-sm font-semibold text-white group-hover:text-black transition-colors duration-300">Schedule</p>
              <p className="text-xs text-gray-400 group-hover:text-black transition-colors duration-300">Manage appointments</p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;