export const dictionaries = {
  kh: {
    sidebar: {
      dashboard: "ទំព័រដើម",
      employees: "បុគ្គលិក",
      attendance: "វត្តមាន",
      leave: "ច្បាប់ឈប់សម្រាក",
      advance: "ប្រាក់បុរេប្រទាន",
      payroll: "ប្រាក់ខែ",
      exports: "ទាញយកទិន្នន័យ",
      settings: "ការកំណត់",
      system: "ប្រព័ន្ធ",
      kpi: "KPI របស់ HR",
      documents: "??????????????",
      about: "????????????"
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
        reason: "មូលហេតុ / ចំណាំ",
        save: "រក្សាទុក",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់"
      }
    },
    advance: {
      title: "ប្រាក់បុរេប្រទាន (ខ្ចីលុយ)",
      newBtn: "+ ខ្ចីលុយ",
      columns: { id: "អត្តលេខ", name: "ឈ្មោះ", amount: "ចំនួន ($)", date: "ថ្ងៃទី", monthYear: "កាត់ខែ/ឆ្នាំ", reason: "មូលហេតុ", status: "ស្ថានភាព", actions: "សកម្មភាព" },
      form: { newTitle: "សំណើខ្ចីលុយថ្មី", employee: "បុគ្គលិក", amount: "ចំនួនប្រាក់ ($)", requestDate: "ថ្ងៃស្នើសុំ", month: "កាត់ខែ", year: "កាត់ឆ្នាំ", reason: "មូលហេតុ", save: "រក្សាទុក", saving: "កំពុងរក្សាទុក...", cancel: "បោះបង់" }
    },
    header: {
      adminUser: "អ្នកគ្រប់គ្រង"
    },
    dashboard: {
      totalEmployees: "បុគ្គលិកសរុប",
      totalPayroll: "ប្រាក់ខែសរុបខែនេះ",
      todayAttendance: "វត្តមានថ្ងៃនេះ",
      onLeave: "ច្បាប់ឈប់សម្រាក"
    },
    employee: {
      listTitle: "បញ្ជីបុគ្គលិក",
      searchPlaceholder: "ស្វែងរកឈ្មោះ ឬ ID...",
      searchButton: "ស្វែងរក",
      newEmployeeBtn: "+ បន្ថែមបុគ្គលិកថ្មី",
      noData: "មិនទាន់មានទិន្នន័យ",
      edit: "កែប្រែ",
      delete: "លុប",
      confirmDelete: "តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?",
      columns: {
        id: "ID",
        nameKh: "ឈ្មោះខ្មែរ",
        nameEn: "ឈ្មោះអង់គ្លេស",
        gender: "ភេទ",
        dob: "ថ្ងៃខែឆ្នាំកំណើត",
        hireDate: "ថ្ងៃចូលធ្វើការ",
        position: "មុខតំណែង",
        department: "ផ្នែក",
        salary: "ប្រាក់ខែ",
        phone: "លេខទូរសព្ទ",
        actions: "សកម្មភាព"
      },
      form: {
        newTitle: "បន្ថែមបុគ្គលិកថ្មី",
        editTitle: "កែប្រែព័ត៌មានបុគ្គលិក",
        employeeId: "អត្តលេខបុគ្គលិក",
        firstNameEn: "ឈ្មោះ (អង់គ្លេស)",
        lastNameEn: "នាមត្រកូល (អង់គ្លេស)",
        firstNameKh: "ឈ្មោះ (ខ្មែរ)",
        lastNameKh: "នាមត្រកូល (ខ្មែរ)",
        gender: "ភេទ",
        male: "ប្រុស",
        female: "ស្រី",
        dob: "ថ្ងៃខែឆ្នាំកំណើត",
        hireDate: "ថ្ងៃចូលធ្វើការ",
        position: "មុខតំណែង",
        department: "ផ្នែក",
        basicSalary: "ប្រាក់ខែគោល ($)",
        phone: "លេខទូរសព្ទ",
        address: "អាសយដ្ឋានបច្ចុប្បន្ន",
        save: "រក្សាទុកទិន្នន័យ",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់",
        back: "ត្រលប់ក្រោយ"
      }
    },
    exports: {
      title: "ទាញយកទិន្នន័យ",
      employeeReport: "របាយការណ៍បុគ្គលិក",
      employeeDesc: "ទាញយកបញ្ជីឈ្មោះបុគ្គលិកទាំងអស់ជាទម្រង់ Excel, PDF ឬ Word។",
      attendanceReport: "របាយការណ៍វត្តមាន",
      attendanceDesc: "ទាញយកបញ្ជីវត្តមានរបស់បុគ្គលិក។ (មុខងារនេះកំពុងរៀបចំ)",
      payrollReport: "របាយការណ៍ប្រាក់បៀវត្សរ៍",
      payrollDesc: "ទាញយកបញ្ជីបើកប្រាក់ខែរបស់បុគ្គលិក។ (មុខងារនេះកំពុងរៀបចំ)"
    },
    payroll: {
      title: "បញ្ជីប្រាក់ខែ",
      generateBtn: "+ គិតប្រាក់ខែ",
      filterBtn: "ចម្រាញ់",
      noData: "គ្មានទិន្នន័យប្រាក់ខែសម្រាប់ខែនេះទេ។ ចុចប៊ូតុង 'គិតប្រាក់ខែ' ដើម្បីចាប់ផ្តើម។",
      columns: {
        no: "ល.រ",
        id: "អត្តលេខ",
        name: "ឈ្មោះ",
        dept: "ផ្នែក",
        line: "ក្រុម",
        position: "តួនាទី",
        shift: "វេន",
        sex: "ភេទ",
        child: "កូន",
        bSalary: "ប្រាក់ខែគោល",
        wDay: "ថ្ងៃធ្វើការ",
        wSalary: "ប្រាក់ខែគិត",
        payScale: "Pay Scale",
        otHour: "OT(ម៉ោង)",
        otWage: "OT(លុយ)",
        sunOt: "OTអាទិត្យ(ម៉ោង)",
        sunWage: "OTអាទិត្យ(លុយ)",
        nightOt: "OTយប់(ម៉ោង)",
        nightWage: "OTយប់(លុយ)",
        annualLeave: "ច្បាប់សម្រាក",
        attBonus: "រង្វាន់ទៀងទាត់",
        transport: "សោហ៊ុយ",
        lunch: "អាហារថ្ងៃ",
        otMeal: "អាហារOT",
        dayCare: "ប្រាក់កូន",
        seniority: "អតីតភាព",
        indemnity: "Indemnity",
        prodInc: "Prod inc.",
        adjust: "Adjust",
        totalSalary: "ប្រាក់ខែសរុប",
        severance: "SX(5%)",
        tax: "ពន្ធ",
        loan: "កាត់កម្ចី",
        union: "សហជីព",
        netUsd: "ប្រាក់ខែសុទ្ធ($)",
        netRiel: "ប្រាក់ខែសុទ្ធ(៛)",
        actions: "សកម្មភាព"
      }
    },
    kpi: {
      title: "ឧទាហរណ៍ KPI របស់ HR",
      columns: {
        kpi: "KPI",
        target: "Target"
      },
      items: {
        attendanceRate: "អត្រាវត្តមាន",
        turnover: "អត្រាផ្លាស់ប្តូរបុគ្គលិក",
        training: "ការបញ្ចប់ការបណ្តុះបណ្តាល",
        leadTime: "រយៈពេលជ្រើសរើសបុគ្គលិក",
        probation: "អត្រាជាប់ការសាកល្បងការងារ",
        satisfaction: "ការពេញចិត្តរបស់បុគ្គលិក"
      },
      evidenceTitle: "ភស្តុតាង (Evidence)",
      evidence: {
        policy: "គោលការណ៍ HR KPI",
        matrix: "ម៉ាទ្រីស KPI",
        orgChart: "រចនាសម្ព័ន្ធស្ថាប័ន",
        jd: "ការពិពណ៌នាការងារ (JD)",
        approvalRecord: "កំណត់ត្រាអនុម័ត KPI",
        managementApproval: "ការអនុម័តពីថ្នាក់គ្រប់គ្រង"
      },
      dashboard: {
        overview: "សេចក្តីសង្ខេប",
        totalDepts: "ផ្នែកសរុប",
        assignedKPIs: "KPI ដែលបានចាត់តាំង",
        avgScore: "ពិន្ទុមធ្យមសរុប",
        deptAssignments: "ការចាត់តាំងតាមផ្នែក",
        viewDetails: "មើលលម្អិត",
        progress: "វឌ្ឍនភាព",
        noData: "មិនមានទិន្នន័យចាត់តាំងទេ"
      },
      smart: {
        title: "គោលការណ៍ S.M.A.R.T",
        s: { title: "Specific", desc: "ជាក់លាក់ និងច្បាស់លាស់" },
        m: { title: "Measurable", desc: "អាចវាស់វែងបាន" },
        a: { title: "Achievable", desc: "អាចសម្រេចបាន" },
        r: { title: "Relevant", desc: "ទាក់ទងនឹងគោលដៅរួម" },
        t: { title: "Time-bound", desc: "មានពេលវេលាកំណត់ច្បាស់លាស់" }
      },
      tabs: {
        overview: "ផ្ទាំងសង្ខេប",
        setting: "ការកំណត់ KPI",
        master: "គ្រប់គ្រង Master KPI",
        approval: "ការអនុម័ត KPI",
        plan: "ផែនការប្រចាំឆ្នាំ",
        matrix: "ម៉ាទ្រីស KPI",
        formulas: "ទិន្នន័យ និងរូបមន្ត"
      },
      formulas: {
        title: "៣. ការកំណត់ទិន្នន័យ និងទិន្នន័យត្រូវវាស់",
        subtitle: "HRM System ត្រូវអាចទាញទិន្នន័យពី៖",
        sources: ["Attendance", "Leave", "Recruitment", "Training", "Payroll", "OT", "Performance", "Discipline", "Employee Records"],
        exampleTitle: "ឧទាហរណ៍រូបមន្ត",
        formulaLabel: "Formula:",
        items: [
          { name: "Attendance Rate", formula: "Present Days ÷ Working Days × 100%" },
          { name: "Turnover Rate", formula: "Resigned Employee ÷ Average Headcount × 100%" },
          { name: "Training Completion", formula: "Completed ÷ Planned × 100%" }
        ]
      },
      setting: {
        title: "ទម្រង់បញ្ចូល KPI ថ្មី",
        refDoc: "ឯកសារយោង*",
        docDate: "កាលបរិច្ឆេទឯកសារ",
        employee: "ឈ្មោះនិយោជិក (ជ្រើសរើស ID ឬ ឈ្មោះ)",
        kpi: "KPI",
        kpiDesc: "ពិពណ៌នា KPI",
        measure: "វាស់វែង %",
        target: "គោលដៅ",
        actual: "ដែលប្រាកដ",
        timeSheet: "New Time Sheet",
        submitBtn: "ដាក់ស្នើ"
      },
      approval: {
        title: "អនុម័ត KPI",
        table: { employee: "បុគ្គលិក", kpi: "KPI", target: "គោលដៅ", status: "ស្ថានភាព", action: "សកម្មភាព" },

        approveBtn: "អនុម� � ",
        rejectBtn: "បដិស� ធ"
      },
      plan: {
        title: "ផែនការ KPI ប្រចាំឆ្នាំ",
        q1: "� ្រីមាសទី ១", q2: "� ្រីមាសទី ២", q3: "� ្រីមាសទី ៣", q4: "� ្រីមាសទី ៤"
      },
      matrix: {
        title: "ម៉ាទ្រីស KPI � ាមផ្នែក",
        companyGoal: "គោលដៅក្រុមហ៊ុន",
        deptGoal: "គោលដៅផ្នែក",
        alignment: "ការ� ម្រឹម (Alignment)"
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
      kpi: "HR KPI", documents: "Documents"
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
        no: "No",
        id: "ID",
        name: "Name",
        dept: "Dept",
        line: "Line",
        position: "Position",
        shift: "Shift",
        sex: "Sex",
        child: "Child",
        bSalary: "B. Salary",
        wDay: "W. Day",
        wSalary: "W. Salary",
        payScale: "Pay Scale inc.",
        otHour: "OT Hour",
        otWage: "OT Wage",
        sunOt: "Sun OT",
        sunWage: "Sun Wage",
        nightOt: "N. OT",
        nightWage: "N. Wage",
        annualLeave: "Annual Leave",
        attBonus: "Att. Bonus",
        transport: "Transp.",
        lunch: "Lunch",
        otMeal: "OT Meal",
        dayCare: "Day Care",
        seniority: "Seniority",
        indemnity: "Indemnity",
        prodInc: "Prod inc.",
        adjust: "Adjust",
        totalSalary: "Total Salary",
        severance: "SX (5%)",
        tax: "Tax",
        loan: "Loan",
        union: "Union",
        netUsd: "Net USD",
        netRiel: "Net Riel",
        actions: "Actions"
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
      dashboard: "仪表� �",
      employees: "员工",
      attendance: "出勤",
      leave: "请� �",
      advance: "预支",
      payroll: "薪资",
      exports: "导出文件",
      settings: "设置",
      system: "系统",
      kpi: "????KPI",
      documents: "????",
      about: "????"
    },
    leave: {
      title: "????",
      newBtn: "+ ????",
      columns: {
        id: "??",
        name: "??",
        type: "类型",
        startDate: "开始日期",
        endDate: "结� �日期",
        reason: "原因",
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
      title: "预支工资",
      newBtn: "+ 申请预支",
      columns: { id: "工号", name: "姓名", amount: "金额 ($)", date: "日期", monthYear: "月份/年份", reason: "原因", status: "状态", actions: "操作" },
      form: { newTitle: "新预支申请", employee: "员工", amount: "金额 ($)", requestDate: "日期", month: "月份", year: "年份", reason: "原因", save: "保存", saving: "保存中...", cancel: "取消" }
    },
    header: {
      adminUser: "管理员"
    },
    dashboard: {
      totalEmployees: "员工总数",
      totalPayroll: "本月总薪资",
      todayAttendance: "今日出勤",
      onLeave: "请假人数"
    },
    employee: {
      listTitle: "员工主数据",
      searchPlaceholder: "搜索姓名或ID...",
      searchButton: "搜索",
      newEmployeeBtn: "+ 新增员工",
      noData: "暂无数据",
      edit: "编辑",
      delete: "删除",
      confirmDelete: "您确定要删除此数据吗？",
      columns: {
        id: "工号",
        nameKh: "高棉语姓名",
        nameEn: "英文姓名",
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
        firstNameEn: "名 (英文)",
        lastNameEn: "姓 (英文)",
        firstNameKh: "名 (高棉语)",
        lastNameKh: "姓 (高棉语)",
        gender: "性别",
        male: "男",
        female: "女",
        dob: "出生日期",
        hireDate: "入职日期",
        position: "职位",
        department: "部门",
        basicSalary: "基本薪资 ($)",
        phone: "电话号码",
        address: "当前地址",
        save: "保存数据",
        saving: "保存中...",
        cancel: "取消",
        back: "返回"
      }
    },
    exports: {
      title: "导出文件",
      employeeReport: "员工报告",
      employeeDesc: "以Excel、PDF或Word格式下载所有员工列表。",
      attendanceReport: "出勤报告",
      attendanceDesc: "下载员工出勤记录。（功能开发中）",
      payrollReport: "薪资报告",
      payrollDesc: "下载员工工资单。（功能开发中）"
    },
    payroll: {
      title: "薪资表",
      generateBtn: "+ 生成薪资",
      filterBtn: "筛选",
      noData: "本月无薪资记录。点击“生成薪资”开始。",
      columns: {
        no: "序号",
        id: "工号",
        name: "姓名",
        dept: "部门",
        line: "生产线",
        position: "职位",
        shift: "班次",
        sex: "性别",
        child: "子女",
        bSalary: "基本工资",
        wDay: "出勤天数",
        wSalary: "出勤工资",
        payScale: "职级津贴",
        otHour: "加班(小时)",
        otWage: "加班(金额)",
        sunOt: "周日加班(小时)",
        sunWage: "周日加班(金额)",
        nightOt: "夜班加班(小时)",
        nightWage: "夜班加班(金额)",
        annualLeave: "年假",
        attBonus: "全勤奖",
        transport: "交通贴",
        lunch: "午餐贴",
        otMeal: "加班餐补",
        dayCare: "托儿贴",
        seniority: "工龄奖",
        indemnity: "补偿金",
        prodInc: "生产奖",
        adjust: "调整",
        totalSalary: "总薪资",
        severance: "SX(5%)",
        tax: "税金",
        loan: "扣款/借款",
        union: "工会费",
        netUsd: "实发薪资($)",
        netRiel: "实发薪资(៛)",
        actions: "操作"
      }
    },
    kpi: {
      title: "人力资源KPI示例",
      columns: {
        kpi: "KPI",
        target: "目标"
      },
      items: {
        attendanceRate: "出勤率",
        turnover: "员工流失率",
        training: "培训完成率",
        leadTime: "招聘周期",
        probation: "试用期通过率",
        satisfaction: "员工满意度"
      },
      evidenceTitle: "证据 (Evidence)",
      evidence: {
        policy: "人力资源KPI政策",
        matrix: "KPI矩阵",
        orgChart: "组织架构图",
        jd: "职位描述",
        approvalRecord: "KPI审批记录",
        managementApproval: "管理层审批"
      },
      dashboard: {
        overview: "概览",
        totalDepts: "部门总数",
        assignedKPIs: "已分配KPI",
        avgScore: "平均得分",
        deptAssignments: "各部门KPI分配",
        viewDetails: "查看详情",
        progress: "进度",
        noData: "暂无分配数据"
      },
      smart: {
        title: "S.M.A.R.T 原则",
        s: { title: "Specific (具体)", desc: "目标明确具体" },
        m: { title: "Measurable (可衡量)", desc: "数据化可测量" },
        a: { title: "Achievable (可实现)", desc: "有挑战但可达到" },
        r: { title: "Relevant (相关性)", desc: "与战略目标一致" },
        t: { title: "Time-bound (时限性)", desc: "明确的截止期限" }
      },
      tabs: {
        overview: "概览",
        setting: "KPI设定表",
        master: "主KPI管理",
        approval: "KPI审批",
        plan: "年度计划",
        matrix: "KPI矩阵",
        formulas: "数据与公式"
      },
      formulas: {
        title: "3. 数据定义与测量",
        subtitle: "HRM系统必须从以下模块提取数据：",
        sources: ["考勤", "休假", "招聘", "培训", "薪资", "加班", "绩效", "纪律", "员工档案"],
        exampleTitle: "公式示例",
        formulaLabel: "公式:",
        items: [
          { name: "出勤率 (Attendance Rate)", formula: "Present Days ÷ Working Days × 100%" },
          { name: "离职率 (Turnover Rate)", formula: "Resigned Employee ÷ Average Headcount × 100%" },
          { name: "培训完成率 (Training Completion)", formula: "Completed ÷ Planned × 100%" }
        ]
      },
      setting: {
        title: "新建KPI录入表",
        refDoc: "参考文件*",
        docDate: "文件日期",
        employee: "员工姓名 (选择ID或姓名)",
        kpi: "KPI",
        kpiDesc: "KPI描述",
        measure: "测量 %",
        target: "目标",
        actual: "实际达成",
        timeSheet: "新时间表 (New Time Sheet)",
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
