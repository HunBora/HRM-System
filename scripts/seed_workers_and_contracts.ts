import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

interface FdcCycle {
  cycle: number;
  start: string;
  finish: string;
}

interface WorkerRecord {
  no: number;
  empId: string;
  nameRaw: string;
  nameEn: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: string;
  genderCh: string;
  deptRaw: string;
  posRaw: string;
  joinDate: string;
  seniority: string;
  finishProbation: string;
  fdcContracts: FdcCycle[];
  udcStartDate: string;
}

function mapDepartmentAndLine(deptRaw: string, posRaw: string) {
  if (deptRaw === '1组') return { department: 'Production', line: 'Line 01', position: 'Sewing Operator / កម្មករដេរ (1组)' };
  if (deptRaw === '2组') return { department: 'Production', line: 'Line 02', position: 'Sewing Operator / កម្មករដេរ (2组)' };
  if (deptRaw === '3组') return { department: 'Production', line: 'Line 03', position: 'Sewing Operator / កម្មករដេរ (3组)' };
  if (deptRaw === '5组') return { department: 'Production', line: 'Line 05', position: 'Sewing Operator / កម្មករដេរ (5组)' };
  if (deptRaw === '6组') return { department: 'Production', line: 'Line 06', position: 'Sewing Operator / កម្មករដេរ (6组)' };
  if (deptRaw === '组长') return { department: 'Production', line: 'Production Lines', position: 'Line Leader / មេក្រុម (组长)' };
  if (deptRaw === '仓库') return { department: 'Warehouse', line: 'Warehouse Section', position: 'Warehouse Staff / បុគ្គលិកឃ្លាំង (仓库)' };
  if (deptRaw === '办公室') return { department: 'Office', line: 'Admin Office', position: 'Office Staff / បុគ្គលិករដ្ឋបាល (办公室)' };
  if (deptRaw === '开料') return { department: 'Cutting', line: 'Cutting Section', position: 'Cutting Worker / កម្មករប៉ែកកាត់ (开料)' };
  if (deptRaw === '胶水') return { department: 'Gluing', line: 'Gluing Section', position: 'Gluing Worker / កម្មករលាបកាវ (胶水)' };
  if (deptRaw === '包装') return { department: 'Packing', line: 'Packing Section', position: 'Packing Worker / កម្មករវេចខ្ចប់ (包装)' };
  if (deptRaw === '品检部') return { department: 'Quality Control', line: 'QC Section', position: 'QC Inspector / ត្រួតពិនិត្យគុណភាព (品检部)' };
  return { department: deptRaw || 'Production', line: 'Line 01', position: posRaw || 'Staff' };
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'data', 'workers_contract_matrix.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const workers: WorkerRecord[] = JSON.parse(rawData);

  console.log(`Starting import for ${workers.length} workers...`);
  let importedCount = 0;
  let contractCount = 0;

  for (const w of workers) {
    const { department, line, position } = mapDepartmentAndLine(w.deptRaw, w.posRaw);
    const hireDate = new Date(`${w.joinDate}T00:00:00.000Z`);
    const probationStart = new Date(`${w.joinDate}T00:00:00.000Z`);
    const probationEnd = w.finishProbation ? new Date(`${w.finishProbation}T00:00:00.000Z`) : null;

    // Upsert Employee
    const employee = await prisma.employee.upsert({
      where: { employeeId: w.empId },
      update: {
        firstNameEn: w.firstNameEn,
        lastNameEn: w.lastNameEn,
        gender: w.gender,
        department,
        line,
        position,
        hireDate,
        basicSalary: 208.0, // Standard minimum wage for garment/travel goods
        probationStart,
        probationEnd,
        status: 'ACTIVE',
      },
      create: {
        employeeId: w.empId,
        firstNameEn: w.firstNameEn,
        lastNameEn: w.lastNameEn,
        gender: w.gender,
        department,
        line,
        position,
        hireDate,
        basicSalary: 208.0,
        probationStart,
        probationEnd,
        status: 'ACTIVE',
        annualLeaveDays: 18,
      },
    });

    importedCount++;

    // 1. Create Probation Contract Record
    if (w.finishProbation) {
      await prisma.contract.upsert({
        where: { contractNo: `CTR-${w.empId}-PROB` },
        update: {
          startDate: probationStart,
          endDate: probationEnd,
          contractType: 'PROBATION',
          status: 'EXPIRED',
          positionTitle: position,
          department,
          basicSalaryUsd: 208.0,
        },
        create: {
          contractNo: `CTR-${w.empId}-PROB`,
          employeeId: employee.id,
          contractType: 'PROBATION',
          status: 'EXPIRED',
          startDate: probationStart,
          endDate: probationEnd,
          positionTitle: position,
          department,
          basicSalaryUsd: 208.0,
          probationCategory: 'SPECIALISED', // 2 months
          notes: `Probation Contract for ${w.nameEn}`,
        },
      });
      contractCount++;
    }

    // 2. Create FDC contracts 1 through 9
    for (const fdc of w.fdcContracts) {
      if (fdc.start && fdc.finish) {
        const fdcStart = new Date(`${fdc.start}T00:00:00.000Z`);
        const fdcFinish = new Date(`${fdc.finish}T00:00:00.000Z`);
        const isCurrentActive = !w.udcStartDate && fdc.cycle === 9; // If no UDC yet, last FDC may be active

        await prisma.contract.upsert({
          where: { contractNo: `CTR-${w.empId}-FDC${fdc.cycle}` },
          update: {
            startDate: fdcStart,
            endDate: fdcFinish,
            contractType: 'FDC',
            status: isCurrentActive ? 'ACTIVE' : 'RENEWED',
            positionTitle: position,
            department,
            severancePercent: 5.0,
            renewalCount: fdc.cycle,
          },
          create: {
            contractNo: `CTR-${w.empId}-FDC${fdc.cycle}`,
            employeeId: employee.id,
            contractType: 'FDC',
            status: isCurrentActive ? 'ACTIVE' : 'RENEWED',
            startDate: fdcStart,
            endDate: fdcFinish,
            positionTitle: position,
            department,
            basicSalaryUsd: 208.0,
            severancePercent: 5.0,
            renewalCount: fdc.cycle,
            notes: `FDC Cycle ${fdc.cycle} (3 Months)`,
          },
        });
        contractCount++;
      }
    }

    // 3. Create UDC Contract (if UDC Starting Date is defined)
    if (w.udcStartDate) {
      const udcStart = new Date(`${w.udcStartDate}T00:00:00.000Z`);
      await prisma.contract.upsert({
        where: { contractNo: `CTR-${w.empId}-UDC` },
        update: {
          startDate: udcStart,
          endDate: null,
          contractType: 'UDC',
          status: 'ACTIVE',
          positionTitle: position,
          department,
          basicSalaryUsd: 208.0,
        },
        create: {
          contractNo: `CTR-${w.empId}-UDC`,
          employeeId: employee.id,
          contractType: 'UDC',
          status: 'ACTIVE',
          startDate: udcStart,
          endDate: null,
          positionTitle: position,
          department,
          basicSalaryUsd: 208.0,
          notes: `Permanent Contract (UDC) converted following 9 FDC cycles (${w.seniority})`,
        },
      });
      contractCount++;
    }
  }

  console.log(`✅ Successfully imported ${importedCount} employees and created/synced ${contractCount} contract records in DB!`);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
