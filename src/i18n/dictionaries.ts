export const dictionaries = {
  kh: {
    sidebar: {
      dashboard: "ផ្ទាំងដើម",
      employees: "បុគ្គលិក",
      attendance: "វត្តមាន",
      leave: "ច្បាប់ឈប់សម្រាក",
      advance: "ប្រាក់បុរេប្រទាន",
      payroll: "ប្រាក់ខែ",
      exports: "ទាញយកទិន្នន័យ",
      settings: "ការកំណត់",
      system: "ប្រព័ន្ធ",
      kpi: "KPI របស់ HR",
      documents: "ឯកសារក្រុមហ៊ុន",
      about: "អំពីប្រព័ន្ធ"
    },
    leave: {
      title: "គ្រប់គ្រងថ្ងៃឈប់សម្រាក",
      newBtn: "+ បញ្ចូលច្បាប់",
      columns: {
        id: "អត្តលេខ",
        name: "ឈ្មោះ",
        type: "ប្រភេទច្បាប់",
        startDate: "ថ្ងៃចាប់ផ្តើម",
        endDate: "ថ្ងៃបញ្ចប់",
        reason: "មូលហេតុ",
        status: "ស្ថានភាព",
        actions: "សកម្មភាព"
      },
      status: {
        PENDING: "រង់ចាំ",
        APPROVED: "អនុម័ត",
        REJECTED: "បដិសេធ"
      },
      types: {
        ANNUAL: "ច្បាប់ប្រចាំឆ្នាំ",
        SICK: "ច្បាប់ឈឺ",
        UNPAID: "សម្រាកគ្មានប្រាក់ខែ",
        MATERNITY: "ច្បាប់លំហែមាតុភាព",
        OTHER: "ផ្សេងៗ"
      },
      form: {
        newTitle: "បញ្ចូលច្បាប់ឈប់សម្រាកថ្មី",
        employee: "ជ្រើសរើសបុគ្គលិក",
        type: "ប្រភេទច្បាប់",
        startDate: "ថ្ងៃចាប់ផ្តើម",
        endDate: "ថ្ងៃបញ្ចប់",
        reason: "មូលហេតុ / កំណត់សម្គាល់",
        save: "រក្សាទុក",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់"
      }
    },
    advance: {
      title: "ប្រាក់បុរេប្រទាន",
      newBtn: "+ ស្នើសុំប្រាក់បុរេប្រទាន",
      columns: { id: "អត្តលេខ", name: "ឈ្មោះ", amount: "ចំនួនប្រាក់ ($)", date: "ថ្ងៃខែ", monthYear: "ខែ/ឆ្នាំ", reason: "មូលហេតុ", status: "ស្ថានភាព", actions: "សកម្មភាព" },
      form: { newTitle: "បញ្ចូលប្រាក់បុរេប្រទានថ្មី", employee: "បុគ្គលិក", amount: "ចំនួនប្រាក់ ($)", requestDate: "ថ្ងៃខែ", month: "ខែ", year: "ឆ្នាំ", reason: "មូលហេតុ", save: "រក្សាទុក", saving: "កំពុងរក្សាទុក...", cancel: "បោះបង់" }
    },
    header: {
      adminUser: "អ្នកគ្រប់គ្រងប្រព័ន្ធ"
    },
    dashboard: {
      totalEmployees: "បុគ្គលិកសរុប",
      totalPayroll: "ប្រាក់ខែសរុបប្រចាំខែ",
      todayAttendance: "វត្តមានថ្ងៃនេះ",
      onLeave: "ច្បាប់ឈប់សម្រាក"
    },
    employee: {
      listTitle: "បញ្ជីបុគ្គលិក",
      searchPlaceholder: "ស្វែងរកឈ្មោះ ឬ អត្តលេខ...",
      searchButton: "ស្វែងរក",
      newEmployeeBtn: "+ បញ្ចូលបុគ្គលិកថ្មី",
      noData: "មិនមានទិន្នន័យ",
      edit: "កែប្រែ",
      delete: "លុប",
      confirmDelete: "តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?",
      columns: {
        id: "អត្តលេខ",
        nameKh: "ឈ្មោះ (ខ្មែរ)",
        nameEn: "ឈ្មោះ (អង់គ្លេស)",
        gender: "ភេទ",
        dob: "ថ្ងៃខែឆ្នាំកំណើត",
        hireDate: "ថ្ងៃចូលធ្វើការ",
        position: "តួនាទី",
        department: "ផ្នែក",
        salary: "ប្រាក់ខែ",
        phone: "លេខទូរស័ព្ទ",
        actions: "សកម្មភាព"
      },
      form: {
        newTitle: "បញ្ចូលបុគ្គលិកថ្មី",
        editTitle: "កែប្រែទិន្នន័យបុគ្គលិក",
        employeeId: "អត្តលេខបុគ្គលិក",
        firstNameEn: "នាមត្រកូល (EN)",
        lastNameEn: "នាមខ្លួន (EN)",
        firstNameKh: "នាមត្រកូល (KH)",
        lastNameKh: "នាមខ្លួន (KH)",
        gender: "ភេទ",
        male: "ប្រុស",
        female: "ស្រី",
        dob: "ថ្ងៃខែឆ្នាំកំណើត",
        hireDate: "ថ្ងៃចូលធ្វើការ",
        position: "តួនាទី",
        department: "ផ្នែក",
        basicSalary: "ប្រាក់ខែគោល ($)",
        phone: "លេខទូរស័ព្ទ",
        address: "អាសយដ្ឋានបច្ចុប្បន្ន",
        save: "រក្សាទុកទិន្នន័យ",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់",
        back: "ត្រឡប់ក្រោយ"
      }
    },
    exports: {
      title: "ទាញយកទិន្នន័យ",
      employeeReport: "របាយការណ៍បុគ្គលិក",
      employeeDesc: "ទាញយកបញ្ជីបុគ្គលិកជាទម្រង់ Excel, PDF ឬ Word។",
      attendanceReport: "របាយការណ៍វត្តមាន",
      attendanceDesc: "ទាញយកកំណត់ត្រាវត្តមានបុគ្គលិក។ (កំពុងអភិវឌ្ឍ)",
      payrollReport: "របាយការណ៍ប្រាក់ខែ",
      payrollDesc: "ទាញយកបញ្ជីប្រាក់ខែបុគ្គលិក។ (កំពុងអភិវឌ្ឍ)"
    },
    payroll: {
      title: "បញ្ជីប្រាក់ខែ (Payroll)",
      generateBtn: "+ បង្កើតបញ្ជីប្រាក់ខែ",
      filterBtn: "ចម្រាញ់",
      noData: "មិនមានទិន្នន័យប្រាក់ខែសម្រាប់ខែនេះទេ។ សូមចុច 'បង្កើតបញ្ជីប្រាក់ខែ' ដើម្បីចាប់ផ្តើម។",
      columns: {
        no: "ល.រ", id: "អត្តលេខ", name: "ឈ្មោះ", dept: "ផ្នែក", line: "ខ្សែ", position: "តួនាទី", shift: "វេន", sex: "ភេទ", child: "កូន", bSalary: "ប្រាក់ខែគោល", wDay: "ថ្ងៃធ្វើការ", wSalary: "ប្រាក់ខែជាក់ស្តែង", payScale: "ប្រាក់តម្លើង", otHour: "ម៉ោងថែម", otWage: "ថ្លៃថែមម៉ោង", sunOt: "ថែមថ្ងៃអាទិត្យ", sunWage: "ថ្លៃថែមថ្ងៃអាទិត្យ", nightOt: "ថែមយប់", nightWage: "ថ្លៃថែមយប់", annualLeave: "ច្បាប់ប្រចាំឆ្នាំ", attBonus: "រង្វាន់វត្តមាន", transport: "ធ្វើដំណើរ", lunch: "អាហារ", otMeal: "អាហារថែមម៉ោង", dayCare: "មើលថែកូន", seniority: "អតីតភាព", indemnity: "ប្រាក់បំណាច់", prodInc: "រង្វាន់ផលិតកម្ម", adjust: "កែតម្រូវ", totalSalary: "ប្រាក់ខែសរុប", severance: "បំណាច់៥%", tax: "ពន្ធ", loan: "ប្រាក់កម្ចី", union: "សហជីព", netUsd: "ប្រាក់បើក ($)", netRiel: "ប្រាក់បើក (៛)", actions: "សកម្មភាព"
      }
    },
    kpi: {
      title: "ឧទាហរណ៍ KPI របស់ HR",
      columns: {
        kpi: "KPI",
        target: "គោលដៅ"
      },
      items: {
        attendanceRate: "អត្រាវត្តមាន",
        turnover: "អត្រាផ្លាស់ប្តូរបុគ្គលិក",
        training: "អត្រាបញ្ចប់ការបណ្តុះបណ្តាល",
        leadTime: "រយៈពេលជ្រើសរើសបុគ្គលិក",
        probation: "អត្រាជាប់ការសាកល្បងការងារ",
        satisfaction: "ការពេញចិត្តរបស់បុគ្គលិក"
      },
      evidenceTitle: "ឯកសារយោង",
      evidence: {
        policy: "គោលការណ៍ KPI",
        matrix: "ម៉ាទ្រីស KPI",
        orgChart: "រចនាសម្ព័ន្ធអង្គភាព",
        jd: "ការពិពណ៌នាការងារ (JD)",
        approvalRecord: "កំណត់ត្រាអនុម័ត KPI",
        managementApproval: "ការអនុម័តពីអ្នកគ្រប់គ្រង"
      },
      dashboard: {
        overview: "ទិដ្ឋភាពទូទៅ",
        totalDepts: "ផ្នែកសរុប",
        assignedKPIs: "KPI ដែលបានចាត់តាំង",
        avgScore: "ពិន្ទុមធ្យម",
        deptAssignments: "ការចាត់តាំងតាមផ្នែក",
        viewDetails: "មើលលម្អិត",
        progress: "វឌ្ឍនភាព",
        noData: "មិនមានការចាត់តាំងទេ"
      },
      smart: {
        title: "គោលការណ៍ S.M.A.R.T",
        s: { title: "Specific", desc: "ច្បាស់លាស់ និងជាក់លាក់" },
        m: { title: "Measurable", desc: "អាចវាស់វែងបាន" },
        a: { title: "Achievable", desc: "អាចសម្រេចបានពិតប្រាកដ" },
        r: { title: "Relevant", desc: "ស្របតាមគោលដៅរួម" },
        t: { title: "Time-bound", desc: "មានពេលវេលាកំណត់ច្បាស់លាស់" }
      },
      tabs: {
        overview: "ទិដ្ឋភាពទូទៅ",
        setting: "ទម្រង់កំណត់ KPI",
        master: "Master KPI",
        approval: "ការអនុម័ត KPI",
        plan: "ផែនការប្រចាំឆ្នាំ",
        matrix: "ម៉ាទ្រីស KPI",
        formulas: "ទិន្នន័យនិងរូបមន្ត"
      },
      formulas: {
        title: "៣. និយមន័យទិន្នន័យ និងរង្វាស់",
        subtitle: "ប្រព័ន្ធ HRM ត្រូវទាញទិន្នន័យពី៖",
        sources: ["វត្តមាន", "ច្បាប់ឈប់សម្រាក", "ការជ្រើសរើស", "ការបណ្តុះបណ្តាល", "ប្រាក់ខែ", "ថែមម៉ោង", "ការវាយតម្លៃ", "វិន័យ", "កំណត់ត្រាបុគ្គលិក"],
        exampleTitle: "ឧទាហរណ៍រូបមន្ត",
        formulaLabel: "រូបមន្ត៖",
        items: [
          { name: "អត្រាវត្តមាន", formula: "ថ្ងៃធ្វើការជាក់ស្តែង ÷ ថ្ងៃធ្វើការសរុប × 100%" },
          { name: "អត្រាផ្លាស់ប្តូរបុគ្គលិក", formula: "បុគ្គលិកឈប់ ÷ ចំនួនបុគ្គលិកមធ្យម × 100%" },
          { name: "អត្រាបញ្ចប់ការបណ្តុះបណ្តាល", formula: "បានបញ្ចប់ ÷ បានគ្រោងទុក × 100%" }
        ]
      },
      setting: {
        title: "ទម្រង់បញ្ចូល KPI ថ្មី",
        refDoc: "ឯកសារយោង*",
        docDate: "កាលបរិច្ឆេទឯកសារ",
        employee: "ឈ្មោះបុគ្គលិក (ជ្រើសរើសអត្តលេខ ឬឈ្មោះ)",
        kpi: "KPI",
        kpiDesc: "ការពិពណ៌នា KPI",
        measure: "រង្វាស់ %",
        target: "គោលដៅ",
        actual: "ជាក់ស្តែង / សម្រេចបាន",
        timeSheet: "តារាងពេលវេលាថ្មី",
        submitBtn: "បញ្ជូន"
      },
      approval: {
        title: "ការអនុម័ត KPI",
        table: { employee: "បុគ្គលិក", kpi: "KPI", target: "គោលដៅ", status: "ស្ថានភាព", action: "សកម្មភាព" },
        approveBtn: "អនុម័ត",
        rejectBtn: "បដិសេធ"
      },
      plan: {
        title: "ផែនការ KPI ប្រចាំឆ្នាំ",
        q1: "ត្រីមាសទី ១", q2: "ត្រីមាសទី ២", q3: "ត្រីមាសទី ៣", q4: "ត្រីមាសទី ៤"
      },
      matrix: {
        title: "ម៉ាទ្រីស KPI តាមផ្នែក",
        companyGoal: "គោលដៅក្រុមហ៊ុន",
        deptGoal: "គោលដៅផ្នែក",
        alignment: "ការតម្រឹម (Alignment)"
      }
    }
  },
  en: {
    sidebar: {
      dashboard: "Dashboard",
      employees: "Employees",
      attendance: "Attendance",
      leave: "Leave",
      advance: "Advance",
      payroll: "Payroll",
      exports: "Export Files",
      settings: "Settings",
      system: "System",
      kpi: "HR KPI",
      documents: "Documents",
      about: "About"
    },
    leave: {
      title: "Leave Management",
      newBtn: "+ New Leave",
      columns: {
        id: "ID",
        name: "Name",
        type: "Type",
        startDate: "Start Date",
        endDate: "End Date",
        reason: "Reason",
        status: "Status",
        actions: "Actions"
      },
      status: {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected"
      },
      types: {
        ANNUAL: "Annual Leave",
        SICK: "Sick Leave",
        UNPAID: "Unpaid Leave",
        MATERNITY: "Maternity Leave",
        OTHER: "Other"
      },
      form: {
        newTitle: "New Leave Request",
        employee: "Select Employee",
        type: "Leave Type",
        startDate: "Start Date",
        endDate: "End Date",
        reason: "Reason / Notes",
        save: "Save",
        saving: "Saving...",
        cancel: "Cancel"
      }
    },
    advance: {
      title: "Advance Salary",
      newBtn: "+ Request Advance",
      columns: { id: "ID", name: "Name", amount: "Amount ($)", date: "Date", monthYear: "Month/Year", reason: "Reason", status: "Status", actions: "Actions" },
      form: { newTitle: "New Advance", employee: "Employee", amount: "Amount ($)", requestDate: "Date", month: "Month", year: "Year", reason: "Reason", save: "Save", saving: "Saving...", cancel: "Cancel" }
    },
    header: {
      adminUser: "Admin User"
    },
    dashboard: {
      totalEmployees: "Total Employees",
      totalPayroll: "Total Payroll",
      todayAttendance: "Today Attendance",
      onLeave: "On Leave"
    },
    employee: {
      listTitle: "Employee Master",
      searchPlaceholder: "Search name or ID...",
      searchButton: "Search",
      newEmployeeBtn: "+ New Employee",
      noData: "No data available",
      edit: "Edit",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete?",
      columns: {
        id: "ID",
        nameKh: "Name (KH)",
        nameEn: "Name (EN)",
        gender: "Gender",
        dob: "DOB",
        hireDate: "Hire Date",
        position: "Position",
        department: "Department",
        salary: "Salary",
        phone: "Phone",
        actions: "Actions"
      },
      form: {
        newTitle: "New Employee",
        editTitle: "Edit Employee",
        employeeId: "Employee ID",
        firstNameEn: "First Name (EN)",
        lastNameEn: "Last Name (EN)",
        firstNameKh: "First Name (KH)",
        lastNameKh: "Last Name (KH)",
        gender: "Gender",
        male: "Male",
        female: "Female",
        dob: "Date of Birth",
        hireDate: "Hire Date",
        position: "Position",
        department: "Department",
        basicSalary: "Basic Salary ($)",
        phone: "Phone Number",
        address: "Current Address",
        save: "Save Data",
        saving: "Saving...",
        cancel: "Cancel",
        back: "Back"
      }
    },
    exports: {
      title: "Export Files",
      employeeReport: "Employee Report",
      employeeDesc: "Download the list of all employees in Excel, PDF, or Word format.",
      attendanceReport: "Attendance Report",
      attendanceDesc: "Download employee attendance records. (Feature in progress)",
      payrollReport: "Payroll Report",
      payrollDesc: "Download the employee payroll list. (Feature in progress)"
    },
    payroll: {
      title: "Payroll Master",
      generateBtn: "+ Generate Payroll",
      filterBtn: "Filter",
      noData: "No payroll records found for this month. Click 'Generate Payroll' to begin.",
      columns: {
        no: "No", id: "ID", name: "Name", dept: "Dept", line: "Line", position: "Position", shift: "Shift", sex: "Sex", child: "Child", bSalary: "B. Salary", wDay: "W. Day", wSalary: "W. Salary", payScale: "Pay Scale inc.", otHour: "OT Hour", otWage: "OT Wage", sunOt: "Sun OT", sunWage: "Sun Wage", nightOt: "N. OT", nightWage: "N. Wage", annualLeave: "Annual Leave", attBonus: "Att. Bonus", transport: "Transp.", lunch: "Lunch", otMeal: "OT Meal", dayCare: "Day Care", seniority: "Seniority", indemnity: "Indemnity", prodInc: "Prod inc.", adjust: "Adjust", totalSalary: "Total Salary", severance: "SX (5%)", tax: "Tax", loan: "Loan", union: "Union", netUsd: "Net USD", netRiel: "Net Riel", actions: "Actions"
      }
    },
    kpi: {
      title: "HR KPI Examples",
      columns: {
        kpi: "KPI",
        target: "Target"
      },
      items: {
        attendanceRate: "Attendance Rate",
        turnover: "Employee Turnover",
        training: "Training Completion",
        leadTime: "Recruitment Lead Time",
        probation: "Probation Pass Rate",
        satisfaction: "Employee Satisfaction"
      },
      evidenceTitle: "Evidence",
      evidence: {
        policy: "HR KPI Policy",
        matrix: "KPI Matrix",
        orgChart: "Organization Chart",
        jd: "Job Description",
        approvalRecord: "KPI Approval Record",
        managementApproval: "Management Approval"
      },
      dashboard: {
        overview: "Overview",
        totalDepts: "Total Departments",
        assignedKPIs: "Assigned KPIs",
        avgScore: "Average Score",
        deptAssignments: "Department Assignments",
        viewDetails: "View Details",
        progress: "Progress",
        noData: "No assignments found"
      },
      smart: {
        title: "S.M.A.R.T Principles",
        s: { title: "Specific", desc: "Clear and well-defined" },
        m: { title: "Measurable", desc: "Can be quantified" },
        a: { title: "Achievable", desc: "Realistic to attain" },
        r: { title: "Relevant", desc: "Aligns with broader goals" },
        t: { title: "Time-bound", desc: "Has a clear deadline" }
      },
      tabs: {
        overview: "Overview",
        setting: "KPI Setting Form",
        master: "Master KPI",
        approval: "KPI Approval",
        plan: "Annual Plan",
        matrix: "KPI Matrix",
        formulas: "Data & Formulas"
      },
      formulas: {
        title: "3. Data Definition and Measurement",
        subtitle: "HRM System must pull data from:",
        sources: ["Attendance", "Leave", "Recruitment", "Training", "Payroll", "OT", "Performance", "Discipline", "Employee Records"],
        exampleTitle: "Formula Examples",
        formulaLabel: "Formula:",
        items: [
          { name: "Attendance Rate", formula: "Present Days ÷ Working Days × 100%" },
          { name: "Turnover Rate", formula: "Resigned Employee ÷ Average Headcount × 100%" },
          { name: "Training Completion", formula: "Completed ÷ Planned × 100%" }
        ]
      },
      setting: {
        title: "New KPI Input Form",
        refDoc: "Reference Document*",
        docDate: "Document Date",
        employee: "Employee Name (Select ID or Name)",
        kpi: "KPI",
        kpiDesc: "KPI Description",
        measure: "Measure %",
        target: "Target",
        actual: "Actual / Achieved",
        timeSheet: "New Time Sheet",
        submitBtn: "Submit"
      },
      approval: {
        title: "KPI Approval",
        table: { employee: "Employee", kpi: "KPI", target: "Target", status: "Status", action: "Action" },
        approveBtn: "Approve",
        rejectBtn: "Reject"
      },
      plan: {
        title: "Annual KPI Plan",
        q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4"
      },
      matrix: {
        title: "Department KPI Matrix",
        companyGoal: "Company Goal",
        deptGoal: "Department Goal",
        alignment: "Alignment"
      }
    }
  },
  zh: {
    sidebar: {
      dashboard: "仪表板",
      employees: "员工",
      attendance: "出勤",
      leave: "请假",
      advance: "预支",
      payroll: "薪资",
      exports: "导出文件",
      settings: "设置",
      system: "系统",
      kpi: "人力资源KPI",
      documents: "公司文件",
      about: "关于系统"
    },
    leave: {
      title: "请假管理",
      newBtn: "+ 新增请假",
      columns: {
        id: "工号",
        name: "姓名",
        type: "类型",
        startDate: "开始日期",
        endDate: "结束日期",
        reason: "原因",
        status: "状态",
        actions: "操作"
      },
      status: {
        PENDING: "待定",
        APPROVED: "已批准",
        REJECTED: "已拒绝"
      },
      types: {
        ANNUAL: "年假",
        SICK: "病假",
        UNPAID: "无薪假",
        MATERNITY: "产假",
        OTHER: "其他"
      },
      form: {
        newTitle: "新增请假申请",
        employee: "选择员工",
        type: "请假类型",
        startDate: "开始日期",
        endDate: "结束日期",
        reason: "原因 / 备注",
        save: "保存",
        saving: "保存中...",
        cancel: "取消"
      }
    },
    advance: {
      title: "预支薪资",
      newBtn: "+ 申请预支",
      columns: { id: "工号", name: "姓名", amount: "金额 ($)", date: "日期", monthYear: "月/年", reason: "原因", status: "状态", actions: "操作" },
      form: { newTitle: "新增预支", employee: "员工", amount: "金额 ($)", requestDate: "日期", month: "月", year: "年", reason: "原因", save: "保存", saving: "保存中...", cancel: "取消" }
    },
    header: {
      adminUser: "管理员"
    },
    dashboard: {
      totalEmployees: "员工总数",
      totalPayroll: "本月总薪资",
      todayAttendance: "今日出勤",
      onLeave: "请假中"
    },
    employee: {
      listTitle: "员工档案",
      searchPlaceholder: "搜索姓名或工号...",
      searchButton: "搜索",
      newEmployeeBtn: "+ 新增员工",
      noData: "暂无数据",
      edit: "编辑",
      delete: "删除",
      confirmDelete: "您确定要删除此数据吗？",
      columns: {
        id: "工号",
        nameKh: "姓名 (高棉语)",
        nameEn: "姓名 (英语)",
        gender: "性别",
        dob: "出生日期",
        hireDate: "入职日期",
        position: "职位",
        department: "部门",
        salary: "薪资",
        phone: "电话",
        actions: "操作"
      },
      form: {
        newTitle: "新增员工",
        editTitle: "编辑员工信息",
        employeeId: "工号",
        firstNameEn: "名字 (英语)",
        lastNameEn: "姓氏 (英语)",
        firstNameKh: "名字 (高棉语)",
        lastNameKh: "姓氏 (高棉语)",
        gender: "性别",
        male: "男",
        female: "女",
        dob: "出生日期",
        hireDate: "入职日期",
        position: "职位",
        department: "部门",
        basicSalary: "基本薪资 ($)",
        phone: "电话号码",
        address: "当前住址",
        save: "保存数据",
        saving: "保存中...",
        cancel: "取消",
        back: "返回"
      }
    },
    exports: {
      title: "导出文件",
      employeeReport: "员工报告",
      employeeDesc: "下载Excel、PDF或Word格式的全体员工名单。",
      attendanceReport: "出勤报告",
      attendanceDesc: "下载员工出勤记录。(开发中)",
      payrollReport: "薪资报告",
      payrollDesc: "下载员工薪资列表。(开发中)"
    },
    payroll: {
      title: "薪资档案",
      generateBtn: "+ 生成薪资",
      filterBtn: "筛选",
      noData: "本月无薪资记录。请点击“生成薪资”开始。",
      columns: {
        no: "序号", id: "工号", name: "姓名", dept: "部门", line: "产线", position: "职位", shift: "班次", sex: "性别", child: "子女", bSalary: "基本薪资", wDay: "工作日", wSalary: "实际薪资", payScale: "加薪", otHour: "加班小时", otWage: "加班费", sunOt: "周日加班", sunWage: "周日加班费", nightOt: "夜班", nightWage: "夜班费", annualLeave: "年假", attBonus: "全勤奖", transport: "交通补助", lunch: "午餐补助", otMeal: "加班餐", dayCare: "托儿补助", seniority: "工龄奖", indemnity: "遣散费", prodInc: "生产奖金", adjust: "调整", totalSalary: "总薪资", severance: "离职补偿(5%)", tax: "税金", loan: "借款", union: "工会", netUsd: "实发 (美元)", netRiel: "实发 (瑞尔)", actions: "操作"
      }
    },
    kpi: {
      title: "人力资源KPI",
      columns: {
        kpi: "KPI",
        target: "目标"
      },
      items: {
        attendanceRate: "出勤率",
        turnover: "员工离职率",
        training: "培训完成率",
        leadTime: "招聘周期",
        probation: "试用期通过率",
        satisfaction: "员工满意度"
      },
      evidenceTitle: "证据材料",
      evidence: {
        policy: "HR KPI 政策",
        matrix: "KPI 矩阵",
        orgChart: "组织架构图",
        jd: "岗位描述",
        approvalRecord: "KPI 审批记录",
        managementApproval: "管理层审批"
      },
      dashboard: {
        overview: "概览",
        totalDepts: "部门总数",
        assignedKPIs: "已分配KPI",
        avgScore: "平均得分",
        deptAssignments: "部门分配",
        viewDetails: "查看详情",
        progress: "进度",
        noData: "未找到分配记录"
      },
      smart: {
        title: "S.M.A.R.T 原则",
        s: { title: "Specific (具体)", desc: "目标必须清晰明确" },
        m: { title: "Measurable (可衡量)", desc: "可以通过数据量化" },
        a: { title: "Achievable (可实现)", desc: "在现实条件下可以达成" },
        r: { title: "Relevant (相关性)", desc: "与整体目标保持一致" },
        t: { title: "Time-bound (时限性)", desc: "有明确的截止日期" }
      },
      tabs: {
        overview: "概览",
        setting: "KPI设置表单",
        master: "主要KPI",
        approval: "KPI审批",
        plan: "年度计划",
        matrix: "KPI矩阵",
        formulas: "数据与公式"
      },
      formulas: {
        title: "3. 数据定义与测量",
        subtitle: "HRM系统必须从以下模块提取数据：",
        sources: ["出勤", "请假", "招聘", "培训", "薪资", "加班", "绩效", "纪律", "员工档案"],
        exampleTitle: "公式示例",
        formulaLabel: "公式：",
        items: [
          { name: "出勤率", formula: "实际出勤天数 ÷ 应出勤天数 × 100%" },
          { name: "离职率", formula: "离职人数 ÷ 平均总人数 × 100%" },
          { name: "培训完成率", formula: "已完成人数 ÷ 计划人数 × 100%" }
        ]
      },
      setting: {
        title: "新增KPI录入表单",
        refDoc: "参考文件*",
        docDate: "文件日期",
        employee: "员工姓名 (选择工号或姓名)",
        kpi: "KPI",
        kpiDesc: "KPI描述",
        measure: "测量 %",
        target: "目标",
        actual: "实际/达成",
        timeSheet: "新时间表",
        submitBtn: "提交"
      },
      approval: {
        title: "KPI审批",
        table: { employee: "员工", kpi: "KPI", target: "目标", status: "状态", action: "操作" },
        approveBtn: "批准",
        rejectBtn: "拒绝"
      },
      plan: {
        title: "年度KPI计划",
        q1: "第一季度", q2: "第二季度", q3: "第三季度", q4: "第四季度"
      },
      matrix: {
        title: "部门KPI矩阵",
        companyGoal: "公司目标",
        deptGoal: "部门目标",
        alignment: "对齐度 (Alignment)"
      }
    }
  }
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof dictionaries['kh'];
