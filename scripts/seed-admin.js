const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@forestry.local',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@forestry.local');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
