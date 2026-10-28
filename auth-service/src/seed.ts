import 'dotenv/config';
import { hash } from 'bcryptjs';
import { prisma } from './config/prisma.js';

const name = process.env.ADMIN_NAME ?? 'Administrador';
const email = process.env.ADMIN_EMAIL ?? 'admin@test.com';
const password = process.env.ADMIN_PASSWORD ?? '123456';

async function main(): Promise<void> {
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Unable to seed the admin user', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
