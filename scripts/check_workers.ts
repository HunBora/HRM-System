import { prisma } from '../src/lib/prisma';

async function main() {
  const count = await prisma.employee.count();
  console.log('Total current employees in DB:', count);
  const existing = await prisma.employee.findMany({
    where: {
      employeeId: {
        in: ['1305', '1205', '1616', '2002', '6011']
      }
    },
    select: { employeeId: true, firstNameEn: true, lastNameEn: true }
  });
  console.log('Existing matched:', existing);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
