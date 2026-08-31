'use client'

import { useState, useEffect } from 'react';
import { updatePayrollRecord } from '@/app/dashboard/payroll/actions';

export default function PayrollEditForm({ payroll }: { payroll: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({ ...payroll });

  const [extraBenefits, setExtraBenefits] = useState<{name: string, nameEn?: string, amount: number, confirmed?: boolean}[]>(() => {
    try {
      if (payroll.otherAllowanceDesc && payroll.otherAllowanceDesc.startsWith('[')) {
        const parsed = JSON.parse(payroll.otherAllowanceDesc);
        return parsed.map((p: any) => ({ ...p, confirmed: true }));
      }
    } catch (e) {
      // ignore
    }
    if (payroll.otherAllowanceDesc || payroll.otherAllowance > 0) {
       return [{ name: payroll.otherAllowanceDesc || 'Other Benefit', amount: payroll.otherAllowance || 0, confirmed: true }];
    }
    return [];
  });

  const addExtraBenefit = () => {
    setExtraBenefits([...extraBenefits, { name: '', nameEn: '', amount: 0, confirmed: false }]);
  };

  const confirmExtraBenefit = (index: number) => {
    const newBenefits = [...extraBenefits];
    if (newBenefits[index].name.trim() === '') return;
    newBenefits[index].confirmed = true;
    setExtraBenefits(newBenefits);
  };

  const removeExtraBenefit = (index: number) => {
    const newBenefits = [...extraBenefits];
    newBenefits.splice(index, 1);
    setExtraBenefits(newBenefits);
  };

  const handleExtraBenefitChange = (index: number, field: 'name' | 'nameEn' | 'amount', value: string) => {
    const newBenefits = [...extraBenefits];
    if (field === 'amount') {
      newBenefits[index][field] = value === '' ? 0 : parseFloat(value) || 0;
    } else {
      newBenefits[index][field] = value;
    }
    setExtraBenefits(newBenefits);
  };

  useEffect(() => {
    const totalExtra = extraBenefits.reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
    setFormData((prev: any) => ({
      ...prev,
      otherAllowance: totalExtra,
      otherAllowanceDesc: JSON.stringify(extraBenefits)
    }));
  }, [extraBenefits]);

  // Calculate totals whenever formData changes
  useEffect(() => {
    // Basic calculation logic
    // W. Salary = (Basic Salary / 26) * W. Day (or simple override if typed)
    
    const workingSalary = parseFloat(formData.workingSalary) || 0;
    const payScaleIncentive = parseFloat(formData.payScaleIncentive) || 0;
    const otWage = parseFloat(formData.otWage) || 0;
    const sunOtWage = parseFloat(formData.sunOtWage) || 0;
    const nightOtWage = parseFloat(formData.nightOtWage) || 0;
    
    // Some allowances are not added to Total Salary in the spreadsheet (like Annual Leave?), but let's sum standard ones.
    // Based on the spreadsheet analysis: Total Salary = W.Salary + OT + Sun OT + N. OT + AnnualLeave + Attendance + Transport + Lunch + OT Meal + Day Care + Seniority + Indemnity + Prod + Adjust
    const annualLeaveAmount = parseFloat(formData.annualLeaveAmount) || 0;
    const attendanceBonus = parseFloat(formData.attendanceBonus) || 0;
    const transportation = parseFloat(formData.transportation) || 0;
    const lunchAllowance = parseFloat(formData.lunchAllowance) || 0;
    const otMealAllowance = parseFloat(formData.otMealAllowance) || 0;
    const dayCareAllowance = parseFloat(formData.dayCareAllowance) || 0;
    const seniority = parseFloat(formData.seniority) || 0;
    const seniorityIndemnity = parseFloat(formData.seniorityIndemnity) || 0;
    const productionIncentive = parseFloat(formData.productionIncentive) || 0;
    const adjustmentSkill = parseFloat(formData.adjustmentSkill) || 0;
    const otherAllowance = parseFloat(formData.otherAllowance) || 0;

    const totalSalary = workingSalary + payScaleIncentive + otWage + sunOtWage + nightOtWage 
                      + annualLeaveAmount + attendanceBonus + transportation + lunchAllowance 
                      + otMealAllowance + dayCareAllowance + seniority + seniorityIndemnity 
                      + productionIncentive + adjustmentSkill + otherAllowance;

    const severancePay = totalSalary * 0.05; // 5% SX Severance
    
    const taxPayment = parseFloat(formData.taxPayment) || 0;
    const loanPension = parseFloat(formData.loanPension) || 0;
    const unionDeduction = parseFloat(formData.unionDeduction) || 0;
    const nssf = parseFloat(formData.nssf) || 0;
    const basicSalary1 = parseFloat(formData.employee?.basicSalary1) || 0;

    const netSalaryUsd = totalSalary + severancePay - taxPayment - loanPension - unionDeduction - nssf - basicSalary1;
    
    const paidUsd = parseFloat(formData.paidSalaryUsd) || 0;
    const exchangeRate = parseFloat(formData.exchangeRate) || 4000;
    
    // Calculate Riel from the remainder
    let netSalaryRiel = (netSalaryUsd - paidUsd) * exchangeRate;
    if (netSalaryRiel > 0) {
       netSalaryRiel = Math.floor(netSalaryRiel / 100) * 100; // Round down to nearest 100 Riel
    } else {
       netSalaryRiel = 0;
    }

    setFormData((prev: any) => ({
      ...prev,
      totalSalary,
      severancePay,
      netSalaryUsd,
      netSalaryRiel
    }));
     
  }, [
    formData.workingSalary, formData.payScaleIncentive, formData.otWage, formData.sunOtWage, 
    formData.nightOtWage, formData.annualLeaveAmount, formData.attendanceBonus, formData.transportation, 
    formData.lunchAllowance, formData.otMealAllowance, formData.dayCareAllowance, formData.seniority, 
    formData.seniorityIndemnity, formData.productionIncentive, formData.adjustmentSkill, formData.otherAllowance,
    formData.taxPayment, formData.loanPension, formData.unionDeduction, formData.nssf, formData.exchangeRate,
    formData.paidSalaryUsd
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    // Allow empty string for deleting numbers, otherwise parse float if type is number
    let finalValue: string | number = value;
    let numValue = 0;
    
    if (type === 'number') {
      numValue = value === '' ? 0 : parseFloat(value) || 0;
      finalValue = numValue;
    } else {
      numValue = parseFloat(value) || 0; // Fallback for calculations if somehow needed
    }
    
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: finalValue };
      
      // 2025 Auto-Calculation Logic
      const basicSalary = parseFloat(updated.basicSalary) || 0;
      const dailyRate = basicSalary / 26;
      const hourlyRate = dailyRate / 8;
      
      if (name === 'workingDays') {
        updated.workingSalary = dailyRate * numValue;
        updated.lunchAllowance = numValue * 0.50; // 2000 Riel = $0.50
      }
      
      if (name === 'otHours') {
        updated.otWage = hourlyRate * 1.5 * numValue;
      }
      
      if (name === 'sunOtHours' || name === 'holidayOtHours') {
        updated.sunOtWage = hourlyRate * 2 * numValue;
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Save extra benefits as JSON
    const benefitsData = extraBenefits.filter(b => b.confirmed).map(b => ({ name: b.name, nameEn: b.nameEn, amount: b.amount }));
    const totalExtra = benefitsData.reduce((sum, b) => sum + b.amount, 0);
    
    const payload = {
      ...formData,
      otherAllowance: totalExtra,
      otherAllowanceDesc: JSON.stringify(benefitsData)
    };
    
    // Clean data for saving
    const dataToSave = { ...payload };
    delete dataToSave.id;
    delete dataToSave.employeeId;
    delete dataToSave.employee;
    delete dataToSave.createdAt;
    delete dataToSave.updatedAt;

    await updatePayrollRecord(payroll.id, dataToSave);
    setLoading(false);
    
    // Dynamically import Swal since this is a client component
    const Swal = (await import('sweetalert2')).default;
    Swal.fire({
      icon: 'success',
      title: 'ជោគជ័យ!',
      text: 'Payroll record updated successfully',
      timer: 2000,
      showConfirmButton: false
    });
    window.history.back();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Left Column: Earnings */}
        <div>
          <h3 className="kh-text" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>ប្រាក់ចំណូល (Earnings)</h3>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ព័ត៌មានមូលដ្ឋាន (Basic Info)</h4>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់គោល (B. Salary)</label>
            <input type="number" step="0.01" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Basic Pay Scale</label>
            <input type="number" step="0.01" name="basicPayScale" value={formData.basicPayScale} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>

          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>វត្តមាន និងការងារ (Attendance & Work)</h4>
          <div style={rowStyle}>
            <label className="kh-text">អវត្តមាន (Absent)</label>
            <input type="number" step="0.5" name="absentDays" value={formData.absentDays} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">មានច្បាប់ (Permission)</label>
            <input type="number" step="0.5" name="permissionDays" value={formData.permissionDays} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ម៉ោងធ្វើការ (Working Days)</label>
            <input type="number" step="0.5" name="workingDays" value={formData.workingDays} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់ខែធ្វើការ (W. Salary)</label>
            <input type="number" step="0.01" name="workingSalary" value={formData.workingSalary} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Pay Scale inc.</label>
            <input type="number" step="0.01" name="payScaleIncentive" value={formData.payScaleIncentive} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ថែមម៉ោង (Overtime)</h4>
          <div style={rowStyle}>
            <label className="kh-text">OT Hour</label>
            <input type="number" step="0.5" name="otHours" value={formData.otHours} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">OT Wage $</label>
            <input type="number" step="0.01" name="otWage" value={formData.otWage} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Sun OT Hour</label>
            <input type="number" step="0.5" name="sunOtHours" value={formData.sunOtHours} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Sun OT Wage $</label>
            <input type="number" step="0.01" name="sunOtWage" value={formData.sunOtWage} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Night OT Hour</label>
            <input type="number" step="0.5" name="nightOtHours" value={formData.nightOtHours} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">Night OT Wage $</label>
            <input type="number" step="0.01" name="nightOtWage" value={formData.nightOtWage} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          
          <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ប្រាក់ឧបត្ថម្ភ (Allowances)</h4>
          <div style={rowStyle}>
            <label className="kh-text">ច្បាប់ឈប់សម្រាក (Annual Leave)</label>
            <input type="number" step="0.01" name="annualLeaveAmount" value={formData.annualLeaveAmount} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">រង្វាន់ទៀងទាត់ (Att. Bonus)</label>
            <input type="number" step="0.01" name="attendanceBonus" value={formData.attendanceBonus} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់ធ្វើដំណើរ (Transport)</label>
            <input type="number" step="0.01" name="transportation" value={formData.transportation} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់អាហារ (Lunch)</label>
            <input type="number" step="0.01" name="lunchAllowance" value={formData.lunchAllowance} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់អាហារថែមម៉ោង (OT Meal)</label>
            <input type="number" step="0.01" name="otMealAllowance" value={formData.otMealAllowance} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់កូន (Day Care)</label>
            <input type="number" step="0.01" name="dayCareAllowance" value={formData.dayCareAllowance} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់អតីតភាព (Seniority)</label>
            <input type="number" step="0.01" name="seniority" value={formData.seniority} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">សំណងអតីតភាព (Indemnity)</label>
            <input type="number" step="0.01" name="seniorityIndemnity" value={formData.seniorityIndemnity} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">រង្វាន់ផលិតកម្ម (Prod. Incentive)</label>
            <input type="number" step="0.01" name="productionIncentive" value={formData.productionIncentive} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប្រាក់កែតម្រូវ (Adjustment)</label>
            <input type="number" step="0.01" name="adjustmentSkill" value={formData.adjustmentSkill} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>

          {/* Confirmed Extra Benefits appended here to look like standard rows */}
          {extraBenefits.filter(b => b.confirmed).map((benefit, index) => {
             const actualIndex = extraBenefits.indexOf(benefit);
             const displayName = benefit.nameEn ? `${benefit.name} (${benefit.nameEn})` : benefit.name;
             return (
               <div 
                 key={`confirmed-${actualIndex}`} 
                 style={{...rowStyle, cursor: 'pointer', transition: 'background-color 0.2s'}} 
                 onDoubleClick={() => removeExtraBenefit(actualIndex)} 
                 title="ចុចពីរដងជាប់គ្នាដើម្បីលុប (Double click to remove)"
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
               >
                 <label className="kh-text" style={{ cursor: 'inherit' }}>{displayName}</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <input type="number" step="0.01" value={benefit.amount} onChange={(e) => handleExtraBenefitChange(actualIndex, 'amount', e.target.value)} className="input-field" style={{ margin: 0, width: '120px' }} />
                 </div>
               </div>
             );
          })}

          {/* Dynamic Extra Benefits Drafts */}
          {extraBenefits.filter(b => !b.confirmed).length > 0 && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 className="kh-text" style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>អត្ថប្រយោជន៍កំពុងបន្ថែម (Draft Benefits)</h4>
              </div>
              
              {extraBenefits.map((benefit, index) => {
                if (benefit.confirmed) return null;
                return (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                     <input type="text" value={benefit.name} onChange={(e) => handleExtraBenefitChange(index, 'name', e.target.value)} className="input-field" style={{ margin: 0, flex: 1, padding: '8px' }} placeholder="ឈ្មោះខ្មែរ..." />
                     <input type="text" value={benefit.nameEn || ''} onChange={(e) => handleExtraBenefitChange(index, 'nameEn', e.target.value)} className="input-field" style={{ margin: 0, flex: 1, padding: '8px' }} placeholder="English Name..." />
                     <input type="number" step="0.01" value={benefit.amount === 0 ? '' : benefit.amount} onChange={(e) => handleExtraBenefitChange(index, 'amount', e.target.value)} className="input-field" style={{ margin: 0, width: '80px', padding: '8px' }} placeholder="$0.00" />
                     <button type="button" onClick={() => confirmExtraBenefit(index)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }} title="យល់ព្រម (Confirm)">✓</button>
                     <button type="button" onClick={() => removeExtraBenefit(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }} title="លុប (Remove)">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Deductions & Totals */}
        <div>
          <h3 className="kh-text" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>ការកាត់ប្រាក់ និងសរុប (Deductions & Totals)</h3>
          
          <div style={rowStyle}>
            <label className="kh-text">ពន្ធ (Tax Payment)</label>
            <input type="number" step="0.01" name="taxPayment" value={formData.taxPayment} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ខ្ចីប្រាក់ (Loan/Pension)</label>
            <input type="number" step="0.01" name="loanPension" value={formData.loanPension} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">សហជីព (Union Deduction)</label>
            <input type="number" step="0.01" name="unionDeduction" value={formData.unionDeduction} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>
          <div style={rowStyle}>
            <label className="kh-text">ប.ស.ស (NSSF)</label>
            <input type="number" step="0.01" name="nssf" value={formData.nssf} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px' }} />
          </div>

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ ...rowStyle, fontWeight: 'bold' }}>
              <label className="kh-text">ប្រាក់ខែសរុប (Total Salary)</label>
              <span>${formData.totalSalary?.toFixed(2)}</span>
            </div>
            <div style={rowStyle}>
              <label className="kh-text">SX Severance (5%)</label>
              <span>${formData.severancePay?.toFixed(2)}</span>
            </div>
            <div style={{ ...rowStyle, fontWeight: 'bold', color: '#166534', marginTop: '10px', fontSize: '1.2rem' }}>
              <label className="kh-text">ប្រាក់ខែត្រូវបើក (Net USD)</label>
              <span>${formData.netSalaryUsd?.toFixed(2)}</span>
            </div>
            <div style={{ ...rowStyle, marginTop: '10px' }}>
              <label className="kh-text">ប្រាក់ត្រូវបើកជាក់ស្តែង (Paid USD)</label>
              <input type="number" step="0.01" name="paidSalaryUsd" value={formData.paidSalaryUsd} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px', padding: '4px', border: '1px solid #166534' }} />
            </div>
            <div style={rowStyle}>
              <label className="kh-text">អត្រាប្តូរប្រាក់ (Exchange Rate)</label>
              <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="input-field" style={{ margin: 0, width: '120px', padding: '4px' }} />
            </div>
            <div style={{ ...rowStyle, fontWeight: 'bold', color: '#166534', marginTop: '10px', fontSize: '1.2rem' }}>
              <label className="kh-text">ប្រាក់រៀល (Net Riel)</label>
              <span>៛{formData.netSalaryRiel?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', alignItems: 'center' }}>
        <button type="submit" disabled={loading} className="btn-primary kh-text">
          {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
        </button>
        
        <button type="button" onClick={addExtraBenefit} className="btn-secondary kh-text" style={{ background: '#10b981', color: 'white', border: 'none' }}>
          + បន្ថែមអត្ថប្រយោជន៍ផ្សេងៗ (Add Extra Benefit)
        </button>

        <button type="button" onClick={() => window.history.back()} className="btn-secondary kh-text">
          ត្រឡប់ក្រោយ (Back)
        </button>
      </div>
    </form>
  );
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' };
