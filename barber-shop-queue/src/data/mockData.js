// Mock data for the barber shop queue management system

export const services = [
  { id: 1, name: 'Haircut', duration: 30, price: 25 },
  { id: 2, name: 'Beard Trim', duration: 15, price: 15 },
  { id: 3, name: 'Haircut + Beard', duration: 45, price: 35 },
  { id: 4, name: 'Shampoo & Style', duration: 20, price: 20 },
  { id: 5, name: 'Hot Towel Shave', duration: 25, price: 30 },
];

export const staff = [
  { id: 1, name: 'Mike Johnson', role: 'Senior Barber', status: 'available', avatar: null },
  { id: 2, name: 'Sarah Davis', role: 'Barber', status: 'busy', avatar: null },
  { id: 3, name: 'Tom Wilson', role: 'Junior Barber', status: 'available', avatar: null },
  { id: 4, name: 'Lisa Brown', role: 'Stylist', status: 'break', avatar: null },
];

export const customers = [
  {
    id: 1,
    name: 'John Smith',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@email.com',
    visitCount: 12,
    lastVisit: '2024-01-15',
    preferredBarber: 'Mike Johnson',
    notes: 'Prefers short sides, medium top'
  },
  {
    id: 2,
    name: 'David Brown',
    phone: '+1 (555) 234-5678',
    email: 'david.brown@email.com',
    visitCount: 8,
    lastVisit: '2024-01-10',
    preferredBarber: 'Sarah Davis',
    notes: 'Allergic to certain hair products'
  },
  {
    id: 3,
    name: 'Michael Wilson',
    phone: '+1 (555) 345-6789',
    email: 'michael.wilson@email.com',
    visitCount: 15,
    lastVisit: '2024-01-12',
    preferredBarber: 'Mike Johnson',
    notes: 'Regular customer, usual cut'
  },
];

export const queueData = [
  {
    id: 1,
    customer: customers[0],
    service: services[0],
    status: 'waiting',
    joinTime: '2024-01-20T10:30:00',
    estimatedTime: 15,
    assignedBarber: null,
    position: 1
  },
  {
    id: 2,
    customer: customers[1],
    service: services[2],
    status: 'in_service',
    joinTime: '2024-01-20T10:15:00',
    estimatedTime: 0,
    assignedBarber: staff[1],
    position: 0,
    serviceStartTime: '2024-01-20T10:45:00'
  },
  {
    id: 3,
    customer: customers[2],
    service: services[1],
    status: 'waiting',
    joinTime: '2024-01-20T10:45:00',
    estimatedTime: 25,
    assignedBarber: null,
    position: 2
  },
  {
    id: 4,
    customer: { id: 4, name: 'Robert Taylor', phone: '+1 (555) 456-7890' },
    service: services[3],
    status: 'waiting',
    joinTime: '2024-01-20T11:00:00',
    estimatedTime: 35,
    assignedBarber: null,
    position: 3
  },
];

export const dailyStats = {
  totalCustomers: 24,
  averageWaitTime: 18,
  totalRevenue: 680,
  completedServices: 20,
  currentQueue: queueData.filter(item => item.status !== 'completed').length,
};

export const weeklyStats = [
  { day: 'Mon', customers: 28, revenue: 720 },
  { day: 'Tue', customers: 32, revenue: 840 },
  { day: 'Wed', customers: 25, revenue: 650 },
  { day: 'Thu', customers: 30, revenue: 780 },
  { day: 'Fri', customers: 45, revenue: 1200 },
  { day: 'Sat', customers: 52, revenue: 1380 },
  { day: 'Sun', customers: 18, revenue: 480 },
];

export const recentTransactions = [
  {
    id: 1,
    customer: 'John Smith',
    service: 'Haircut',
    amount: 25,
    time: '2024-01-20T11:30:00',
    barber: 'Mike Johnson'
  },
  {
    id: 2,
    customer: 'David Brown',
    service: 'Haircut + Beard',
    amount: 35,
    time: '2024-01-20T11:15:00',
    barber: 'Sarah Davis'
  },
  {
    id: 3,
    customer: 'Michael Wilson',
    service: 'Beard Trim',
    amount: 15,
    time: '2024-01-20T10:45:00',
    barber: 'Tom Wilson'
  },
];