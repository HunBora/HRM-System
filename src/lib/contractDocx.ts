import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import {
  ContractFormData,
  CONTRACT_TYPE_METADATA,
  formatContractDate,
  getGenderLabel,
} from './contractTemplates';

const FONT_FAMILY = {
  name: 'Khmer OS Battambang',
  ascii: 'Calibri',
  cs: 'Khmer OS Battambang',
  eastAsia: 'SimSun',
};

export async function generateContractDocxBlob(data: ContractFormData): Promise<Blob> {
  const meta = CONTRACT_TYPE_METADATA[data.contractType] || CONTRACT_TYPE_METADATA.FDC;
  const gender = getGenderLabel(data.gender);
  const formattedDob = formatContractDate(data.dob);
  const formattedSignedDate = formatContractDate(data.signedDate);
  const formattedStartDate = formatContractDate(data.startDate);
  const formattedEndDate =
    data.contractType === 'UDC'
      ? 'គ្មានកំណត់ / Indefinite / 无固定期限'
      : formatContractDate(data.endDate);

  const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorderCell = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '94A3B8' },
  };

  // 1. Header Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { line: 260, before: 0, after: 30 },
                children: [
                  new TextRun({
                    text: 'ឈ្មោះក្រុមហ៊ុន / Company name / 公司名称: ',
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: data.companyName || '__________',
                    bold: true,
                    underline: {},
                    size: 19,
                    color: '1E3A8A',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { line: 260, before: 0, after: 30 },
                children: [
                  new TextRun({
                    text: 'លេខឯកសារ / Doc No: ',
                    size: 17,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: data.contractNo || 'HR-CON-____',
                    bold: true,
                    size: 18,
                    color: '1E3A8A',
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: '   Rev: ',
                    size: 17,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: data.revision || '01',
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Helper for trilingual sections
  const createSectionHeader = (titleKm: string, titleEn: string, titleZh: string) => {
    return new Paragraph({
      spacing: { before: 180, after: 50, line: 260 },
      keepNext: true,
      children: [
        new TextRun({
          text: `${titleKm} / ${titleEn} / ${titleZh}`,
          bold: true,
          size: 20,
          color: '1E3A8A',
          font: FONT_FAMILY,
        }),
      ],
    });
  };

  const createTrilingualParagraph = (kmText: string, enText: string, zhText: string) => {
    return [
      new Paragraph({
        spacing: { before: 30, after: 20, line: 260 },
        children: [
          new TextRun({
            text: kmText,
            size: 19,
            color: '0F172A',
            font: FONT_FAMILY,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 15, after: 20, line: 250 },
        children: [
          new TextRun({
            text: enText,
            size: 17,
            italics: true,
            color: '334155',
            font: FONT_FAMILY,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 15, after: 60, line: 250 },
        children: [
          new TextRun({
            text: zhText,
            size: 17,
            color: '475569',
            font: FONT_FAMILY,
          }),
        ],
      }),
    ];
  };

  // Section 1 Terms variation based on contract type & MLVT Instructions
  let termKm = '';
  let termEn = '';
  let termZh = '';

  if (data.contractType === 'PROBATION') {
    const catLabel =
      data.probationCategory === 'SPECIALISED'
        ? 'កម្មករឯកទេស (២ ខែ)'
        : data.probationCategory === 'NON_SPECIALISED'
        ? 'កម្មករធម្មតា (១ ខែ)'
        : 'និយោជិត/ការិយាល័យ (៣ ខែ)';
    const catEn =
      data.probationCategory === 'SPECIALISED'
        ? 'Specialised Worker (2 months)'
        : data.probationCategory === 'NON_SPECIALISED'
        ? 'Non-specialised Worker (1 month)'
        : 'Employee/Office (3 months)';
    const catZh =
      data.probationCategory === 'SPECIALISED'
        ? '专业工人（2个月）'
        : data.probationCategory === 'NON_SPECIALISED'
        ? '普通工人（1个月）'
        : '职员/办公室（3个月）';

    termKm = `• រយៈពេលសាកល្បង៖ ចាប់ពីថ្ងៃទី ${formattedStartDate} ដល់ថ្ងៃទី ${formattedEndDate}។ រយៈពេលអតិបរមាអនុលោមតាមមាត្រា ៦៨ នៃច្បាប់ស្តីពីការងារ៖ ៣ ខែសម្រាប់និយោជិត; ២ ខែសម្រាប់កម្មករឯកទេស; ១ ខែសម្រាប់កម្មករធម្មតា (ប្រភេទមុខងារជាក់ស្តែង៖ ${catLabel})។ សោហ៊ុយធ្វើដំណើរទៅមកសម្រាប់កម្មករនិយោជិតសាកល្បងដែលត្រូវទៅធ្វើការឆ្ងាយពីលំនៅធម្មតា ត្រូវនៅក្នុងបន្ទុកនិយោជក។ យោងមាត្រា ៨២ នៃច្បាប់ការងារ គូភាគីមិនចាំបាច់គោរពកាតព្វកិច្ចជូនដំណឹងមុនក្នុងអំឡុងពេលសាកល្បងឡើយ។ បន្ទាប់ពីឆ្លងផុតរយៈពេលសាកល្បងដោយជោគជ័យ ភាគីទាំងពីរនឹងចុះកិច្ចសន្យាការងារមានថិរវេលាកំណត់ (FDC) ឬកិច្ចសន្យាការងារមានថិរវេលាមិនកំណត់ (UDC) ជាផ្លូវការ។`;
    termEn = `• Probation Period: From ${formattedStartDate} to ${formattedEndDate}. Maximum duration complies with Article 68 of the Labour Law: 3 months for employees; 2 months for specialised workers; 1 month for non-specialised workers (Designated category: ${catEn}). Round-trip travel expenses for workers assigned far from their usual residence are borne by the employer. Pursuant to Article 82, neither party is required to give advance notice during the probationary period. Upon successful evaluation, a formal FDC or UDC shall be executed.`;
    termZh = `• 试用期限：自 ${formattedStartDate} 至 ${formattedEndDate}。最长试用期依照劳动法第68条规定：职员3个月、专业工人2个月、普通工人1个月（岗位类别：${catZh}）。试用员工因派遣远离原住所所产生的往返交通费用由雇主承担。依第82条规定，试用期内解除合同无需提前通知。试用期满合格后，双方将正式签署固定期限（FDC）或无固定期限（UDC）劳动合同。`;
  } else if (data.contractType === 'UDC') {
    termKm = `• ការចាប់ផ្តើម និងថិរវេលា៖ ចាប់ផ្តើមអនុវត្តពីថ្ងៃទី ${formattedStartDate} ដោយគ្មានកាលបរិច្ឆេទបញ្ចប់កំណត់ជាមុនឡើយ (មាត្រា ៧៤)។ អតីតភាពការងាររបស់កម្មករនិយោជិតត្រូវបានគណនាចាប់ពីថ្ងៃចូលបម្រើការងារ។ ការរំលាយកិច្ចសន្យាត្រូវមានមូលហេតុស្របច្បាប់ (មាត្រា ៧៤, ៨៣) និងមានកាតព្វកិច្ចជូនដំណឹងជាមុនតាមមាត្រា ៧៥ នៃច្បាប់ស្តីពីការងារ៖ ៧ ថ្ងៃ (ធ្វើការក្រោម ៦ ខែ); ១៥ ថ្ងៃ (៦ ខែដល់ ២ ឆ្នាំ); ១ ខែ (លើស ២ ដល់ ៥ ឆ្នាំ); ២ ខែ (លើស ៥ ដល់ ១០ ឆ្នាំ); ៣ ខែ (លើសពី ១០ ឆ្នាំឡើងទៅ)។ ប្រាក់បំណាច់អតីតភាពការងារត្រូវបានទូទាត់រៀងរាល់ ៦ ខែម្តង (១៥ ថ្ងៃក្នុងមួយឆ្នាំ) ស្របតាមមាត្រា ៨៩ ថ្មី និង ១១០ ថ្មី នៃច្បាប់ស្តីពីការងារ។`;
    termEn = `• Commencement and Duration: Commences on ${formattedStartDate} with no predetermined end date (Article 74). Seniority is calculated from the initial date of service. Termination requires legitimate lawful cause (Articles 74, 83) and advance written notice pursuant to Article 75: 7 days (service under 6 months); 15 days (6 months to 2 years); 1 month (over 2 to 5 years); 2 months (over 5 to 10 years); 3 months (over 10 years). Seniority indemnity is disbursed semi-annually (15 days of wages per year) in accordance with New Articles 89 and 110.`;
    termZh = `• 合同期限：自 ${formattedStartDate} 起生效，无预先确定终止日期（第74条）。员工工龄自入职之日起计算。解除合同须具备合法正当理由（第74、83条）并依第75条提前书面通知：不足6个月提前7天；6个月至2年提前15天；超过2年至5年提前1个月；超过5年至10年提前2个月；超过10年提前3个月。工龄补偿金每半年发放一次（全年累计15天工资），依照劳动法新第89条及新第110条执行。`;
  } else {
    // FDC or FOREIGN_FDC
    const foreignAddonKm =
      data.isForeigner && data.workPermitNo
        ? ` [ប័ណ្ណការងារ MLVT: ${data.workPermitNo} (ផុតកំណត់: ${formatContractDate(data.workPermitExpiry)}) | ទិដ្ឋាការ: ${data.visaNo || 'N/A'}]`
        : '';
    const foreignAddonEn =
      data.isForeigner && data.workPermitNo
        ? ` [MLVT Work Permit: ${data.workPermitNo} (Expires: ${formatContractDate(data.workPermitExpiry)}) | Visa: ${data.visaNo || 'N/A'}]`
        : '';
    const foreignAddonZh =
      data.isForeigner && data.workPermitNo
        ? ` [柬埔寨劳工部工作许可证: ${data.workPermitNo} (到期日: ${formatContractDate(data.workPermitExpiry)}) | 签证: ${data.visaNo || 'N/A'}]`
        : '';

    termKm = `• រយៈពេលកិច្ចសន្យា៖ ចាប់ពីថ្ងៃទី ${formattedStartDate} ដល់ថ្ងៃទី ${formattedEndDate}។ កិច្ចសន្យានេះត្រូវធ្វើឡើងជាលាយលក្ខណ៍អក្សរ និងមានបញ្ជាក់កាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់ច្បាស់លាស់ ដោយថិរវេលានីមួយៗមិនលើសពី ២ ឆ្នាំឡើយ (មាត្រា ៦៧)។ ការបន្តកិច្ចសន្យាអាចធ្វើឡើងម្តង ឬច្រើនដង ស្របតាមសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ ដោយថិរវេលាសរុបមិនលើសពី ៤ ឆ្នាំឡើយ${foreignAddonKm}។ នៅពេលផុតកំណត់ និយោជកត្រូវជូនដំណឹងមុនតាមមាត្រា ៧៣ កថាខណ្ឌទី ៥ (១០ ថ្ងៃសម្រាប់កិច្ចសន្យាលើស ៦ ខែដល់ ១ ឆ្នាំ; ១៥ ថ្ងៃសម្រាប់កិច្ចសន្យាលើស ១ ឆ្នាំ) និងផ្តល់ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥% នៃប្រាក់ឈ្នួលសរុបដែលបានបើកក្នុងអំឡុងពេលកិច្ចសន្យា។`;
    termEn = `• Contract Term: From ${formattedStartDate} to ${formattedEndDate}. This agreement is executed in writing with definite start and expiration dates; each duration shall not exceed two years (Article 67). Renewals are governed by MLVT Instruction No. 050/19, with the cumulative duration not exceeding four years${foreignAddonEn}. Upon expiration, statutory advance notice applies under Article 73(5) (10 days for contracts >6 months up to 1 year; 15 days for >1 year) alongside a severance payment of at least 5% of all wages paid throughout the contract duration.`;
    termZh = `• 合同期限：自 ${formattedStartDate} 至 ${formattedEndDate}。本合同采用书面形式并载明明确的起止日期，单期合同不得超过2年（第67条）。续签遵循柬埔寨劳工部第050/19号指导文件，累计期限不得超过4年${foreignAddonZh}。合同期满时，雇主须依法提前通知（超过6个月至1年提前10天；超过1年提前15天），并依法足额发放期满补偿金，标准至少为合同期内实发工资总额的5%（第73条）。`;
  }

  // Parties info
  const partiesKm = `និយោជក៖ ឈ្មោះក្រុមហ៊ុន/សហគ្រាស ${data.companyName || '__________'} អាសយដ្ឋាន ${data.companyAddress || '__________'} តំណាងដោយ ${data.representative || '__________'} តួនាទី ${data.representativeRole || '__________'}។ កម្មករនិយោជិត៖ ឈ្មោះ ${data.employeeNameKh || data.employeeNameEn || '__________'} (ឡាតាំង: ${data.employeeNameEn || '__________'}) ភេទ ${gender.kh} ថ្ងៃខែឆ្នាំកំណើត ${formattedDob} សញ្ជាតិ ${data.nationality || 'ខ្មែរ'} លេខអត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន ${data.nationalIdOrPassport || '__________'} អាសយដ្ឋានបច្ចុប្បន្ន ${data.address || '__________'}។`;
  const partiesEn = `Employer: Company ${data.companyName || '__________'}, address ${data.companyAddress || '__________'}, represented by ${data.representative || '__________'}, position ${data.representativeRole || '__________'}. Employee: Name ${data.employeeNameEn || '__________'} (Khmer: ${data.employeeNameKh || data.employeeNameEn || '__________'}), sex ${gender.en}, date of birth ${formattedDob}, nationality ${data.nationality || 'Cambodian'}, ID/Passport ${data.nationalIdOrPassport || '__________'}, address ${data.address || '__________'}.`;
  const partiesZh = `雇主：公司/企业名称 ${data.companyName || '__________'}，地址 ${data.companyAddress || '__________'}，法定代表/授权人 ${data.representative || '__________'}，职务 ${data.representativeRole || '__________'}。员工：姓名 ${data.employeeNameKh || data.employeeNameEn || '__________'}（英文：${data.employeeNameEn || '__________'}），性别 ${gender.zh}，出生日期 ${formattedDob}，国籍 ${data.nationality || '柬埔寨'}，身份证/护照号 ${data.nationalIdOrPassport || '__________'}，现居地址 ${data.address || '__________'}。`;

  // Section 2: Position, Workplace & Detailed Scope of Work
  const jobScopeDetailKh = data.jobScopeKh || data.jobScope || 'ទទួលបន្ទុកអនុវត្តភារកិច្ចស្នូលប្រចាំថ្ងៃស្របតាមមុខតំណែង និងការណែនាំស្របច្បាប់របស់ថ្នាក់ដឹកនាំ; គោរពបទបញ្ជាផ្ទៃក្នុង គោលការណ៍វិជ្ជាជីវៈ និងច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា។';
  const jobScopeDetailEn = data.jobScopeEn || data.jobScope || 'Execute key daily responsibilities in accordance with operational requirements and lawful instructions of management; adhere to company internal rules and the Labour Law of Cambodia.';
  const jobScopeDetailZh = data.jobScopeZh || data.jobScope || '根据岗位说明及管理层正当工作指派履行日常职责；严格遵守公司内部规章制度及柬埔寨王国劳动法。';

  const posKm = `• មុខតំណែង៖ ${data.positionTitle || '__________'} | នាយកដ្ឋាន៖ ${data.department || '__________'}\n• ទីកន្លែងធ្វើការ៖ ${data.workplace || data.companyAddress || '__________'}\n• អ្នករាយការណ៍ផ្ទាល់៖ ${data.supervisorRole || 'ថ្នាក់ដឹកនាំផ្ទាល់ / Direct Supervisor'}\n• វិសាលភាពភារកិច្ចការងារលម្អិត (Scope of Work)៖ ${jobScopeDetailKh}`;
  const posEn = `• Position: ${data.positionTitle || '__________'} | Department: ${data.department || '__________'}\n• Workplace: ${data.workplace || data.companyAddress || '__________'}\n• Direct Supervisor: ${data.supervisorRole || 'Direct Supervisor'}\n• Scope of Work / Core Responsibilities: ${jobScopeDetailEn}`;
  const posZh = `• 岗位职务：${data.positionTitle || '__________'} | 所属部门：${data.department || '__________'}\n• 工作地点：${data.workplace || data.companyAddress || '__________'}\n• 直接汇报上级：${data.supervisorRole || '直接主管'}\n• 详细工作职责范围（Scope of Work）：${jobScopeDetailZh}`;

  // Section 3: Wages & Payment
  const wageKm = `• ប្រាក់ឈ្នួលគោល៖ ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'} ដុល្លារអាមេរិក/ខែ ឬ ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'} រៀល/ខែ (មិនទាបជាងកម្រិតប្រាក់ឈ្នួលអប្បបរមាស្របច្បាប់)។\n• កាលបរិច្ឆេទ និងមធ្យោបាយទូទាត់៖ បើកជូននៅថ្ងៃទី ${data.paymentDay || '01-05'} នៃខែនីមួយៗ តាមរយៈ ${data.paymentMethod || 'Bank Transfer / ផ្ទេរតាមធនាគារ'} (មាត្រា ១១៦)។\n• ប្រាក់ថែមម៉ោង (OT)៖ គណនាតាមមាត្រា ១៣៩ នៃច្បាប់ការងារ (១៣០% ម៉ោងធម្មតា, ១៥០% ពេលយប់ ឬ ២០០% ថ្ងៃអាទិត្យ/បុណ្យ)។`;
  const wageEn = `• Basic Wage: USD ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'}/month or KHR ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'}/month (never below statutory minimum wage).\n• Payment Schedule & Method: Disbursed on the ${data.paymentDay || '01-05'} of each month via ${data.paymentMethod || 'Bank Transfer'} (Article 116).\n• Overtime (OT): Paid according to Article 139 (130% normal OT, 150% night work, or 200% Sundays/Public Holidays).`;
  const wageZh = `• 基本工资：每月 ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'} 美元或 ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'} 瑞尔（不低于法定最低工资标准）。\n• 发薪日及方式：每月 ${data.paymentDay || '01-05'} 日通过 ${data.paymentMethod || '银行转账'} 支付（第116条）。\n• 加班费：依第139条标准核算（平时加班130%，夜间加班150%，周日及法定节假日加班200%）。`;

  // Section 4: Working Hours & Rest
  const hoursKm = `• ម៉ោងធ្វើការធម្មតា៖ ${data.workingHours || '07:00 ដល់ 11:00 / 13:00 ដល់ 17:00'} (មិនលើស ៨ ម៉ោង/ថ្ងៃ និង ៤៨ ម៉ោង/សប្តាហ៍ តាមមាត្រា ១៣៧)។\n• សម្រាកអាហារថ្ងៃត្រង់៖ ${data.mealBreak || '11:00 ដល់ 13:00'}។\n• ថ្ងៃធ្វើការ៖ ${data.workingDays || 'ច័ន្ទ ដល់ សៅរ៍'} ដោយមានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍យ៉ាងតិច ២៤ ម៉ោងជាប់គ្នា (ជាទូទៅថ្ងៃអាទិត្យ មាត្រា ១៤៦)។`;
  const hoursEn = `• Normal Work Hours: ${data.workingHours || '07:00 to 11:00 / 13:00 to 17:00'} (not exceeding 8 hours/day and 48 hours/week pursuant to Article 137).\n• Meal/Rest Break: ${data.mealBreak || '11:00 to 13:00'}.\n• Working Days: ${data.workingDays || 'Monday to Saturday'} with at least 24 consecutive hours of weekly rest (normally Sunday, Article 146).`;
  const hoursZh = `• 正常工作时间：${data.workingHours || '07:00至11:00 / 13:00至17:00'}（依照第137条，每日不超过8小时、每周不超过48小时）。\n• 用餐与中休：${data.mealBreak || '11:00至13:00'}。\n• 工作日安排：${data.workingDays || '周一至周六'}，每周保证至少连续24小时的休息日（通常为周日，第146条）。`;

  // Section 5: Leave & Social Security
  const leaveKm = `• ការឈប់សម្រាកប្រចាំឆ្នាំមានប្រាក់ឈ្នួល៖ ១.៥ ថ្ងៃក្នុងមួយខែ (១៨ ថ្ងៃក្នុងមួយឆ្នាំ) និងបូកបន្ថែម ១ ថ្ងៃក្នុងរៀងរាល់ ៣ ឆ្នាំនៃអតីតភាពការងារ (មាត្រា ១៦៦)។\n• ថ្ងៃបុណ្យជាតិមានប្រាក់ឈ្នួល៖ អនុវត្តតាមសេចក្តីប្រកាសប្រចាំឆ្នាំរបស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ (មាត្រា ១៦១)។\n• របបសន្តិសុខសង្គម ប.ស.ស.៖ និយោជកធានាចុះបញ្ជិកា និងបង់វិភាគទាន ប.ស.ស. លើផ្នែកហានិភ័យការងារ ថែទាំសុខភាព និងប្រាក់សោធននិវត្តន៍ ជូនកម្មករនិយោជិតស្របតាមច្បាប់។`;
  const leaveEn = `• Paid Annual Leave: 1.5 days per month of service (18 working days/year), plus 1 additional day per 3 years of seniority (Article 166).\n• Paid Public Holidays: Fully observed in accordance with the annual Prakas of the MLVT (Article 161).\n• NSSF Social Security: The employer ensures full enrollment and timely contributions for Occupational Risk, Health Care, and Pension Schemes.`;
  const leaveZh = `• 带薪年假：每月1.5个工作日（全年18天），并在本企业每满3年工龄递增1天（第166条）。\n• 带薪法定假日：严格执行柬埔寨劳工部年度法定公共假日通告（第161条）。\n• 国家社保（NSSF）：雇主依法为员工办理并缴纳工伤保险、健康医疗保险及养老保险金。`;

  // Section 6: Safety, Health, Discipline & Suspension
  const safetyKm = `• សុវត្ថិភាព និងសុខភាពការងារ៖ និយោជកធានាបរិយាកាសការងារប្រកបដោយអនាម័យ សុវត្ថិភាព និងផ្តល់ឧបករណ៍ការពារការងារ (PPE) គ្រប់គ្រាន់ (មាត្រា ២២៩)។\n• បទបញ្ជាផ្ទៃក្នុង និងវិន័យ៖ កម្មករនិយោជិតត្រូវគោរពបទបញ្ជាផ្ទៃក្នុងសហគ្រាសយ៉ាងម៉ឺងម៉ាត់។\n• ការព្យួរកិច្ចសន្យាការងារ៖ អនុវត្តតាមមាត្រា ៧១ និង ៧២ នៃច្បាប់ស្តីពីការងារ ដោយរក្សានូវកាតព្វកិច្ចស្មោះត្រង់ និងការសម្ងាត់។`;
  const safetyEn = `• Occupational Safety & Health: The employer maintains a safe, hygienic environment and supplies necessary personal protective equipment (Article 229).\n• Internal Regulations: The employee complies strictly with enterprise internal work rules and discipline.\n• Suspension of Contract: Carried out pursuant to Articles 71 and 72 of the Labour Law, preserving loyalty and confidentiality obligations.`;
  const safetyZh = `• 职业健康与安全：雇主提供符合标准的劳动卫生安全环境并按需配发防护用品（第229条）。\n• 规章纪律：员工严格遵守公司内部规程与岗位纪律。\n• 合同中止：依照劳动法第71条和第72条规定执行，中止期间双方仍须恪守诚信与保密义务。`;

  // Section 7: Confidentiality & Non-discrimination
  const discKm = `• ការរក្សាការសម្ងាត់៖ កម្មករនិយោជិតត្រូវរក្សាការសម្ងាត់វិជ្ជាជីវៈ និងព័ត៌មានផ្ទៃក្នុងរបស់ក្រុមហ៊ុនទាំងក្នុងអំឡុងពេល និងក្រោយពេលផុតរលត់កិច្ចសន្យា (មាត្រា ៧០ នៃច្បាប់ការងារ)។\n• គ្មានការរើសអើង និងការស្ម័គ្រចិត្ត៖ គ្មានការងារបង្ខិតបង្ខំ ឬការរើសអើងពូជសាសន៍ ពណ៌សម្បុរ ភេទ ជំនឿ សាសនា ឬសហជីព (មាត្រា ១២)។ និយោជកមិនរក្សាទុកឯកសារសម្គាល់ខ្លួនដើមរបស់កម្មករនិយោជិតដោយខុសច្បាប់ឡើយ។`;
  const discEn = `• Confidentiality & Loyalty: The employee preserves company trade secrets and internal data during and after contract termination (Article 70).\n• Non-Discrimination & Voluntary Labour: Employment is voluntary without forced labour or discrimination based on race, color, gender, religion, or union membership (Article 12). The employer shall not retain original personal documents unlawfully.`;
  const discZh = `• 商业秘密与忠实义务：员工在履职期间及离职后，均须对公司商业秘密与核心信息承担严格保密义务（第70条）。\n• 反歧视与自愿劳动：禁止强迫劳动，禁止因种族、肤色、性别、宗教信仰或工会关系产生歧视（第12条）。雇主严禁非法扣留员工个人证件原件。`;

  // Section 8: Termination Benefits & Dispute Resolution
  const dispKm = `• អត្ថប្រយោជន៍បញ្ចប់កិច្ចសន្យា៖ និយោជកត្រូវទូទាត់ប្រាក់ឈ្នួលមិនទាន់បើក (មាត្រា ១១៦) ប្រាក់បំណាច់ទូទាត់ជួសការឈប់សម្រាកប្រចាំឆ្នាំដែលនៅសល់ (មាត្រា ១៦៦-១៦៧) និងប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យា ៥% សម្រាប់ FDC (មាត្រា ៧៣) ឬប្រាក់បំណាច់អតីតភាពសម្រាប់ UDC (មាត្រា ៨៩ ថ្មី)។\n• ការដោះស្រាយវិវាទ៖ វិវាទការងារត្រូវដោះស្រាយតាមការផ្សះផ្សា និងនីតិវិធីច្បាប់ការងារកម្ពុជា។ អនុលោមតាមមាត្រា ១៣ (សេចក្តីបង្គាប់ជាសាធារណៈ) លក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ប្រសើរជាងច្បាប់ដល់កម្មករនិយោជិតត្រូវមានអាទិភាព។`;
  const dispEn = `• Termination Entitlements: The employer settles unpaid wages (Article 116), compensation for unused annual leave (Articles 166-167), and statutory 5% severance for FDC (Article 73) or seniority payments for UDC (New Article 89).\n• Dispute Resolution & Public Order: Labour disputes shall be resolved through dialogue, conciliation, and statutory Cambodian procedures. Under Article 13 (Public Order), terms more favourable to the employee always prevail.`;
  const dispZh = `• 解除及期满待遇：雇主须结清未结工资（第116条）、未休年假折算补偿金（第166-167条），并足额支付FDC期满补偿金5%（第73条）或UDC工龄补偿金（新第89条）。\n• 争议解决与公共秩序原则：劳动争议通过协商、调解及法定程序解决。依第13条（公共秩序原则），凡对员工更优厚的合同约定或法定条款优先适用。`;

  // Section 9: Execution & Acknowledgment
  const ackKm = `កិច្ចសន្យានេះត្រូវបានធ្វើឡើងជាភាសាខ្មែរ អង់គ្លេស និងចិន។ ភាគីទាំងពីរបានអាន ឬទទួលការពន្យល់យ៉ាងច្បាស់លាស់ និងចុះហត្ថលេខា/ផ្តិតស្នាមមេដៃដោយស្ម័គ្រចិត្ត។ ធ្វើឡើងចំនួន ២ ច្បាប់ដើម មានតម្លៃគតិយុត្តស្មើគ្នា ភាគីនីមួយៗរក្សាទុក ១ ច្បាប់។`;
  const ackEn = `This agreement is formulated in Khmer, English, and Chinese. Both parties have read or received clear explanation and voluntarily signed/thumbprinted. Executed in two identical originals having equal legal validity, one retained by each party.`;
  const ackZh = `本合同以柬埔寨文、英文和中文书就。双方当事人已认真通读或听取充分解释，自愿签字/捺指印。本合同一式两份，具有同等法律效力，双方各执一份。`;

  // Signatures table
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderCell,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 60, line: 260 },
                children: [
                  new TextRun({
                    text: 'តំណាងនិយោជក / Employer / 雇主',
                    bold: true,
                    size: 20,
                    color: '1E3A8A',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 200, line: 260 },
                children: [
                  new TextRun({
                    text: 'ហត្ថលេខា និងត្រាក្រុមហ៊ុន / Signature & Company Stamp\n\n\n\n_________________________________',
                    size: 17,
                    color: '64748B',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 40, after: 20, line: 260 },
                children: [
                  new TextRun({
                    text: `ឈ្មោះ / Name / 姓名: `,
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: `${data.representative || '__________'}`,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 20, after: 40, line: 260 },
                children: [
                  new TextRun({
                    text: `កាលបរិច្ឆេទ / Date / 日期: `,
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: `${formattedSignedDate}`,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 60, line: 260 },
                children: [
                  new TextRun({
                    text: 'កម្មករនិយោជិត / Employee / 员工',
                    bold: true,
                    size: 20,
                    color: '1E3A8A',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 200, line: 260 },
                children: [
                  new TextRun({
                    text: 'ហត្ថលេខា ឬស្នាមមេដៃស្តាំ / Signature or Thumbprint\n\n\n\n_________________________________',
                    size: 17,
                    color: '64748B',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 40, after: 20, line: 260 },
                children: [
                  new TextRun({
                    text: `ឈ្មោះ / Name / 姓名: `,
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: `${data.employeeNameKh || data.employeeNameEn || '__________'}`,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 20, after: 40, line: 260 },
                children: [
                  new TextRun({
                    text: `កាលបរិច្ឆេទ / Date / 日期: `,
                    bold: true,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    text: `${formattedSignedDate}`,
                    size: 18,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 850, bottom: 850, left: 1020, right: 1020 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: `${data.companyName || 'Enterprise'} | លេខកិច្ចសន្យា: ${data.contractNo || 'HR-CON'} | Rev: ${data.revision || '01'}`,
                    size: 15,
                    color: '94A3B8',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: 'ទំព័រ ',
                    size: 15,
                    color: '94A3B8',
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' នៃ ',
                    size: 15,
                    color: '94A3B8',
                    font: FONT_FAMILY,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' | អនុលោមតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា',
                    size: 15,
                    color: '94A3B8',
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // National Emblem & Motto
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 20, line: 260 },
            children: [
              new TextRun({
                text: 'ព្រះរាជាណាចក្រកម្ពុជា\nជាតិ សាសនា ព្រះមហាក្សត្រ',
                bold: true,
                size: 22,
                color: '1E3A8A',
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 10, after: 140, line: 250 },
            children: [
              new TextRun({
                text: 'KINGDOM OF CAMBODIA • NATION RELIGION KING\n柬埔寨王国 • 民族 宗教 国王',
                size: 16,
                color: '475569',
                font: FONT_FAMILY,
              }),
            ],
          }),

          headerTable,

          new Paragraph({ spacing: { before: 100, after: 40 } }),

          // Title Trilingual
          new Paragraph({
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { line: 280, after: 40 },
            children: [
              new TextRun({
                text: meta.nameKh,
                bold: true,
                size: 26,
                color: '1E3A8A',
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { line: 260, after: 30 },
            children: [
              new TextRun({
                text: meta.nameEn,
                bold: true,
                size: 20,
                color: '1D4ED8',
                font: FONT_FAMILY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { line: 260, after: 50 },
            children: [
              new TextRun({
                text: meta.nameZh,
                bold: true,
                size: 20,
                color: '475569',
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Legal reference pill
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120, line: 250 },
            children: [
              new TextRun({
                text: meta.lawRefKh,
                size: 16,
                italics: true,
                color: '475569',
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Signed at and Date
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160, line: 260 },
            children: [
              new TextRun({
                text: 'ធ្វើនៅ / Signed at / 签订地点: ',
                bold: true,
                size: 18,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: `${data.signedAtLocation || 'Phnom Penh'}    `,
                underline: {},
                size: 18,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: 'កាលបរិច្ឆេទ / Date / 日期: ',
                bold: true,
                size: 18,
                font: FONT_FAMILY,
              }),
              new TextRun({
                text: formattedSignedDate,
                underline: {},
                size: 18,
                font: FONT_FAMILY,
              }),
            ],
          }),

          // Section 1
          createSectionHeader('១. ភាគីនៃកិច្ចសន្យា និងប្រភេទកិច្ចសន្យា', '1. Contracting parties & contract terms', '一、合同双方及期限'),
          ...createTrilingualParagraph(
            data.clause1BodyKh || partiesKm,
            data.clause1BodyEn || partiesEn,
            data.clause1BodyZh || partiesZh
          ),
          ...createTrilingualParagraph(termKm, termEn, termZh),

          // Section 2: Position, Workplace & Scope of Work
          createSectionHeader('២. មុខតំណែង ទីកន្លែងធ្វើការ និងវិសាលភាពភារកិច្ចការងារ', '2. Position, workplace & scope of work', '二、岗位、工作地点及工作职责'),
          ...createTrilingualParagraph(
            data.clause2BodyKh || posKm,
            data.clause2BodyEn || posEn,
            data.clause2BodyZh || posZh
          ),

          // Section 3: Wages & Payment
          createSectionHeader('៣. ប្រាក់ឈ្នួល ការទូទាត់ និងប្រាក់បន្ទាប់បន្សំ', '3. Wages, payment & allowances', '三、工资、支付及津贴'),
          ...createTrilingualParagraph(
            data.clause3BodyKh || wageKm,
            data.clause3BodyEn || wageEn,
            data.clause3BodyZh || wageZh
          ),

          // Section 4: Working Hours & Rest
          createSectionHeader('៤. ម៉ោងធ្វើការ ម៉ោងសម្រាក និងថ្ងៃឈប់សម្រាក', '4. Working hours, meal break & rest', '四、工作时间、休息及休假'),
          ...createTrilingualParagraph(
            data.clause4BodyKh || hoursKm,
            data.clause4BodyEn || hoursEn,
            data.clause4BodyZh || hoursZh
          ),

          // Section 5: Leave & Social Security (NSSF)
          createSectionHeader('៥. ការឈប់សម្រាកប្រចាំឆ្នាំ ថ្ងៃបុណ្យ និងរបបសន្តិសុខសង្គម', '5. Annual leave, public holidays & social security (NSSF)', '五、年假、法定节假日及国家社保（NSSF）'),
          ...createTrilingualParagraph(
            data.clause5BodyKh || leaveKm,
            data.clause5BodyEn || leaveEn,
            data.clause5BodyZh || leaveZh
          ),

          // Section 6: Safety, Health, Discipline & Suspension
          createSectionHeader('៦. សុវត្ថិភាព សុខភាពការងារ បទបញ្ជាផ្ទៃក្នុង និងការព្យួរ', '6. Occupational health, safety, discipline & suspension', '六、安全卫生、内部规程及合同中止'),
          ...createTrilingualParagraph(
            data.clause6BodyKh || safetyKm,
            data.clause6BodyEn || safetyEn,
            data.clause6BodyZh || safetyZh
          ),

          // Section 7: Confidentiality & Non-discrimination
          createSectionHeader('៧. ការរក្សាការសម្ងាត់ និងការមិនរើសអើង', '7. Confidentiality, loyalty & non-discrimination', '七、保密义务、诚信与反歧视'),
          ...createTrilingualParagraph(
            data.clause7BodyKh || discKm,
            data.clause7BodyEn || discEn,
            data.clause7BodyZh || discZh
          ),

          // Section 8: Termination Benefits & Dispute Resolution
          createSectionHeader('៨. ការបញ្ចប់កិច្ចសន្យា អត្ថប្រយោជន៍ និងការដោះស្រាយវិវាទ', '8. Termination benefits, notice & dispute resolution', '八、终止补偿、提前通知及争议解决'),
          ...createTrilingualParagraph(
            data.clause8BodyKh || dispKm,
            data.clause8BodyEn || dispEn,
            data.clause8BodyZh || dispZh
          ),

          // Section 9: Execution & Acknowledgment
          createSectionHeader('៩. ការទទួលស្គាល់ និងការចុះហត្ថលេខា', '9. Acknowledgment & signatures', '九、确认及签署'),
          ...createTrilingualParagraph(
            data.clause9BodyKh || ackKm,
            data.clause9BodyEn || ackEn,
            data.clause9BodyZh || ackZh
          ),

          new Paragraph({ spacing: { before: 180, after: 80 } }),
          signaturesTable,

          new Paragraph({ spacing: { before: 120 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'សម្គាល់: ទម្រង់កិច្ចសន្យានេះត្រូវបានរៀបចំឡើងយ៉ាងហ្មត់ចត់ស្របតាមច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា និងសេចក្តីណែនាំលេខ ០៥០/១៩ របស់ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ។',
                italics: true,
                size: 15,
                color: '64748B',
                font: FONT_FAMILY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
