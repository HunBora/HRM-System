'use client'

import React, { useState, useEffect } from 'react';
import ExportButtons from '@/components/ExportButtons';
import EmployeeExportImportButtons from '@/app/dashboard/employees/EmployeeExportImportButtons';
import { fetchEmployeeReport, fetchAttendanceReport, fetchPayrollReport, fetchBankTransferReport } from './actions';

interface Props {
  t: any;
}

export default function ExportHubClient({ t }: Props) {
  const [reportType, setReportType] = useState('EMPLOYEE');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [bankName, setBankName] = useState('ABA');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (reportType === 'EMPLOYEE') {
        const res = await fetchEmployeeReport();
        setData(res);
      } else if (reportType === 'ATTENDANCE') {
        const res = await fetchAttendanceReport(month, year);
        setData(res);
      } else if (reportType === 'PAYROLL' || reportType === 'PAYSLIP_STRIPS') {
        const res = await fetchPayrollReport(month, year);
        setData(res);
      } else if (reportType === 'BANK_TRANSFER_EXCEL') {
        const res = await fetchBankTransferReport(month, year);
        setData(res);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, month, year]);

  const getColumns = () => {
    if (reportType === 'EMPLOYEE') {
      return [
        { header: t.employee.columns.id, key: 'employeeId' },
        { header: t.employee.form.firstNameEn, key: 'firstNameEn' },
        { header: t.employee.form.lastNameEn, key: 'lastNameEn' },
        { header: t.employee.form.firstNameKh, key: 'firstNameKh' },
        { header: t.employee.form.lastNameKh, key: 'lastNameKh' },
        { header: t.employee.columns.gender, key: 'gender' },
        { header: t.employee.columns.dob, key: 'dob' },
        { header: t.employee.columns.hireDate, key: 'hireDate' },
        { header: t.employee.columns.position, key: 'position' },
        { header: t.employee.columns.department, key: 'department' },
        { header: t.employee.form.basicSalary, key: 'basicSalary' },
        { header: t.employee.columns.phone, key: 'phone' },
      ];
    }
    if (reportType === 'ATTENDANCE') {
      return [
        { header: "ID", key: "id" },
        { header: "Name", key: "name" },
        { header: "Department", key: "dept" },
        { header: "Position", key: "position" },
        { header: "Days Worked", key: "daysWorked" },
        { header: "Absent", key: "absentDays" },
        { header: "Leave", key: "leaveDays" },
        { header: "OT Hours", key: "otHours" },
      ];
    }
    if (reportType === 'PAYROLL' || reportType === 'PAYSLIP_STRIPS') {
      return [
        { header: "ល.រ\nNo\n序号", key: "no" },
        { header: "អត្តលេខ\nID\n工号", key: "id" },
        { header: "ឈ្មោះ\nName\n姓名", key: "nameKh" },
        { header: "ឈ្មោះឡាតាំង\nName\n姓名", key: "nameEn" },
        { header: "ផ្នែក\nDept\n部门", key: "dept" },
        { header: "ឡាញ\nLine\n组", key: "line" },
        { header: "មុខងារ\nPosition\n职务", key: "position" },
        { header: "វេន\nN.T\n班次", key: "shift" },
        { header: "ភេទ\nSex\n性别", key: "gender" },
        { header: "ប្រពន្ធ\nWife\n配偶", key: "wife" },
        { header: "កូន\nChild\n孩子", key: "child" },
        { header: "ថ្ងៃចូលធ្វើការ\nStart Date\n入职日期", key: "startDate" },
        { header: "ប្រាក់គោល\nB. Salary\n底薪", key: "basicSalary" },
        { header: "ប្រាក់បន្ថែម\nBasic Pay Scale\n岗位薪资", key: "basicPayScale" },
        { header: "ថ្ងៃធ្វើការ\nW. Day\n工作天数", key: "workingDays" },
        { header: "អវត្តមាន\nAbsent\n旷工", key: "absent" },
        { header: "មានច្បាប់\nPermission\n请假", key: "permission" },
        { header: "ប្រាក់ខែធ្វើការ\nM. Salary\n工作工资", key: "workingSalary" },
        { header: "រង្វាន់ថែម\nPay Scale Incentive\n岗位津贴", key: "payScaleIncentive" },
        { header: "ថែមម៉ោងធម្មតា\nOT Hour\n平时加班时", key: "otHour" },
        { header: "ប្រាក់ថែមម៉ោង\nWage\n平时加班费", key: "otWage" },
        { header: "ថ្ងៃអាទិត្យ\nSun OT Hour\n星期日加班时", key: "sunOtHour" },
        { header: "ប្រាក់\nWage\n星期日加班费", key: "sunOtWage" },
        { header: "ថែមម៉ោងយប់\nN. OT Hour\n夜班加班时", key: "nightOtHour" },
        { header: "ប្រាក់\nWage\n夜班加班费", key: "nightOtWage" },
        { header: "ច្បាប់ឈប់សម្រាក\nAnnual Leave\n年假", key: "annualLeave" },
        { header: "រង្វាន់ទៀងទាត់\nAtt. Bonus\n全勤奖", key: "attBonus" },
        { header: "ប្រាក់ធ្វើដំណើរ\nTransportation\n车费补贴", key: "transportation" },
        { header: "ប្រាក់អាហារ\nLunch Allowance\n午餐费", key: "lunchAllowance" },
        { header: "អាហារថែមម៉ោង\nOT Meal Allowance\n加班餐补", key: "otMealAllowance" },
        { header: "ប្រាក់កូនតូច\nDay Care Allowance\n育儿费", key: "dayCareAllowance" },
        { header: "ប្រាក់អតីតភាព\nSeniority\n工龄津贴", key: "seniority" },
        { header: "សំណងអតីតភាព\nSeniority Indemnity\n工龄奖", key: "seniorityIndemnity" },
        { header: "រង្វាន់ផលិតកម្ម\nProduction Incentive\n超产奖金", key: "productionIncentive" },
        { header: "ប្រាក់កែតម្រូវ\nAdjust\n调整金额", key: "adjust" },
        { header: "ប្រាក់ខែសរុប\nTotal Salary\n合计工资", key: "totalSalary" },
        { header: "5%\n5% Severance Pay\n5%", key: "severancePay" },
        { header: "ពន្ធ\nTax payment\n扣税", key: "taxPayment" },
        { header: "ប្រាក់ខ្ចី\nLoan/Pension\n借款及养老金", key: "loanPension" },
        { header: "បើកលើកទី១\n1st Salary paid\n第一次发放", key: "firstSalary" },
        { header: "សហជីព\nUnion Deduction\n工会费", key: "unionDeduction" },
        { header: "បើកលើកទី២\n2nd Salary paid\n第二次发放", key: "secondSalary" },
        { header: "ប្រាក់ត្រូវបើកUSD\nPaid Salary USD\n实发薪水USD", key: "paidSalaryUsd" },
        { header: "ប្រាក់រៀល\nRIEL\n瑞尔", key: "riel" },
        { header: "ហត្ថលេខា\nSignature\n签名", key: "signature" }

      ];
    }
    if (reportType === 'BANK_TRANSFER_EXCEL') {
      return [
        { header: "Employee Name", key: "name" },
        { header: "Employee Id", key: "empId" },
        { header: "Account Number", key: "accountNumber" },
        { header: "Amount", key: "amount" },
        { header: "Remark", key: "remark" }
      ];
    }
    return [];
  };

  const columns = getColumns();
  const filename = reportType === 'BANK_TRANSFER_EXCEL' 
    ? `Bank_Transfer_${bankName}_${month}_${year}`
    : `${reportType}_Report${reportType !== 'EMPLOYEE' ? `_${month}_${year}` : ''}`;

  return (
    <div>
      <h1 className="title kh-text">{t.exports.title}</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ជ្រើសរើសរបាយការណ៍ (Select Report)</label>
            <select className="input-field kh-text" value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ margin: 0, minWidth: '250px' }}>
              <option value="EMPLOYEE">របាយការណ៍បុគ្គលិក (Employee Report)</option>
              <option value="ATTENDANCE">របាយការណ៍វត្តមាន (Attendance Report)</option>
              <option value="PAYROLL">របាយការណ៍ប្រាក់ខែ (Payroll Report)</option>
              <option value="PAYSLIP_STRIPS">បោះពុម្ពក្រដាសប្រាក់ខែ (Payslip Strips)</option>
              <option value="BANK_TRANSFER_EXCEL">របាយការណ៍ផ្ទេរប្រាក់ធនាគារ (Bank Transfer Excel)</option>
              <option value="MASTER_PAYROLL_EXCEL">Master Payroll ពេញលេញ (Master Payroll Excel)</option>
              <option value="MASTER_ATTENDANCE_EXCEL">Master Attendance ពេញលេញ (Master Attendance Excel)</option>
              <option value="MASTER_EMPLOYEE_EXCEL">Master Employee ពេញលេញ (Master Employee Excel)</option>
            </select>
          </div>
          
          {reportType !== 'EMPLOYEE' && (
            <>
              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ខែ (Month)</label>
                <select className="input-field" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ margin: 0 }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឆ្នាំ (Year)</label>
                <select className="input-field" value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ margin: 0 }}>
                  {[year - 1, year, year + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'BANK_TRANSFER_EXCEL' && (
            <div>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឈ្មោះធនាគារ (Bank Name)</label>
              <input 
                type="text" 
                className="input-field" 
                value={bankName} 
                onChange={(e) => setBankName(e.target.value)} 
                style={{ margin: 0, minWidth: '150px' }}
              />
            </div>
          )}
          
          <div>
            <button onClick={loadData} className="btn-secondary kh-text">Refresh Data</button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '20px 0' }} />

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : reportType === 'MASTER_PAYROLL_EXCEL' ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h3 className="kh-text" style={{ marginBottom: '15px' }}>ទាញយកទម្រង់ Master Payroll ជា Excel ពេញលេញ</h3>
            <p className="kh-text" style={{ marginBottom: '20px', color: '#64748b' }}>
              ទម្រង់នេះមានការកំណត់ Page Setup សម្រាប់ព្រីន មានអក្សរឈរ និងមានរូបមន្ត Excel ផ្ទាល់។
            </p>
            <a 
              href={`/api/export/master-payroll?month=${month}&year=${year}&t=${Date.now()}`}
              className="btn-primary kh-text"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 24px', fontSize: '1.1rem' }}
            >
              📊 ទាញយក Excel (Download)
            </a>
          </div>
        ) : reportType === 'MASTER_ATTENDANCE_EXCEL' ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h3 className="kh-text" style={{ marginBottom: '15px' }}>ទាញយកទម្រង់ Master Attendance ជា Excel ពេញលេញ</h3>
            <p className="kh-text" style={{ marginBottom: '20px', color: '#64748b' }}>
              ទម្រង់នេះរៀបចំឡើងជាប្រតិទិនប្រចាំខែ និងសរុបទិន្នន័យច្បាប់/អវត្តមានសម្រាប់បុគ្គលិកម្នាក់ៗ។
            </p>
            <a 
              href={`/api/export/master-attendance?month=${month}&year=${year}&t=${Date.now()}`}
              className="btn-primary kh-text"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 24px', fontSize: '1.1rem' }}
            >
              📅 ទាញយក Excel (Download)
            </a>
          </div>
        ) : reportType === 'MASTER_EMPLOYEE_EXCEL' ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h3 className="kh-text" style={{ marginBottom: '15px' }}>ទាញយក និងនាំចូលទម្រង់ Employee Master (Excel ពេញលេញ)</h3>
            <p className="kh-text" style={{ marginBottom: '20px', color: '#64748b' }}>
              ទម្រង់នេះរៀបចំឡើងយ៉ាងលម្អិត រួមមានព័ត៌មានកិច្ចសន្យា ប្រាក់ខែ គ្រួសារ និងព័ត៌មានផ្សេងៗទៀតរបស់បុគ្គលិកទាំងអស់។ អ្នកអាចទាញយក ឬនាំចូល (Import Original Format) វិញបាន។
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <EmployeeExportImportButtons />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <ExportButtons data={data} columns={columns} filename={filename} printId="preview-table" />
              {reportType === 'EMPLOYEE' && <EmployeeExportImportButtons />}
              {reportType === 'PAYSLIP_STRIPS' && (
                <a 
                  href={`/api/export/payslip-strips?month=${month}&year=${year}`}
                  className="btn-primary kh-text"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}
                >
                  📊 ទាញយក Excel Strips (Download)
                </a>
              )}
            </div>

            {/* Preview Section */}
            <div style={{ marginTop: '20px' }}>
              <h3 className="kh-text" style={{ marginBottom: '10px' }}>តារាងមើលជាមុន (Preview) - {data.length} records</h3>
              <div id="preview-table" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: columns.length <= 6 ? 'max-content' : '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 'max-content' }}>
                  {reportType !== 'PAYSLIP_STRIPS' && (
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        {columns.map((col, i) => (
                          <th key={i} style={{ padding: '10px', borderBottom: '2px solid var(--border-color)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', verticalAlign: 'middle', textAlign: 'center' }}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>គ្មានទិន្នន័យ (No Data)</td>
                      </tr>
                    ) : (
                      data.map((row, i) => (
                        reportType === 'PAYSLIP_STRIPS' ? (
                          <React.Fragment key={i}>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                              {columns.map((col, j) => (
                                <th key={`th-${j}`} style={{ padding: '10px', borderBottom: '2px solid var(--border-color)', borderTop: i > 0 ? '2px dashed #cbd5e1' : 'none', fontSize: '0.85rem', whiteSpace: 'pre-wrap', verticalAlign: 'middle', textAlign: 'center' }}>{col.header}</th>
                              ))}
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                              {columns.map((col, j) => (
                                <td key={`td-${j}`} style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'center' }}>{row[col.key]}</td>
                              ))}
                            </tr>
                            <tr>
                              <td colSpan={columns.length} style={{ height: '30px', borderBottom: '2px dashed #94a3b8', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                ✂️ កាត់ត្រង់នេះ (Cut Here)
                              </td>
                            </tr>
                          </React.Fragment>
                        ) : (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {columns.map((col, j) => (
                              <td key={j} style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'center' }}>{row[col.key]}</td>
                            ))}
                          </tr>
                        )
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
