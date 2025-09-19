import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  User,
  Filter,
  Download
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { customers } from '../data/mockData';

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      // In a real app, this would make an API call
      console.log('Adding customer:', newCustomer);
      setNewCustomer({ name: '', phone: '', email: '', notes: '' });
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Customers</p>
              <p className="text-2xl font-semibold text-white">{customers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">This Month</p>
              <p className="text-2xl font-semibold text-white">24</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Regular Customers</p>
              <p className="text-2xl font-semibold text-white">
                {customers.filter(c => c.visitCount > 5).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Avg Visits</p>
              <p className="text-2xl font-semibold text-white">
                {Math.round(customers.reduce((acc, c) => acc + c.visitCount, 0) / customers.length)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Customer List */}
      <Card className="animate-slideIn" title="Customer Directory" subtitle={`${filteredCustomers.length} customers found`}>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Preferred Barber
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-r from-gray-900 to-gray-800 divide-y divide-gray-600">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: `${index * 0.05}s`}}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-medium text-white">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{customer.name}</div>
                        <div className="text-sm text-gray-400">ID: #{customer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {customer.phone}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{customer.visitCount} visits</div>
                    <div className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.visitCount > 10 ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 border border-purple-500/30' : 
                        customer.visitCount > 5 ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30' : 
                        'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {customer.visitCount > 10 ? 'VIP Customer' : 
                         customer.visitCount > 5 ? 'Regular' : 'New Customer'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(customer.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {customer.preferredBarber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="text-yellow-400 hover:text-yellow-300 transform hover:scale-110 transition-all duration-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white transform hover:scale-110 transition-all duration-300">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">No customers found</h3>
              <p className="text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Details Modal */}
      <Modal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-xl font-medium text-white">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedCustomer.name}</h3>
                <p className="text-gray-400">Customer ID: #{selectedCustomer.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-yellow-400" />
                    {selectedCustomer.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="w-4 h-4 mr-2 text-yellow-400" />
                    {selectedCustomer.email}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Visit History</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-400">Total Visits:</span> <span className="text-white">{selectedCustomer.visitCount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Last Visit:</span> <span className="text-white">{new Date(selectedCustomer.lastVisit).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Preferred Barber:</span> <span className="text-white">{selectedCustomer.preferredBarber}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedCustomer.notes && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Notes</h4>
                <p className="text-sm text-gray-300 bg-gradient-to-r from-gray-800 to-gray-700 p-3 rounded-lg border border-gray-600">
                  {selectedCustomer.notes}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Close
              </Button>
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Customer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Full Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              placeholder="Enter customer's full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={3}
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
              placeholder="Any preferences or special notes"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
              Add Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerManagement;