const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://blessie999:Mabunda@blessingapi.vbplv.mongodb.net/blessAPI?retryWrites=true&w=majority&appName=BlessingAPI';

// Import models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Franchise = require('../models/Franchise');

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log('Connected to MongoDB');
    
    return mongoose;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

module.exports = {
  mongoose,
  initializeDatabase,
  models: {
    User,
    Customer,
    Service,
    Queue,
    QueueEntry,
    Appointment,
    Payment,
    Franchise
  }
};