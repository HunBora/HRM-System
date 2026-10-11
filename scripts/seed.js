const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defaultGroups = [
    { name: 'Office', keywords: 'office,admin,accountant,purchasing,hr,គណនេយ្យ,រដ្ឋបាល', color: '#e3f2fd', textColor: '#1565c0', orderIdx: 1 },
    { name: 'Production', keywords: 'line,ដេរ,តុកាត់,production,sewing,cutting', color: '#fce4ec', textColor: '#ad1457', orderIdx: 2 },
    { name: 'Warehouse', keywords: 'ឃ្លាំង,warehouse,stock', color: '#fff3e0', textColor: '#ef6c00', orderIdx: 3 },
    { name: 'QA/QC', keywords: 'qa,qc,គុណភាព,quality', color: '#e8f5e9', textColor: '#2e7d32', orderIdx: 4 },
  ];

  for (const g of defaultGroups) {
    const existing = await prisma.departmentGroup.findFirst({ where: { name: g.name } });
    if (!existing) {
      await prisma.departmentGroup.create({ data: g });
      console.log('Created group:', g.name);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
