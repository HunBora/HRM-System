'use client'
import { useState } from 'react';
import { createEmployee, updateEmployee } from '@/app/dashboard/employees/actions';

export default function EmployeeForm({ employee, t }: { employee?: any, t: any }) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <form action={employee ? updateEmployee : createEmployee} onSubmit={() => setLoading(true)} className="card" style={{ maxWidth: '1000px' }}>
      {employee && <input type="hidden" name="id" value={employee.id} />}
      
      {/* 1. ព័ត៌មានទូទៅ (Personal Information) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ១. ព័ត៌មានទូទៅ (Personal Information)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឈ្មោះខ្មែរ (Name Khmer)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" name="lastNameKh" defaultValue={employee?.lastNameKh} placeholder="នាមត្រកូល" className="input-field kh-text" />
            <input type="text" name="firstNameKh" defaultValue={employee?.firstNameKh} placeholder="នាមខ្លួន" className="input-field kh-text" />
          </div>
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឈ្មោះឡាតាំង (Name English) *</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" name="lastNameEn" defaultValue={employee?.lastNameEn} placeholder="Last Name" className="input-field" required />
            <input type="text" name="firstNameEn" defaultValue={employee?.firstNameEn} placeholder="First Name" className="input-field" required />
          </div>
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ភេទ (Sex) *</label>
          <select name="gender" defaultValue={employee?.gender || 'ប្រុស'} className="input-field kh-text" required>
            <option value="ប្រុស">{t.employee.form.male}</option>
            <option value="ស្រី">{t.employee.form.female}</option>
          </select>
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)</label>
          <input type="date" name="dob" defaultValue={formatDate(employee?.dob)} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ទីកន្លែងកំណើត (Place of Birth)</label>
          <input type="text" name="placeOfBirth" defaultValue={employee?.placeOfBirth} className="input-field kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>អាស័យដ្ឋានបច្ចុប្បន្ន (Address)</label>
          <input type="text" name="address" defaultValue={employee?.address} className="input-field kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>លេខទូរស័ព្ទ (Phone)</label>
          <input type="tel" name="phone" defaultValue={employee?.phone} className="input-field" />
        </div>
      </div>

      {/* 2. ព័ត៌មានគ្រួសារ (Family Information) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ២. ព័ត៌មានគ្រួសារ (Family Information)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ស្ថានភាពគ្រួសារ (Marital Status)</label>
          <select name="maritalStatus" defaultValue={employee?.maritalStatus || 'SINGLE'} className="input-field kh-text">
            <option value="SINGLE">នៅលីវ (Single)</option>
            <option value="MARRIED">រៀបការរួច (Married)</option>
          </select>
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ឈ្មោះប្តី/ប្រពន្ធ (Spouse Name)</label>
          <input type="text" name="spouseName" defaultValue={employee?.spouseName} className="input-field kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ចំនួនកូន (Number of Children)</label>
          <input type="number" name="numberOfChildren" defaultValue={employee?.numberOfChildren || 0} min="0" className="input-field" />
        </div>
      </div>

      {/* 3. ព័ត៌មានការងារ (Employment Details) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ៣. ព័ត៌មានការងារ (Employment Details)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>អត្តលេខ (Emp ID) *</label>
          <input type="text" name="employeeId" defaultValue={employee?.employeeId} className="input-field" required />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>លេខកាត (Card No)</label>
          <input type="text" name="cardNo" defaultValue={employee?.cardNo} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ថ្ងៃចូលធ្វើការ (Join Date) *</label>
          <input type="date" name="hireDate" defaultValue={formatDate(employee?.hireDate)} className="input-field" required />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ផ្នែក (Department) *</label>
          <input type="text" name="department" defaultValue={employee?.department} className="input-field kh-text" required />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>មុខងារ (Position) *</label>
          <input type="text" name="position" defaultValue={employee?.position} className="input-field kh-text" required />
        </div>
      </div>

      {/* 4. កិច្ចសន្យាការងារ (Contracts) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ៤. កិច្ចសន្យាការងារ (Contracts)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>កិច្ចសន្យាសាកល្បង ចាប់ផ្តើម<br/>(Probation Start)</label>
          <input type="date" name="probationStart" defaultValue={formatDate(employee?.probationStart)} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>កិច្ចសន្យាសាកល្បង បញ្ចប់<br/>(Probation End)</label>
          <input type="date" name="probationEnd" defaultValue={formatDate(employee?.probationEnd)} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>កិច្ចសន្យាការងារ លើកទី១<br/>(Regular Contract 1st)</label>
          <input type="date" name="regularContract1" defaultValue={formatDate(employee?.regularContract1)} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>កិច្ចសន្យាការងារ លើកទី២<br/>(Regular Contract 2nd)</label>
          <input type="date" name="regularContract2" defaultValue={formatDate(employee?.regularContract2)} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>កិច្ចសន្យាការងារ លើកទី៣<br/>(Regular Contract 3rd)</label>
          <input type="date" name="regularContract3" defaultValue={formatDate(employee?.regularContract3)} className="input-field" />
        </div>
      </div>

      {/* 5. ប្រាក់បៀវត្សរ៍ និងប្រាក់រង្វាន់ (Salaries & Allowances) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ៥. ប្រាក់បៀវត្សរ៍ និងប្រាក់រង្វាន់ (Salaries & Allowances)
      </h3>
      
      {/* Basic Salary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់បៀវត្សរ៍ គោល (Basic Salary) *</label>
          <input type="number" step="0.01" name="basicSalary" defaultValue={employee?.basicSalary} className="input-field" required />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់បៀវត្សរ៍ លើកទី១ (Basic Salary 1st)</label>
          <input type="number" step="0.01" name="basicSalary1" defaultValue={employee?.basicSalary1} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់បៀវត្សរ៍ លើកទី២ (Basic Salary 2nd)</label>
          <input type="number" step="0.01" name="basicSalary2" defaultValue={employee?.basicSalary2} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់បៀវត្សរ៍ លើកទី៣ (Basic Salary 3rd)</label>
          <input type="number" step="0.01" name="basicSalary3" defaultValue={employee?.basicSalary3} className="input-field" />
        </div>
      </div>

      {/* Skill Allowance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់ជំនាញ លើកទី១ (Skill Allowance 1st)</label>
          <input type="number" step="0.01" name="skillAllowance1" defaultValue={employee?.skillAllowance1} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់ជំនាញ លើកទី២ (Skill Allowance 2nd)</label>
          <input type="number" step="0.01" name="skillAllowance2" defaultValue={employee?.skillAllowance2} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់ជំនាញ លើកទី៣ (Skill Allowance 3rd)</label>
          <input type="number" step="0.01" name="skillAllowance3" defaultValue={employee?.skillAllowance3} className="input-field" />
        </div>
      </div>

      {/* Position Allowance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់មុខងារ លើកទី១ (Position Allowance 1st)</label>
          <input type="number" step="0.01" name="positionAllowance1" defaultValue={employee?.positionAllowance1} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់មុខងារ លើកទី២ (Position Allowance 2nd)</label>
          <input type="number" step="0.01" name="positionAllowance2" defaultValue={employee?.positionAllowance2} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ប្រាក់មុខងារ លើកទី៣ (Position Allowance 3rd)</label>
          <input type="number" step="0.01" name="positionAllowance3" defaultValue={employee?.positionAllowance3} className="input-field" />
        </div>
      </div>

      {/* 6. ឯកសារ និងព័ត៌មានផ្សេងៗ (Documents & Others) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ៦. ឯកសារ និងព័ត៌មានផ្សេងៗ (Documents & Others)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>លេខអត្តសញ្ញាណប័ណ្ណ (National ID)</label>
          <input type="text" name="nationalId" defaultValue={employee?.nationalId} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>កម្រិតវប្បធម៌ (Education)</label>
          <input type="text" name="education" defaultValue={employee?.education} className="input-field kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>លេខកាតធនាគារ (Bank Card No)</label>
          <input type="text" name="bankCardNo" defaultValue={employee?.bankCardNo} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>លេខ ប.ស.ស (NSSF No)</label>
          <input type="text" name="nssfNo" defaultValue={employee?.nssfNo} className="input-field" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>សៀវភៅសុខភាព (Health Book)</label>
          <input type="text" name="healthBook" defaultValue={employee?.healthBook} className="input-field kh-text" />
        </div>
        <div>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>សំបុត្រពេទ្យ (Health Certificate)</label>
          <input type="text" name="healthCertificate" defaultValue={employee?.healthCertificate} className="input-field kh-text" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="kh-text" style={{ display: 'block', marginBottom: '8px' }}>ផ្សេងៗ (Remark)</label>
          <textarea name="remark" defaultValue={employee?.remark} className="input-field kh-text" rows={2}></textarea>
        </div>
      </div>
      
      {/* 7. រូបថត (Photo) */}
      <h3 className="kh-text" style={{ marginBottom: '15px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        ៧. រូបថត (Profile Photo)
      </h3>
      <div style={{ marginBottom: '30px' }}>
        {employee?.photoUrl && (
          <div style={{ marginBottom: '10px' }}>
            <img src={employee.photoUrl} alt="Profile" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
        )}
        <input type="file" name="photo" accept="image/*" className="input-field" />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="submit" className="btn-primary kh-text" disabled={loading} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
          {loading ? t.employee.form.saving : t.employee.form.save}
        </button>
        <button type="button" onClick={() => window.history.back()} className="btn-secondary kh-text" disabled={loading} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
          {t.employee.form.cancel}
        </button>
      </div>
    </form>
  );
}
