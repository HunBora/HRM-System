const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating Document Record in Database ---');

  const htmlPath = path.join(__dirname, '..', 'public', 'docs', 'training_curriculum_manual.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error('HTML manual not found at: ' + htmlPath);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const base64Data = 'data:text/html;charset=utf-8;base64,' + Buffer.from(htmlContent).toString('base64');

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
    fileUrl: '/docs/training_curriculum_manual.html',
    fileData: base64Data,
  };

  if (existingDoc) {
    const updated = await prisma.document.update({
      where: { id: existingDoc.id },
      data: docData
    });
    console.log(`Updated Document in System: ${updated.title}`);
    console.log(`fileUrl: ${updated.fileUrl}`);
    console.log(`fileData prefix: ${updated.fileData.slice(0, 45)}...`);
  } else {
    const created = await prisma.document.create({ data: docData });
    console.log(`Created Document in System: ${created.title}`);
  }

  console.log('--- Database Updated Successfully! ---');
}

main()
  .catch(e => {
    console.error('Error updating document:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
