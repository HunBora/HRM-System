'use client';

import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FACTORY_PRESETS,
  DEFAULT_6_RULES_KH,
  DEFAULT_6_RULES_EN,
  DEFAULT_6_RULES_ZH,
  type FactoryPreset
} from '@/lib/idCardConstants';

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

// Common Factory Department Translations
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

// 7 Comprehensive Card Styles Covering All Uploaded Samples
export type CardStyleType =
  | 'wave-gold'      // Sample 4: Royal Blue & Yellow Wave (media_1792595501340_a70ab44b.png & media_1792595464658_c91347ff.png)
  | 'green-wave'    // Sample 5: Green & Gold Dual Wave + Tagline (media_1792595733733_14e59bc7.png)
  | 'green-eco'      // Sample 1: Green Eco-Diagonal Cut (media_1792595379869_b0d19eee.png)
  | 'angular-tech'   // Sample 2: Angular Modern Tech Blue (media_1792595415838_011ac0ac.png)
  | 'corporate'      // Modern Corporate Clean
  | 'landscape'      // Horizontal 86x54mm
  | 'executive';     // Executive Gold Frame

interface CardStyleDef {
  id: CardStyleType;
  nameKh: string;
  nameEn: string;
  sampleNo: string;
  isLandscape: boolean;
  icon: string;
  desc: string;
  defaultPrimary: string;
  defaultAccent: string;
}

const CARD_STYLES: CardStyleDef[] = [
  {
    id: 'wave-gold',
    nameKh: '🌊 Royal Wave & Gold (រលកខៀវ & ឆ្នូតមាស)',
    nameEn: 'Royal Wave & Gold (Sample 4)',
    sampleNo: 'Sample 4',
    isLandscape: false,
    icon: '🌊',
    desc: 'ដូចគំរូរូបភាពទី ៤: រលកខៀវរាជវង្ស + បន្ទាត់មាស + រូបថតរង្វង់កណ្តាល + Barcode ខាងមុខ',
    defaultPrimary: '#1e3a8a',
    defaultAccent: '#eab308'
  },
  {
    id: 'green-wave',
    nameKh: '🍃 Green & Gold Wave (បៃតង & រលកមាស)',
    nameEn: 'Green & Gold Dual Wave (Sample 5)',
    sampleNo: 'Sample 5',
    isLandscape: false,
    icon: '🍃',
    desc: 'ដូចគំរូរូបភាពទី ៥: ក្បាលបៃតងរលកភ្លោះមាស + Tagline + Barcode + QR Code កណ្តាលខ្នង',
    defaultPrimary: '#15803d',
    defaultAccent: '#eab308'
  },
  {
    id: 'green-eco',
    nameKh: '🌿 Green Eco-Diagonal (បៃតង & ឆ្នូតកាត់មាស)',
    nameEn: 'Green Eco-Diagonal (Sample 1)',
    sampleNo: 'Sample 1',
    isLandscape: false,
    icon: '🌿',
    desc: 'ដូចគំរូរូបភាពទី ១: រចនាប័ទ្មកាត់ឆ្នូតមាសទ្រេត រូបថតជ្រុងមូល Barcode មុខ និង QR ជ្រុងខ្នង',
    defaultPrimary: '#15803d',
    defaultAccent: '#eab308'
  },
  {
    id: 'angular-tech',
    nameKh: '🔷 Angular Tech Blue (ខៀវជ្រុងធរណីមាត្រ)',
    nameEn: 'Angular Modern Tech (Sample 2)',
    sampleNo: 'Sample 2',
    isLandscape: false,
    icon: '🔷',
    desc: 'ដូចគំរូរូបភាពទី ២: ក្បាលជ្រុងស្រួចបែបទំនើប QR Code ជ្រុងមុខ/ខ្នង និងតារាង 2-Column',
    defaultPrimary: '#0b2545',
    defaultAccent: '#0284c7'
  },
  {
    id: 'corporate',
    nameKh: '🏢 Modern Corporate (សាជីវកម្មស្អាត)',
    nameEn: 'Corporate Flat Badge',
    sampleNo: 'Standard',
    isLandscape: false,
    icon: '🏢',
    desc: 'រចនាប័ទ្មបែបសាជីវកម្ម ស៊ុមរាងជ្រុងស្អាត សន្សំសំចៃ space និងងាយស្រួលបោះពុម្ព',
    defaultPrimary: '#0a192f',
    defaultAccent: '#ef4444'
  },
  {
    id: 'landscape',
    nameKh: '🪪 Landscape Horizontal (ផ្តេក 86x54mm)',
    nameEn: 'Horizontal Badge (Landscape)',
    sampleNo: 'Landscape',
    isLandscape: true,
    icon: '🪪',
    desc: 'ទម្រង់ផ្តេកស្តង់ដារ CR80 រូបថតខាងឆ្វេង និងព័ត៌មាន ៣ ភាសាខាងស្តាំ',
    defaultPrimary: '#1e3a8a',
    defaultAccent: '#f59e0b'
  },
  {
    id: 'executive',
    nameKh: '👑 Executive Gold (ប្រណិតឆ្នូតមាសភ្លោះ)',
    nameEn: 'Executive Gold Inlay',
    sampleNo: 'VIP',
    isLandscape: false,
    icon: '👑',
    desc: 'រចនាប័ទ្មថ្នាក់ដឹកនាំ មានបន្ទាត់ភ្លោះពណ៌មាសជុំវិញកាត ឆើតឆាយថ្លៃថ្នូរ',
    defaultPrimary: '#18181b',
    defaultAccent: '#eab308'
  }
];

// Preset Themes
interface ThemePreset {
  id: string;
  nameKh: string;
  primary: string;
  accent: string;
  cardBg: string;
  textColor: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'navy-gold',
    nameKh: '🌊 Navy & Gold (ខៀវ & មាស)',
    primary: '#1e3a8a',
    accent: '#eab308',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  },
  {
    id: 'green-gold',
    nameKh: '🌿 Green & Gold (បៃតង & មាស)',
    primary: '#15803d',
    accent: '#eab308',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  },
  {
    id: 'tech-cyan',
    nameKh: '🔷 Tech Navy & Cyan (ខៀវ & ខៀវខ្ចី)',
    primary: '#0b2545',
    accent: '#0284c7',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  },
  {
    id: 'classic-red',
    nameKh: '🔵 Navy & Red (ខៀវចាស់ & ក្រហម)',
    primary: '#0a192f',
    accent: '#ef4444',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  },
  {
    id: 'burgundy-rose',
    nameKh: '🍷 Burgundy (ក្រហមទំពាំងបាយជូរ)',
    primary: '#701a75',
    accent: '#f43f5e',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  },
  {
    id: 'obsidian-gold',
    nameKh: '👔 Obsidian (ខ្មៅប្រណិត & មាស)',
    primary: '#18181b',
    accent: '#eab308',
    cardBg: '#ffffff',
    textColor: '#0f172a'
  }
];

// Font Families
const FONT_OPTIONS = [
  { id: 'kantumruy', label: 'Kantumruy Pro (ស្អាតច្បាស់ - ណែនាំ)', value: "'Kantumruy Pro', 'Noto Sans Khmer', sans-serif" },
  { id: 'noto', label: 'Noto Sans Khmer (ស្តង់ដារ Google)', value: "'Noto Sans Khmer', sans-serif" },
  { id: 'battambang', label: 'Battambang (បាត់ដំបង)', value: "'Battambang', sans-serif" },
  { id: 'siemreap', label: 'Siemreap (សៀមរាប)', value: "'Siemreap', cursive" },
  { id: 'inter', label: 'Inter / Sans-Serif (អន្តរជាតិ)', value: "'Inter', sans-serif" }
];

// Font Scales
const FONT_SCALES = [
  { id: 'compact', label: 'តូចសន្សំសំចៃ (88%)', scale: 0.88 },
  { id: 'medium', label: 'ល្មមសមរម្យ (94%)', scale: 0.94 },
  { id: 'standard', label: 'ស្តង់ដារ (100%)', scale: 1.0 },
  { id: 'large', label: 'ធំច្បាស់ (106%)', scale: 1.06 }
];

// Barcode SVG Generator Component
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
      <div style={{ display: 'flex', alignItems: 'stretch', height: '13px', gap: '1px', justifyContent: 'center' }}>
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
      <div style={{ fontSize: '5.8px', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '1px', color: '#64748b', fontWeight: 600 }}>
        *{value}*
      </div>
    </div>
  );
}

// Lanyard Hole & Clip Mockup (ដូចរូប 3, 4, 5)
function LanyardClipMockup({ color }: { color: string }) {
  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '-6px',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {/* Lanyard Fabric Strap */}
      <div
        style={{
          width: '18px',
          height: '24px',
          backgroundColor: color,
          borderRadius: '3px 3px 0 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      {/* Metallic Swivel Hook / Clip */}
      <div
        style={{
          width: '14px',
          height: '12px',
          border: '2.5px solid #94a3b8',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          backgroundColor: '#e2e8f0',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
        }}
      />
      {/* Badge Clip Slot */}
      <div
        style={{
          width: '28px',
          height: '6px',
          backgroundColor: '#ffffff',
          borderRadius: '3px',
          border: '1.5px solid #cbd5e1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '-2px'
        }}
      />
    </div>
  );
}

export default function IDCardClient({
  employee,
  companyName,
  settings
}: {
  employee: any;
  companyName: string;
  settings?: any;
}) {
  // Parse saved default config from settings or null
  const initialConfig = useMemo(() => {
    let cfg: any = null;
    if (settings?.idCardDefaultSettings) {
      try {
        cfg = typeof settings.idCardDefaultSettings === 'string'
          ? JSON.parse(settings.idCardDefaultSettings)
          : settings.idCardDefaultSettings;
      } catch (e) {
        console.error('Failed to parse settings.idCardDefaultSettings', e);
      }
    }
    return cfg;
  }, [settings?.idCardDefaultSettings]);

  // Card Format Style State (Defaulting to saved default or Wave & Gold)
  const [cardStyle, setCardStyle] = useState<CardStyleType>(initialConfig?.cardStyle || 'wave-gold');

  // Theme and Styling State
  const [activeTheme, setActiveTheme] = useState(initialConfig?.activeTheme || 'navy-gold');
  const [primaryColor, setPrimaryColor] = useState(initialConfig?.primaryColor || '#1e3a8a');
  const [accentColor, setAccentColor] = useState(initialConfig?.accentColor || '#eab308');
  const [cardBg, setCardBg] = useState(initialConfig?.cardBg || '#ffffff');
  const [textColor, setTextColor] = useState(initialConfig?.textColor || '#0f172a');

  // Font Options
  const [fontFamily, setFontFamily] = useState(initialConfig?.fontFamily || FONT_OPTIONS[0].value);
  const [fontScale, setFontScale] = useState(initialConfig?.fontScale ?? 1.0);

  // Zoom Preview
  const [previewZoom, setPreviewZoom] = useState(1.2);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'styles' | 'themes' | 'fonts' | 'qr' | 'content'>('styles');

  // Export Loading State
  const [isExporting, setIsExporting] = useState(false);

  // Lanyard & Barcode Display Toggles
  const [showLanyard, setShowLanyard] = useState(initialConfig?.showLanyard ?? true);
  const [showBarcode, setShowBarcode] = useState(initialConfig?.showBarcode ?? true);

  // Tagline (ដូចរូប 5: "Your Tagline Here")
  const [tagline, setTagline] = useState(initialConfig?.tagline || 'Excellence in Production');

  // Saved default indicator & state
  const [savedDefaultStyle, setSavedDefaultStyle] = useState<string>(initialConfig?.cardStyle || 'wave-gold');
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Dates and Blood Group
  const issueDateFormatted = employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-GB') : '01/01/2026';
  const expireDateFormatted = employee.hireDate
    ? new Date(new Date(employee.hireDate).setFullYear(new Date(employee.hireDate).getFullYear() + 2)).toLocaleDateString('en-GB')
    : '01/01/2028';

  const [issueDate, setIssueDate] = useState(issueDateFormatted);
  const [expireDate, setExpireDate] = useState(expireDateFormatted);
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Factory Preset Determination (Defaults to Wahgoo Bags as requested)
  const defaultPresetId = useMemo(() => {
    if (initialConfig?.factoryPreset) return initialConfig.factoryPreset;
    if (companyName.toUpperCase().includes('WAHGOO')) return 'wahgoo';
    if (companyName.toUpperCase().includes('G.S') || companyName.toUpperCase().includes('TEXTILE')) return 'gs-textile';
    return 'wahgoo';
  }, [initialConfig?.factoryPreset, companyName]);

  const [factoryPreset, setFactoryPreset] = useState<string>(defaultPresetId);

  // Trilingual Company Header
  const defaultCompanyKh = useMemo(() => {
    if (initialConfig?.companyKh) return initialConfig.companyKh;
    if (defaultPresetId === 'wahgoo') return FACTORY_PRESETS[0].companyKh;
    if (companyName.toUpperCase().includes('G.S') || companyName.toUpperCase().includes('TEXTILE')) {
      return FACTORY_PRESETS[1].companyKh;
    }
    return companyName;
  }, [initialConfig?.companyKh, defaultPresetId, companyName]);

  const defaultCompanyZh = useMemo(() => {
    if (initialConfig?.companyZh) return initialConfig.companyZh;
    if (defaultPresetId === 'wahgoo') return FACTORY_PRESETS[0].companyZh;
    if (companyName.toUpperCase().includes('G.S') || companyName.toUpperCase().includes('TEXTILE')) {
      return FACTORY_PRESETS[1].companyZh;
    }
    return '';
  }, [initialConfig?.companyZh, defaultPresetId, companyName]);

  const defaultCompanyEn = useMemo(() => {
    if (initialConfig?.companyEn) return initialConfig.companyEn;
    if (defaultPresetId === 'wahgoo') return FACTORY_PRESETS[0].companyEn;
    return companyName;
  }, [initialConfig?.companyEn, defaultPresetId, companyName]);

  const [companyKh, setCompanyKh] = useState(defaultCompanyKh);
  const [companyEn, setCompanyEn] = useState(defaultCompanyEn);
  const [companyZh, setCompanyZh] = useState(defaultCompanyZh);

  // Address (Trilingual)
  const [addressKh, setAddressKh] = useState<string>(
    initialConfig?.addressKh ||
    (defaultPresetId === 'gs-textile' ? FACTORY_PRESETS[1].addressKh : FACTORY_PRESETS[0].addressKh)
  );
  const [addressEn, setAddressEn] = useState<string>(
    initialConfig?.addressEn ||
    (defaultPresetId === 'gs-textile' ? FACTORY_PRESETS[1].addressEn : FACTORY_PRESETS[0].addressEn)
  );
  const [addressZh, setAddressZh] = useState<string>(
    initialConfig?.addressZh ||
    (defaultPresetId === 'gs-textile' ? FACTORY_PRESETS[1].addressZh : FACTORY_PRESETS[0].addressZh)
  );

  // Admin Phone (Hotline - អាចកែប្រែបានតាមចិត្ត)
  const [adminPhone, setAdminPhone] = useState<string>(
    initialConfig?.adminPhone ||
    (defaultPresetId === 'gs-textile' ? FACTORY_PRESETS[1].adminPhone : FACTORY_PRESETS[0].adminPhone)
  );

  // 6 Factory Rules (Trilingual)
  const [rulesKh, setRulesKh] = useState<string[]>(initialConfig?.rulesKh || DEFAULT_6_RULES_KH);
  const [rulesEn, setRulesEn] = useState<string[]>(initialConfig?.rulesEn || DEFAULT_6_RULES_EN);
  const [rulesZh, setRulesZh] = useState<string[]>(initialConfig?.rulesZh || DEFAULT_6_RULES_ZH);

  // Back Card Configuration
  const [backLangMode, setBackLangMode] = useState<'trilingual' | 'bilingual' | 'khmer'>(
    initialConfig?.backLangMode || 'trilingual'
  );
  const [showBackQr, setShowBackQr] = useState<boolean>(initialConfig?.showBackQr ?? true);
  const [showBackSignature, setShowBackSignature] = useState<boolean>(initialConfig?.showBackSignature ?? true);
  const [showBackDates, setShowBackDates] = useState<boolean>(initialConfig?.showBackDates ?? true);

  // Handle preset switch
  const handleSelectFactoryPreset = (presetId: string) => {
    setFactoryPreset(presetId);
    const p = FACTORY_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    if (presetId !== 'custom') {
      setCompanyKh(p.companyKh);
      setCompanyEn(p.companyEn);
      setCompanyZh(p.companyZh);
      setAddressKh(p.addressKh);
      setAddressEn(p.addressEn);
      setAddressZh(p.addressZh);
      setAdminPhone(p.adminPhone);
      if (p.primaryColor) setPrimaryColor(p.primaryColor);
      if (p.accentColor) setAccentColor(p.accentColor);
    }
  };

  // Employee Trilingual Name
  const defaultNameKh = `${employee.lastNameKh || ''} ${employee.firstNameKh || ''}`.trim() || employee.firstNameEn;
  const defaultNameEn = `${employee.firstNameEn || ''} ${employee.lastNameEn || ''}`.trim();
  const [nameKh, setNameKh] = useState(defaultNameKh);
  const [nameEn, setNameEn] = useState(defaultNameEn);

  // Position & Department Trilingual
  const resolvedPos = useMemo(() => resolveTrilingual(employee.position, POSITION_DICT), [employee.position]);
  const resolvedDept = useMemo(() => resolveTrilingual(employee.department, DEPARTMENT_DICT), [employee.department]);
  const genderTri = useMemo(() => resolveGender(employee.gender), [employee.gender]);

  const [posKh, setPosKh] = useState(resolvedPos.kh);
  const [posEn, setPosEn] = useState(resolvedPos.en);
  const [posZh, setPosZh] = useState(resolvedPos.zh);

  const [deptKh, setDeptKh] = useState(resolvedDept.kh);
  const [deptEn, setDeptEn] = useState(resolvedDept.en);
  const [deptZh, setDeptZh] = useState(resolvedDept.zh);

  // Emergency contact phone
  const defaultPhone = settings?.contactPhone || employee.phone || '+855 (0) 23 888 999';
  const [contactPhone, setContactPhone] = useState(defaultPhone);

  // Trilingual Terms & Conditions (Back Side)
  const [termsKh, setTermsKh] = useState('ប័ណ្ណនេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន។ ប្រសិនបើរើសបាន សូមប្រគល់ជូនការិយាល័យរដ្ឋបាលក្រុមហ៊ុនវិញ។');
  const [termsEn, setTermsEn] = useState('This card is the property of the company. If found, please return to Admin Office.');
  const [termsZh, setTermsZh] = useState('此工卡为公司资产。如有拾获，请交还至公司行政部。');

  // Language Display Mode
  const [langMode, setLangMode] = useState<'trilingual' | 'bilingual' | 'khmer' | 'english'>('trilingual');

  // QR Code behavior & values
  const [qrType, setQrType] = useState<'verify-url' | 'vcard' | 'company-url' | 'raw-data'>('verify-url');
  const [customQrUrl, setCustomQrUrl] = useState('');

  // Dynamically compute QR code payload based on user selection
  const computedQrValue = useMemo(() => {
    if (qrType === 'verify-url') {
      if (customQrUrl.trim()) return customQrUrl.trim();
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/dashboard/employees/${employee.id}`;
      }
      return `https://hrm-system-omega-gray.vercel.app/dashboard/employees/${employee.id}`;
    }

    if (qrType === 'company-url') {
      return customQrUrl.trim() || 'https://hrm-system-omega-gray.vercel.app';
    }

    if (qrType === 'vcard') {
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${nameEn}\nORG:${companyEn}\nTITLE:${posEn}\nTEL:${employee.phone || contactPhone}\nEMAIL:${employee.email || ''}\nNOTE:Employee ID: ${employee.employeeId} - Dept: ${deptEn}\nEND:VCARD`;
    }

    return `HRM-VERIFY:ID=${employee.employeeId};NAME=${nameEn};POS=${posEn};DEPT=${deptEn};HIRE=${employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-GB') : 'N/A'}`;
  }, [qrType, customQrUrl, employee, nameEn, companyEn, posEn, deptEn, contactPhone]);

  // Determine current card dimensions
  const isLandscape = cardStyle === 'landscape';
  const cardWidth = isLandscape ? '86mm' : '54mm';
  const cardHeight = isLandscape ? '54mm' : '86mm';

  // Check localStorage on mount if no server settings were provided
  React.useEffect(() => {
    if (!initialConfig && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('hrm_id_card_default_settings');
        if (raw) {
          const cfg = JSON.parse(raw);
          if (cfg.cardStyle) {
            setCardStyle(cfg.cardStyle);
            setSavedDefaultStyle(cfg.cardStyle);
          }
          if (cfg.activeTheme) setActiveTheme(cfg.activeTheme);
          if (cfg.primaryColor) setPrimaryColor(cfg.primaryColor);
          if (cfg.accentColor) setAccentColor(cfg.accentColor);
          if (cfg.cardBg) setCardBg(cfg.cardBg);
          if (cfg.textColor) setTextColor(cfg.textColor);
          if (cfg.fontFamily) setFontFamily(cfg.fontFamily);
          if (cfg.fontScale !== undefined) setFontScale(cfg.fontScale);
          if (cfg.showBarcode !== undefined) setShowBarcode(cfg.showBarcode);
          if (cfg.showLanyard !== undefined) setShowLanyard(cfg.showLanyard);
          if (cfg.tagline) setTagline(cfg.tagline);
          if (cfg.qrType) setQrType(cfg.qrType);
          if (cfg.customQrUrl !== undefined) setCustomQrUrl(cfg.customQrUrl);
          if (cfg.langMode) setLangMode(cfg.langMode);
          if (cfg.factoryPreset) setFactoryPreset(cfg.factoryPreset);
          if (cfg.companyKh) setCompanyKh(cfg.companyKh);
          if (cfg.companyEn) setCompanyEn(cfg.companyEn);
          if (cfg.companyZh) setCompanyZh(cfg.companyZh);
          if (cfg.addressKh) setAddressKh(cfg.addressKh);
          if (cfg.addressEn) setAddressEn(cfg.addressEn);
          if (cfg.addressZh) setAddressZh(cfg.addressZh);
          if (cfg.adminPhone) setAdminPhone(cfg.adminPhone);
          if (cfg.rulesKh) setRulesKh(cfg.rulesKh);
          if (cfg.rulesEn) setRulesEn(cfg.rulesEn);
          if (cfg.rulesZh) setRulesZh(cfg.rulesZh);
          if (cfg.backLangMode) setBackLangMode(cfg.backLangMode);
          if (cfg.showBackQr !== undefined) setShowBackQr(cfg.showBackQr);
          if (cfg.showBackSignature !== undefined) setShowBackSignature(cfg.showBackSignature);
          if (cfg.showBackDates !== undefined) setShowBackDates(cfg.showBackDates);
          if (cfg.termsKh) setTermsKh(cfg.termsKh);
          if (cfg.termsEn) setTermsEn(cfg.termsEn);
          if (cfg.termsZh) setTermsZh(cfg.termsZh);
        }
      } catch (e) {
        console.error('Error reading localStorage default id card:', e);
      }
    }
  }, [initialConfig]);

  // Apply card style
  const handleSelectStyle = (s: CardStyleDef) => {
    setCardStyle(s.id);
    setPrimaryColor(s.defaultPrimary);
    setAccentColor(s.defaultAccent);
  };

  // Apply preset theme
  const applyPresetTheme = (theme: ThemePreset) => {
    setActiveTheme(theme.id);
    setPrimaryColor(theme.primary);
    setAccentColor(theme.accent);
    setCardBg(theme.cardBg);
    setTextColor(theme.textColor);
  };

  // Save current style & options as default for all ID cards
  const handleSaveAsDefault = async (targetStyle?: CardStyleType) => {
    const styleToSave = targetStyle || cardStyle;
    setIsSavingDefault(true);

    let pColor = primaryColor;
    let aColor = accentColor;
    if (targetStyle && targetStyle !== cardStyle) {
      const foundDef = CARD_STYLES.find((s) => s.id === targetStyle);
      if (foundDef) {
        pColor = foundDef.defaultPrimary;
        aColor = foundDef.defaultAccent;
        setCardStyle(targetStyle);
        setPrimaryColor(pColor);
        setAccentColor(aColor);
      }
    }

    const configToSave = {
      cardStyle: styleToSave,
      activeTheme,
      primaryColor: pColor,
      accentColor: aColor,
      cardBg,
      textColor,
      fontFamily,
      fontScale,
      showBarcode,
      showLanyard,
      tagline,
      qrType,
      customQrUrl,
      langMode,
      factoryPreset,
      companyKh,
      companyEn,
      companyZh,
      addressKh,
      addressEn,
      addressZh,
      adminPhone,
      rulesKh,
      rulesEn,
      rulesZh,
      backLangMode,
      showBackQr,
      showBackSignature,
      showBackDates,
      termsKh,
      termsEn,
      termsZh,
      savedAt: new Date().toISOString()
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hrm_id_card_default_settings', JSON.stringify(configToSave));
      }

      await fetch('/api/company-settings/id-card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCardDefaultSettings: JSON.stringify(configToSave) })
      });

      setSavedDefaultStyle(styleToSave);
      const styleDef = CARD_STYLES.find((s) => s.id === styleToSave);
      const name = styleDef ? styleDef.nameKh : styleToSave;
      setSaveSuccessMessage(`✓ បានរក្សាទុក «${name}» ជាម៉ូតលំនាំដើម (Default) សម្រាប់កាតបុគ្គលិកទាំងអស់រួចរាល់!`);
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    } catch (err) {
      console.warn('Saved to localStorage notice:', err);
      setSavedDefaultStyle(styleToSave);
      setSaveSuccessMessage(`✓ បានរក្សាទុកជាម៉ូតលំនាំដើម (Default) រួចរាល់!`);
      setTimeout(() => setSaveSuccessMessage(null), 4500);
    } finally {
      setIsSavingDefault(false);
    }
  };

  // Reset all to defaults
  const handleReset = () => {
    const baseStyle = initialConfig?.cardStyle || 'wave-gold';
    setCardStyle(baseStyle);
    if (initialConfig?.primaryColor) {
      setPrimaryColor(initialConfig.primaryColor);
      setAccentColor(initialConfig.accentColor || '#eab308');
    } else {
      applyPresetTheme(THEME_PRESETS[0]);
    }
    setFontFamily(initialConfig?.fontFamily || FONT_OPTIONS[0].value);
    setFontScale(initialConfig?.fontScale ?? 1.0);
    setCompanyKh(defaultCompanyKh);
    setCompanyEn(companyName);
    setCompanyZh(defaultCompanyZh);
    setNameKh(defaultNameKh);
    setNameEn(defaultNameEn);
    setPosKh(resolvedPos.kh);
    setPosEn(resolvedPos.en);
    setPosZh(resolvedPos.zh);
    setDeptKh(resolvedDept.kh);
    setDeptEn(resolvedDept.en);
    setDeptZh(resolvedDept.zh);
    setContactPhone(defaultPhone);
    setTermsKh(initialConfig?.termsKh || 'ប័ណ្ណនេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន។ ប្រសិនបើរើសបាន សូមប្រគល់ជូនការិយាល័យរដ្ឋបាលក្រុមហ៊ុនវិញ។');
    setTermsEn(initialConfig?.termsEn || 'This card is the property of the company. If found, please return to Admin Office.');
    setTermsZh(initialConfig?.termsZh || '此工卡为公司资产。如有拾获，请交还至公司行政部。');
    setLangMode(initialConfig?.langMode || 'trilingual');
    setQrType(initialConfig?.qrType || 'verify-url');
    setCustomQrUrl(initialConfig?.customQrUrl || '');
    setShowLanyard(initialConfig?.showLanyard ?? true);
    setShowBarcode(initialConfig?.showBarcode ?? true);
    setTagline(initialConfig?.tagline || 'Excellence in Production');
  };

  // Export to PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const frontEl = document.getElementById('id-card-front');
      const backEl = document.getElementById('id-card-back');

      if (!frontEl || !backEl) {
        alert('រកមិនឃើញកាតសម្គាល់ខ្លួនទេ');
        return;
      }

      const pdfW = isLandscape ? 86 : 54;
      const pdfH = isLandscape ? 54 : 86;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfW, pdfH]
      });

      // Render Front
      const canvasFront = await html2canvas(frontEl, {
        scale: 4,
        useCORS: true,
        backgroundColor: null
      });
      const imgFront = canvasFront.toDataURL('image/png');
      pdf.addImage(imgFront, 'PNG', 0, 0, pdfW, pdfH);

      // Render Back
      pdf.addPage([pdfW, pdfH], isLandscape ? 'landscape' : 'portrait');
      const canvasBack = await html2canvas(backEl, {
        scale: 4,
        useCORS: true,
        backgroundColor: null
      });
      const imgBack = canvasBack.toDataURL('image/png');
      pdf.addImage(imgBack, 'PNG', 0, 0, pdfW, pdfH);

      pdf.save(`ID-Card-${employee.employeeId || 'employee'}-${cardStyle}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('មានបញ្ហាក្នុងការបង្កើត PDF សូមសាកល្បងម្ដងទៀត');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PNG Image
  const handleExportImage = async (side: 'front' | 'back') => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById(side === 'front' ? 'id-card-front' : 'id-card-back');
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 4,
        useCORS: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `ID-Card-${employee.employeeId || 'employee'}-${side}-${cardStyle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image Export Error:', err);
      alert('មានបញ្ហាក្នុងការទាញយករូបភាព');
    } finally {
      setIsExporting(false);
    }
  };

  // =========================================================================
  // SUB-RENDERERS FOR FRONT SIDES
  // =========================================================================

  // 1. ROYAL WAVE & GOLD FRONT (Sample 4: ដូចរូបភាព 4 & 3)
  const renderWaveGoldFront = () => (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '28mm',
          backgroundColor: primaryColor,
          borderBottomLeftRadius: '50% 18%',
          borderBottomRightRadius: '50% 18%',
          borderBottom: `3.5px solid ${accentColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '2.8mm 2mm 0 2mm',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: `${8.5 * fontScale}px`, textAlign: 'center', lineHeight: '1.2', maxWidth: '100%', wordBreak: 'break-word', textShadow: '0 1px 2px rgba(0,0,0,0.3)', marginBottom: '1px' }}>
          {companyKh}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600, fontSize: `${6.5 * fontScale}px`, textAlign: 'center', lineHeight: '1.15', letterSpacing: '0.2px', maxWidth: '100%', wordBreak: 'break-word', textTransform: 'uppercase' }}>
          {companyEn}
        </div>
        {companyZh && langMode === 'trilingual' && (
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: `${6.2 * fontScale}px`, textAlign: 'center', lineHeight: '1.15', letterSpacing: '0.3px', maxWidth: '100%', wordBreak: 'break-word' }}>
            {companyZh}
          </div>
        )}
      </div>

      {/* Circle Photo */}
      <div
        style={{
          position: 'absolute',
          top: '17.5mm',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '21mm',
          height: '21mm',
          borderRadius: '50%',
          border: '2.5px solid #ffffff',
          boxShadow: `0 0 0 2px ${accentColor}, 0 4px 8px rgba(0,0,0,0.15)`,
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3
        }}
      >
        {employee.photoUrl ? (
          <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '22px', color: '#64748b' }}>👤</span>
        )}
      </div>

      {/* Employee Info Details */}
      <div style={{ marginTop: '39.5mm', padding: '0 2.8mm', display: 'flex', flexDirection: 'column', gap: '1.2mm', zIndex: 2, flex: 1, justifyContent: 'space-between', paddingBottom: showBarcode ? '1mm' : '4mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: `${9 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>{nameKh}</div>
          <div style={{ fontSize: `${7.2 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ display: 'inline-block', backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}60`, color: primaryColor, fontWeight: 800, fontSize: `${6.8 * fontScale}px`, padding: '0.6mm 2.5mm', borderRadius: '1.5mm', marginTop: '0.5mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7mm', backgroundColor: `${primaryColor}06`, padding: '0.9mm 1.5mm', borderRadius: '1.8mm', border: `1px solid ${primaryColor}15`, fontSize: `${6.2 * fontScale}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>អត្តលេខ ID:</span>
            <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ផ្នែក Dept:</span>
            <span style={{ fontWeight: 700 }}>{deptKh && deptEn && deptKh !== deptEn ? `${deptKh} (${deptEn})` : (deptEn || deptKh || 'Office')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>តួនាទី Position:</span>
            <span style={{ fontWeight: 700 }}>{posKh && posEn && posKh !== posEn ? `${posKh} (${posEn})` : (posEn || posKh || 'Human Resource')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ចូលការ Join:</span>
            <span style={{ fontWeight: 700 }}>{issueDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ផុតកំណត់ Exp:</span>
            <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
          </div>
        </div>

        {showBarcode && (
          <div style={{ margin: '0 auto', width: '92%' }}>
            <BarcodeSVG value={employee.employeeId || 'EM-0001'} />
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3.5mm', backgroundColor: primaryColor, borderTop: `2px solid ${accentColor}` }} />
    </>
  );

  // 2. GREEN & GOLD DUAL WAVE FRONT (Sample 5: ដូចរូបភាពទី 5)
  const renderGreenWaveFront = () => (
    <>
      {/* Top Green Primary Wave with Yellow Dual Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '28mm',
          backgroundColor: primaryColor,
          borderBottomLeftRadius: '50% 20%',
          borderBottomRightRadius: '50% 20%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '2.5mm 2mm 0 2mm',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: `${8.5 * fontScale}px`, textAlign: 'center', lineHeight: '1.2' }}>
          {companyKh}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: `${6.5 * fontScale}px`, fontWeight: 600, textTransform: 'uppercase' }}>
          {companyEn}
        </div>
        {tagline && (
          <div style={{ color: accentColor, fontSize: `${6 * fontScale}px`, fontStyle: 'italic', marginTop: '1px' }}>
            {tagline}
          </div>
        )}
      </div>

      {/* Gold Dual Wave Ribbon Underneath */}
      <div
        style={{
          position: 'absolute',
          top: '25mm', left: '-5%', right: '-5%',
          height: '5mm',
          backgroundColor: accentColor,
          borderBottomLeftRadius: '50% 40%',
          borderBottomRightRadius: '50% 40%',
          zIndex: 1
        }}
      />

      {/* Circular Photo with Gold Ring */}
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
          boxShadow: `0 0 0 2px ${accentColor}, 0 4px 8px rgba(0,0,0,0.15)`,
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3
        }}
      >
        {employee.photoUrl ? (
          <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '22px', color: '#64748b' }}>👤</span>
        )}
      </div>

      {/* Employee Details (Aligned with colon `:`) */}
      <div style={{ marginTop: '39.5mm', padding: '0 2.8mm', display: 'flex', flexDirection: 'column', gap: '1mm', zIndex: 2, flex: 1, justifyContent: 'space-between', paddingBottom: showBarcode ? '1mm' : '4mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{nameKh}</div>
          <div style={{ fontSize: `${7.2 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: 800, color: accentColor, marginTop: '0.3mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7mm', padding: '0 1.5mm', fontSize: `${6.4 * fontScale}px` }}>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '40%', color: primaryColor, fontWeight: 700 }}>ID</span>
            <span style={{ width: '6%', color: '#64748b' }}>:</span>
            <span style={{ width: '54%', fontWeight: 800, fontFamily: 'monospace' }}>{employee.employeeId}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '40%', color: primaryColor, fontWeight: 700 }}>DOB</span>
            <span style={{ width: '6%', color: '#64748b' }}>:</span>
            <span style={{ width: '54%', fontWeight: 700 }}>{employee.dob ? new Date(employee.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '40%', color: primaryColor, fontWeight: 700 }}>Join Date</span>
            <span style={{ width: '6%', color: '#64748b' }}>:</span>
            <span style={{ width: '54%', fontWeight: 700 }}>{issueDate}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '40%', color: primaryColor, fontWeight: 700 }}>Expire Date</span>
            <span style={{ width: '6%', color: '#64748b' }}>:</span>
            <span style={{ width: '54%', fontWeight: 700, color: accentColor }}>{expireDate}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '40%', color: primaryColor, fontWeight: 700 }}>Phone</span>
            <span style={{ width: '6%', color: '#64748b' }}>:</span>
            <span style={{ width: '54%', fontWeight: 700 }}>{employee.phone || contactPhone}</span>
          </div>
        </div>

        {showBarcode && (
          <div style={{ margin: '0 auto', width: '92%' }}>
            <BarcodeSVG value={employee.employeeId || 'EM-0001'} />
          </div>
        )}
      </div>

      {/* Bottom Wave Accent */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3.5mm', backgroundColor: primaryColor, borderTop: `2px solid ${accentColor}` }} />
    </>
  );

  // 3. GREEN ECO-DIAGONAL FRONT (Sample 1: ដូចរូបភាពទី 1)
  const renderGreenEcoFront = () => (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '26mm',
          backgroundColor: primaryColor,
          clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '2.5mm 2mm 0 2mm',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: `${8.5 * fontScale}px`, textAlign: 'center', lineHeight: '1.2' }}>{companyKh}</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${6.5 * fontScale}px`, fontWeight: 600, textTransform: 'uppercase' }}>{companyEn}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '23mm', left: 0, right: 0,
          height: '3px',
          backgroundColor: accentColor,
          transform: 'rotate(-4deg)',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '15mm',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '21mm',
          height: '24mm',
          borderRadius: '3mm',
          border: `2px solid ${primaryColor}`,
          boxShadow: `0 0 0 1.5px ${accentColor}, 0 4px 8px rgba(0,0,0,0.15)`,
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3
        }}
      >
        {employee.photoUrl ? (
          <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '22px', color: '#64748b' }}>👤</span>
        )}
      </div>

      <div style={{ marginTop: '40mm', padding: '0 2.8mm', display: 'flex', flexDirection: 'column', gap: '1.2mm', zIndex: 2, flex: 1, justifyContent: 'space-between', paddingBottom: showBarcode ? '1mm' : '4mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>{nameKh}</div>
          <div style={{ fontSize: `${7.2 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: 800, color: accentColor, marginTop: '0.5mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8mm', backgroundColor: '#f8fafc', padding: '1mm 1.5mm', borderRadius: '1.8mm', border: '1px solid #e2e8f0', fontSize: `${6.4 * fontScale}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>🪪 ID:</span>
            <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>📅 DOB:</span>
            <span style={{ fontWeight: 700 }}>{employee.dob ? new Date(employee.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>🏢 Dept:</span>
            <span style={{ fontWeight: 700 }}>{deptEn || deptKh}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>💼 Position:</span>
            <span style={{ fontWeight: 700 }}>{posEn || posKh}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>📅 ចូលការ Join:</span>
            <span style={{ fontWeight: 700 }}>{issueDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>⏳ ផុតកំណត់ Exp:</span>
            <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
          </div>
        </div>

        {showBarcode && (
          <div style={{ margin: '0 auto', width: '92%' }}>
            <BarcodeSVG value={employee.employeeId || 'EM-0001'} />
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '4mm',
          backgroundColor: primaryColor,
          clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 100%)'
        }}
      />
    </>
  );

  // 4. ANGULAR TECH BLUE FRONT (Sample 2: ដូចរូបភាពទី 2)
  const renderAngularTechFront = () => (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '27mm',
          backgroundColor: primaryColor,
          clipPath: 'polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '2.5mm 2mm 0 2mm',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: `${8.5 * fontScale}px`, textAlign: 'center', lineHeight: '1.2' }}>{companyKh}</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${6.5 * fontScale}px`, fontWeight: 600, textTransform: 'uppercase' }}>{companyEn}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '16mm',
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
        {employee.photoUrl ? (
          <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '22px', color: '#64748b' }}>👤</span>
        )}
      </div>

      <div style={{ marginTop: '39mm', padding: '0 2.8mm', display: 'flex', flexDirection: 'column', gap: '1.2mm', zIndex: 2, flex: 1, justifyContent: 'space-between', paddingBottom: '3.5mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{nameKh}</div>
          <div style={{ fontSize: `${7.2 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ display: 'inline-block', backgroundColor: accentColor, color: 'white', fontWeight: 800, fontSize: `${7 * fontScale}px`, padding: '0.6mm 2.5mm', borderRadius: '1.5mm', marginTop: '0.5mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2mm', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8mm', backgroundColor: '#f0f9ff', padding: '1mm 1.5mm', borderRadius: '1.8mm', border: `1px solid ${accentColor}30`, fontSize: `${6.4 * fontScale}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>ID:</span>
              <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Dept:</span>
              <span style={{ fontWeight: 700 }}>{deptEn || deptKh}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Pos:</span>
              <span style={{ fontWeight: 700 }}>{posEn || posKh}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Hire:</span>
              <span style={{ fontWeight: 700 }}>{issueDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Exp:</span>
              <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
            </div>
          </div>

          <div style={{ padding: '1mm', backgroundColor: 'white', borderRadius: '1.5mm', border: `1px solid ${primaryColor}30`, flexShrink: 0 }}>
            <QRCodeSVG value={computedQrValue} size={26} level="M" />
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '4mm',
          backgroundColor: primaryColor,
          clipPath: 'polygon(0 100%, 100% 100%, 100% 30%, 50% 0, 0 30%)'
        }}
      />
    </>
  );

  // 5. MODERN CORPORATE FRONT
  const renderCorporateFront = () => (
    <>
      <div style={{ backgroundColor: primaryColor, padding: '2.5mm 2mm 2mm 2mm', textAlign: 'center', borderBottom: `2.5px solid ${accentColor}` }}>
        <div style={{ color: 'white', fontWeight: 800, fontSize: `${8.5 * fontScale}px`, lineHeight: '1.2', wordBreak: 'break-word' }}>
          {companyKh}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: `${6.5 * fontScale}px`, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          {companyEn}
        </div>
      </div>

      <div style={{ padding: '2mm 2.8mm', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
        <div
          style={{
            width: '21mm',
            height: '24mm',
            borderRadius: '2.5mm',
            border: `2px solid ${primaryColor}`,
            boxShadow: `0 0 0 1.5px ${accentColor}`,
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1mm'
          }}
        >
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '24px', color: '#64748b' }}>👤</span>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5mm', width: '100%' }}>
          <div style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>{nameKh}</div>
          <div style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ display: 'inline-block', backgroundColor: accentColor, color: 'white', fontWeight: 800, fontSize: `${6.8 * fontScale}px`, padding: '0.8mm 3mm', borderRadius: '10px', marginTop: '1mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '2mm', padding: '1.5mm 2mm', display: 'flex', flexDirection: 'column', gap: '1mm', fontSize: `${6.5 * fontScale}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>អត្តលេខ ID:</span>
            <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ផ្នែក Dept:</span>
            <span style={{ fontWeight: 700 }}>{deptKh && deptEn && deptKh !== deptEn ? `${deptKh} (${deptEn})` : (deptEn || deptKh)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>តួនាទី Pos:</span>
            <span style={{ fontWeight: 700 }}>{posKh && posEn && posKh !== posEn ? `${posKh} (${posEn})` : (posEn || posKh)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ចូលការ Hire:</span>
            <span style={{ fontWeight: 700 }}>{issueDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>ផុតកំណត់ Exp:</span>
            <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
          </div>
        </div>

        {showBarcode && (
          <div style={{ margin: '0 auto', width: '92%' }}>
            <BarcodeSVG value={employee.employeeId || 'EM-0001'} />
          </div>
        )}
      </div>
    </>
  );

  // 6. LANDSCAPE HORIZONTAL FRONT (86mm × 54mm)
  const renderLandscapeFront = () => (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div
        style={{
          width: '28mm',
          backgroundColor: `${primaryColor}08`,
          borderRight: `2px solid ${accentColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2mm',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '20mm',
            height: '21mm',
            borderRadius: '2.5mm',
            border: `2px solid ${primaryColor}`,
            boxShadow: `0 0 0 1.5px ${accentColor}`,
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '20px', color: '#64748b' }}>👤</span>
          )}
        </div>
        <div style={{ marginTop: '2mm', textAlign: 'center' }}>
          <div style={{ fontSize: `${5.8 * fontScale}px`, color: '#64748b', fontWeight: 600 }}>ID NO.</div>
          <div style={{ fontSize: `${8.5 * fontScale}px`, fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '2.5mm 3.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ borderBottom: `1.5px solid ${primaryColor}25`, paddingBottom: '1mm' }}>
          <div style={{ fontSize: `${8.5 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>{companyKh}</div>
          <div style={{ fontSize: `${6.5 * fontScale}px`, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{companyEn}</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{nameKh}</span>
            <span style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>({nameEn})</span>
          </div>
          <div style={{ display: 'inline-block', backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}40`, color: accentColor, fontWeight: 800, fontSize: `${7 * fontScale}px`, padding: '0.6mm 2.5mm', borderRadius: '1.5mm', marginTop: '0.5mm' }}>
            {posKh} • {posEn} {langMode === 'trilingual' && posZh && `• ${posZh}`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm', fontSize: `${6.5 * fontScale}px` }}>
          <div>
            <span style={{ color: '#64748b' }}>ភេទ / Sex: </span>
            <span style={{ fontWeight: 700 }}>{genderTri.kh}/{genderTri.en}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ផ្នែក / Dept: </span>
            <span style={{ fontWeight: 700 }}>{deptKh}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ចូលការ / Hire: </span>
            <span style={{ fontWeight: 700 }}>{issueDate}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>ផុតកំណត់ / Exp: </span>
            <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 7. EXECUTIVE GOLD FRONT
  const renderExecutiveFront = () => (
    <div style={{ padding: '2.5mm', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div
        style={{
          height: '100%',
          border: `1.5px solid ${accentColor}`,
          outline: `1px solid ${accentColor}60`,
          outlineOffset: '-2.5px',
          padding: '2mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: `${8.5 * fontScale}px`, fontWeight: 800, color: primaryColor, letterSpacing: '0.3px', lineHeight: '1.2' }}>{companyKh}</div>
          <div style={{ fontSize: `${6.5 * fontScale}px`, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{companyEn}</div>
        </div>

        <div
          style={{
            width: '21mm',
            height: '21mm',
            borderRadius: '50%',
            border: `2.5px solid ${accentColor}`,
            boxShadow: `0 0 0 2px #ffffff, 0 3px 8px rgba(0,0,0,0.15)`,
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '1mm 0'
          }}
        >
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '20px', color: '#64748b' }}>👤</span>
          )}
        </div>

        <div>
          <div style={{ fontSize: `${9.2 * fontScale}px`, fontWeight: 800, color: primaryColor }}>{nameKh}</div>
          <div style={{ fontSize: `${7.5 * fontScale}px`, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{nameEn}</div>
          <div style={{ fontSize: `${7.8 * fontScale}px`, fontWeight: 800, color: accentColor, marginTop: '0.5mm' }}>
            {posKh} • {posEn}
          </div>
        </div>

        <div style={{ width: '100%', borderTop: `1px solid ${accentColor}40`, borderBottom: `1px solid ${accentColor}40`, padding: '1mm 0', fontSize: `${6.5 * fontScale}px`, display: 'flex', flexDirection: 'column', gap: '0.6mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <span style={{ color: '#64748b' }}>ID: </span>
              <span style={{ fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{employee.employeeId}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Dept: </span>
              <span style={{ fontWeight: 700 }}>{deptEn || deptKh}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Pos: </span>
              <span style={{ fontWeight: 700 }}>{posEn || posKh}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: `${6 * fontScale}px` }}>
            <div>
              <span style={{ color: '#64748b' }}>Join: </span>
              <span style={{ fontWeight: 700 }}>{issueDate}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Exp: </span>
              <span style={{ fontWeight: 700, color: accentColor }}>{expireDate}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: `${5.8 * fontScale}px`, color: '#64748b', letterSpacing: '0.5px' }}>
          OFFICIAL EMPLOYEE BADGE
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // SUB-RENDERERS FOR BACK SIDES
  // =========================================================================

  // Standard Vertical Back Side (Used for Wave Gold, Green Wave, Green Eco, Angular, Corporate, Executive)
  const renderVerticalBack = () => {
    const isTri = backLangMode === 'trilingual';
    const isBi = backLangMode === 'bilingual';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative' }}>
        {/* Top Accent Strip */}
        <div style={{ position: 'absolute', top: '-2.5mm', left: '-2.2mm', right: '-2.2mm', height: '3.2mm', backgroundColor: primaryColor, borderBottom: `2px solid ${accentColor}` }} />

        {/* 1. Header: Company Name (Stylized Banner Box like Factory Reference) */}
        <div style={{
          marginTop: '1.2mm',
          textAlign: 'center',
          padding: '1mm 0.8mm',
          backgroundColor: `${primaryColor}0c`,
          border: `1.2px solid ${primaryColor}35`,
          borderRadius: '1.5mm'
        }}>
          <div style={{ fontSize: `${7.2 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>
            {companyKh}
          </div>
          <div style={{ fontSize: `${5.2 * fontScale}px`, fontWeight: 700, color: '#334155', letterSpacing: '0.2px', textTransform: 'uppercase', lineHeight: '1.15' }}>
            {companyEn}
          </div>
          {isTri && companyZh && (
            <div style={{ fontSize: `${4.8 * fontScale}px`, color: '#64748b', lineHeight: '1.1' }}>
              {companyZh}
            </div>
          )}
        </div>

        {/* 2. Rules 1 - 6 (Table / Bordered Rows matching Factory ID Rules) */}
        <div style={{
          margin: '0.6mm 0',
          backgroundColor: '#ffffff',
          border: `1px solid #cbd5e1`,
          borderRadius: '1.2mm',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {rulesKh.map((rKh, idx) => {
            const ruleNum = idx + 1;
            const rEn = rulesEn[idx] || '';
            const rZh = rulesZh[idx] || '';
            const isLast = idx === rulesKh.length - 1;

            return (
              <div
                key={idx}
                style={{
                  padding: isTri ? '0.45mm 0.8mm' : '0.6mm 1mm',
                  borderBottom: isLast ? 'none' : `1px solid #e2e8f0`,
                  backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff',
                  fontSize: `${(isTri ? 4.5 : 5.2) * fontScale}px`,
                  lineHeight: '1.18',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.8mm'
                }}
              >
                <span style={{ fontWeight: 800, color: primaryColor, minWidth: '3.2mm', textAlign: 'right', flexShrink: 0 }}>
                  {ruleNum === 6 ? '6-' : `${ruleNum}.`}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#0f172a', fontWeight: 600 }}>{rKh}</div>
                  {(isTri || isBi) && rEn && (
                    <div style={{ color: '#475569', fontSize: `${3.9 * fontScale}px`, lineHeight: '1.1', marginTop: '0.15mm' }}>
                      {rEn}
                    </div>
                  )}
                  {isTri && rZh && (
                    <div style={{ color: '#64748b', fontSize: `${3.8 * fontScale}px`, lineHeight: '1.1' }}>
                      {rZh}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Address (អាសយដ្ឋាន) */}
        <div style={{
          backgroundColor: `${primaryColor}06`,
          border: `1px solid ${primaryColor}20`,
          borderRadius: '1.2mm',
          padding: '0.6mm 0.8mm',
          fontSize: `${(isTri ? 4.4 : 5.0) * fontScale}px`,
          lineHeight: '1.2'
        }}>
          <div>
            <strong style={{ color: primaryColor }}>អាសយដ្ឋាន: </strong>
            <span style={{ color: '#1e293b' }}>{addressKh}</span>
          </div>
          {(isTri || isBi) && addressEn && (
            <div style={{ color: '#475569', fontSize: `${3.9 * fontScale}px`, lineHeight: '1.1', marginTop: '0.15mm' }}>
              <strong>Address: </strong>{addressEn}
            </div>
          )}
          {isTri && addressZh && (
            <div style={{ color: '#64748b', fontSize: `${3.8 * fontScale}px`, lineHeight: '1.1' }}>
              <strong>地址: </strong>{addressZh}
            </div>
          )}
        </div>

        {/* 4. Admin Hotline Phone (លេខទូរស័ព្ទរដ្ឋបាល) */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: `1px solid #bfdbfe`,
          borderRadius: '1.2mm',
          padding: '0.6mm 0.8mm',
          textAlign: 'center',
          fontSize: `${5.2 * fontScale}px`,
          fontWeight: 700,
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1mm'
        }}>
          <span>លេខទូរស័ព្ទរដ្ឋបាល:</span>
          <span style={{ color: '#b91c1c', letterSpacing: '0.2px', fontWeight: 800 }}>{adminPhone}</span>
        </div>

        {/* 5. Bottom Info Bar: Issue/Expiry, Mini QR & Signature */}
        {(showBackDates || showBackQr || showBackSignature) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1mm',
            paddingTop: '0.6mm',
            borderTop: `1px dashed ${primaryColor}20`,
            marginBottom: '0.2mm'
          }}>
            {/* Dates */}
            {showBackDates && (
              <div style={{ fontSize: `${4.6 * fontScale}px`, color: '#64748b', lineHeight: '1.2', display: 'flex', flexDirection: 'column' }}>
                <div>ចេញ: <strong style={{ color: '#0f172a' }}>{issueDate}</strong></div>
                <div>ផុត: <strong style={{ color: accentColor }}>{expireDate}</strong></div>
              </div>
            )}

            {/* QR Code */}
            {showBackQr && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ padding: '0.5mm', backgroundColor: '#ffffff', borderRadius: '0.8mm', border: `1px solid ${primaryColor}30` }}>
                  <QRCodeSVG value={computedQrValue} size={28} level="M" />
                </div>
                <div style={{ fontSize: `${4 * fontScale}px`, color: '#64748b', fontWeight: 600 }}>Scan</div>
              </div>
            )}

            {/* Signature */}
            {showBackSignature && (
              <div style={{ textAlign: 'center', minWidth: '18mm' }}>
                <div style={{ width: '16mm', borderBottom: `1px solid ${primaryColor}`, margin: '0 auto 0.4mm auto' }} />
                <div style={{ fontSize: `${4.6 * fontScale}px`, fontWeight: 700, color: primaryColor }}>
                  ហត្ថលេខា / Sign
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Accent Strip */}
        <div style={{ position: 'absolute', bottom: '-2.5mm', left: '-2.2mm', right: '-2.2mm', height: '3.2mm', backgroundColor: primaryColor, borderTop: `2px solid ${accentColor}` }} />
      </div>
    );
  };

  // Landscape Horizontal Back Side (86mm × 54mm)
  const renderLandscapeBack = () => {
    const isTri = backLangMode === 'trilingual';
    const isBi = backLangMode === 'bilingual';

    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Header, Rules, Address, Hotline */}
        <div style={{ flex: 1, padding: '2mm 2.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: `1.2px solid ${primaryColor}20` }}>
          <div>
            <div style={{ fontSize: `${6.5 * fontScale}px`, fontWeight: 800, color: primaryColor, lineHeight: '1.2' }}>{companyKh}</div>
            <div style={{ fontSize: `${4.8 * fontScale}px`, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>{companyEn}</div>
            {isTri && companyZh && <div style={{ fontSize: `${4.4 * fontScale}px`, color: '#64748b' }}>{companyZh}</div>}
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '1mm', overflow: 'hidden', margin: '0.6mm 0' }}>
            {rulesKh.map((rKh, idx) => (
              <div key={idx} style={{ padding: '0.3mm 0.6mm', fontSize: `${4.2 * fontScale}px`, lineHeight: '1.15', display: 'flex', gap: '0.6mm', borderBottom: idx === rulesKh.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <strong style={{ color: primaryColor }}>{idx + 1 === 6 ? '6-' : `${idx + 1}.`}</strong>
                <span style={{ color: '#0f172a' }}>{rKh}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: `${4.3 * fontScale}px`, lineHeight: '1.15' }}>
            <span style={{ color: primaryColor, fontWeight: 700 }}>អាសយដ្ឋាន: </span>
            <span style={{ color: '#334155' }}>{addressKh}</span>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '1mm', padding: '0.4mm 0.8mm', fontSize: `${4.8 * fontScale}px`, fontWeight: 700, color: '#1e40af' }}>
            <span>លេខទូរស័ព្ទរដ្ឋបាល: </span>
            <span style={{ color: '#b91c1c' }}>{adminPhone}</span>
          </div>
        </div>

        {/* Right Column: QR Code, Dates, Signature */}
        <div style={{ width: '30mm', padding: '2mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
          {showBackQr && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '0.8mm', backgroundColor: '#ffffff', borderRadius: '1.2mm', border: `1px solid ${primaryColor}30` }}>
                <QRCodeSVG value={computedQrValue} size={36} level="M" />
              </div>
              <div style={{ fontSize: `${4.4 * fontScale}px`, color: '#64748b', fontWeight: 600, marginTop: '0.4mm' }}>ស្កេនផ្ទៀងផ្ទាត់ / Scan</div>
            </div>
          )}

          {showBackDates && (
            <div style={{ fontSize: `${4.5 * fontScale}px`, color: '#64748b', lineHeight: '1.2' }}>
              <div>ចេញ: <strong style={{ color: '#0f172a' }}>{issueDate}</strong></div>
              <div>ផុត: <strong style={{ color: accentColor }}>{expireDate}</strong></div>
            </div>
          )}

          {showBackSignature && (
            <div style={{ width: '100%', marginTop: 'auto', marginBottom: '0.5mm' }}>
              <div style={{ width: '22mm', borderBottom: `1px solid ${primaryColor}`, margin: '0 auto 0.4mm auto' }} />
              <div style={{ fontSize: `${4.8 * fontScale}px`, fontWeight: 700, color: primaryColor }}>
                ហត្ថលេខា / Authorized Sign
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* External Web Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&family=Noto+Sans+Khmer:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&family=Siemreap&family=Battambang:wght@400;700&family=Inter:wght@400;600;700&display=swap"
      />

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #id-card-print-area, #id-card-print-area * {
            visibility: visible !important;
          }
          #id-card-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: flex !important;
            flex-direction: row !important;
            gap: 12mm !important;
            justify-content: flex-start !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: transparent !important;
            transform: none !important;
          }
          .id-card-cr80 {
            box-shadow: none !important;
            border: 0.5px solid #cbd5e1 !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: ${isLandscape ? '86mm 54mm' : '54mm 86mm'};
            margin: 5mm;
          }
        }
      `}</style>

      {/* Top Header Banner & Action Buttons */}
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
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← ត្រឡប់ក្រោយ
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', margin: 0 }} className="kh-text">
              🪪 កាតសម្គាល់ខ្លួនបុគ្គលិក ៣ ភាសា (Employee ID Card Studio)
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', margin: '2px 0 0 0' }}>
              គ្រប់ម៉ូដគំរូ (All Samples) • QR Code & Barcode • Fit Content ស្អាត កុំដាច់អក្សរ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '9px 16px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
            }}
          >
            🖨️ បោះពុម្ពកាត (Print)
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            style={{
              padding: '9px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
            }}
          >
            📑 {isExporting ? 'កំពុងទាញយក...' : 'ទាញយក PDF (.pdf)'}
          </button>

          <button
            onClick={() => handleExportImage('front')}
            disabled={isExporting}
            style={{
              padding: '9px 14px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖼️ រូបមុខ (.png)
          </button>

          <button
            onClick={() => handleExportImage('back')}
            disabled={isExporting}
            style={{
              padding: '9px 14px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖼️ រូបក្រោយ (.png)
          </button>

          {/* Save as Default Button */}
          <button
            type="button"
            onClick={() => handleSaveAsDefault()}
            disabled={isSavingDefault}
            style={{
              padding: '9px 16px',
              backgroundColor: savedDefaultStyle === cardStyle ? '#047857' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSavingDefault ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 5px rgba(5, 150, 105, 0.3)',
              transition: 'all 0.15s ease'
            }}
            title="រក្សាទុក Style & ការកំណត់បច្ចុប្បន្នជាលំនាំដើមសម្រាប់កាតបុគ្គលិកទាំងអស់"
          >
            {isSavingDefault ? (
              <>
                <span>⏳</span>
                <span>កំពុងរក្សាទុក...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{savedDefaultStyle === cardStyle ? '✓ លំនាំដើមបច្ចុប្បន្ន (Default)' : 'រក្សាទុកជាលំនាំដើម (Save Default)'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '9px 12px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
            title="កំណត់ជម្រើសទាំងអស់មកសភាពដើមវិញ"
          >
            🔄 កំណត់ឡើងវិញ
          </button>
        </div>
      </div>

      {/* Toast Notification for Default Save */}
      {saveSuccessMessage && (
        <div
          className="no-print"
          style={{
            padding: '12px 18px',
            backgroundColor: '#065f46',
            color: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(6, 95, 70, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out',
            border: '1px solid #059669'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Layout: Left Controls + Right Live Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 460px) 1fr',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >
        {/* LEFT COLUMN: Customizer Controls (No-Print) */}
        <div
          className="no-print"
          style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
            overflow: 'hidden'
          }}
        >
          {/* Studio Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              padding: '4px'
            }}
          >
            <button
              onClick={() => setActiveTab('styles')}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: 'none',
                backgroundColor: activeTab === 'styles' ? '#ffffff' : 'transparent',
                color: activeTab === 'styles' ? '#4f46e5' : '#64748b',
                fontWeight: activeTab === 'styles' ? 700 : 500,
                fontSize: '11.5px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'styles' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📐 ម៉ូដគំរូ (Styles)
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: 'none',
                backgroundColor: activeTab === 'themes' ? '#ffffff' : 'transparent',
                color: activeTab === 'themes' ? '#4f46e5' : '#64748b',
                fontWeight: activeTab === 'themes' ? 700 : 500,
                fontSize: '11.5px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'themes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🎨 ពណ៌
            </button>
            <button
              onClick={() => setActiveTab('fonts')}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: 'none',
                backgroundColor: activeTab === 'fonts' ? '#ffffff' : 'transparent',
                color: activeTab === 'fonts' ? '#4f46e5' : '#64748b',
                fontWeight: activeTab === 'fonts' ? 700 : 500,
                fontSize: '11.5px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'fonts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🔤 Font
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: 'none',
                backgroundColor: activeTab === 'qr' ? '#ffffff' : 'transparent',
                color: activeTab === 'qr' ? '#4f46e5' : '#64748b',
                fontWeight: activeTab === 'qr' ? 700 : 500,
                fontSize: '11.5px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'qr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📱 QR Code
            </button>
            <button
              onClick={() => setActiveTab('content')}
              style={{
                flex: 1,
                padding: '9px 4px',
                border: 'none',
                backgroundColor: activeTab === 'content' ? '#ffffff' : 'transparent',
                color: activeTab === 'content' ? '#4f46e5' : '#64748b',
                fontWeight: activeTab === 'content' ? 700 : 500,
                fontSize: '11.5px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'content' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🌐 ៣ ភាសា
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            {/* TAB 1: ALL SAMPLES & STYLES */}
            {activeTab === 'styles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  📐 ជ្រើសរើស Style/Format កាតសម្គាល់ខ្លួន (គ្រប់ម៉ូដគំរូ):
                </div>

                {/* Default Style Status & Save Action */}
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ecfdf5',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>
                      ⭐ ម៉ូតលំនាំដើមរបស់ក្រុមហ៊ុន (Default Style):
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>{CARD_STYLES.find((s) => s.id === savedDefaultStyle)?.icon}</span>
                      <span>{CARD_STYLES.find((s) => s.id === savedDefaultStyle)?.nameKh}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAsDefault(cardStyle)}
                    disabled={isSavingDefault}
                    style={{
                      padding: '7px 13px',
                      backgroundColor: savedDefaultStyle === cardStyle ? '#10b981' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      cursor: isSavingDefault ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                      whiteSpace: 'nowrap'
                    }}
                    title="រក្សាទុកម៉ូតដែលកំពុងជ្រើសរើសជាលំនាំដើម"
                  >
                    💾 {savedDefaultStyle === cardStyle ? 'បានរក្សាទុក (Active)' : 'រក្សាទុកជាលំនាំដើម'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CARD_STYLES.map((s) => {
                    const isSelected = cardStyle === s.id;
                    const isDefault = savedDefaultStyle === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStyle(s)}
                        style={{
                          padding: '11px 12px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '22px', lineHeight: 1 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? '#4f46e5' : '#1e293b' }}>
                              {s.nameKh}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isDefault && (
                                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#047857', backgroundColor: '#d1fae5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #6ee7b7' }}>
                                  ★ លំនាំដើម
                                </span>
                              )}
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', backgroundColor: '#ede9fe', padding: '1px 6px', borderRadius: '4px' }}>
                                {s.sampleNo}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                            {s.desc}
                          </div>
                          {isSelected && !isDefault && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveAsDefault(s.id);
                              }}
                              style={{
                                marginTop: '6px',
                                padding: '3px 9px',
                                fontSize: '10.5px',
                                borderRadius: '4px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>⭐</span>
                              <span>កំណត់ម៉ូតនេះជាលំនាំដើម (Set as Default)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Display Toggles */}
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    ⚙️ ជម្រើសបន្ថែមលើកាត៖
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={showBarcode}
                        onChange={(e) => setShowBarcode(e.target.checked)}
                      />
                      <span>បង្ហាញ <strong>Barcode</strong> លើផ្នែកខាងមុខកាត (ដូចរូប 1, 4, 5)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={showLanyard}
                        onChange={(e) => setShowLanyard(e.target.checked)}
                      />
                      <span>បង្ហាញ <strong>គន្លឹះខ្សែពាក់កាត (Lanyard Clip Mockup)</strong> (ដូចរូប 3, 4, 5)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: THEMES & COLORS */}
            {activeTab === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                    ✨ ពណ៌ស្តង់ដាររៀបចំស្រាប់ (Preset Palettes)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {THEME_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyPresetTheme(t)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: activeTheme === t.id ? `2px solid ${t.accent}` : '1px solid #cbd5e1',
                          backgroundColor: activeTheme === t.id ? '#f1f5f9' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.primary, display: 'inline-block' }} />
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.accent, display: 'inline-block' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{t.nameKh.split('(')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                    🎛️ កំណត់ពណ៌ដោយផ្ទាល់ (Custom Colors)
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>ពណ៌ចម្បង (Primary Wave)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => {
                            setPrimaryColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '38px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => {
                            setPrimaryColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '75px', padding: '6px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>ពណ៌បន្ទាត់/ស៊ុម (Accent)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => {
                            setAccentColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '38px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          value={accentColor}
                          onChange={(e) => {
                            setAccentColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '75px', padding: '6px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>ពណ៌ផ្ទៃកាត (Card BG)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={cardBg}
                          onChange={(e) => {
                            setCardBg(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '38px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          value={cardBg}
                          onChange={(e) => {
                            setCardBg(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '75px', padding: '6px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>ពណ៌អក្សរ (Text Color)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '38px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value);
                            setActiveTheme('custom');
                          }}
                          style={{ width: '75px', padding: '6px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FONTS & SIZES */}
            {activeTab === 'fonts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                    🔤 ជ្រើសរើសពុម្ពអក្សរខ្មែរ (Font Family)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {FONT_OPTIONS.map((f) => (
                      <label
                        key={f.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: fontFamily === f.value ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          backgroundColor: fontFamily === f.value ? '#f5f3ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="fontFamily"
                          checked={fontFamily === f.value}
                          onChange={() => setFontFamily(f.value)}
                        />
                        <span style={{ fontFamily: f.value, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {f.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                    📏 ទំហំអក្សរលើកាត (Fit Content Scale)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {FONT_SCALES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFontScale(s.scale)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: fontScale === s.scale ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          backgroundColor: fontScale === s.scale ? '#f5f3ff' : '#ffffff',
                          color: fontScale === s.scale ? '#4f46e5' : '#334155',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: QR CODE SETTINGS */}
            {activeTab === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    💡 យោបល់ទូទៅអំពី QR Code លើកាតបុគ្គលិក៖
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#15803d', margin: 0, lineHeight: '1.4' }}>
                    ជាទូទៅនៅតាមរោងចក្រ និងក្រុមហ៊ុនធំៗ QR Code ត្រូវបានគេដាក់ជា <strong>Link ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ (Verification URL)</strong> ឬ <strong>vCard (កាត Contact)</strong> ដើម្បីឱ្យសន្តិសុខ ឬរដ្ឋបាលអាចយកទូរស័ព្ទមកស្កេនពិនិត្យបានភ្លាមៗ។
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                    ជ្រើសរើសប្រភេទ QR Code (QR Code Mode):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      {
                        id: 'verify-url',
                        title: '🌐 1. Link ផ្ទៀងផ្ទាត់បុគ្គលិក (Verification Link - ណែនាំ)',
                        desc: 'ស្កេនចូលទៅកាន់ Profile បុគ្គលិកលើប្រព័ន្ធ HRM ដើម្បីបញ្ជាក់ថាបុគ្គលិកពិតប្រាកដ ឬអត់'
                      },
                      {
                        id: 'vcard',
                        title: '📇 2. កាត Contact ឌីជីថល (vCard Contact)',
                        desc: 'ពេលស្កេនតាមទូរស័ព្ទ (iOS/Android) វានឹងលោតឱ្យ Save លេខទូរស័ព្ទ, ឈ្មោះ, តួនាទី ចូល Contact ភ្លាមៗ'
                      },
                      {
                        id: 'company-url',
                        title: '🏢 3. Link គេហទំព័រ ឬ Telegram ក្រុមហ៊ុន (Company URL)',
                        desc: 'ស្កេនបើកវេបសាយក្រុមហ៊ុន ឬ Telegram Bot សម្រាប់ឆែកមើលប័ណ្ណបើកប្រាក់ខែ (Payslip)'
                      },
                      {
                        id: 'raw-data',
                        title: '🔐 4. ទិន្នន័យអត្ថបទសុទ្ធ (Raw Barcode Text)',
                        desc: 'ផ្ទុក Employee ID, Name, Dept សម្រាប់ម៉ាស៊ីនស្កេន Barcode/QR នៅច្រកទ្វាររោងចក្រ'
                      }
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: qrType === opt.id ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          backgroundColor: qrType === opt.id ? '#f5f3ff' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="qrType"
                          checked={qrType === opt.id}
                          onChange={() => setQrType(opt.id as any)}
                          style={{ marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{opt.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {(qrType === 'verify-url' || qrType === 'company-url') && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      បញ្ចូល Link ជាក់លាក់ (Custom URL):
                    </div>
                    <input
                      type="text"
                      value={customQrUrl}
                      onChange={(e) => setCustomQrUrl(e.target.value)}
                      placeholder="ឧ. https://hrm-system-omega-gray.vercel.app ឬ link ក្រុមហ៊ុន..."
                      style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px' }}>
                      (ទុកទំនេរ ប្រព័ន្ធនឹងយក Link Verification ស្វ័យប្រវត្តិតាមអត្តលេខបុគ្គលិក)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: TRILINGUAL DATA & CONTENT */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Factory / Company Preset Selector */}
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#166534', marginBottom: '8px', display: 'block' }}>
                    🏭 ជ្រើសរើសរោងចក្រ ឬក្រុមហ៊ុន (Factory / Company Presets)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {FACTORY_PRESETS.map((fp) => (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => handleSelectFactoryPreset(fp.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: factoryPreset === fp.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
                          backgroundColor: factoryPreset === fp.id ? '#dcfce7' : '#ffffff',
                          color: factoryPreset === fp.id ? '#15803d' : '#334155',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{fp.nameKh}</span>
                        {factoryPreset === fp.id && <span style={{ fontSize: '14px' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Admin Phone Hotline (កែប្រែលេខទូរស័ព្ទរដ្ឋបាលតាមចិត្ត) */}
                <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1.5px solid #93c5fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e40af' }}>
                      📞 លេខទូរស័ព្ទរដ្ឋបាល (Admin Hotline Phone):
                    </label>
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>*កែប្រែបានតាមចិត្ត</span>
                  </div>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="069 817 168 , 066 817 168"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#b91c1c',
                      borderRadius: '6px',
                      border: '1.5px solid #3b82f6',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    បង្ហាញនៅផ្នែកខាងក្រោយកាតសម្រាប់បុគ្គលិកទាក់ទងពេលមានបណ្ដឹងតវ៉ា ឬបញ្ហាប្រាក់ខែ
                  </div>
                </div>

                {/* 3. Company Address (អាសយដ្ឋានក្រុមហ៊ុន) */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    📍 អាសយដ្ឋានក្រុមហ៊ុន / រោងចក្រ (Address 3 Languages)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇰🇭 អាសយដ្ឋានខ្មែរ:</div>
                      <textarea
                        rows={2}
                        value={addressKh}
                        onChange={(e) => setAddressKh(e.target.value)}
                        placeholder="ផ្លូវជាតិលេខ៤ ភូមិដំណាក់ត្រាច ឃុំដំបូកខ្ពស់..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇬🇧 អាសយដ្ឋានអង់គ្លេស:</div>
                      <textarea
                        rows={2}
                        value={addressEn}
                        onChange={(e) => setAddressEn(e.target.value)}
                        placeholder="National Road 4, Damnak Trach Village..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇨🇳 អាសយដ្ឋានចិន:</div>
                      <textarea
                        rows={2}
                        value={addressZh}
                        onChange={(e) => setAddressZh(e.target.value)}
                        placeholder="柬埔寨实居省普农斯罗县..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Back Card Language Mode & Toggles */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                    🌐 របៀបបង្ហាញភាសាខាងក្រោយកាត (Back Language Mode)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    {[
                      { id: 'trilingual', label: '៣ ភាសា (ខ្មែរ/EN/中文)' },
                      { id: 'khmer', label: '🇰🇭 ខ្មែរតែមួយ (ដូចគំរូ)' },
                      { id: 'bilingual', label: '២ ភាសា (ខ្មែរ/EN)' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setBackLangMode(m.id as any)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          border: backLangMode === m.id ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          backgroundColor: backLangMode === m.id ? '#f5f3ff' : '#ffffff',
                          color: backLangMode === m.id ? '#4f46e5' : '#334155',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    ⚙️ ធាតុបង្ហាញបន្ថែមខាងក្រោយកាត:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showBackQr}
                        onChange={(e) => setShowBackQr(e.target.checked)}
                      />
                      <span>បង្ហាញ QR Code ខាងក្រោយកាត</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showBackSignature}
                        onChange={(e) => setShowBackSignature(e.target.checked)}
                      />
                      <span>បង្ហាញ បន្ទាត់ហត្ថលេខា (Authorized Signature)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={showBackDates}
                        onChange={(e) => setShowBackDates(e.target.checked)}
                      />
                      <span>បង្ហាញ ថ្ងៃចេញកាត / ផុតកំណត់ (Issue & Expire Dates)</span>
                    </label>
                  </div>
                </div>

                {/* 5. 6 Factory Rules Editor */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      📜 ច្បាប់វិន័យ ៦ ចំណុចលើកាត (Factory 6 Rules)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRulesKh(DEFAULT_6_RULES_KH);
                        setRulesEn(DEFAULT_6_RULES_EN);
                        setRulesZh(DEFAULT_6_RULES_ZH);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="ស្តារច្បាប់វិន័យទាំង ៦ ចំណុចទៅដូចគំរូរោងចក្រដើម"
                    >
                      🔄 ស្តារ ៦ ចំណុចដើម
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rulesKh.map((rKh, i) => (
                      <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', backgroundColor: '#ffffff' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#4338ca', marginBottom: '4px' }}>
                          ចំណុចទី {i + 1} ({i === 5 ? 'ផ្នែកបណ្តឹងតវ៉ា & លេខទូរស័ព្ទ' : `ច្បាប់ទី ${i + 1}`}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            value={rKh}
                            onChange={(e) => {
                              const updated = [...rulesKh];
                              updated[i] = e.target.value;
                              setRulesKh(updated);
                            }}
                            placeholder={`ច្បាប់ទី ${i + 1} ជាភាសាខ្មែរ...`}
                            style={{ width: '100%', padding: '5px 7px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                          {backLangMode !== 'khmer' && (
                            <>
                              <input
                                type="text"
                                value={rulesEn[i] || ''}
                                onChange={(e) => {
                                  const updated = [...rulesEn];
                                  updated[i] = e.target.value;
                                  setRulesEn(updated);
                                }}
                                placeholder={`Rule ${i + 1} in English...`}
                                style={{ width: '100%', padding: '5px 7px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}
                              />
                              {backLangMode === 'trilingual' && (
                                <input
                                  type="text"
                                  value={rulesZh[i] || ''}
                                  onChange={(e) => {
                                    const updated = [...rulesZh];
                                    updated[i] = e.target.value;
                                    setRulesZh(updated);
                                  }}
                                  placeholder={`条款 ${i + 1} 中文...`}
                                  style={{ width: '100%', padding: '5px 7px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Company Name Header Inputs */}
                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    🏢 ឈ្មោះក្រុមហ៊ុន និងពាក្យស្លោក (Company Header & Tagline)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇰🇭 ភាសាខ្មែរ (ខាងលើគេ):</div>
                      <input
                        type="text"
                        value={companyKh}
                        onChange={(e) => setCompanyKh(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇬🇧 ភាសាអង់គ្លេស:</div>
                      <input
                        type="text"
                        value={companyEn}
                        onChange={(e) => setCompanyEn(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🇨🇳 ភាសាចិន:</div>
                      <input
                        type="text"
                        value={companyZh}
                        onChange={(e) => setCompanyZh(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>✨ ពាក្យស្លោកក្រុមហ៊ុន (Tagline):</div>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="ឧ. Excellence in Quality / គុណភាពជាចម្បង..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Dates & Blood Group */}
                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    📅 កាលបរិច្ឆេទ & ប្រភេទឈាម
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>ថ្ងៃចេញកាត:</div>
                      <input
                        type="text"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', fontSize: '11px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>ថ្ងៃផុតកំណត់:</div>
                      <input
                        type="text"
                        value={expireDate}
                        onChange={(e) => setExpireDate(e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', fontSize: '11px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>ប្រភេទឈាម:</div>
                      <input
                        type="text"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', fontSize: '11px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 8. Employee Details Tuning */}
                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    👤 ឈ្មោះ និងតួនាទីបុគ្គលិក
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ឈ្មោះខ្មែរ:</div>
                        <input
                          type="text"
                          value={nameKh}
                          onChange={(e) => setNameKh(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ឈ្មោះអង់គ្លេស:</div>
                        <input
                          type="text"
                          value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>តួនាទី (KH / EN / ZH):</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                        <input
                          type="text"
                          value={posKh}
                          onChange={(e) => setPosKh(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text"
                          value={posEn}
                          onChange={(e) => setPosEn(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text"
                          value={posZh}
                          onChange={(e) => setPosZh(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ផ្នែក/ដេប៉ាតឺម៉ង់ (KH / EN / ZH):</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                        <input
                          type="text"
                          value={deptKh}
                          onChange={(e) => setDeptKh(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text"
                          value={deptEn}
                          onChange={(e) => setDeptEn(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text"
                          value={deptZh}
                          onChange={(e) => setDeptZh(e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>លេខទូរស័ព្ទផ្ទាល់ខ្លួនបុគ្គលិក (Personal Tel):</div>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Card Canvas & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Style Switcher Bar directly above Canvas */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--card-bg, #ffffff)',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)',
              fontSize: '12.5px',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            {/* Quick Style Switcher Pills on Canvas Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>Style:</span>
              {CARD_STYLES.map((s) => {
                const isSelected = cardStyle === s.id;
                const isDefault = savedDefaultStyle === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStyle(s)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: isSelected ? '1.5px solid #4f46e5' : isDefault ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f5f3ff' : isDefault ? '#f0fdf4' : '#ffffff',
                      color: isSelected ? '#4f46e5' : isDefault ? '#047857' : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={isDefault ? 'ម៉ូតលំនាំដើមរបស់ក្រុមហ៊ុន (Default)' : s.nameKh}
                  >
                    <span>{s.icon}</span>
                    <span>{s.nameKh.split('(')[0]}</span>
                    {isDefault && <span style={{ color: '#059669', fontWeight: 800 }}>★</span>}
                  </button>
                );
              })}

              {/* Quick Save as Default Pill Button */}
              <button
                type="button"
                onClick={() => handleSaveAsDefault(cardStyle)}
                disabled={isSavingDefault}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: savedDefaultStyle === cardStyle ? '#ecfdf5' : '#10b981',
                  color: savedDefaultStyle === cardStyle ? '#065f46' : '#ffffff',
                  border: savedDefaultStyle === cardStyle ? '1px solid #a7f3d0' : 'none',
                  fontWeight: 700,
                  cursor: isSavingDefault ? 'wait' : 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px'
                }}
                title="រក្សាទុកម៉ូតនេះជាលំនាំដើម (Save as Default)"
              >
                <span>💾</span>
                <span>{savedDefaultStyle === cardStyle ? '★ លំនាំដើម (Active)' : 'រក្សាទុកជាលំនាំដើម'}</span>
              </button>
            </div>

            {/* Preview Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: '#64748b' }}>Zoom:</span>
              {[
                { label: '100%', val: 1.0 },
                { label: '120%', val: 1.2 },
                { label: '140%', val: 1.4 }
              ].map((z) => (
                <button
                  key={z.val}
                  onClick={() => setPreviewZoom(z.val)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: previewZoom === z.val ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                    backgroundColor: previewZoom === z.val ? '#f5f3ff' : '#ffffff',
                    color: previewZoom === z.val ? '#4f46e5' : '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Display Container (Both Screen and Print) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '16px 0 24px 0',
              overflowX: 'auto',
              minHeight: '480px'
            }}
          >
            <div
              id="id-card-print-area"
              style={{
                display: 'flex',
                gap: isLandscape ? '24px' : '32px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'flex-start',
                transform: `scale(${previewZoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              {/* ========================================================= */}
              {/* FRONT SIDE CARD                                           */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {showLanyard && !isLandscape && <LanyardClipMockup color={primaryColor} />}
                <div
                  id="id-card-front"
                  className="id-card-cr80"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    minWidth: cardWidth,
                    minHeight: cardHeight,
                    maxWidth: cardWidth,
                    maxHeight: cardHeight,
                    backgroundColor: cardBg,
                    borderRadius: '3.5mm',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxSizing: 'border-box',
                    fontFamily: fontFamily,
                    color: textColor,
                    userSelect: 'none'
                  }}
                >
                  {cardStyle === 'wave-gold' && renderWaveGoldFront()}
                  {cardStyle === 'green-wave' && renderGreenWaveFront()}
                  {cardStyle === 'green-eco' && renderGreenEcoFront()}
                  {cardStyle === 'angular-tech' && renderAngularTechFront()}
                  {cardStyle === 'corporate' && renderCorporateFront()}
                  {cardStyle === 'landscape' && renderLandscapeFront()}
                  {cardStyle === 'executive' && renderExecutiveFront()}
                </div>
                <div className="no-print" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
                  ផ្នែកខាងមុខ (Front Side)
                </div>
              </div>

              {/* ========================================================= */}
              {/* BACK SIDE CARD                                            */}
              {/* ========================================================= */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {showLanyard && !isLandscape && <LanyardClipMockup color={primaryColor} />}
                <div
                  id="id-card-back"
                  className="id-card-cr80"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    minWidth: cardWidth,
                    minHeight: cardHeight,
                    maxWidth: cardWidth,
                    maxHeight: cardHeight,
                    backgroundColor: cardBg,
                    borderRadius: '3.5mm',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxSizing: 'border-box',
                    fontFamily: fontFamily,
                    color: textColor,
                    padding: isLandscape ? '0' : '3mm 2.6mm',
                    userSelect: 'none'
                  }}
                >
                  {isLandscape ? renderLandscapeBack() : renderVerticalBack()}
                </div>
                <div className="no-print" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
                  ផ្នែកខាងក្រោយ (Back Side)
                </div>
              </div>
            </div>
          </div>

          {/* Guidance Footer Note */}
          <div
            className="no-print"
            style={{
              padding: '12px 16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div>
              💡 <strong>Style បច្ចុប្បន្ន:</strong> {CARD_STYLES.find(s => s.id === cardStyle)?.nameKh} ({cardWidth} × {cardHeight}) ស្តង់ដារ CR80 PVC Card {savedDefaultStyle === cardStyle ? '• ⭐ (ម៉ូតលំនាំដើមក្រុមហ៊ុន / Default)' : ''}
            </div>
            <div style={{ fontWeight: 600, color: '#2563eb' }}>
              ✓ Fit Content ស្អាត កុំដាច់អក្សរ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
