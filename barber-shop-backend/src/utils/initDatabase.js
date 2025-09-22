const { mongoose, models } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Check if data already exists
    const franchiseCount = await models.Franchise.countDocuments();
    if (franchiseCount > 0) {
      console.log('📊 Database already contains data, skipping initialization');
      return;
    }

    console.log('🌱 Seeding database with initial data...');

    // Create sample franchises
    const franchise1 = await models.Franchise.create({
      name: 'Kings Barbershop Downtown',
      address: '123 Main Street, Downtown, City 12345',
      phone: '+1234567890',
      email: 'downtown@kingsbarbershop.com',
      operating_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '20:00', closed: false },
        friday: { open: '09:00', close: '20:00', closed: false },
        saturday: { open: '08:00', close: '17:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: false }
      },
      timezone: 'America/New_York',
      settings: {
        max_queue_size: 50,
        allow_walk_ins: true,
        require_appointments: false,
        notification_settings: {
          sms_enabled: true,
          email_enabled: true,
          push_enabled: true
        },
        payment_methods: ['cash', 'card', 'digital'],
        loyalty_program: {
          enabled: true,
          points_per_dollar: 1,
          redemption_rate: 100
        }
      },
      is_active: true
    });

    const franchise2 = await models.Franchise.create({
      name: 'Kings Barbershop Uptown',
      address: '456 Oak Avenue, Uptown, City 12346',
      phone: '+1234567891',
      email: 'uptown@kingsbarbershop.com',
      operating_hours: {
        monday: { open: '08:00', close: '19:00', closed: false },
        tuesday: { open: '08:00', close: '19:00', closed: false },
        wednesday: { open: '08:00', close: '19:00', closed: false },
        thursday: { open: '08:00', close: '21:00', closed: false },
        friday: { open: '08:00', close: '21:00', closed: false },
        saturday: { open: '07:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '17:00', closed: false }
      },
      timezone: 'America/New_York',
      settings: {
        max_queue_size: 75,
        allow_walk_ins: true,
        require_appointments: false,
        notification_settings: {
          sms_enabled: true,
          email_enabled: true,
          push_enabled: true
        },
        payment_methods: ['cash', 'card', 'digital'],
        loyalty_program: {
          enabled: true,
          points_per_dollar: 1.5,
          redemption_rate: 100
        }
      },
      is_active: true
    });

    console.log('✅ Created sample franchises');

    // Create admin users
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admin1 = await models.User.create({
      username: 'admin_downtown',
      email: 'admin@downtown.kingsbarbershop.com',
      password_hash: adminPassword,
      first_name: 'John',
      last_name: 'Admin',
      role: 'admin',
      franchise_id: franchise1._id,
      phone: '+1234567892',
      is_active: true,
      permissions: {
        manage_users: true,
        manage_services: true,
        manage_queue: true,
        view_analytics: true,
        manage_payments: true,
        manage_settings: true
      }
    });

    const admin2 = await models.User.create({
      username: 'admin_uptown',
      email: 'admin@uptown.kingsbarbershop.com',
      password_hash: adminPassword,
      first_name: 'Jane',
      last_name: 'Admin',
      role: 'admin',
      franchise_id: franchise2._id,
      phone: '+1234567893',
      is_active: true,
      permissions: {
        manage_users: true,
        manage_services: true,
        manage_queue: true,
        view_analytics: true,
        manage_payments: true,
        manage_settings: true
      }
    });

    console.log('✅ Created admin users');

    // Create staff users
    const staffPassword = await bcrypt.hash('staff123', 12);
    
    const staff1 = await models.User.create({
      username: 'mike_barber',
      email: 'mike@downtown.kingsbarbershop.com',
      password_hash: staffPassword,
      first_name: 'Mike',
      last_name: 'Johnson',
      role: 'staff',
      franchise_id: franchise1._id,
      phone: '+1234567894',
      is_active: true,
      staff_details: {
        specialties: ['classic_cuts', 'beard_trim', 'hot_towel'],
        experience_years: 5,
        hourly_rate: 25.00,
        commission_rate: 15,
        availability: {
          monday: { start: '09:00', end: '18:00', available: true },
          tuesday: { start: '09:00', end: '18:00', available: true },
          wednesday: { start: '09:00', end: '18:00', available: true },
          thursday: { start: '09:00', end: '20:00', available: true },
          friday: { start: '09:00', end: '20:00', available: true },
          saturday: { start: '08:00', end: '17:00', available: true },
          sunday: { start: '10:00', end: '16:00', available: false }
        }
      },
      permissions: {
        manage_queue: true,
        view_analytics: false,
        manage_payments: true
      }
    });

    const staff2 = await models.User.create({
      username: 'sarah_stylist',
      email: 'sarah@uptown.kingsbarbershop.com',
      password_hash: staffPassword,
      first_name: 'Sarah',
      last_name: 'Williams',
      role: 'staff',
      franchise_id: franchise2._id,
      phone: '+1234567895',
      is_active: true,
      staff_details: {
        specialties: ['modern_cuts', 'styling', 'color'],
        experience_years: 8,
        hourly_rate: 30.00,
        commission_rate: 20,
        availability: {
          monday: { start: '08:00', end: '19:00', available: true },
          tuesday: { start: '08:00', end: '19:00', available: true },
          wednesday: { start: '08:00', end: '19:00', available: true },
          thursday: { start: '08:00', end: '21:00', available: true },
          friday: { start: '08:00', end: '21:00', available: true },
          saturday: { start: '07:00', end: '18:00', available: true },
          sunday: { start: '09:00', end: '17:00', available: true }
        }
      },
      permissions: {
        manage_queue: true,
        view_analytics: false,
        manage_payments: true
      }
    });

    console.log('✅ Created staff users');

    // Create services for franchise 1
    const services1 = await models.Service.insertMany([
      {
        name: 'Classic Haircut',
        description: 'Traditional men\'s haircut with scissors and clippers',
        category: 'haircut',
        base_price: 25.00,
        duration: 30,
        franchise_id: franchise1._id,
        is_active: true,
        requirements: {
          staff_level: 'any',
          equipment: ['scissors', 'clippers', 'cape'],
          preparation_time: 5
        }
      },
      {
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping',
        category: 'grooming',
        base_price: 15.00,
        duration: 20,
        franchise_id: franchise1._id,
        is_active: true,
        requirements: {
          staff_level: 'any',
          equipment: ['beard_trimmer', 'scissors', 'cape'],
          preparation_time: 3
        }
      },
      {
        name: 'Hot Towel Shave',
        description: 'Traditional hot towel shave with straight razor',
        category: 'shaving',
        base_price: 35.00,
        duration: 45,
        franchise_id: franchise1._id,
        is_active: true,
        requirements: {
          staff_level: 'experienced',
          equipment: ['straight_razor', 'hot_towel', 'shaving_cream'],
          preparation_time: 10
        }
      }
    ]);

    // Create services for franchise 2
    const services2 = await models.Service.insertMany([
      {
        name: 'Modern Cut & Style',
        description: 'Contemporary haircut with modern styling',
        category: 'haircut',
        base_price: 35.00,
        duration: 45,
        franchise_id: franchise2._id,
        is_active: true,
        requirements: {
          staff_level: 'any',
          equipment: ['scissors', 'clippers', 'styling_products'],
          preparation_time: 5
        }
      },
      {
        name: 'Hair Wash & Condition',
        description: 'Professional hair washing and conditioning treatment',
        category: 'treatment',
        base_price: 20.00,
        duration: 25,
        franchise_id: franchise2._id,
        is_active: true,
        requirements: {
          staff_level: 'any',
          equipment: ['shampoo', 'conditioner', 'towels'],
          preparation_time: 3
        }
      },
      {
        name: 'Full Service Package',
        description: 'Haircut, wash, style, and beard trim',
        category: 'package',
        base_price: 55.00,
        duration: 75,
        franchise_id: franchise2._id,
        is_active: true,
        requirements: {
          staff_level: 'experienced',
          equipment: ['scissors', 'clippers', 'shampoo', 'styling_products'],
          preparation_time: 10
        }
      }
    ]);

    console.log('✅ Created services');

    // Create sample customers
    const customers = await models.Customer.insertMany([
      {
        first_name: 'Robert',
        last_name: 'Smith',
        phone: '+1234567896',
        email: 'robert.smith@email.com',
        preferences: {
          preferred_barber: staff1._id.toString(),
          preferred_services: ['Classic Haircut', 'Beard Trim'],
          communication: {
            sms_notifications: true,
            email_notifications: false
          }
        },
        loyalty_points: 150,
        total_visits: 12,
        total_spent: 300.00
      },
      {
        first_name: 'David',
        last_name: 'Johnson',
        phone: '+1234567897',
        email: 'david.johnson@email.com',
        preferences: {
          preferred_barber: staff2._id.toString(),
          preferred_services: ['Modern Cut & Style'],
          communication: {
            sms_notifications: true,
            email_notifications: true
          }
        },
        loyalty_points: 200,
        total_visits: 8,
        total_spent: 280.00
      },
      {
        first_name: 'Michael',
        last_name: 'Brown',
        phone: '+1234567898',
        email: 'michael.brown@email.com',
        preferences: {
          communication: {
            sms_notifications: false,
            email_notifications: true
          }
        },
        loyalty_points: 50,
        total_visits: 3,
        total_spent: 75.00
      }
    ]);

    console.log('✅ Created sample customers');

    // Create queues for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queue1 = await models.Queue.create({
      franchise_id: franchise1._id,
      date: today,
      status: 'active',
      max_capacity: 50,
      current_size: 0,
      staff_assignments: [
        {
          staff_id: staff1._id,
          is_available: true,
          customers_served_today: 0
        }
      ]
    });

    const queue2 = await models.Queue.create({
      franchise_id: franchise2._id,
      date: today,
      status: 'active',
      max_capacity: 75,
      current_size: 0,
      staff_assignments: [
        {
          staff_id: staff2._id,
          is_available: true,
          customers_served_today: 0
        }
      ]
    });

    console.log('✅ Created daily queues');

    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Franchises: 2`);
    console.log(`   • Admin users: 2`);
    console.log(`   • Staff users: 2`);
    console.log(`   • Services: 6`);
    console.log(`   • Customers: 3`);
    console.log(`   • Daily queues: 2`);
    console.log('');
    console.log('🔐 Default credentials:');
    console.log('   Admin (Downtown): admin_downtown / admin123');
    console.log('   Admin (Uptown): admin_uptown / admin123');
    console.log('   Staff: mike_barber / staff123');
    console.log('   Staff: sarah_stylist / staff123');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

module.exports = { initializeDatabase };