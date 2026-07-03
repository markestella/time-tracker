import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thynetwork.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
  const adminPin = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPin, 10);

    await prisma.user.create({
      data: {
        firstName: adminFirstName,
        lastName: adminLastName,   
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
