import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  User, 
  Phone, 
  Scissors, 
  Play, 
  Pause, 
  CheckCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { queueData, services, staff } from '../data/mockData';

const QueueManagement = () => {
  const [queue, setQueue] = useState(queueData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    service: '',
    notes: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30';
      case 'in_service': return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/30';
      case 'completed': return 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30';
      case 'no_show': return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30';
      default: return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'in_service': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.phone && newCustomer.service) {
      const selectedService = services.find(s => s.id === parseInt(newCustomer.service));
      const newQueueItem = {
        id: Date.now(),
        customer: {
          id: Date.now(),
          name: newCustomer.name,
          phone: newCustomer.phone
        },
        service: selectedService,
        status: 'waiting',
        joinTime: new Date().toISOString(),
        estimatedTime: selectedService.duration,
        assignedBarber: null,
        position: queue.filter(item => item.status === 'waiting').length + 1,
        notes: newCustomer.notes
      };
      
      setQueue([...queue, newQueueItem]);
      setNewCustomer({ name: '', phone: '', service: '', notes: '' });
      setShowAddModal(false);
    }
  };

  const updateQueueItemStatus = (id, newStatus, barberId = null) => {
    setQueue(queue.map(item => {
      if (item.id === id) {
        const updates = { status: newStatus };
        if (barberId) {
          updates.assignedBarber = staff.find(s => s.id === barberId);
        }
        if (newStatus === 'in_service') {
          updates.serviceStartTime = new Date().toISOString();
        }
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const currentQueue = queue.filter(item => item.status !== 'completed' && item.status !== 'no_show');
  const waitingCustomers = queue.filter(item => item.status === 'waiting');
  const inServiceCustomers = queue.filter(item => item.status === 'in_service');

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Waiting</p>
              <p className="text-2xl font-semibold text-white">{waitingCustomers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">In Service</p>
              <p className="text-2xl font-semibold text-white">{inServiceCustomers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Available Staff</p>
              <p className="text-2xl font-semibold text-white">
                {staff.filter(s => s.status === 'available').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 animate-fadeIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Avg Wait</p>
              <p className="text-2xl font-semibold text-white">18m</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Queue Management */}
      <Card 
        className="animate-slideIn"
        title="Current Queue" 
        subtitle={`${currentQueue.length} customers in queue`}
        action={
          <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105 transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        }
      >
        <div className="space-y-4">
          {currentQueue.map((item, index) => (
            <div key={item.id} className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg p-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fadeIn" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-medium shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-white">{item.customer.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {item.customer.phone}
                      </div>
                      <div className="flex items-center">
                        <Scissors className="w-4 h-4 mr-1" />
                        {item.service.name} (${item.service.price})
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.service.duration}min
                      </div>
                    </div>
                    
                    {item.assignedBarber && (
                      <div className="mt-1 text-sm text-gray-300">
                        Assigned to: <span className="font-medium text-yellow-400">{item.assignedBarber.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.status === 'waiting' && (
                    <>
                      <select 
                        className="text-sm bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        onChange={(e) => updateQueueItemStatus(item.id, 'in_service', parseInt(e.target.value))}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign Barber</option>
                        {staff.filter(s => s.status === 'available').map(barber => (
                          <option key={barber.id} value={barber.id}>{barber.name}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all duration-300">
                        <Play className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  {item.status === 'in_service' && (
                    <Button 
                      size="sm" 
                      variant="success"
                      onClick={() => updateQueueItemStatus(item.id, 'completed')}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-300"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  
                  <button className="p-1 text-gray-400 hover:text-yellow-400 transition-colors duration-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {currentQueue.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">No customers in queue</h3>
              <p className="text-gray-400">Add a customer to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Staff Status */}
      <Card title="Staff Status" subtitle="Current availability and assignments">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    member.status === 'available' ? 'bg-green-100 text-green-800' :
                    member.status === 'busy' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              className="input-field"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              className="input-field"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service *
            </label>
            <select
              className="input-field"
              value={newCustomer.service}
              onChange={(e) => setNewCustomer({...newCustomer, service: e.target.value})}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration}min)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
              placeholder="Any special requests or notes"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer}>
              Add to Queue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagement;