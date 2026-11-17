const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Training Programs and Document into Database ---');

  // 1. Seed Training Programs
  const programs = [
    {
      title: 'វគ្គតម្រង់ទិស និងសិទ្ធិការងារទូទៅ (Module 1: Worker Awareness & Orientation)',
      description: 'វគ្គបណ្តុះបណ្តាល ១០ ប្រធានបទគន្លឹះ៖ សុវត្ថិភាព OSH, ការការពារបរិស្ថាន & សំរាម ៤ ពណ៌, សុវត្ថិភាពគីមី & SDS, ការមិនរើសអើង & ប្រឆាំងការបៀតបៀន, សេរីភាពសហជីព, ប្រាក់ឈ្នួល & អត្ថប្រយោជន៍, យន្តការបណ្តឹងសារទុក្ខ, សុវត្ថិភាពអគ្គិសនី, ការទប់ស្កាត់ពលកម្មកុមារ, និងប្រអប់ First Aid/បន្ទប់ពេទ្យ។',
      trainer: 'HR & Compliance Department',
      location: 'សាលបណ្តុះបណ្តាលរោងចក្រ (Training Hall)',
      startDate: new Date('2026-11-20T08:00:00.000Z'),
      endDate: new Date('2026-11-20T17:00:00.000Z'),
      cost: 0,
      status: 'UPCOMING',
    },
    {
      title: 'វគ្គតួនាទី និងភាពជាអ្នកដឹកនាំ (Module 2: Supervisory Leadership & JDs)',
      description: 'បណ្តុះបណ្តាលប្រធានក្រុម មេការ និងប្រធានផ្នែកផលិតកម្ម (ឃ្លាំង, តុកាត់, ដេរ, QC, វេចខ្ចប់, ឃ្លាំងសម្រេច) អំពីការពិពណ៌នាការងារ (JD), ការគ្រប់គ្រងខ្សែសង្វាក់, ការតាមដាន KPI, 5S, និងការគោរពសិទ្ធិកម្មករ។',
      trainer: 'Production & HR Manager',
      location: 'បន្ទប់ប្រជុំធំ (Meeting Room A)',
      startDate: new Date('2026-11-25T08:00:00.000Z'),
      endDate: new Date('2026-11-25T17:00:00.000Z'),
      cost: 0,
      status: 'UPCOMING',
    },
    {
      title: 'វគ្គគណៈកម្មការឯកទេស & កិច្ចសន្ទនាសង្គម (Module 3: Committees & Social Dialogue)',
      description: 'ពង្រឹងសមត្ថភាពសមាជិកគណៈកម្មការ OSH, គណៈកម្មការបង្ការមេរោគអេដស៍ និងគ្រឿងញៀន, និងតំណាងកម្មករ អំពីការដើរត្រួតពិនិត្យរួម (Joint Walkthrough), ការតាមដាន CAP Tracker, និងយន្តការដោះស្រាយវិវាទ។',
      trainer: 'Compliance & OSH Team',
      location: 'បន្ទប់ប្រជុំ OSH / Meeting Room B',
      startDate: new Date('2026-12-01T08:00:00.000Z'),
      endDate: new Date('2026-12-01T17:00:00.000Z'),
      cost: 0,
      status: 'UPCOMING',
    },
    {
      title: 'កញ្ចប់ឯកសារប្រតិបត្តិការផ្ទៃក្នុង HR & Compliance (Module 4: Internal Toolkit)',
      description: 'ណែនាំការអនុវត្តការងារប្រចាំថ្ងៃសម្រាប់ក្រុមការងារ HR និង Compliance: ការតាមដានកិច្ចសន្យា FDC / UDC Tracker, រូបមន្តគណនាប្រាក់ខែ Payroll, និងការត្រៀមរៀបចំឯកសារ Audit (BFC, BSCI, SMETA, WRAP)។',
      trainer: 'HR Director / General Manager',
      location: 'ការិយាល័យ HR & Compliance',
      startDate: new Date('2026-12-05T08:00:00.000Z'),
      endDate: new Date('2026-12-05T17:00:00.000Z'),
      cost: 0,
      status: 'UPCOMING',
    }
  ];

  for (const prog of programs) {
    const existing = await prisma.trainingProgram.findFirst({
      where: { title: prog.title }
    });
    if (!existing) {
      const created = await prisma.trainingProgram.create({ data: prog });
      console.log(`Created Training Program: ${created.title}`);
    } else {
      console.log(`Training Program already exists: ${existing.title}`);
    }
  }

  // 2. Seed Document into Document model
  const docPath = path.join(__dirname, '..', 'docs', 'training_curriculum_manual.md');
  let fileContent = '';
  if (fs.existsSync(docPath)) {
    fileContent = fs.readFileSync(docPath, 'utf-8');
  }

  const docTitle = 'កញ្ចប់ឯកសារវគ្គបណ្តុះបណ្តាលស្តង់ដាររោងចក្រ (Factory Training Curriculum & Operations Manual)';
  const existingDoc = await prisma.document.findFirst({
    where: { title: docTitle }
  });

  const docData = {
    title: docTitle,
    category: 'Training',
    description: JSON.stringify({
      desc: 'កញ្ចប់ឯកសារបណ្តុះបណ្តាលស្តង់ដារ ៤ ម៉ូឌុល (Worker Awareness, Leadership, Committees, HR/Compliance Toolkit)',
      department: 'HR & Compliance',
      docCode: 'SOP-TR-2026-V1'
    }),
    fileUrl: '/docs/training_curriculum_manual.md',
    fileData: Buffer.from(fileContent).toString('base64'),
  };

  if (!existingDoc) {
    const createdDoc = await prisma.document.create({ data: docData });
    console.log(`Created Document in System: ${createdDoc.title} (ID: ${createdDoc.id})`);
  } else {
    await prisma.document.update({
      where: { id: existingDoc.id },
      data: docData
    });
    console.log(`Updated Document in System: ${existingDoc.title}`);
  }

  console.log('--- Done successfully! ---');
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
