const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const testAccounts = [
    { email: 'admin@gmail.com', role: 'ADMIN' },
    { email: 'hr@gmail.com', role: 'HR_MANAGER' },
    { email: 'payroll@gmail.com', role: 'PAYROLL_ADMIN' },
    { email: 'depthead@gmail.com', role: 'DEPT_HEAD' },
    { email: 'employee@gmail.com', role: 'EMPLOYEE' }
  ];

  console.log('Creating test accounts...');

  for (const acc of testAccounts) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: acc.email,
          password,
          role: acc.role
        }
      });
      console.log(`Created ${acc.role}: ${acc.email} / 123456`);
    } else {
      await prisma.user.update({
        where: { email: acc.email },
        data: { role: acc.role, password }
      });
      console.log(`Updated ${acc.role}: ${acc.email} / 123456`);
    }
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
