'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

// Common Factory Position Translations
const POSITION_DICT: Record<string, { kh: string; en: string; zh: string }> = {
  staff: { kh: 'បុគ្គលិក', en: 'Staff', zh: '职员' },
  worker: { kh: 'កម្មករ', en: 'Worker', zh: '工人' },
  operator: { kh: 'កម្មករដេរ', en: 'Operator', zh: '车位工' },
  'sewing operator': { kh: 'កម្មករដេរ', en: 'Sewing Operator', zh: '车位工' },
  sewing: { kh: 'ជាងដេរ', en: 'Sewing', zh: '车位工' },
  qc: { kh: 'ត្រួតពិនិត្យគុណភាព', en: 'QC Inspector', zh: '品检员' },
  'qc inspector': { kh: 'ត្រួតពិនិត្យគុណភាព', en: 'QC Inspector', zh: '品检员' },
  qa: { kh: 'ធានាគុណភាព', en: 'QA Officer', zh: '品保员' },
  supervisor: { kh: 'ប្រធានផ្នែក', en: 'Supervisor', zh: '主管' },
  leader: { kh: 'មេក្រុម', en: 'Line Leader', zh: '组长' },
  'line leader': { kh: 'មេក្រុម', en: 'Line Leader', zh: '组长' },
  manager: { kh: 'ប្រធានចាត់ការ', en: 'Manager', zh: '经理' },
  'general manager': { kh: 'អគ្គនាយក', en: 'General Manager', zh: '总经理' },
  hr: { kh: 'មន្ត្រីរដ្ឋបាល', en: 'HR Officer', zh: '人事专员' },
  'hr officer': { kh: 'មន្ត្រីរដ្ឋបាល', en: 'HR Officer', zh: '人事专员' },
  admin: { kh: 'បុគ្គលិករដ្ឋបាល', en: 'Admin Staff', zh: '行政人员' },
  clerk: { kh: 'ស្មៀន', en: 'Clerk', zh: '文员' },
  accountant: { kh: 'គណនេយ្យករ', en: 'Accountant', zh: '会计师' },
  mechanic: { kh: 'ជាងម៉ាស៊ីន', en: 'Mechanic', zh: '机修工' },
  technician: { kh: 'ជាងបច្ចេកទេស', en: 'Technician', zh: '技术员' },
  cutter: { kh: 'ជាងកាត់', en: 'Cutter', zh: '裁剪工' },
  cutting: { kh: 'ផ្នែកកាត់', en: 'Cutting', zh: '裁剪工' },
  ironer: { kh: 'ជាងអ៊ុត', en: 'Ironer', zh: '整烫工' },
  packer: { kh: 'វេចខ្ចប់', en: 'Packer', zh: '包装工' },
  packing: { kh: 'វេចខ្ចប់', en: 'Packer', zh: '包装工' },
  warehouse: { kh: 'ឃ្លាំង', en: 'Warehouse Keeper', zh: '仓管员' },
  driver: { kh: 'អ្នកបើកបរ', en: 'Driver', zh: '司机' },
  security: { kh: 'សន្តិសុខ', en: 'Security Guard', zh: '保安' },
  cleaner: { kh: 'អនាម័យ', en: 'Cleaner', zh: '保洁员' }
};

const DEPARTMENT_DICT: Record<string, { kh: string; en: string; zh: string }> = {
  production: { kh: 'ផលិតកម្ម', en: 'Production', zh: '生产部' },
  sewing: { kh: 'ផ្នែកដេរ', en: 'Sewing Dept', zh: '缝纫部' },
  cutting: { kh: 'ផ្នែកកាត់', en: 'Cutting Dept', zh: '裁剪部' },
  packing: { kh: 'ផ្នែកវេចខ្ចប់', en: 'Packing Dept', zh: '包装部' },
  quality: { kh: 'ផ្នែកគុណភាព', en: 'Quality Dept', zh: '品质部' },
  qc: { kh: 'ផ្នែកត្រួតពិនិត្យ (QC)', en: 'QC Dept', zh: '品检部' },
  warehouse: { kh: 'ផ្នែកឃ្លាំង', en: 'Warehouse Dept', zh: '仓库部' },
  hr: { kh: 'រដ្ឋបាល & ធនធានមនុស្ស', en: 'HR & Admin', zh: '人事行政部' },
  admin: { kh: 'ផ្នែករដ្ឋបាល', en: 'Administration', zh: '行政部' },
  maintenance: { kh: 'ផ្នែកជួសជុល', en: 'Maintenance', zh: '机修部' },
  mechanic: { kh: 'ផ្នែកជាងម៉ាស៊ីន', en: 'Mechanic Dept', zh: '机修部' },
  finance: { kh: 'ផ្នែកហិរញ្ញវត្ថុ', en: 'Finance Dept', zh: '财务部' },
  accounting: { kh: 'ផ្នែកគណនេយ្យ', en: 'Accounting Dept', zh: '会计部' },
  sample: { kh: 'ផ្នែកគំរូ', en: 'Sample Room', zh: '样板房' },
  security: { kh: 'ផ្នែកសន្តិសុខ', en: 'Security Dept', zh: '保安部' },
};

function resolveTrilingual(value: string | undefined | null, dict: Record<string, { kh: string; en: string; zh: string }>) {
  if (!value) return { kh: 'N/A', en: 'N/A', zh: 'N/A' };
  const key = value.trim().toLowerCase();
  if (dict[key]) return dict[key];
  for (const [k, v] of Object.entries(dict)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { kh: value, en: value, zh: value };
}

function resolveGender(gender?: string) {
  const g = (gender || '').trim().toUpperCase();
  if (g === 'FEMALE' || g === 'ស្រី' || g === 'F') {
    return { kh: 'ស្រី', en: 'Female', zh: '女' };
  }
  return { kh: 'ប្រុស', en: 'Male', zh: '男' };
}

export type CardStyleType = 'wave-gold' | 'green-wave' | 'green-eco' | 'angular-tech' | 'corporate' | 'landscape' | 'executive';

interface CardStyleDef {
  id: CardStyleType;
  nameKh: string;
  isLandscape: boolean;
  icon: string;
  defaultPrimary: string;
  defaultAccent: string;
}

const CARD_STYLES: CardStyleDef[] = [
  { id: 'wave-gold', nameKh: '🌊 Royal Wave & Gold (គំរូទី ៤)', isLandscape: false, icon: '🌊', defaultPrimary: '#1e3a8a', defaultAccent: '#eab308' },
  { id: 'green-wave', nameKh: '🍃 Green & Gold Wave (គំរូទី ៥)', isLandscape: false, icon: '🍃', defaultPrimary: '#15803d', defaultAccent: '#eab308' },
  { id: 'green-eco', nameKh: '🌿 Green Eco-Diagonal (គំរូទី ១)', isLandscape: false, icon: '🌿', defaultPrimary: '#15803d', defaultAccent: '#eab308' },
  { id: 'angular-tech', nameKh: '🔷 Angular Tech Blue (គំរូទី ២)', isLandscape: false, icon: '🔷', defaultPrimary: '#0b2545', defaultAccent: '#0284c7' },
  { id: 'corporate', nameKh: '🏢 Modern Corporate', isLandscape: false, icon: '🏢', defaultPrimary: '#0a192f', defaultAccent: '#ef4444' },
  { id: 'landscape', nameKh: '🪪 Landscape 86x54mm', isLandscape: true, icon: '🪪', defaultPrimary: '#1e3a8a', defaultAccent: '#f59e0b' },
  { id: 'executive', nameKh: '👑 Executive Gold', isLandscape: false, icon: '👑', defaultPrimary: '#18181b', defaultAccent: '#eab308' }
];

// Barcode Component
function BarcodeSVG({ value }: { value: string }) {
  const bars = useMemo(() => {
    const str = value || 'EM-0001';
    const pattern = [2, 1, 1, 2];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      pattern.push((c % 3) + 1, ((c >> 1) % 2) + 1, ((c >> 3) % 3) + 1, 1);
    }
    pattern.push(2, 1, 2);
    return pattern;
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', height: '12px', gap: '1px', justifyContent: 'center' }}>
        {bars.map((w, idx) => (
          <div
            key={idx}
            style={{
              width: `${w * 1.1}px`,
              backgroundColor: idx % 2 === 0 ? '#0f172a' : 'transparent',
              flexShrink: 0
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '5.5px', fontFamily: 'monospace', letterSpacing: '0.8px', marginTop: '1px', color: '#64748b', fontWeight: 600 }}>
        *{value}*
      </div>
    </div>
  );
}

export default function BatchIDCardsClient({
  initialEmployees,
  departments,
  initialDept,
  settings
}: {
  initialEmployees: any[];
  departments: string[];
  initialDept?: string;
  settings?: any;
}) {
  // Filters & Selection
  const [selectedDept, setSelectedDept] = useState(initialDept || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialEmployees.map((e) => e.id))
  );

  // Style & Theme Configurations
  const [cardStyle, setCardStyle] = useState<CardStyleType>('wave-gold');
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');
  const [accentColor, setAccentColor] = useState('#eab308');
  const [cardBg, setCardBg] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontScale, setFontScale] = useState(1.0);
  const [showBarcode, setShowBarcode] = useState(true);

  // Print Layout
  const [printLayout, setPrintLayout] = useState<'a4-grid' | 'single-tray'>('a4-grid');
  const [printSides, setPrintSides] = useState<'both' | 'front-only' | 'back-only'>('both');

  // Export Progress
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Company Name
  const companyName = settings?.companyName || 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD.';
  const defaultCompanyKh = useMemo(() => {
    if (companyName.toUpperCase().includes('G.S') || companyName.toUpperCase().includes('TEXTILE')) {
      return 'ជី.អេស ថិកស្តាយ ហ្គាមិន (ខេមបូឌា)';
    }
    return companyName;
  }, [companyName]);

  const defaultCompanyZh = useMemo(() => {
    if (companyName.toUpperCase().includes('G.S') || companyName.toUpperCase().includes('TEXTILE')) {
      return '金边纺织制衣（柬埔寨）有限公司';
    }
    return '';
  }, [companyName]);

  const [companyKh, setCompanyKh] = useState(defaultCompanyKh);
  const [companyEn, setCompanyEn] = useState(companyName);
  const [companyZh, setCompanyZh] = useState(defaultCompanyZh);
  const [tagline, setTagline] = useState('Excellence in Production');

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return initialEmployees.filter((emp) => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (emp.firstNameEn && emp.firstNameEn.toLowerCase().includes(q)) ||
        (emp.lastNameEn && emp.lastNameEn.toLowerCase().includes(q)) ||
        (emp.firstNameKh && emp.firstNameKh.includes(q)) ||
        (emp.lastNameKh && emp.lastNameKh.includes(q)) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q));
      return matchDept && matchSearch;
    });
  }, [initialEmployees, selectedDept, searchQuery]);

  // Selected Employees List
  const selectedEmployees = useMemo(() => {
    return filteredEmployees.filter((e) => selectedIds.has(e.id));
  }, [filteredEmployees, selectedIds]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Card dimensions
  const isLandscape = cardStyle === 'landscape';
  const cardW = isLandscape ? '86mm' : '54mm';
  const cardH = isLandscape ? '54mm' : '86mm';

  // Apply card style
  const handleSelectStyle = (s: CardStyleDef) => {
    setCardStyle(s.id);
    setPrimaryColor(s.defaultPrimary);
    setAccentColor(s.defaultAccent);
  };

  // Batch Export Multi-Page PDF
  const handleBatchExportPdf = async () => {
    if (selectedEmployees.length === 0) {
      alert('សូមជ្រើសរើសបុគ្គលិកយ៉ាងហោចណាស់ម្នាក់');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pdfW = isLandscape ? 86 : 54;
      const pdfH = isLandscape ? 54 : 86;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfW, pdfH]
      });

      for (let i = 0; i < selectedEmployees.length; i++) {
        const emp = selectedEmployees[i];
        setExportProgress(Math.round(((i + 1) / selectedEmployees.length) * 100));

        // Front Side
        if (printSides === 'both' || printSides === 'front-only') {
          const frontEl = document.getElementById(`batch-front-${emp.id}`);
          if (frontEl) {
            if (i > 0 || printSides === 'back-only') {
              pdf.addPage([pdfW, pdfH], isLandscape ? 'landscape' : 'portrait');
            }
            const canvas = await html2canvas(frontEl, { scale: 3.5, useCORS: true, backgroundColor: null });
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH);
          }
        }

        // Back Side
        if (printSides === 'both' || printSides === 'back-only') {
          const backEl = document.getElementById(`batch-back-${emp.id}`);
          if (backEl) {
            if (printSides === 'both' || (printSides === 'back-only' && i > 0)) {
              pdf.addPage([pdfW, pdfH], isLandscape ? 'landscape' : 'portrait');
            }
            const canvas = await html2canvas(backEl, { scale: 3.5, useCORS: true, backgroundColor: null });
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH);
          }
        }
      }

      pdf.save(`Batch-ID-Cards-${selectedDept}-${selectedEmployees.length}-cards.pdf`);
    } catch (err) {
      console.error('Batch PDF Export Error:', err);
      alert('មានបញ្ហាក្នុងការបង្កើត Batch PDF');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* External Web Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&family=Noto+Sans+Khmer:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap"
      />

      {/* Print Specific CSS for A4 Sheet Grid & PVC Card Tray */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #batch-print-area, #batch-print-area * {
            visibility: visible !important;
          }
          #batch-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .a4-sheet-page {
            display: grid !important;
            grid-template-columns: repeat(2, 54mm) !important;
            grid-gap: 8mm 12mm !important;
            justify-content: center !important;
            align-content: flex-start !important;
            padding: 8mm 6mm !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .single-tray-card {
            page-break-after: always !important;
            margin: 0 auto !important;
          }
          .id-card-cr80 {
            box-shadow: none !important;
            border: 0.5px solid #94a3b8 !important;
          }
          @page {
            size: ${printLayout === 'a4-grid' ? 'A4 portrait' : isLandscape ? '86mm 54mm' : '54mm 86mm'};
            margin: 0mm;
          }
        }
      `}</style>

      {/* Header Toolbar */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--card-bg, #ffffff)',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.05))',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/dashboard/employees"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            ← ត្រឡប់ទៅបញ្ជីបុគ្គលិក
          </Link>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }} className="kh-text">
              🖨️ បោះពុម្ពកាតបុគ្គលិកជាដុំ (Batch ID Cards Print)
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', margin: '2px 0 0 0' }}>
              កំណត់ចំនួនបោះពុម្ពកាតបានច្រើនក្នុងពេលតែមួយ • ជ្រើសរើសតាមផ្នែក • ប្លង់ A4 (៨ កាត/សន្លឹក) ឬ PVC Tray
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '12.5px', fontWeight: 700, color: '#1e40af' }}>
            បានជ្រើសរើស: {selectedEmployees.length} / {filteredEmployees.length} នាក់
          </div>

          <button
            onClick={() => window.print()}
            disabled={selectedEmployees.length === 0}
            style={{
              padding: '9px 18px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
            }}
          >
            🖨️ បោះពុម្ពទាំងអស់ ({selectedEmployees.length} នាក់)
          </button>

          <button
            onClick={handleBatchExportPdf}
            disabled={isExporting || selectedEmployees.length === 0}
            style={{
              padding: '9px 18px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isExporting || selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
            }}
          >
            📑 {isExporting ? `កំពុង Render... ${exportProgress}%` : `ទាញយក PDF រួម (${selectedEmployees.length})`}
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div
        className="no-print"
        style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Row 1: Filter by Department + Search + Selection Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>🏢 ផ្នែក (Department):</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
              >
                <option value="ALL">ទាំងអស់ (បុគ្គលិកសរុប {initialEmployees.length} នាក់)</option>
                {departments.map((d) => {
                  const count = initialEmployees.filter((e) => e.department === d).length;
                  return (
                    <option key={d} value={d}>
                      {d} ({count} នាក់)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="🔍 ស្វែងរកឈ្មោះ ឬ ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              ✓ ជ្រើសរើសទាំងអស់ ({filteredEmployees.length})
            </button>
            <button
              onClick={handleDeselectAll}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              ✕ ដោះការជ្រើសរើស
            </button>
          </div>
        </div>

        {/* Row 2: Card Style Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Style កាត:</span>
          {CARD_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectStyle(s)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: cardStyle === s.id ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                backgroundColor: cardStyle === s.id ? '#f5f3ff' : '#ffffff',
                color: cardStyle === s.id ? '#4f46e5' : '#475569',
                fontWeight: cardStyle === s.id ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{s.icon}</span>
              <span>{s.nameKh.split('(')[0]}</span>
            </button>
          ))}
        </div>

        {/* Row 3: Print Layout Settings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#475569', marginRight: '6px' }}>📄 ប្លង់ក្រដាស:</span>
              <select
                value={printLayout}
                onChange={(e) => setPrintLayout(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              >
                <option value="a4-grid">សន្លឹក A4 (៨ កាតក្នុង ១ ទំព័រ - ស័ក្តិសមក្រដាសរូបថត)</option>
                <option value="single-tray">កាតទោល (PVC Card Tray - ម៉ាស៊ីនព្រីនកាត)</option>
              </select>
            </div>

            <div>
              <span style={{ fontWeight: 700, color: '#475569', marginRight: '6px' }}>📑 ផ្នែកបោះពុម្ព:</span>
              <select
                value={printSides}
                onChange={(e) => setPrintSides(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              >
                <option value="both">ទាំងមុខ & ក្រោយ (Front & Back)</option>
                <option value="front-only">តែផ្នែកខាងមុខ (Front Only)</option>
                <option value="back-only">តែផ្នែកខាងក្រោយ (Back Only)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} />
              <span>បង្ហាញ Barcode មុខ</span>
            </label>
          </div>

          <div style={{ color: '#059669', fontWeight: 700 }}>
            ✓ ប្លង់ CR80 (54mm × 86mm) គ្មានការដាច់អក្សរ
          </div>
        </div>
      </div>

      {/* Main Print and Preview Area */}
      <div id="batch-print-area">
        {printLayout === 'a4-grid' ? (
          // =========================================================================
          // A4 GRID LAYOUT (8 Cards per Sheet: 2 columns x 4 rows)
          // =========================================================================
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Array.from({ length: Math.ceil(selectedEmployees.length / 4) }).map((_, sheetIdx) => {
              const sheetEmployees = selectedEmployees.slice(sheetIdx * 4, sheetIdx * 4 + 4);
              return (
                <div
                  key={sheetIdx}
                  className="a4-sheet-page card"
                  style={{
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px dashed #cbd5e1',
                    marginBottom: '20px'
                  }}
                >
                  <div className="no-print" style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
                    📄 សន្លឹក A4 ទី {sheetIdx + 1} (បុគ្គលិក {sheetEmployees.length} នាក់)
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      justifyContent: 'center'
                    }}
                  >
                    {sheetEmployees.map((emp) => {
                      const posTri = resolveTrilingual(emp.position, POSITION_DICT);
                      const deptTri = resolveTrilingual(emp.department, DEPARTMENT_DICT);
                      const genderTri = resolveGender(emp.gender);
                      const nameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn;
                      const nameEn = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
                      const hireDate = emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : 'N/A';
                      const expDate = emp.hireDate
                        ? new Date(new Date(emp.hireDate).setFullYear(new Date(emp.hireDate).getFullYear() + 2)).toLocaleDateString('en-GB')
                        : '01/01/2028';
                      const qrVal = `HRM:ID=${emp.employeeId};NAME=${nameEn};POS=${posTri.en};DEPT=${deptTri.en}`;

                      return (
                        <div
                          key={emp.id}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: '#fafafa',
                            position: 'relative'
                          }}
                        >
                          {/* Selection Checkbox on preview card */}
                          <div className="no-print" style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 10 }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(emp.id)}
                              onChange={() => handleToggleSelect(emp.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </div>

                          {/* FRONT CARD */}
                          {(printSides === 'both' || printSides === 'front-only') && (
                            <div
                              id={`batch-front-${emp.id}`}
                              className="id-card-cr80"
                              style={{
                                width: cardW,
                                height: cardH,
                                minWidth: cardW,
                                minHeight: cardH,
                                maxWidth: cardW,
                                maxHeight: cardH,
                                backgroundColor: cardBg,
                                borderRadius: '3.5mm',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxSizing: 'border-box',
                                fontFamily: "'Kantumruy Pro', 'Noto Sans Khmer', sans-serif",
                                color: textColor
                              }}
                            >
                              {/* Top Banner */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0, left: 0, right: 0,
                                  height: '27mm',
                                  backgroundColor: primaryColor,
                                  borderBottomLeftRadius: '50% 18%',
                                  borderBottomRightRadius: '50% 18%',
                                  borderBottom: `3px solid ${accentColor}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'flex-start',
                                  padding: '2.5mm 2mm 0 2mm',
                                  zIndex: 1,
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div style={{ color: '#ffffff', fontWeight: 800, fontSize: `${8.2 * fontScale}px`, textAlign: 'center', lineHeight: '1.2' }}>{companyKh}</div>
                                <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: `${6.2 * fontScale}px`, fontWeight: 600, textTransform: 'uppercase' }}>{companyEn}</div>
                                {companyZh && <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: `${6 * fontScale}px` }}>{companyZh}</div>}
                              </div>

                              {/* Photo */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '17mm',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '21mm',
                                  height: '21mm',
                                  borderRadius: '50%',
                                  border: '2.5px solid #ffffff',
                                  boxShadow: `0 0 0 2px ${accentColor}`,
                                  backgroundColor: '#f1f5f9',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 3
                                }}
                              >
                                {emp.photoUrl ? (
                                  <img src={emp.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '20px', color: '#64748b' }}>👤</span>
                                )}
                              </div>

                              {/* Details */}
                              <div style={{ marginTop: '39mm', padding: '0 2.8mm', display: 'flex', flexDirection: 'column', gap: '1mm', zIndex: 2, flex: 1, justifyContent: 'space-between', paddingBottom: showBarcode ? '1mm' : '4mm' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: `${8.8 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{nameKh}</div>
                                  <div style={{ fontSize: `${7 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
                                  <div style={{ display: 'inline-block', backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}60`, color: primaryColor, fontWeight: 800, fontSize: `${6.5 * fontScale}px`, padding: '0.5mm 2.5mm', borderRadius: '1.5mm', marginTop: '0.4mm' }}>
                                    {posTri.kh} • {posTri.en}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7mm', backgroundColor: `${primaryColor}06`, padding: '0.8mm 1.5mm', borderRadius: '1.6mm', border: `1px solid ${primaryColor}15`, fontSize: `${6.3 * fontScale}px` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>ID:</span>
                                    <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{emp.employeeId}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Dept:</span>
                                    <span style={{ fontWeight: 700 }}>{deptTri.kh}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>ចូលការ Join:</span>
                                    <span style={{ fontWeight: 700 }}>{hireDate}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>ផុតកំណត់ Exp:</span>
                                    <span style={{ fontWeight: 700, color: accentColor }}>{expDate}</span>
                                  </div>
                                </div>

                                {showBarcode && (
                                  <div style={{ margin: '0 auto', width: '92%' }}>
                                    <BarcodeSVG value={emp.employeeId || 'EM-0001'} />
                                  </div>
                                )}
                              </div>

                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3.5mm', backgroundColor: primaryColor, borderTop: `2px solid ${accentColor}` }} />
                            </div>
                          )}

                          {/* BACK CARD */}
                          {(printSides === 'both' || printSides === 'back-only') && (
                            <div
                              id={`batch-back-${emp.id}`}
                              className="id-card-cr80"
                              style={{
                                width: cardW,
                                height: cardH,
                                minWidth: cardW,
                                minHeight: cardH,
                                maxWidth: cardW,
                                maxHeight: cardH,
                                backgroundColor: cardBg,
                                borderRadius: '3.5mm',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxSizing: 'border-box',
                                fontFamily: "'Kantumruy Pro', 'Noto Sans Khmer', sans-serif",
                                color: textColor,
                                padding: '3mm 2.6mm'
                              }}
                            >
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5mm', backgroundColor: primaryColor, borderBottom: `2px solid ${accentColor}` }} />

                              <div style={{ marginTop: '2mm', textAlign: 'center' }}>
                                <div style={{ fontSize: `${7 * fontScale}px`, fontWeight: 800, color: primaryColor, marginBottom: '0.8mm' }}>
                                  លក្ខខណ្ឌប្រើប្រាស់ • TERMS & CONDITIONS
                                </div>
                                <div style={{ backgroundColor: `${primaryColor}06`, border: `1px dashed ${primaryColor}25`, borderRadius: '1.8mm', padding: '1.2mm', textAlign: 'left', fontSize: `${5.6 * fontScale}px`, lineHeight: '1.2' }}>
                                  🇰🇭 ប័ណ្ណនេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន។ ប្រសិនបើរើសបាន សូមប្រគល់ជូនការិយាល័យរដ្ឋបាល។
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1mm', fontSize: `${5.8 * fontScale}px`, backgroundColor: '#f1f5f9', borderRadius: '1.5mm', paddingBlock: '0.6mm' }}>
                                <div><span style={{ color: '#64748b' }}>ចេញ: </span><strong>{hireDate}</strong></div>
                                <div><span style={{ color: '#64748b' }}>ផុត: </span><strong style={{ color: accentColor }}>{expDate}</strong></div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ padding: '1mm', backgroundColor: '#ffffff', borderRadius: '1.5mm', border: `1px solid ${primaryColor}30` }}>
                                  <QRCodeSVG value={qrVal} size={44} level="M" />
                                </div>
                                <div style={{ fontSize: `${5.4 * fontScale}px`, color: '#64748b', marginTop: '0.6mm', fontWeight: 600 }}>ស្កេនផ្ទៀងផ្ទាត់ / Scan</div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '26mm', borderBottom: `1px solid ${primaryColor}`, margin: '0 auto 0.6mm auto' }} />
                                <div style={{ fontSize: `${5.6 * fontScale}px`, fontWeight: 700, color: primaryColor }}>ហត្ថលេខា / Authorized Signature</div>
                              </div>

                              <div style={{ textAlign: 'center', marginBottom: '2.5mm' }}>
                                <div style={{ fontSize: `${7 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{companyKh}</div>
                                <div style={{ fontSize: `${5.8 * fontScale}px`, color: '#64748b', textTransform: 'uppercase' }}>{companyEn}</div>
                              </div>

                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3.5mm', backgroundColor: primaryColor, borderTop: `2px solid ${accentColor}` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // =========================================================================
          // SINGLE TRAY LAYOUT (For Direct PVC ID Card Printers)
          // =========================================================================
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {selectedEmployees.map((emp) => {
              const posTri = resolveTrilingual(emp.position, POSITION_DICT);
              const deptTri = resolveTrilingual(emp.department, DEPARTMENT_DICT);
              const nameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn;
              const nameEn = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
              const hireDate = emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-GB') : 'N/A';
              const expDate = emp.hireDate
                ? new Date(new Date(emp.hireDate).setFullYear(new Date(emp.hireDate).getFullYear() + 2)).toLocaleDateString('en-GB')
                : '01/01/2028';
              const qrVal = `HRM:ID=${emp.employeeId};NAME=${nameEn};POS=${posTri.en};DEPT=${deptTri.en}`;

              return (
                <div key={emp.id} className="single-tray-card" style={{ display: 'flex', gap: '16px' }}>
                  {(printSides === 'both' || printSides === 'front-only') && (
                    <div
                      id={`batch-front-${emp.id}`}
                      className="id-card-cr80"
                      style={{
                        width: cardW,
                        height: cardH,
                        backgroundColor: cardBg,
                        borderRadius: '3.5mm',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: "'Kantumruy Pro', sans-serif"
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ height: '27mm', backgroundColor: primaryColor, borderBottom: `3px solid ${accentColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 2mm' }}>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '8px' }}>{companyKh}</div>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '6.2px', textTransform: 'uppercase' }}>{companyEn}</div>
                      </div>
                      {/* Photo */}
                      <div style={{ position: 'absolute', top: '17mm', left: '50%', transform: 'translateX(-50%)', width: '21mm', height: '21mm', borderRadius: '50%', border: '2.5px solid white', boxShadow: `0 0 0 2px ${accentColor}`, overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                        {emp.photoUrl ? <img src={emp.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>👤</span>}
                      </div>
                      {/* Details */}
                      <div style={{ marginTop: '39mm', padding: '0 2.5mm', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '3.5mm' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '8.8px', fontWeight: 800, color: primaryColor }}>{nameKh}</div>
                          <div style={{ fontSize: '7px', fontWeight: 700, color: '#475569' }}>{nameEn}</div>
                          <div style={{ display: 'inline-block', backgroundColor: `${accentColor}20`, color: primaryColor, fontWeight: 800, fontSize: '6.5px', padding: '0.5mm 2mm', borderRadius: '1mm' }}>{posTri.kh}</div>
                        </div>
                        <div style={{ backgroundColor: `${primaryColor}06`, padding: '1mm', borderRadius: '1.5mm', fontSize: '6.3px', display: 'flex', flexDirection: 'column', gap: '0.6mm' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ID:</span><strong>{emp.employeeId}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Dept:</span><strong>{deptTri.kh}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Join:</span><strong>{hireDate}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Exp:</span><strong style={{ color: accentColor }}>{expDate}</strong></div>
                        </div>
                        {showBarcode && <BarcodeSVG value={emp.employeeId || 'EM-0001'} />}
                      </div>
                    </div>
                  )}

                  {(printSides === 'both' || printSides === 'back-only') && (
                    <div
                      id={`batch-back-${emp.id}`}
                      className="id-card-cr80"
                      style={{
                        width: cardW,
                        height: cardH,
                        backgroundColor: cardBg,
                        borderRadius: '3.5mm',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '3mm 2.6mm',
                        fontFamily: "'Kantumruy Pro', sans-serif"
                      }}
                    >
                      <div style={{ textAlign: 'center', fontSize: '7px', fontWeight: 800, color: primaryColor }}>TERMS & CONDITIONS</div>
                      <div style={{ fontSize: '5.6px', lineHeight: '1.2', backgroundColor: `${primaryColor}06`, padding: '1mm', borderRadius: '1.5mm' }}>
                        🇰🇭 ប័ណ្ណនេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន។ ប្រសិនបើរើសបាន សូមប្រគល់ជូនការិយាល័យរដ្ឋបាល។
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5.8px' }}>
                        <span>ចេញ: <strong>{hireDate}</strong></span>
                        <span>ផុត: <strong style={{ color: accentColor }}>{expDate}</strong></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <QRCodeSVG value={qrVal} size={44} level="M" />
                        <div style={{ fontSize: '5.4px', color: '#64748b' }}>Scan to Verify</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '26mm', borderBottom: `1px solid ${primaryColor}`, margin: '0 auto 0.6mm auto' }} />
                        <div style={{ fontSize: '5.6px', fontWeight: 700, color: primaryColor }}>Authorized Signature</div>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '6.8px', fontWeight: 800, color: primaryColor }}>{companyKh}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
