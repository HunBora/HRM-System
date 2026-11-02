import { getDictionary } from '@/i18n/getDictionary';
import styles from './kpi.module.css';
import KpiExportImportButtons from './approval/KpiExportImportButtons';
import DepartmentAssignments from './DepartmentAssignments';
import { DepartmentKpiDetail } from './DepartmentDetailModal';
import { prisma } from '@/lib/prisma';

export default async function KpiPage() {
  const t = await getDictionary();

  // Fetch registered employees from DB for department assignment roster
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstNameKh: true,
      lastNameKh: true,
      firstNameEn: true,
      lastNameEn: true,
      department: true,
      position: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Department KPIs with rich details for interactive view
  const departments: DepartmentKpiDetail[] = [
    {
      name: 'IT & Engineering',
      icon: '💻',
      score: 96,
      manager: 'IT Director / Systems Lead',
      headcount: '12 នាក់',
      category: 'Technology & Infrastructure',
      kpis: [
        {
          name: t.kpi.items.attendanceRate,
          target: '>=98%',
          current: 97,
          actualText: '97.2%',
          color: '#3b82f6',
          weight: '25%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបានល្អ',
          formula: '(ម៉ោងជាក់ស្តែង ÷ ម៉ោងការងារតាមកាលវិភាគ) × 100'
        },
        {
          name: t.kpi.items.turnover,
          target: '<=5%',
          current: 95,
          actualText: '2.1%',
          color: '#10b981',
          weight: '25%',
          frequency: 'ប្រចាំត្រីមាស (Quarterly)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបាន',
          formula: '(ចំនួនបុគ្គលិកឈប់ ÷ បុគ្គលិកសរុបជាមធ្យម) × 100'
        },
        {
          name: 'ភាពដំណើរការនៃប្រព័ន្ធ ERP & Network (System Uptime)',
          target: '>=99%',
          current: 99,
          actualText: '99.5%',
          color: '#8b5cf6',
          weight: '30%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'ឆ្នើម (Outstanding)',
          formula: '(ម៉ោងប្រព័ន្ធដំណើរការ ÷ ម៉ោងសរុប) × 100'
        },
        {
          name: 'ការបណ្តុះបណ្តាលសន្តិសុខព័ត៌មាន (IT Security Training)',
          target: '100%',
          current: 92,
          actualText: '92.0%',
          color: '#06b6d4',
          weight: '20%',
          frequency: 'ប្រចាំឆ្នាំ (Annual)',
          status: 'ON_TRACK',
          statusText: 'កំពុងអនុវត្ត',
          formula: '(បុគ្គលិកបានរៀន ÷ បុគ្គលិកទាំងអស់) × 100'
        }
      ],
      quarterlyGoals: [
        { quarter: 'Q1 (ត្រីមាសទី ១)', title: 'ធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ ERP & បណ្តាញ Network', target: '95%', progress: 98, status: 'សម្រេចបាន' },
        { quarter: 'Q2 (ត្រីមាសទី ២)', title: 'រៀបចំប្រព័ន្ធ Auto Backup & Cloud Security', target: '98%', progress: 95, status: 'កំពុងអនុវត្ត' },
        { quarter: 'Q3 (ត្រីមាសទី ៣)', title: 'សវនកម្មប្រព័ន្ធការពារទិន្នន័យ (ISO 27001 standard)', target: '99%', progress: 85, status: 'គ្រោងទុក' },
        { quarter: 'Q4 (ត្រីមាសទី ៤)', title: 'វាយតម្លៃប្រសិទ្ធភាពប្រព័ន្ធ & ស្ទង់មតិអ្នកប្រើប្រាស់', target: '100%', progress: 60, status: 'គ្រោងទុក' },
      ],
      actionPlans: [
        'រៀបចំប្រព័ន្ធត្រួតពិនិត្យ Server Uptime ២៤/៧ ដើម្បីទប់ស្កាត់ការរអាក់រអួល។',
        'ផ្តល់វគ្គបណ្តុះបណ្តាលខ្លីៗស្តីពី Cybersecurity & Phishing Prevention ដល់គ្រប់ផ្នែក។',
        'ពន្លឿនការដោះស្រាយបញ្ហា Helpdesk សំបុត្រជំនួយបច្ចេកទេសក្នុងរង្វង់ក្រោម ២ ម៉ោង។'
      ]
    },
    {
      name: 'Human Resources',
      icon: '👥',
      score: 92,
      manager: 'HR Manager',
      headcount: '8 នាក់',
      category: 'Human Capital & Administration',
      kpis: [
        {
          name: t.kpi.items.leadTime,
          target: '<=30 Days',
          current: 90,
          actualText: '26 ថ្ងៃ',
          color: '#8b5cf6',
          weight: '30%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបាន',
          formula: 'កាលបរិច្ឆេទជ្រើសបាន - កាលបរិច្ឆេទប្រកាស'
        },
        {
          name: t.kpi.items.satisfaction,
          target: '>=85%',
          current: 88,
          actualText: '88.5%',
          color: '#f59e0b',
          weight: '25%',
          frequency: 'ប្រចាំឆមាស (Biannual)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបានល្អ',
          formula: '(ចម្លើយពេញចិត្ត ÷ ចម្លើយសរុបនៃការស្ទង់មតិ) × 100'
        },
        {
          name: 'ភាពត្រឹមត្រូវនៃប្រាក់បៀវត្សរ៍ (Payroll Accuracy)',
          target: '100%',
          current: 99,
          actualText: '99.8%',
          color: '#10b981',
          weight: '25%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'ឆ្នើម (Outstanding)',
          formula: '(ចំនួនវិក្កយបត្រត្រឹមត្រូវ ១០០% ÷ បុគ្គលិកសរុប) × 100'
        },
        {
          name: 'អត្រាចូលរួមបណ្តុះបណ្តាលបុគ្គលិក (Training Attendance)',
          target: '>=95%',
          current: 91,
          actualText: '91.2%',
          color: '#3b82f6',
          weight: '20%',
          frequency: 'ប្រចាំត្រីមាស (Quarterly)',
          status: 'ON_TRACK',
          statusText: 'កំពុងអនុវត្ត',
          formula: '(អ្នកចូលរួមជាក់ស្តែង ÷ ចំនួនគោលដៅ) × 100'
        }
      ],
      quarterlyGoals: [
        { quarter: 'Q1 (ត្រីមាសទី ១)', title: 'ជ្រើសរើសកម្លាំងពលកម្មផលិតកម្មបំពេញតាមតម្រូវការ', target: '90%', progress: 94, status: 'សម្រេចបាន' },
        { quarter: 'Q2 (ត្រីមាសទី ២)', title: 'អនុវត្តកម្មវិធីវាយតម្លៃ 360 Degree Appraisal', target: '95%', progress: 92, status: 'កំពុងអនុវត្ត' },
        { quarter: 'Q3 (ត្រីមាសទី ៣)', title: 'ស្ទង់មតិសុខុមាលភាព & បរិយាកាសការងារ', target: '90%', progress: 75, status: 'គ្រោងទុក' },
        { quarter: 'Q4 (ត្រីមាសទី ៤)', title: 'សរុបរបាយការណ៍ KPI ប្រចាំឆ្នាំ & ផែនការប្រាក់លើកទឹកចិត្ត', target: '100%', progress: 50, status: 'គ្រោងទុក' },
      ],
      actionPlans: [
        'ពង្រឹងកិច្ចសហការជាមួយសាលាបណ្តុះបណ្តាលវិជ្ជាជីវៈដើម្បីទាក់ទាញបុគ្គលិកជំនាញ។',
        'រៀបចំប្រព័ន្ធ Digital Appraisal ដើម្បីសម្រួលដល់ការវាយតម្លៃឱ្យកាន់តែរហ័ស និងតម្លាភាព។',
        'តាមដាន និងដោះស្រាយកង្វល់បុគ្គលិកទាន់ពេលវេលាដើម្បីកាត់បន្ថយអត្រាចាកចេញ។'
      ]
    },
    {
      name: 'Production',
      icon: '🏭',
      score: 85,
      manager: 'Factory Director / Production Head',
      headcount: '240 នាក់',
      category: 'Manufacturing & Operations',
      kpis: [
        {
          name: t.kpi.items.attendanceRate,
          target: '>=98%',
          current: 92,
          actualText: '92.4%',
          color: '#3b82f6',
          weight: '25%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ON_TRACK',
          statusText: 'ល្អបង្គួរ',
          formula: '(ថ្ងៃវត្តមានជាក់ស្តែង ÷ ថ្ងៃធ្វើការសរុប) × 100'
        },
        {
          name: t.kpi.items.turnover,
          target: '<=5%',
          current: 85,
          actualText: '6.4%',
          color: '#10b981',
          weight: '25%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'NEEDS_ATTENTION',
          statusText: 'ត្រូវការយកចិត្តទុកដាក់',
          formula: '(ចំនួនកម្មករឈប់ ÷ ចំនួនកម្មករជាមធ្យម) × 100'
        },
        {
          name: t.kpi.items.training,
          target: '100%',
          current: 75,
          actualText: '75.0%',
          color: '#ef4444',
          weight: '25%',
          frequency: 'ប្រចាំត្រីមាស (Quarterly)',
          status: 'NEEDS_ATTENTION',
          statusText: 'យឺតជាងផែនការ',
          formula: '(កម្មករបានឆ្លងកាត់ការបណ្តុះបណ្តាល ÷ គោលដៅ) × 100'
        },
        {
          name: 'ទិន្នផលសម្រេចតាមខ្សែចង្វាក់ផលិតកម្ម (Production Efficiency)',
          target: '>=95%',
          current: 88,
          actualText: '88.3%',
          color: '#f59e0b',
          weight: '25%',
          frequency: 'ប្រចាំថ្ងៃ/សប្តាហ៍',
          status: 'ON_TRACK',
          statusText: 'កំពុងកែលម្អ',
          formula: '(ចំនួនទំនិញសម្រេច ÷ ផែនការផលិតកម្ម) × 100'
        }
      ],
      quarterlyGoals: [
        { quarter: 'Q1 (ត្រីមាសទី ១)', title: 'ទប់ស្កាត់ការអវត្តមាន និងពង្រឹងវិន័យការងារលើខ្សែចង្វាក់', target: '90%', progress: 85, status: 'កំពុងអនុវត្ត' },
        { quarter: 'Q2 (ត្រីមាសទី ២)', title: 'ពន្លឿនវគ្គបណ្តុះបណ្តាលសុវត្ថិភាពការងារ & បច្ចេកទេសដេរ', target: '95%', progress: 75, status: 'កំពុងអនុវត្ត' },
        { quarter: 'Q3 (ត្រីមាសទី ៣)', title: 'បង្កើនទិន្នផលផលិតកម្មឱ្យដល់ ៩៥% និងកាត់បន្ថយ Waste', target: '95%', progress: 65, status: 'គ្រោងទុក' },
        { quarter: 'Q4 (ត្រីមាសទី ៤)', title: 'សម្រេចគោលដៅ Export តាមកាលកំណត់របស់ Buyer', target: '100%', progress: 40, status: 'គ្រោងទុក' },
      ],
      actionPlans: [
        'រៀបចំប្រព័ន្ធប្រាក់រង្វាន់លើកទឹកចិត្តវត្តមានទៀងទាត់ (Attendance Bonus) ឱ្យកាន់តែទាក់ទាញ។',
        'រៀបចំវគ្គ On-the-job Training រយៈពេលខ្លីនៅដើមម៉ោងធ្វើការ។',
        'ត្រួតពិនិត្យម៉ាស៊ីន និងសម្ភារៈឱ្យបានទៀងទាត់ដើម្បីកាត់បន្ថយ Downtime នៃផលិតកម្ម។'
      ]
    },
    {
      name: 'Quality Assurance',
      icon: '🔍',
      score: 98,
      manager: 'QA/QC Manager',
      headcount: '22 នាក់',
      category: 'Quality Control & Compliance',
      kpis: [
        {
          name: t.kpi.items.training,
          target: '100%',
          current: 100,
          actualText: '100%',
          color: '#ef4444',
          weight: '30%',
          frequency: 'ប្រចាំត្រីមាស (Quarterly)',
          status: 'ACHIEVED',
          statusText: 'ឆ្នើម (100%)',
          formula: '(អធិការកិច្ចគុណភាពបានឆ្លងកាត់ការប្រឡង ÷ ចំនួនសរុប) × 100'
        },
        {
          name: t.kpi.items.probation,
          target: '>=95%',
          current: 98,
          actualText: '98.5%',
          color: '#ec4899',
          weight: '25%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបាន',
          formula: '(បុគ្គលិកជាប់សាកល្បង ÷ បុគ្គលិកជ្រើសរើសថ្មី) × 100'
        },
        {
          name: 'អត្រាកំហុសផលិតផល (Defect Rate - AQL 2.5)',
          target: '<=1.5%',
          current: 99,
          actualText: '0.8%',
          color: '#10b981',
          weight: '25%',
          frequency: 'ប្រចាំថ្ងៃ (Daily)',
          status: 'ACHIEVED',
          statusText: 'ឆ្នើម (Outstanding)',
          formula: '(ចំនួនទំនិញខូច ÷ ចំនួនទំនិញត្រួតពិនិត្យ) × 100'
        },
        {
          name: 'ពេលវេលាឆ្លើយតបរបាយការណ៍អតិថិជន (Audit Response Time)',
          target: '<=24h',
          current: 95,
          actualText: '18 ម៉ោង',
          color: '#3b82f6',
          weight: '20%',
          frequency: 'ប្រចាំខែ (Monthly)',
          status: 'ACHIEVED',
          statusText: 'សម្រេចបានល្អ',
          formula: 'ម៉ោងសរុបក្នុងការឆ្លើយតប និងដោះស្រាយរបាយការណ៍ Audit'
        }
      ],
      quarterlyGoals: [
        { quarter: 'Q1 (ត្រីមាសទី ១)', title: 'អនុវត្តស្តង់ដារត្រួតពិនិត្យ AQL 2.5 លើគ្រប់ខ្សែបន្ទាត់', target: '98%', progress: 100, status: 'សម្រេចបាន' },
        { quarter: 'Q2 (ត្រីមាសទី ២)', title: 'វគ្គបណ្តុះបណ្តាល Defect Recognition ដល់ Inspector ទាំងអស់', target: '100%', progress: 98, status: 'សម្រេចបាន' },
        { quarter: 'Q3 (ត្រីមាសទី ៣)', title: 'សវនកម្មផ្ទៃក្នុងសម្រាប់ Brand Compliance & Sustainability', target: '99%', progress: 88, status: 'កំពុងអនុវត្ត' },
        { quarter: 'Q4 (ត្រីមាសទី ៤)', title: 'រក្សាអត្រាគ្មានទំនិញត្រូវបាន Return ពីអតិថិជន (Zero Return)', target: '100%', progress: 65, status: 'គ្រោងទុក' },
      ],
      actionPlans: [
        'រៀបចំប្រព័ន្ធត្រួតពិនិត្យគុណភាពចល័ត (Inline QA) ដើម្បីចាប់កំហុសតាំងពីដើមខ្សែបន្ទាត់។',
        'ធ្វើបច្ចុប្បន្នភាព Defect Catalog គំរូជាក់ស្តែងសម្រាប់អ្នកត្រួតពិនិត្យ។',
        'ប្រជុំប្រចាំសប្តាហ៍ជាមួយផ្នែកផលិតកម្មដើម្បីដោះស្រាយមូលហេតុឫសគល់នៃកំហុស (Root Cause Analysis)។'
      ]
    }
  ];

  const evidences = [
    t.kpi.evidence.policy,
    t.kpi.evidence.matrix,
    t.kpi.evidence.orgChart,
    t.kpi.evidence.jd,
    t.kpi.evidence.approvalRecord,
    t.kpi.evidence.managementApproval
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Actions */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={`${styles.headerTitle} kh-text`}>{t.kpi.title}</h1>
          <p className={`${styles.headerSubtitle} kh-text`}>
            {t.kpi.dashboard?.overview || "Dashboard Overview"}
          </p>
        </div>
        <div className={styles.headerActions}>
          <a
            href="/dashboard/performance"
            className={styles.appraisalBtn}
          >
            <span>🎯</span>
            <span className="kh-text">ការវាយតម្លៃបុគ្គលិក (Appraisal 360)</span>
          </a>
          <KpiExportImportButtons />
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>🏢</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.totalDepts || "Total Departments"}</h3>
            <p>4</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🎯</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.assignedKPIs || "Assigned KPIs"}</h3>
            <p>24</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} interactive-icon`} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>📈</div>
          <div className={styles.statInfo}>
            <h3 className="kh-text">{t.kpi.dashboard?.avgScore || "Average Score"}</h3>
            <p>92.7%</p>
          </div>
        </div>
      </div>

      {/* SMART Framework Section */}
      <div className={styles.smartSection}>
        <div className={styles.smartSectionTitle}>
          <span>🧠</span>
          <span className="kh-text">{t.kpi.smart?.title || "S.M.A.R.T Principles"}</span>
        </div>
        <div className={styles.smartGrid}>
          {['S', 'M', 'A', 'R', 'T'].map((letter) => {
            const smartKey = letter.toLowerCase() as 's' | 'm' | 'a' | 'r' | 't';
            const data = t.kpi.smart?.[smartKey];
            return (
              <div key={letter} className={styles.smartCard} data-type={letter}>
                <div className={styles.smartLetter}>{letter}</div>
                <div className={styles.smartCardContent}>
                  <div className={styles.smartTitle}>{data?.title || letter}</div>
                  <div className={`${styles.smartDesc} kh-text`} title={data?.desc}>{data?.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Grid with Interactive View Details Modal */}
      <DepartmentAssignments
        departments={departments}
        employees={employees}
        title={t.kpi.dashboard?.deptAssignments || "Department Assignments"}
        viewDetailsLabel={t.kpi.dashboard?.viewDetails || "View Details"}
      />

      {/* Evidence Section */}
      <div className={styles.evidenceSection}>
        <h2 className={`${styles.sectionTitle} kh-text`}>
          <span>📑</span> {t.kpi.evidenceTitle}
        </h2>
        <div className={styles.evidenceGrid}>
          {evidences.map((evidence, index) => (
            <div key={index} className={styles.evidenceItem} title={evidence}>
              <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>✓</span>
              <span className="kh-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{evidence}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
