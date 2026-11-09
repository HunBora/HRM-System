export interface FactoryPreset {
  id: string;
  nameKh: string;
  nameEn: string;
  companyKh: string;
  companyEn: string;
  companyZh: string;
  addressKh: string;
  addressEn: string;
  addressZh: string;
  adminPhone: string;
  primaryColor?: string;
  accentColor?: string;
}

export const FACTORY_PRESETS: FactoryPreset[] = [
  {
    id: 'wahgoo',
    nameKh: '🏭 វ៉ាហ្គូ ប៊ែក (Wahgoo Bags)',
    nameEn: 'Wahgoo Bags Technology',
    companyKh: 'វ៉ាហ្គូ ប៊ែក (ខេមបូឌា) ថេកណឡូជី ឯ.ក',
    companyEn: 'WAHGOO BAGS (CAMBODIA) TECHNOLOGY CO., LTD',
    companyZh: '华高箱包（柬埔寨）科技有限公司',
    addressKh: 'ផ្លូវជាតិលេខ៤ ភូមិដំណាក់ត្រាច ឃុំដំបូកខ្ពស់ ស្រុកភ្នំស្រួច ខេត្តកំពង់ស្ពឺ',
    addressEn: 'National Road 4, Damnak Trach Village, Dambouk Khpos Commune, Phnom Sruoch District, Kampong Speu Province',
    addressZh: '柬埔寨实居省普农斯罗县丹博克波乡达那达村4号国道',
    adminPhone: '069 817 168 , 066 817 168',
    primaryColor: '#0a192f',
    accentColor: '#10b981'
  },
  {
    id: 'gs-textile',
    nameKh: '🏭 ជី.អេស ថិចស្ដាយ (G.S Textile Garment)',
    nameEn: 'G.S Textile Garment',
    companyKh: 'ជី.អេស ថិចស្ដាយ ហ្គាមិន (ខេមបូឌា)',
    companyEn: 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD',
    companyZh: '金边纺织制衣（柬埔寨）有限公司',
    addressKh: 'ផ្លូវវេងស្រេង សង្កាត់ចោមចៅ ខណ្ឌពោធិ៍សែនជ័យ រាជធានីភ្នំពេញ',
    addressEn: 'Veng Sreng Blvd, Sangkat Chaom Chau, Khan Pur Senchey, Phnom Penh',
    addressZh: '金边市菩森芷区宗周分区温斯林大道',
    adminPhone: '023 888 999 , 012 999 888',
    primaryColor: '#1e3a8a',
    accentColor: '#eab308'
  },
  {
    id: 'custom',
    nameKh: '⚙️ កំណត់ផ្ទាល់ខ្លួន (Custom Company)',
    nameEn: 'Custom / Other Company',
    companyKh: '',
    companyEn: '',
    companyZh: '',
    addressKh: '',
    addressEn: '',
    addressZh: '',
    adminPhone: ''
  }
];

export const DEFAULT_6_RULES_KH = [
  'កាតនេះប្រើសម្រាប់សម្គាល់កម្មករនិយោជិតនៅក្នុងក្រុមហ៊ុនតែប៉ុណ្ណោះ។',
  'កាតនេះហាមធ្វើឲ្យបាត់ ឬឲ្យគេខ្ចីប្រើប្រាស់',
  'ករណីបាត់កាតត្រូវរាយការណ៍មកផ្នែករដ្ឋបាលភ្លាម',
  'កាតនេះត្រូវពាក់ជាប់ខ្លួនរាល់ពេលចូលក្រុមហ៊ុន',
  'កាតនេះត្រូវប្រគល់ជូនមកក្រុមហ៊ុនវិញនៅពេលបងប្អូនឈប់ពីការងារ។',
  'សូមធ្វើការទំនាក់ទំនងតាមលេខទូរស័ព្ទខាងក្រោមក្នុងករណីបណ្តឹងតវ៉ាមិនសុខចិត្ត, ការបៀតបៀនផ្លូវភេទឬមានការរើសអើង និង បញ្ហាប្រាក់ខែជាដើម។'
];

export const DEFAULT_6_RULES_EN = [
  'This card is strictly used to identify employees within the company.',
  'Do not lose this card or lend it to others.',
  'If lost, report immediately to Administration Department.',
  'Must be worn at all times when entering the company.',
  'Must be returned to the company upon employment termination.',
  'Please contact the telephone numbers below in case of grievance, sexual harassment, discrimination, payroll issues, etc.'
];

export const DEFAULT_6_RULES_ZH = [
  '此卡仅用于本公司员工身份识别。',
  '此卡严禁遗失或转借他人使用。',
  '如遗失请立即向行政部报告。',
  '进入公司时须随身佩戴。',
  '离职时须将此卡交还公司。',
  '如有申诉、性骚扰、歧视或薪资等问题，请拨打以下电话联系。'
];
