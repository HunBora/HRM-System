import { prisma } from '@/lib/prisma';
import React from 'react';
import Link from 'next/link';
import { getDictionary } from '@/i18n/getDictionary';
import GeneratePayrollButton from './GeneratePayrollButton';
import DraggableSummaryCards from '@/components/DraggableSummaryCards';
import PayrollFilterForm from '@/components/PayrollFilterForm';

const ThText = ({ kh, en, zh, verticalKh, wrapKh }: { kh: React.ReactNode, en: string, zh: string, verticalKh?: boolean, wrapKh?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: '1.2' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: verticalKh ? '90px' : 'auto' }}>
      <span style={{ 
        fontSize: '0.85rem', 
        fontWeight: 'bold', 
        writingMode: verticalKh ? 'vertical-rl' : 'horizontal-tb',
        transform: verticalKh ? 'rotate(180deg)' : 'none',
        whiteSpace: wrapKh ? 'normal' : 'nowrap',
        textAlign: 'center',
        maxWidth: wrapKh ? '100px' : 'none'
      }}>{kh}</span>
    </div>
    <span style={{ fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap', color: '#333' }}>{zh}</span>
    <span style={{ fontSize: '0.7rem', color: '#4b5563', whiteSpace: 'nowrap' }}>{en}</span>
  </div>
);

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string, department?: string, q?: string }> }) {
  const t = await getDictionary();
  const resolvedParams = await searchParams;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const month = resolvedParams?.month ? parseInt(resolvedParams.month) : currentMonth;
  const year = resolvedParams?.year ? parseInt(resolvedParams.year) : currentYear;
  const department = resolvedParams?.department || '';
  const q = resolvedParams?.q || '';

  const [payrolls, companySettings, distinctDepts] = await Promise.all([
    prisma.payroll.findMany({
      where: {
        month,
        year,
        ...((department || q) ? {
          employee: {
            ...(department ? { department } : {}),
            ...(q ? {
              OR: [
                { employeeId: { contains: q, mode: 'insensitive' } },
                { firstNameEn: { contains: q, mode: 'insensitive' } },
                { lastNameEn: { contains: q, mode: 'insensitive' } },
                { firstNameKh: { contains: q, mode: 'insensitive' } },
                { lastNameKh: { contains: q, mode: 'insensitive' } }
              ]
            } : {})
          }
        } : {})
      },
      include: {
        employee: true,
      },
      orderBy: {
        employee: {
          employeeId: 'asc'
        }
      }
    }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
    prisma.employee.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: '' } }
    })
  ]);

  const uniqueDepartments = distinctDepts.map(d => d.department).filter(Boolean).sort();

  const settings = {
    payment1StartDate: companySettings?.payment1StartDate ?? 1,
    payment1EndDate: companySettings?.payment1EndDate ?? 15,
    payment2StartDate: companySettings?.payment2StartDate ?? 16,
    payment2EndDate: companySettings?.payment2EndDate ?? 31
  };

  const company = await prisma.companySettings.findFirst();
  const companyName = company?.companyName || "GIANNI VINCE BAGS (CAMBODIA) CO., LTD.";

  const totalAdvance = payrolls.reduce((sum, p) => sum + p.loanPension, 0);
  const totalTax = payrolls.reduce((sum, p) => sum + p.taxPayment, 0);
  const totalNSSF = payrolls.reduce((sum, p) => sum + p.nssf, 0);
  const grandNetSalary = payrolls.reduce((sum, p) => sum + p.netSalaryUsd, 0);
  const totalBasicSalary1 = payrolls.reduce((sum, p) => sum + (p.employee?.basicSalary1 || 0), 0);
  const totalUsd = payrolls.reduce((sum, p) => sum + p.paidSalaryUsd, 0);
  const totalRiel = payrolls.reduce((sum, p) => sum + p.netSalaryRiel, 0);
  
  const date1Start = settings.payment1StartDate.toString().padStart(2, '0');
  const date1End = settings.payment1EndDate >= 31 
    ? new Date(year, month, 0).getDate().toString().padStart(2, '0') 
    : settings.payment1EndDate.toString().padStart(2, '0');
    
  const date2Start = settings.payment2StartDate.toString().padStart(2, '0');
  const date2End = settings.payment2EndDate >= 31 
    ? new Date(year, month, 0).getDate().toString().padStart(2, '0') 
    : settings.payment2EndDate.toString().padStart(2, '0');

  const date1 = `${date1Start}-${date1End}`;
  const date2 = `${date2Start}-${date2End}`;

  // Extract unique extra benefits across all payrolls
  const uniqueExtraBenefits = Array.from(new Set(
    payrolls.flatMap(p => {
      try {
        if (p.otherAllowanceDesc && p.otherAllowanceDesc.startsWith('[')) {
          const parsed = JSON.parse(p.otherAllowanceDesc);
          return parsed.filter((b: any) => b.confirmed).map((b: any) => `${b.name}|${b.nameEn || ''}`);
        } else if (p.otherAllowance > 0) {
          return [`${p.otherAllowanceDesc || 'អត្ថប្រយោជន៍ផ្សេងៗ'}|Extra Benefits`];
        }
      } catch (e) {}
      return [];
    })
  )).map(str => {
    const [name, nameEn] = str.split('|');
    return { name, nameEn };
  });

  return (
    <div style={{ paddingBottom: '30px' }}>
      <style>{`
        @media print {
          .card { border: none !important; box-shadow: none !important; }
          div[style*="overflow"] { overflow: visible !important; max-height: none !important; }
          .btn-primary, .btn-secondary, form, header, nav, a { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { padding: 4px !important; font-size: 8pt !important; }
          @page { size: landscape; margin: 0.5cm; }
        }
      `}</style>
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }} className="print-hidden">
        
        {/* Title Block */}
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 5px 0', color: '#333', textTransform: 'uppercase' }}>
            {companyName}
          </h1>
          <h2 className="kh-text" style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: '#1e3a8a' }}>
            ប្រាក់ខែបុគ្គលិក <span style={{ fontSize: '1.1rem', color: '#4b5563', margin: '0 10px' }}>Employee Salary</span> <span style={{ fontSize: '1.2rem' }}>员工工资表</span>
          </h2>
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="kh-text" style={{ fontWeight: 'bold' }}>តម្រង (Filter): </span>
            <PayrollFilterForm 
              uniqueDepartments={uniqueDepartments} 
              month={month} 
              year={year} 
              department={department} 
              filterBtnText={t.payroll.filterBtn} 
              q={q}
            />
          </div>
        </div>

        {/* Buttons and Small Summary Boxes aligned to the right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: '400px' }}>
          <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
            <Link 
              href="/dashboard/payroll/summary" 
              className="btn-secondary flex items-center justify-center kh-text hover:bg-slate-200 transition-colors" 
              style={{ padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
            >
              របាយការណ៍សរុប (Master Summary)
            </Link>
            <GeneratePayrollButton month={month} year={year} text={t.payroll.generateBtn} />
          </div>
          
          <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '15px', marginTop: '5px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="kh-text" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>សរុបប្រាក់ដុល្លារ (Total USD)</span>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 16px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', fontSize: '0.9rem' }}>
                ${totalUsd.toFixed(2)}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="kh-text" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>សរុបប្រាក់រៀល (Total Riel)</span>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 16px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', fontSize: '0.9rem' }}>
                ៛{totalRiel.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="kh-text" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textAlign: 'center' }}>ប្រាក់កាត់ពន្ធ (Total Tax)</span>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 16px', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>
                ${totalTax.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', padding: 0, border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <table style={{ width: 'max-content', borderCollapse: 'collapse', textAlign: 'center', minWidth: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#eef2ff', borderBottom: '1px solid var(--border-color)' }}>
              <th style={thStyle}><ThText kh="ល.រ" zh="序号" en="No" /></th>
              <th style={thStyle}><ThText kh="អត្តលេខ" zh="工号" en="ID" /></th>
              <th style={thStyle}><ThText kh="ឈ្មោះ" zh="姓名" en="Name" /></th>
              <th style={thStyle}><ThText kh="ឈ្មោះឡាតាំង" zh="姓名" en="Name" /></th>
              <th style={thStyle}><ThText kh="ផ្នែក" zh="部门" en="Dept" /></th>
              <th style={thStyle}><ThText kh="ឡាញ" zh="组" en="Line" /></th>
              <th style={thStyle}><ThText kh="មុខងារ" zh="职务" en="Position" /></th>
              <th style={thStyle}><ThText kh="វេន" zh="班次" en="N.T" /></th>
              <th style={thStyle}><ThText kh="ភេទ" zh="性别" en="Sex" /></th>
              <th style={thStyle}><ThText kh="ប្រពន្ធ" zh="配偶" en="Wife" /></th>
              <th style={thStyle}><ThText kh="កូន" zh="孩子" en="Child" /></th>
              <th style={thStyle}><ThText kh="ថ្ងៃចូលធ្វើការ" zh="入职日期" en="Start Date" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់គោល" zh="底薪" en="B. Salary" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់បន្ថែម" zh="岗位薪资" en="Basic Pay Scale" /></th>
              <th style={thStyle}><ThText kh="ថ្ងៃធ្វើការ" zh="工作天数" en="W. Day" /></th>
              <th style={thStyle}><ThText kh="អវត្តមាន" zh="旷工" en="Absent" /></th>
              <th style={thStyle}><ThText kh="មានច្បាប់" zh="请假" en="Permission" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ខែធ្វើការ" zh="工作工资" en="M. Salary" /></th>
              <th style={thStyle}><ThText kh="រង្វាន់ថែម" zh="岗位津贴" en="Pay Scale Incentive" /></th>
              <th style={thStyle}><ThText kh="ថែមម៉ោងធម្មតា" zh="平时加班时" en="OT Hour" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ថែមម៉ោង" zh="平时加班费" en="Wage" /></th>
              <th style={thStyle}><ThText kh="ថ្ងៃអាទិត្យ" zh="星期日加班时" en="Sun OT Hour" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់" zh="星期日加班费" en="Wage" /></th>
              <th style={thStyle}><ThText kh="ថែមម៉ោងយប់" zh="夜班加班时" en="N. OT Hour" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់" zh="夜班加班费" en="Wage" /></th>
              <th style={thStyle}><ThText kh="ច្បាប់ឈប់សម្រាក" zh="年假" en="Annual Leave" /></th>
              <th style={thStyle}><ThText kh="រង្វាន់ទៀងទាត់" zh="全勤奖" en="Att. Bonus" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ធ្វើដំណើរ" zh="车费补贴" en="Transportation" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់អាហារ" zh="午餐费" en="Lunch Allowance" /></th>
              <th style={thStyle}><ThText kh="អាហារថែមម៉ោង" zh="加班餐补" en="OT Meal Allowance" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់កូនតូច" zh="育儿费" en="Day Care Allowance" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់អតីតភាព" zh="工龄津贴" en="Seniority" /></th>
              <th style={thStyle}><ThText kh="សំណងអតីតភាព" zh="工龄奖" en="Seniority Indemnity" /></th>
              <th style={thStyle}><ThText kh="រង្វាន់ផលិតកម្ម" zh="超产奖金" en="Production Incentive" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់កែតម្រូវ" zh="调整金额" en="Adjust" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ខែសរុប" zh="合计工资" en="Total Salary" /></th>
              <th style={thStyle}><ThText kh="5%" zh="5%" en="5% Severance Pay" /></th>
              <th style={thStyle}><ThText kh="ពន្ធ" zh="扣税" en="Tax payment" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ខ្ចី" zh="借款及养老金" en="Loan/Pension" /></th>
              <th style={thStyle}><ThText kh="បើកលើកទី១" zh="第一次发放" en="1st Salary paid" /></th>
              <th style={thStyle}><ThText kh="សហជីព" zh="工会费" en="Union Deduction" /></th>
              <th style={thStyle}><ThText kh="បើកលើកទី២" zh="第二次发放" en="2nd Salary paid" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់ត្រូវបើកUSD" zh="实发薪水USD" en="Paid Salary USD" /></th>
              <th style={thStyle}><ThText kh="ប្រាក់រៀល" zh="瑞尔" en="RIEL" /></th>
              <th style={thStyle}><ThText kh="ហត្ថលេខា" zh="签名" en="Signature" /></th>
              <th style={thStyle}><ThText kh="សកម្មភាព" zh="操作" en="Action" /></th>
            </tr>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', color: '#64748b' }}>
              {Array.from({ length: 46 }, (_, i) => (
                <th key={`num-${i}`} style={{ padding: '4px', borderRight: '1px solid var(--border-color)', fontWeight: 'normal' }}>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr>
                <td colSpan={46} style={{ padding: '30px', textAlign: 'center' }} className="kh-text text-muted">
                  មិនមានទិន្នន័យ / No Data / 暂无数据
                </td>
              </tr>
            ) : (
              payrolls.map((p, index) => {
                const firstPayment = (p.employee.basicSalary1 || 0);
                const secondPayment = p.netSalaryUsd;
                return (
                <tr key={p.id} style={{ transition: 'background-color 0.2s', fontSize: '0.85rem' }} className="hover:bg-gray-50">
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>{p.employee.employeeId}</td>
                  <td style={tdStyle}>{p.employee.firstNameKh} {p.employee.lastNameKh}</td>
                  <td style={tdStyle}>{p.employee.firstNameEn} {p.employee.lastNameEn}</td>
                  <td style={tdStyle}>{p.employee.department}</td>
                  <td style={tdStyle}>{p.employee.line || '-'}</td>
                  <td style={tdStyle}>{p.employee.position}</td>
                  <td style={tdStyle}>{p.employee.shift || '-'}</td>
                  <td style={tdStyle}>{p.employee.gender}</td>
                  <td style={tdStyle}>{p.employee.spouse ? 1 : 0}</td>
                  <td style={tdStyle}>{p.employee.numberOfChildren || 0}</td>
                  <td style={tdStyle}>{p.employee.hireDate ? new Date(p.employee.hireDate).toLocaleDateString('en-GB') : '-'}</td>
                  <td style={tdStyle}>${p.basicSalary.toFixed(2)}</td>
                  <td style={tdStyle}>${p.basicPayScale.toFixed(2)}</td>
                  <td style={tdStyle}>{p.workingDays}</td>
                  <td style={tdStyle}>{p.absentDays}</td>
                  <td style={tdStyle}>{p.permissionDays}</td>
                  <td style={tdStyle}>${p.workingSalary.toFixed(2)}</td>
                  <td style={tdStyle}>${p.payScaleIncentive.toFixed(2)}</td>
                  <td style={tdStyle}>{p.otHours}</td>
                  <td style={tdStyle}>${p.otWage.toFixed(2)}</td>
                  <td style={tdStyle}>{p.sunOtHours}</td>
                  <td style={tdStyle}>${p.sunOtWage.toFixed(2)}</td>
                  <td style={tdStyle}>{p.nightOtHours}</td>
                  <td style={tdStyle}>${p.nightOtWage.toFixed(2)}</td>
                  <td style={tdStyle}>${p.annualLeaveAmount.toFixed(2)}</td>
                  <td style={tdStyle}>${p.attendanceBonus.toFixed(2)}</td>
                  <td style={tdStyle}>${p.transportation.toFixed(2)}</td>
                  <td style={tdStyle}>${p.lunchAllowance.toFixed(2)}</td>
                  <td style={tdStyle}>${p.otMealAllowance.toFixed(2)}</td>
                  <td style={tdStyle}>${p.dayCareAllowance.toFixed(2)}</td>
                  <td style={tdStyle}>${p.seniority.toFixed(2)}</td>
                  <td style={tdStyle}>${p.seniorityIndemnity.toFixed(2)}</td>
                  <td style={tdStyle}>${p.productionIncentive.toFixed(2)}</td>
                  <td style={tdStyle}>${p.adjustmentSkill.toFixed(2)}</td>
                  <td style={tdStyle}>${p.totalSalary.toFixed(2)}</td>
                  <td style={tdStyle}>${p.severancePay.toFixed(2)}</td>
                  <td style={tdStyle}>${p.taxPayment.toFixed(2)}</td>
                  <td style={tdStyle}>${p.loanPension.toFixed(2)}</td>
                  <td style={tdStyle}>${firstPayment.toFixed(2)}</td>
                  <td style={tdStyle}>${p.unionDeduction.toFixed(2)}</td>
                  <td style={tdStyle}>${secondPayment.toFixed(2)}</td>
                  <td style={tdStyle}>${p.paidSalaryUsd.toFixed(2)}</td>
                  <td style={tdStyle}>៛{p.netSalaryRiel.toLocaleString()}</td>
                  <td style={tdStyle}></td>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/payroll/${p.id}`} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', textDecoration: 'none' }}>
                      Edit
                    </Link>
                    <Link href={`/dashboard/payroll/${p.id}/payslip`} className="btn-secondary kh-text" style={{ padding: '4px 8px', fontSize: '0.8rem', textDecoration: 'none', marginLeft: '5px' }}>
                      វិក្កយបត្រ (Payslip)
                    </Link>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
          {payrolls.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', position: 'sticky', bottom: 0, zIndex: 10, boxShadow: '0 -1px 0 var(--border-color)' }}>
                <td colSpan={12} style={{ ...tdStyle, textAlign: 'right', paddingRight: '20px' }} className="kh-text">
                  សរុបរួម / Grand Total / 总计:
                </td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.basicSalary, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.basicPayScale, 0).toFixed(2)}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.workingSalary, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.payScaleIncentive, 0).toFixed(2)}</td>
                <td style={tdStyle}>{payrolls.reduce((sum, p) => sum + p.otHours, 0)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.otWage, 0).toFixed(2)}</td>
                <td style={tdStyle}>{payrolls.reduce((sum, p) => sum + p.sunOtHours, 0)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.sunOtWage, 0).toFixed(2)}</td>
                <td style={tdStyle}>{payrolls.reduce((sum, p) => sum + p.nightOtHours, 0)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.nightOtWage, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.annualLeaveAmount, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.attendanceBonus, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.transportation, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.lunchAllowance, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.otMealAllowance, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.dayCareAllowance, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.seniority, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.seniorityIndemnity, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.productionIncentive, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.adjustmentSkill, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.totalSalary, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.severancePay, 0).toFixed(2)}</td>
                <td style={tdStyle}>${totalTax.toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.loanPension, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + (p.employee.basicSalary1 || 0), 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.unionDeduction, 0).toFixed(2)}</td>
                <td style={tdStyle}>${payrolls.reduce((sum, p) => sum + p.netSalaryUsd, 0).toFixed(2)}</td>
                <td style={{ ...tdStyle, color: '#166534', fontWeight: '900' }}>${totalUsd.toFixed(2)}</td>
                <td style={{ ...tdStyle, color: '#166534', fontWeight: '900' }}>៛{totalRiel.toLocaleString()}</td>
                <td colSpan={2} style={tdStyle}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { 
  padding: '10px 6px', 
  borderRight: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
  whiteSpace: 'nowrap' as const,
  fontWeight: 'bold', 
  fontSize: '0.65rem',
  color: '#475569',
  verticalAlign: 'middle' as const,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: '#eef2ff',
  boxShadow: '0 1px 0 var(--border-color)'
};

const tdStyle = { 
  padding: '8px 6px', 
  borderRight: '1px solid var(--border-color)',
  borderBottom: '1px solid var(--border-color)',
  whiteSpace: 'nowrap' as const
};
