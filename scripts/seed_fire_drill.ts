import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.trainingProgram.findFirst({
    where: { title: { contains: 'Fire Drill' } }
  });

  if (!existing) {
    const created = await prisma.trainingProgram.create({
      data: {
        title: 'វគ្គបណ្តុះបណ្តាលបង្ការនិងពន្លត់អគ្គីភ័យ និងជម្លៀសខ្លួនចេញពីអគ្គីភ័យ (Fire Drill & Evacuation Training)',
        description: 'វគ្គបណ្តុះបណ្តាល និងហាត់សមពន្លត់អគ្គិភ័យប្រចាំឆ្នាំ ៤ ចំណុច៖ ទ្រឹស្តីត្រីកោណភ្លើង, ការជម្លៀសខ្លួន (៣ នាទី ២៥ វិនាទី), ទីតាំងប្រមូលផ្តុំ, និងការអនុវត្តបាញ់ពន្លត់ដោយបំពង់ពន្លត់អគ្គិភ័យ P.A.S.S និងទុយោទឹកពន្លត់',
        trainer: 'ភ្នាក់ងារនគរបាលក្រសួងមហាផ្ទៃ & លោក ចាន់ ភារម្យ (HRM)',
        location: 'ក្រុមហ៊ុន អេចវើហ្គ្រីន ស្ព័តធីង ហ្គូដ (ខេមបូឌា) ឯ.ក (Evergreen Sporting Goods)',
        startDate: new Date('2024-11-23T14:00:00Z'),
        endDate: new Date('2024-11-23T16:00:00Z'),
        cost: 0,
        status: 'COMPLETED'
      }
    });
    console.log('Created Fire Drill Training:', created.id);
  } else {
    console.log('Fire Drill training already exists:', existing.id);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
