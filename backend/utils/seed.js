import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Project from '../models/Project.model.js';
import Donation from '../models/Donation.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dar-al-hikma');

    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Donation.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@daralhikma.org',
      password: adminPassword,
      role: 'admin',
      profession: 'Other',
      isEmailVerified: true
    });

    console.log('✅ Admin user created:', admin.email);

    // Create sample users
    const users = await User.insertMany([
      {
        name: 'Dr. Ahmed Khan',
        email: 'ahmed@example.com',
        password: await bcrypt.hash('password123', 12),
        profession: 'Doctor',
        address: {
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India'
        },
        isHallOfFame: true
      },
      {
        name: 'Engineer Fatima Ali',
        email: 'fatima@example.com',
        password: await bcrypt.hash('password123', 12),
        profession: 'Engineer',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India'
        }
      },
      {
        name: 'Businessman Omar Sheikh',
        email: 'omar@example.com',
        password: await bcrypt.hash('password123', 12),
        profession: 'Businessman',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        },
        isHallOfFame: true
      }
    ]);

    console.log('✅ Sample users created');

    // Create sample projects
    const projects = await Project.insertMany([
      {
        title: 'Medical College Construction',
        description: 'Building a state-of-the-art medical college to provide quality healthcare education to students from underprivileged backgrounds.',
        shortDescription: 'State-of-the-art medical college for quality healthcare education',
        faculty: 'Medical',
        status: 'ongoing',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          district: 'Hyderabad',
          country: 'India'
        },
        targetAmount: 50000000,
        currentAmount: 15000000,
        progress: 30,
        isFeatured: true,
        createdBy: admin._id,
        milestones: [
          {
            title: 'Land Acquisition',
            description: 'Acquired 10 acres of land',
            date: new Date('2024-01-15'),
            completed: true
          },
          {
            title: 'Foundation Work',
            description: 'Foundation and basic structure',
            date: new Date('2024-06-30'),
            completed: false
          }
        ]
      },
      {
        title: 'Engineering College Expansion',
        description: 'Expanding the engineering college to accommodate more students and add new departments.',
        shortDescription: 'Expanding engineering facilities for more students',
        faculty: 'Engineering',
        status: 'ongoing',
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          district: 'Bangalore',
          country: 'India'
        },
        targetAmount: 30000000,
        currentAmount: 12000000,
        progress: 40,
        isFeatured: true,
        createdBy: admin._id
      },
      {
        title: 'Scholarship Program',
        description: 'Providing scholarships to meritorious students from economically weaker sections.',
        shortDescription: 'Scholarships for meritorious students',
        faculty: 'Education',
        status: 'ongoing',
        location: {
          country: 'India'
        },
        targetAmount: 10000000,
        currentAmount: 3500000,
        progress: 35,
        createdBy: admin._id
      },
      {
        title: 'Community Health Center',
        description: 'Completed community health center providing free healthcare services.',
        shortDescription: 'Free healthcare services for the community',
        faculty: 'Welfare',
        status: 'completed',
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          district: 'Hyderabad',
          country: 'India'
        },
        targetAmount: 5000000,
        currentAmount: 5000000,
        progress: 100,
        completionDate: new Date('2023-12-15'),
        createdBy: admin._id
      }
    ]);

    console.log('✅ Sample projects created');

    // Create sample donations
    const donations = await Donation.insertMany([
      {
        donor: users[0]._id,
        amount: 50000,
        currency: 'INR',
        donationType: 'Zakat',
        faculty: 'Medical',
        project: projects[0]._id,
        paymentMethod: 'razorpay',
        paymentId: 'pay_sample1',
        orderId: 'order_sample1',
        status: 'completed',
        receiptNumber: 'DAH-20240101-000001',
        donorName: users[0].name,
        donorEmail: users[0].email,
        donorAddress: users[0].address,
        receiptGenerated: true
      },
      {
        donor: users[1]._id,
        amount: 25000,
        currency: 'INR',
        donationType: 'Sadaqa',
        faculty: 'Engineering',
        project: projects[1]._id,
        paymentMethod: 'razorpay',
        paymentId: 'pay_sample2',
        orderId: 'order_sample2',
        status: 'completed',
        receiptNumber: 'DAH-20240102-000002',
        donorName: users[1].name,
        donorEmail: users[1].email,
        donorAddress: users[1].address,
        receiptGenerated: true
      },
      {
        donor: users[2]._id,
        amount: 100000,
        currency: 'INR',
        donationType: 'SadaqaJaria',
        faculty: 'Education',
        project: projects[2]._id,
        paymentMethod: 'stripe',
        paymentId: 'pay_sample3',
        orderId: 'order_sample3',
        status: 'completed',
        receiptNumber: 'DAH-20240103-000003',
        donorName: users[2].name,
        donorEmail: users[2].email,
        donorAddress: users[2].address,
        receiptGenerated: true
      }
    ]);

    console.log('✅ Sample donations created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@daralhikma.org / admin123');
    console.log('User: ahmed@example.com / password123');
    console.log('User: fatima@example.com / password123');
    console.log('User: omar@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();

