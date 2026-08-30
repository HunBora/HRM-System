import { getDictionary } from '@/i18n/getDictionary';
import styles from '../kpi.module.css';
import { prisma } from '@/lib/prisma';
import EmployeeSearchInput from '@/components/EmployeeSearchInput';
import TimeSheetCalculator from '@/components/TimeSheetCalculator';
import { submitKpi } from '../actions';

export default async function KpiSettingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await getDictionary();
  const resolvedSearchParams = await searchParams;
  const employees = await prisma.employee.findMany({
    select: { id: true, employeeId: true, firstNameKh: true, lastNameKh: true, firstNameEn: true, lastNameEn: true, department: true },
    orderBy: { createdAt: 'desc' }
  });

  const masterKpis = await prisma.masterKpi.findMany({
    orderBy: { kpiType: 'asc' }
  });

  return (
    <div className={styles.dashboardContainer} style={{ alignItems: 'flex-start' }}>
      
      <div className="card" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        
        <h3 className="kh-text" style={{ marginBottom: '20px', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
          {t.kpi.setting.title}
        </h3>

        {resolvedSearchParams?.error === 'missing_fields' && (
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '5px', marginBottom: '20px' }} className="kh-text">
            សូមបំពេញព័ត៌មានដែលចាំបាច់អោយបានគ្រប់គ្រាន់។
          </div>
        )}
        {resolvedSearchParams?.error === 'db_error' && (
          <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '5px', marginBottom: '20px' }} className="kh-text">
            មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។
          </div>
        )}

        <form action={submitKpi}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            <EmployeeSearchInput 
              employees={employees} 
              masterKpis={masterKpis}
              labels={{ 
                refDoc: t.kpi.setting.refDoc, 
                employee: t.kpi.setting.employee,
                docDate: t.kpi.setting.docDate
              }} 
            />

            {/* KPI Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                {t.kpi.setting.kpiDesc}
              </label>
              <textarea name="description" className="input-field kh-text" placeholder="ពិពណ៌នា KPI" rows={2}></textarea>
            </div>

            {/* Measure % */}
            <div>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                {t.kpi.setting.measure}
              </label>
              <input type="text" name="measurePercent" className="input-field kh-text" placeholder="វាស់វែង %" />
            </div>

            {/* Target */}
            <div>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                {t.kpi.setting.target}
              </label>
              <select name="target" className="input-field kh-text">
                <option value="">ជ្រើសរើសគោលដៅ (Target)</option>
                <option value="100%">100%</option>
                <option value=">= 95%">&gt;= 95%</option>
                <option value=">= 90%">&gt;= 90%</option>
                <option value="<= 5%">&lt;= 5%</option>
              </select>
            </div>

            {/* Actual / Achieved */}
            <div>
              <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                {t.kpi.setting.actual}
              </label>
              <input type="number" step="0.01" name="actual" className="input-field kh-text" defaultValue="0.0" />
            </div>

            {/* New Time Sheet */}
            <div style={{ gridColumn: '1 / -1', paddingBottom: '5px' }}>
              <details style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <summary style={{ padding: '12px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', listStyle: 'none' }} className="formula-summary">
                  <span className="kh-text" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{t.kpi.setting.timeSheet}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-muted)' }}>⌄</span>
                </summary>
                
                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <TimeSheetCalculator />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ចំណាំ (Remark)</label>
                    <input type="text" name="tsRemark" className="input-field kh-text" placeholder="ចំណាំ..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="kh-text" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ឯកសារភ្ជាប់ (Attach File) <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Max: 5MB)</span></label>
                    <input type="file" name="tsFile" className="input-field kh-text" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" style={{ paddingTop: '8px' }} />
                  </div>
                </div>
              </details>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button type="submit" className="btn-primary kh-text" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
              {t.kpi.setting.submitBtn}
            </button>
            <button type="button" className="btn-secondary kh-text" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
              បោះបង់ (Cancel)
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
