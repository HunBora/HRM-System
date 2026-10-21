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
} from 'docx';
import { ContractFormData, CONTRACT_TYPE_METADATA, formatContractDate, getGenderLabel } from './contractTemplates';

export async function generateContractDocxBlob(data: ContractFormData): Promise<Blob> {
  const meta = CONTRACT_TYPE_METADATA[data.contractType] || CONTRACT_TYPE_METADATA.FDC;
  const gender = getGenderLabel(data.gender);
  const formattedDob = formatContractDate(data.dob);
  const formattedSignedDate = formatContractDate(data.signedDate);
  const formattedStartDate = formatContractDate(data.startDate);
  const formattedEndDate = data.contractType === 'UDC' ? 'គ្មានកំណត់ / Indefinite / 无固定期限' : formatContractDate(data.endDate);

  const tableBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorderCell = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };

  // 1. Header Table: Company Name, Doc No, Revision
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
                children: [
                  new TextRun({ text: 'ឈ្មោះក្រុមហ៊ុន / Company name / 公司名称: ', bold: true, size: 18 }),
                  new TextRun({ text: data.companyName || '__________', bold: true, underline: {}, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'លេខឯកសារ / Doc No. / 文件编号: ', size: 17 }),
                  new TextRun({ text: data.contractNo || 'HR-CON-____', bold: true, size: 18 }),
                  new TextRun({ text: '   កំណែ / Rev / 版本: ', size: 17 }),
                  new TextRun({ text: data.revision || '01', bold: true, size: 18 }),
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
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: `${titleKm} / ${titleEn} / ${titleZh}`,
          bold: true,
          size: 21,
          color: '1E3A8A',
        }),
      ],
    });
  };

  const createTrilingualParagraph = (kmText: string, enText: string, zhText: string) => {
    return [
      new Paragraph({
        spacing: { before: 40, after: 30 },
        children: [new TextRun({ text: kmText, size: 20 })],
      }),
      new Paragraph({
        spacing: { before: 20, after: 30 },
        children: [new TextRun({ text: enText, size: 19, italics: true, color: '334155' })],
      }),
      new Paragraph({
        spacing: { before: 20, after: 90 },
        children: [new TextRun({ text: zhText, size: 19, color: '475569' })],
      }),
    ];
  };

  // Section 1 Terms variation based on contract type
  let termKm = '';
  let termEn = '';
  let termZh = '';

  if (data.contractType === 'PROBATION') {
    const catLabel = data.probationCategory === 'SPECIALISED' 
      ? 'កម្មករឯកទេស (២ ខែ)' 
      : data.probationCategory === 'NON_SPECIALISED' 
      ? 'កម្មករធម្មតា (១ ខែ)' 
      : 'និយោជិត/ការិយាល័យ (៣ ខែ)';
    const catEn = data.probationCategory === 'SPECIALISED' ? 'Specialised Worker (2 months)' : data.probationCategory === 'NON_SPECIALISED' ? 'Non-specialised Worker (1 month)' : 'Employee (3 months)';
    const catZh = data.probationCategory === 'SPECIALISED' ? '专业工人（2个月）' : data.probationCategory === 'NON_SPECIALISED' ? '普通工人（1个月）' : '职员（3个月）';

    termKm = `រយៈពេលសាកល្បង៖ ចាប់ពីថ្ងៃទី ${formattedStartDate} ដល់ថ្ងៃទី ${formattedEndDate}។ រយៈពេលអតិបរមា៖ ៣ ខែសម្រាប់និយោជិត; ២ ខែសម្រាប់កម្មករឯកទេស; ១ ខែសម្រាប់កម្មករធម្មតា (មាត្រា ៦៨)។ ប្រភេទមុខងារ៖ ${catLabel}។ ការវាយតម្លៃ និងការបញ្ចប់៖ និយោជកវាយតម្លៃសមត្ថភាពការងារ និងពន្យល់លទ្ធផលជូនកម្មករ។ ក្នុងរយៈពេលសាកល្បង ការជូនដំណឹងមុនអនុវត្តតាមមាត្រា ៨២ និងបទប្បញ្ញត្តិពាក់ព័ន្ធ។ ការបន្តការងារត្រូវបញ្ជាក់ជាកិច្ចសន្យា FDC ឬ UDC ស្របច្បាប់។`;
    termEn = `Probation Period: From ${formattedStartDate} to ${formattedEndDate}. Maximum: 3 months for employees, 2 months for specialised workers, 1 month for non-specialised workers (Article 68). Category: ${catEn}. Assessment and ending: The employer evaluates work ability and communicates results. Notice during probation is governed by Article 82 and other applicable rules. Continued employment shall be documented under a lawful FDC or UDC.`;
    termZh = `试用期限：自 ${formattedStartDate} 至 ${formattedEndDate}。最长试用期：职员3个月、专业工人2个月、普通工人1个月（第68条）。类别：${catZh}。考核及结束：雇主评估工作能力并告知结果。试用期间通知依第82条及适用规定执行。继续雇佣须依法签订固定期限或无固定期限合同。`;
  } else if (data.contractType === 'UDC') {
    termKm = `ការចាប់ផ្តើម និងរយៈពេល៖ ចាប់ផ្តើមថ្ងៃទី ${formattedStartDate} ហើយគ្មានថ្ងៃបញ្ចប់កំណត់ជាមុន។ អតីតភាពការងារត្រូវគណនាតាមច្បាប់។ ការបញ្ចប់កិច្ចសន្យា៖ ការបញ្ចប់កិច្ចសន្យាត្រូវមានមូលហេតុ និងការជូនដំណឹងតាមច្បាប់។ រយៈពេលជូនដំណឹងអាស្រ័យលើអតីតភាព៖ ក្រោម ៦ ខែ ៧ ថ្ងៃ; ៦ ខែដល់ ២ ឆ្នាំ ១៥ ថ្ងៃ; លើស ២ ដល់ ៥ ឆ្នាំ ១ ខែ; លើស ៥ ដល់ ១០ ឆ្នាំ ២ ខែ; លើស ១០ ឆ្នាំ ៣ ខែ។ ប្រាក់បំណាច់អតីតភាពការងារ និងសំណងផ្សេងៗត្រូវអនុវត្តតាមច្បាប់ជាធរមាន។`;
    termEn = `Commencement and duration: Commences on ${formattedStartDate} and has no predetermined end date. Length of service is determined according to law. Termination and notice: Termination requires lawful grounds and notice. Notice by service: under 6 months, 7 days; 6 months–2 years, 15 days; over 2–5 years, 1 month; over 5–10 years, 2 months; over 10 years, 3 months. Seniority payments and other compensation follow current law.`;
    termZh = `开始日期及期限：自 ${formattedStartDate} 起生效，无预定终止日期。工龄依法计算。终止及通知：解除合同须具备合法理由并依法通知。按工龄通知：不足6个月7天；6个月至2年15天；超过2年至5年1个月；超过5年至10年2个月；超过10年3个月。工龄补偿及其他赔偿依法执行。`;
  } else {
    // FDC or FOREIGN_FDC
    const foreignAddonKm = data.isForeigner && data.workPermitNo ? ` [ប័ណ្ណការងារ MLVT: ${data.workPermitNo} (ផុតកំណត់: ${formatContractDate(data.workPermitExpiry)}) | ទិដ្ឋាការ: ${data.visaNo || 'N/A'}]` : '';
    const foreignAddonEn = data.isForeigner && data.workPermitNo ? ` [MLVT Work Permit: ${data.workPermitNo} (Expires: ${formatContractDate(data.workPermitExpiry)}) | Visa: ${data.visaNo || 'N/A'}]` : '';
    const foreignAddonZh = data.isForeigner && data.workPermitNo ? ` [劳工部工作许可证: ${data.workPermitNo} (到期: ${formatContractDate(data.workPermitExpiry)}) | 签证: ${data.visaNo || 'N/A'}]` : '';

    termKm = `រយៈពេលកិច្ចសន្យា៖ ចាប់ពីថ្ងៃទី ${formattedStartDate} ដល់ថ្ងៃទី ${formattedEndDate}។ កិច្ចសន្យានេះត្រូវធ្វើជាលាយលក្ខណ៍អក្សរ និងមានថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់ច្បាស់លាស់។ រយៈពេលកិច្ចសន្យានីមួយៗមិនលើស ២ ឆ្នាំ។ ការបន្តកិច្ចសន្យាត្រូវគោរពមាត្រា ៦៧ និងសេចក្តីណែនាំលេខ ០៥០/១៩${foreignAddonKm}។ ការបញ្ចប់ និងអត្ថប្រយោជន៍៖ នៅពេលផុតកំណត់ អនុវត្តការជូនដំណឹងជាមុនតាមមាត្រា ៧៣ ប្រសិនបើត្រូវការ (១០ ថ្ងៃសម្រាប់លើស ៦ ខែដល់ ១ ឆ្នាំ; ១៥ ថ្ងៃសម្រាប់លើស ១ ឆ្នាំ)។ ប្រាក់បំណាច់បញ្ចប់កិច្ចសន្យាយ៉ាងតិច ៥% នៃប្រាក់ឈ្នួលដែលបានទទួលក្នុងរយៈពេលកិច្ចសន្យា រួមទាំងសិទ្ធិផ្សេងៗតាមច្បាប់។ ការបញ្ចប់មុនកាលកំណត់ត្រូវគោរពមាត្រា ៧៣។`;
    termEn = `Contract term: From ${formattedStartDate} to ${formattedEndDate}. This agreement is in writing with definite start and end dates. Each term shall not exceed two years. Renewals must comply with Article 67 and Instruction No. 050/19${foreignAddonEn}. Expiry and entitlements: At expiry, statutory advance notice applies where required (10 days for terms over 6 months up to 1 year; 15 days for over 1 year). Severance at expiry is at least 5% of wages paid during the contract, plus other lawful entitlements. Early termination follows Article 73.`;
    termZh = `合同期限：自 ${formattedStartDate} 至 ${formattedEndDate}。本合同采用书面形式，明确起止日期。每期合同不超过两年。续签须遵守第67条及第050/19号指导文件${foreignAddonZh}。期满及待遇：合同期满时依法提前通知（超过6个月至1年提前10天；超过1年提前15天）。期满补偿至少为合同期内已支付工资的5%，另加其他法定权益。提前终止须遵守第73条。`;
  }

  // Parties info
  const partiesKm = `និយោជក៖ ឈ្មោះក្រុមហ៊ុន ${data.companyName || '__________'} អាសយដ្ឋាន ${data.companyAddress || '__________'} តំណាងដោយ ${data.representative || '__________'} តួនាទី ${data.representativeRole || '__________'}។ កម្មករនិយោជិត៖ ឈ្មោះ ${data.employeeNameKh || data.employeeNameEn || '__________'} (ឡាតាំង: ${data.employeeNameEn || '__________'}) ភេទ ${gender.kh} ថ្ងៃខែឆ្នាំកំណើត ${formattedDob} លេខអត្តសញ្ញាណប័ណ្ណ/លិខិតឆ្លងដែន ${data.nationalIdOrPassport || '__________'} អាសយដ្ឋាន ${data.address || '__________'}។`;
  const partiesEn = `Employer: Company ${data.companyName || '__________'}, address ${data.companyAddress || '__________'}, represented by ${data.representative || '__________'}, position ${data.representativeRole || '__________'}. Employee: Name ${data.employeeNameEn || '__________'}, sex ${gender.en}, date of birth ${formattedDob}, ID/passport ${data.nationalIdOrPassport || '__________'}, address ${data.address || '__________'}.`;
  const partiesZh = `雇主：公司名称 ${data.companyName || '__________'}，地址 ${data.companyAddress || '__________'}，代表人 ${data.representative || '__________'}，职务 ${data.representativeRole || '__________'}。员工：姓名 ${data.employeeNameKh || data.employeeNameEn || '__________'}（英文：${data.employeeNameEn || '__________'}），性别 ${gender.zh}，出生日期 ${formattedDob}，身份证/护照 ${data.nationalIdOrPassport || '__________'}，地址 ${data.address || '__________'}。`;

  // Section 2
  const posKm = `មុខតំណែង ${data.positionTitle || '__________'} នាយកដ្ឋាន ${data.department || '__________'} ទីកន្លែងធ្វើការ ${data.workplace || data.companyAddress || '__________'}។ ភារកិច្ចត្រូវអនុវត្តតាមការពិពណ៌នាការងារដែលបានពន្យល់ជូន។`;
  const posEn = `Position ${data.positionTitle || '__________'}, department ${data.department || '__________'}, workplace ${data.workplace || data.companyAddress || '__________'}. Duties follow the job description explained to the employee.`;
  const posZh = `岗位 ${data.positionTitle || '__________'}，部门 ${data.department || '__________'}，工作地点 ${data.workplace || data.companyAddress || '__________'}。工作职责依照已向员工说明的岗位说明书。`;

  // Section 3
  const wageKm = `ប្រាក់ឈ្នួលគោល ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'} ដុល្លារ/ខែ ឬ ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'} រៀល/ខែ មិនទាបជាងកម្រិតអប្បបរមាដែលអនុវត្ត។ ការទូទាត់ធ្វើនៅថ្ងៃទី ${data.paymentDay || '01-05'} តាមរយៈ ${data.paymentMethod || 'Bank Transfer / Cash'}។ ប្រាក់ថែមម៉ោង និងអត្ថប្រយោជន៍ត្រូវអនុវត្តតាមច្បាប់។`;
  const wageEn = `Basic wage USD ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'}/month or KHR ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'}/month, not below the applicable minimum. Payment date(s) ${data.paymentDay || '01-05'} via ${data.paymentMethod || 'Bank Transfer / Cash'}. Overtime and benefits follow applicable law.`;
  const wageZh = `基本工资每月 ${data.basicSalaryUsd ? '$' + data.basicSalaryUsd.toLocaleString() : '__________'} 美元或 ${data.basicSalaryKhr ? data.basicSalaryKhr.toLocaleString() : '__________'} 瑞尔，不低于适用最低工资。发薪日期 ${data.paymentDay || '01-05'}，支付方式 ${data.paymentMethod || '银行转账/现金'}。加班费及福利依法执行。`;

  // Section 4
  const hoursKm = `ម៉ោងធ្វើការ ${data.workingHours || '07:00 ដល់ 11:00 / 13:00 ដល់ 17:00'}; សម្រាកអាហារ ${data.mealBreak || '11:00 ដល់ 13:00'}; ថ្ងៃធ្វើការ ${data.workingDays || 'ច័ន្ទ ដល់ សៅរ៍'}។ ម៉ោងធ្វើការធម្មតាមិនលើស ៨ ម៉ោងក្នុងមួយថ្ងៃ និង ៤៨ ម៉ោងក្នុងមួយសប្តាហ៍។ ការថែមម៉ោងត្រូវធ្វើតាមច្បាប់។`;
  const hoursEn = `Work hours ${data.workingHours || '07:00 to 11:00 / 13:00 to 17:00'}; meal break ${data.mealBreak || '11:00 to 13:00'}; working days ${data.workingDays || 'Monday to Saturday'} . Normal hours shall not exceed 8 per day and 48 per week. Overtime follows the law.`;
  const hoursZh = `工作时间 ${data.workingHours || '07:00至11:00 / 13:00至17:00'}；用餐休息 ${data.mealBreak || '11:00至13:00'}；工作日 ${data.workingDays || '周一至周六'}。正常工作时间每日不超过8小时、每周不超过48小时。加班依法安排。`;

  // Section 5
  const leaveKm = `កម្មករនិយោជិតមានសិទ្ធិទទួលបានថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ ថ្ងៃបុណ្យមានប្រាក់ឈ្នួល ការឈប់សម្រាកប្រចាំឆ្នាំ និងការឈប់សម្រាកផ្សេងៗតាមច្បាប់។ និយោជកអនុវត្តកាតព្វកិច្ច ប.ស.ស. តាមបទប្បញ្ញត្តិ។`;
  const leaveEn = `The employee receives weekly rest, paid public holidays, annual leave and other statutory leave. The employer meets applicable NSSF obligations.`;
  const leaveZh = `员工依法享有每周休息、带薪法定节假日、年假及其他假期。雇主依法履行国家社会保障基金（NSSF）义务。`;

  // Section 6
  const safetyKm = `និយោជកផ្តល់បរិយាកាសការងារមានសុវត្ថិភាព និងឧបករណ៍ការពារដែលចាំបាច់។ កម្មករនិយោជិតគោរពនីតិវិធីសុវត្ថិភាព បទបញ្ជាផ្ទៃក្នុងស្របច្បាប់ និងមានសិទ្ធិប្តឹងតវ៉ាដោយគ្មានការសងសឹក។`;
  const safetyEn = `The employer provides a safe workplace and necessary protective equipment. The employee follows lawful safety procedures and internal rules and may raise grievances without retaliation.`;
  const safetyZh = `雇主提供安全工作环境及必要防护用品。员工遵守合法安全程序和内部规章，并有权提出申诉且不受报复。`;

  // Section 7
  const discKm = `ការងារធ្វើឡើងដោយស្ម័គ្រចិត្ត គ្មានការបង្ខិតបង្ខំ ការរើសអើង ឬការរក្សាទុកឯកសារផ្ទាល់ខ្លួនដោយខុសច្បាប់។`;
  const discEn = `Employment is voluntary, without forced labour, discrimination or unlawful retention of personal documents.`;
  const discZh = `雇佣属自愿性质，禁止强迫劳动、歧视或非法扣留个人证件。`;

  // Section 8
  const dispKm = `វិវាទត្រូវដោះស្រាយតាមការពិភាក្សា និងយន្តការស្របច្បាប់នៅកម្ពុជា។ ប្រសិនបើលក្ខខណ្ឌណាមួយផ្ទុយច្បាប់ការងារ ត្រូវអនុវត្តច្បាប់ ឬលក្ខខណ្ឌដែលផ្តល់អត្ថប្រយោជន៍ល្អជាងដល់កម្មករនិយោជិត។`;
  const dispEn = `Disputes shall be handled through dialogue and lawful Cambodian mechanisms. Where a term conflicts with labour law, the law or more favourable employee entitlement prevails.`;
  const dispZh = `争议通过协商及柬埔寨合法机制解决。合同条款与劳动法冲突时，以法律或对员工更有利的条件为准。`;

  // Section 9
  const ackKm = `ភាគីទាំងពីរបានអាន ឬទទួលការពន្យល់អំពីកិច្ចសន្យានេះ និងយល់ព្រមដោយស្ម័គ្រចិត្ត។ រៀបចំជា ២ ច្បាប់ មានតម្លៃដូចគ្នា ភាគីនីមួយៗរក្សា ១ ច្បាប់។`;
  const ackEn = `Both parties have read or had this agreement explained and voluntarily accept it. Two equally valid copies are signed, one retained by each party.`;
  const ackZh = `双方已阅读或听取本合同解释并自愿同意。本合同一式两份，具有同等效力，双方各执一份。`;

  // Signatures table
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorderCell,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'និយោជក / Employer / 雇主', bold: true, size: 21 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 300 },
                children: [new TextRun({ text: 'ហត្ថលេខា/ត្រា / Signature/stamp / 签名盖章\n\n\n_________________________________', size: 18 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `ឈ្មោះ / Name / 姓名: ${data.representative || '__________'}\n`, size: 19 }),
                  new TextRun({ text: `កាលបរិច្ឆេទ / Date / 日期: ${formattedSignedDate}`, size: 19 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'កម្មករនិយោជិត / Employee / 员工', bold: true, size: 21 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 300 },
                children: [new TextRun({ text: 'ហត្ថលេខា/ស្នាមមេដៃ / Signature/thumbprint / 签名指印\n\n\n_________________________________', size: 18 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `ឈ្មោះ / Name / 姓名: ${data.employeeNameKh || data.employeeNameEn || '__________'}\n`, size: 19 }),
                  new TextRun({ text: `កាលបរិច្ឆេទ / Date / 日期: ${formattedSignedDate}`, size: 19 }),
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
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { before: 200, after: 40 } }),
          // Title Trilingual
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: meta.nameKh, bold: true, size: 28, color: '1E3A8A' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: meta.nameEn, bold: true, size: 22, color: '1E40AF' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({ text: meta.nameZh, bold: true, size: 22, color: '1E40AF' }),
            ],
          }),
          // Signed at and Date
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'ធ្វើនៅ / Signed at / 签订地点: ', bold: true, size: 19 }),
              new TextRun({ text: `${data.signedAtLocation || 'Phnom Penh'}    `, underline: {}, size: 19 }),
              new TextRun({ text: 'ថ្ងៃទី / Date / 日期: ', bold: true, size: 19 }),
              new TextRun({ text: formattedSignedDate, underline: {}, size: 19 }),
            ],
          }),

          // Section 1
          createSectionHeader('១. ភាគីនៃកិច្ចសន្យា', '1. Contracting parties', '一、合同双方'),
          ...createTrilingualParagraph(
            data.clause1BodyKh || partiesKm,
            data.clause1BodyEn || partiesEn,
            data.clause1BodyZh || partiesZh
          ),
          ...createTrilingualParagraph(termKm, termEn, termZh),

          // Section 2
          createSectionHeader('២. មុខតំណែង និងទីកន្លែងធ្វើការ', '2. Position and workplace', '二、岗位及工作地点'),
          ...createTrilingualParagraph(
            data.clause2BodyKh || posKm,
            data.clause2BodyEn || posEn,
            data.clause2BodyZh || posZh
          ),

          // Section 3
          createSectionHeader('៣. ប្រាក់ឈ្នួល និងការទូទាត់', '3. Wages and payment', '三、工资及支付'),
          ...createTrilingualParagraph(
            data.clause3BodyKh || wageKm,
            data.clause3BodyEn || wageEn,
            data.clause3BodyZh || wageZh
          ),

          // Section 4
          createSectionHeader('៤. ម៉ោងធ្វើការ និងការសម្រាក', '4. Working hours and rest', '四、工作时间及休息'),
          ...createTrilingualParagraph(
            data.clause4BodyKh || hoursKm,
            data.clause4BodyEn || hoursEn,
            data.clause4BodyZh || hoursZh
          ),

          // Section 5
          createSectionHeader('៥. ការឈប់សម្រាក និងសន្តិសុខសង្គម', '5. Leave and social security', '五、休假及社会保障'),
          ...createTrilingualParagraph(
            data.clause5BodyKh || leaveKm,
            data.clause5BodyEn || leaveEn,
            data.clause5BodyZh || leaveZh
          ),

          // Section 6
          createSectionHeader('៦. សុវត្ថិភាព សុខភាព និងវិន័យ', '6. Safety, health and discipline', '六、安全、健康与纪律'),
          ...createTrilingualParagraph(
            data.clause6BodyKh || safetyKm,
            data.clause6BodyEn || safetyEn,
            data.clause6BodyZh || safetyZh
          ),

          // Section 7
          createSectionHeader('៧. ការមិនរើសអើង និងការស្ម័គ្រចិត្ត', '7. Non-discrimination and voluntary work', '七、反歧视与自愿劳动'),
          ...createTrilingualParagraph(
            data.clause7BodyKh || discKm,
            data.clause7BodyEn || discEn,
            data.clause7BodyZh || discZh
          ),

          // Section 8
          createSectionHeader('៨. ការដោះស្រាយវិវាទ និងអាទិភាពច្បាប់', '8. Disputes and governing law', '八、争议解决与适用法律'),
          ...createTrilingualParagraph(
            data.clause8BodyKh || dispKm,
            data.clause8BodyEn || dispEn,
            data.clause8BodyZh || dispZh
          ),

          // Section 9
          createSectionHeader('៩. ការទទួលស្គាល់', '9. Acknowledgment', '九、确认'),
          ...createTrilingualParagraph(
            data.clause9BodyKh || ackKm,
            data.clause9BodyEn || ackEn,
            data.clause9BodyZh || ackZh
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          signaturesTable,

          new Paragraph({ spacing: { before: 140 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'សម្គាល់ / Note / 备注: គំរូសម្រាប់បំពេញ មិនមែនជាទម្រង់ដែលក្រសួងបានអនុម័តជាផ្លូវការទេ។ / Editable template; not an officially approved ministry form. / 本文件为可编辑模板，并非部委正式批准的格式。',
                italics: true,
                size: 16,
                color: '64748B',
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
