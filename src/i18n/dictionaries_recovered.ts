export const dictionaries = {
  kh: {
    sidebar: {
      dashboard: "ទំព�?រដើម",
      employees: "បុគ្គលិក",
      attendance: "វ�?្�?មាន",
      leave: "ច្បាប់ឈប់សម្រាក",
      advance: "ប្រាក់បុរ�?ប្រទាន",
      payroll: "ប្រាក់�?ែ",
      exports: "ទាញយកទិន្នន�?យ",
      settings: "ការកំណ�?់",
      system: "ប្រព�?ន្ធ",
      kpi: "KPI របស់ HR",
      documents: "??????????????",
      about: "????????????"
    },
    leave: {
      title: "គ្រប់គ្រង�?្ងៃឈប់សម្រាក",
      newBtn: "+ បញ្ចូលច្បាប់",
      columns: {
        id: "អ�?្�?ល�?�?",
        name: "ឈ្មោះ",
        type: "ប្រភ�?ទច្បាប់",
        startDate: "�?្ងៃចាប់ផ្�?ើម",
        endDate: "�?្ងៃបញ្ចប់",
        reason: "មូលហ�?�?ុ",
        status: "ស្�?ានភាព",
        actions: "សកម្មភាព"
      },
      status: {
        PENDING: "រង់ចាំ",
        APPROVED: "អនុម�?�?",
        REJECTED: "បដិស�?ធ"
      },
      types: {
        ANNUAL: "ច្បាប់ប្រចាំឆ្នាំ",
        SICK: "ច្បាប់ឈឺ",
        UNPAID: "សម្រាកគ្មានប្រាក់�?ែ",
        MATERNITY: "ច្បាប់លំហែមា�?ុភាព",
        OTHER: "ផ្ស�?ងៗ"
      },
      form: {
        newTitle: "បញ្ចូលច្បាប់ឈប់សម្រាក�?្មី",
        employee: "ជ្រើសរើសបុគ្គលិក",
        type: "ប្រភ�?ទច្បាប់",
        startDate: "�?្ងៃចាប់ផ្�?ើម",
        endDate: "�?្ងៃបញ្ចប់",
        reason: "មូលហ�?�?ុ / ចំណាំ",
        save: "រក្សាទុក",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់"
      }
    },
    advance: {
      title: "ប្រាក់បុរ�?ប្រទាន (�?្ចីលុយ)",
      newBtn: "+ �?្ចីលុយ",
      columns: { id: "អ�?្�?ល�?�?", name: "ឈ្មោះ", amount: "ចំនួន ($)", date: "�?្ងៃទី", monthYear: "កា�?់�?ែ/ឆ្នាំ", reason: "មូលហ�?�?ុ", status: "ស្�?ានភាព", actions: "សកម្មភាព" },
      form: { newTitle: "សំណើ�?្ចីលុយ�?្មី", employee: "បុគ្គលិក", amount: "ចំនួនប្រាក់ ($)", requestDate: "�?្ងៃស្នើសុំ", month: "កា�?់�?ែ", year: "កា�?់ឆ្នាំ", reason: "មូលហ�?�?ុ", save: "រក្សាទុក", saving: "កំពុងរក្សាទុក...", cancel: "បោះបង់" }
    },
    header: {
      adminUser: "អ្នកគ្រប់គ្រង"
    },
    dashboard: {
      totalEmployees: "បុគ្គលិកសរុប",
      totalPayroll: "ប្រាក់�?ែសរុប�?ែន�?ះ",
      todayAttendance: "វ�?្�?មាន�?្ងៃន�?ះ",
      onLeave: "ច្បាប់ឈប់សម្រាក"
    },
    employee: {
      listTitle: "បញ្ជីបុគ្គលិក",
      searchPlaceholder: "ស្វែងរកឈ្មោះ ឬ ID...",
      searchButton: "ស្វែងរក",
      newEmployeeBtn: "+ បន្�?ែមបុគ្គលិក�?្មី",
      noData: "មិនទាន់មានទិន្នន�?យ",
      edit: "កែប្រែ",
      delete: "លុប",
      confirmDelete: "�?ើអ្នកពិ�?ជាចង់លុបទិន្នន�?យន�?ះមែនទ�??",
      columns: {
        id: "ID",
        nameKh: "ឈ្មោះ�?្មែរ",
        nameEn: "ឈ្មោះអង់គ្ល�?ស",
        gender: "ភ�?ទ",
        dob: "�?្ងៃ�?ែឆ្នាំកំណើ�?",
        hireDate: "�?្ងៃចូលធ្វើការ",
        position: "មុ�?�?ំណែង",
        department: "ផ្នែក",
        salary: "ប្រាក់�?ែ",
        phone: "ល�?�?ទូរសព្ទ",
        actions: "សកម្មភាព"
      },
      form: {
        newTitle: "បន្�?ែមបុគ្គលិក�?្មី",
        editTitle: "កែប្រែព�?�?៌មានបុគ្គលិក",
        employeeId: "អ�?្�?ល�?�?បុគ្គលិក",
        firstNameEn: "ឈ្មោះ (អង់គ្ល�?ស)",
        lastNameEn: "នាម�?្រកូល (អង់គ្ល�?ស)",
        firstNameKh: "ឈ្មោះ (�?្មែរ)",
        lastNameKh: "នាម�?្រកូល (�?្មែរ)",
        gender: "ភ�?ទ",
        male: "ប្រុស",
        female: "ស្រី",
        dob: "�?្ងៃ�?ែឆ្នាំកំណើ�?",
        hireDate: "�?្ងៃចូលធ្វើការ",
        position: "មុ�?�?ំណែង",
        department: "ផ្នែក",
        basicSalary: "ប្រាក់�?ែគោល ($)",
        phone: "ល�?�?ទូរសព្ទ",
        address: "អាសយដ្ឋានបច្ចុប្បន្ន",
        save: "រក្សាទុកទិន្នន�?យ",
        saving: "កំពុងរក្សាទុក...",
        cancel: "បោះបង់",
        back: "�?្រលប់ក្រោយ"
      }
    },
    exports: {
      title: "ទាញយកទិន្នន�?យ",
      employeeReport: "របាយការណ�?បុគ្គលិក",
      employeeDesc: "ទាញយកបញ្ជីឈ្មោះបុគ្គលិកទាំងអស់ជាទម្រង់ Excel, PDF ឬ Word។",
      attendanceReport: "របាយការណ�?វ�?្�?មាន",
      attendanceDesc: "ទាញយកបញ្ជីវ�?្�?មានរបស់បុគ្គលិក។ (មុ�?ងារន�?ះកំពុងរៀបចំ)",
      payrollReport: "របាយការណ�?ប្រាក់បៀវ�?្សរ�?",
      payrollDesc: "ទាញយកបញ្ជីបើកប្រាក់�?ែរបស់បុគ្គលិក។ (មុ�?ងារន�?ះកំពុងរៀបចំ)"
    },
    payroll: {
      title: "បញ្ជីប្រាក់�?ែ",
      generateBtn: "+ គិ�?ប្រាក់�?ែ",
      filterBtn: "ចម្រាញ់",
      noData: "គ្មានទិន្នន�?យប្រាក់�?ែសម្រាប់�?ែន�?ះទ�?។ ចុចប៊ូ�?ុង 'គិ�?ប្រាក់�?ែ' ដើម្បីចាប់ផ្�?ើម។",
      columns: {
        no: "ល.រ",
        id: "អ�?្�?ល�?�?",
        name: "ឈ្មោះ",
        dept: "ផ្នែក",
        line: "ក្រុម",
        position: "�?ួនាទី",
        shift: "វ�?ន",
        sex: "ភ�?ទ",
        child: "កូន",
        bSalary: "ប្រាក់�?ែគោល",
        wDay: "�?្ងៃធ្វើការ",
        wSalary: "ប្រាក់�?ែគិ�?",
        payScale: "Pay Scale",
        otHour: "OT(ម៉ោង)",
        otWage: "OT(លុយ)",
        sunOt: "OTអាទិ�?្យ(ម៉ោង)",
        sunWage: "OTអាទិ�?្យ(លុយ)",
        nightOt: "OTយប់(ម៉ោង)",
        nightWage: "OTយប់(លុយ)",
        annualLeave: "ច្បាប់សម្រាក",
        attBonus: "រង្វាន់ទៀងទា�?់",
        transport: "សោហ៊ុយ",
        lunch: "អាហារ�?្ងៃ",
        otMeal: "អាហារOT",
        dayCare: "ប្រាក់កូន",
        seniority: "អ�?ី�?ភាព",
        indemnity: "Indemnity",
        prodInc: "Prod inc.",
        adjust: "Adjust",
        totalSalary: "ប្រាក់�?ែសរុប",
        severance: "SX(5%)",
        tax: "ពន្ធ",
        loan: "កា�?់កម្ចី",
        union: "សហជីព",
        netUsd: "ប្រាក់�?ែសុទ្ធ($)",
        netRiel: "ប្រាក់�?ែសុទ្ធ(៛)",
        actions: "សកម្មភាព"
      }
    },
    kpi: {
      title: "ឧទាហរណ�? KPI របស់ HR",
      columns: {
        kpi: "KPI",
        target: "Target"
      },
      items: {
        attendanceRate: "អ�?្រាវ�?្�?មាន",
        turnover: "អ�?្រាផ្លាស់ប្�?ូរបុគ្គលិក",
        training: "ការបញ្ចប់ការបណ្�?ុះបណ្�?ាល",
        leadTime: "រយៈព�?លជ្រើសរើសបុគ្គលិក",
        probation: "អ�?្រាជាប់ការសាកល្បងការងារ",
        satisfaction: "ការព�?ញចិ�?្�?របស់បុគ្គលិក"
      },
      evidenceTitle: "ភស្�?ុ�?ាង (Evidence)",
      evidence: {
        policy: "គោលការណ�? HR KPI",
        matrix: "ម៉ាទ្រីស KPI",
        orgChart: "រចនាសម្ព�?ន្ធស្�?ាប�?ន",
        jd: "ការពិពណ៌នាការងារ (JD)",
        approvalRecord: "កំណ�?់�?្រាអនុម�?�? KPI",
        managementApproval: "ការអនុម�?�?ពី�?្នាក់គ្រប់គ្រង"
      },
      dashboard: {
        overview: "ស�?ចក្�?ីសង្�?�?ប",
        totalDepts: "ផ្នែកសរុប",
        assignedKPIs: "KPI ដែលបានចា�?់�?ាំង",
        avgScore: "ពិន្ទុមធ្យមសរុប",
        deptAssignments: "ការចា�?់�?ាំង�?ាមផ្នែក",
        viewDetails: "មើលលម្អិ�?",
        progress: "វឌ្�?នភាព",
        noData: "មិនមានទិន្នន�?យចា�?់�?ាំងទ�?"
      },
      smart: {
        title: "គោលការណ�? S.M.A.R.T",
        s: { title: "Specific", desc: "ជាក់លាក់ និងច្បាស់លាស់" },
        m: { title: "Measurable", desc: "អាចវាស់វែងបាន" },
        a: { title: "Achievable", desc: "អាចសម្រ�?ចបាន" },
        r: { title: "Relevant", desc: "ទាក់ទងនឹងគោលដៅរួម" },
        t: { title: "Time-bound", desc: "មានព�?លវ�?លាកំណ�?់ច្បាស់លាស់" }
      },
      tabs: {
        overview: "ផ្ទាំងសង្�?�?ប",
        setting: "ការកំណ�?់ KPI",
        master: "គ្រប់គ្រង Master KPI",
        approval: "ការអនុម�?�? KPI",
        plan: "ផែនការប្រចាំឆ្នាំ",
        matrix: "ម៉ាទ្រីស KPI",
        formulas: "ទិន្នន�?យ និងរូបមន្�?"
      },
      formulas: {
        title: "៣. ការកំណ�?់ទិន្នន�?យ និងទិន្នន�?យ�?្រូវវាស់",
        subtitle: "HRM System �?្រូវអាចទាញទិន្នន�?យពី៖",
        sources: ["Attendance", "Leave", "Recruitment", "Training", "Payroll", "OT", "Performance", "Discipline", "Employee Records"],
        exampleTitle: "ឧទាហរណ�?រូបមន្�?",
        formulaLabel: "Formula:",
        items: [
          { name: "Attendance Rate", formula: "Present Days ÷ Working Days × 100%" },
          { name: "Turnover Rate", formula: "Resigned Employee ÷ Average Headcount × 100%" },
          { name: "Training Completion", formula: "Completed ÷ Planned × 100%" }
        ]
      },
      setting: {
        title: "ទម្រង់បញ្ចូល KPI �?្មី",
        refDoc: "ឯកសារយោង*",
        docDate: "កាលបរិច្ឆ�?ទឯកសារ",
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
        title: "អនុម�?�? KPI",
        table: { employee: "បុគ្គលិក", kpi: "KPI", target: "គោលដៅ", status: "ស្�?ានភាព", action: "សកម្មភាព" },

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
        actions: "�?作"
      },
      status: {
        PENDING: "待定",
        APPROVED: "已批准",
        REJECTED: "已拒�?"
      },
      types: {
        ANNUAL: "年�?�",
        SICK: "病�?�",
        UNPAID: "无薪�?�",
        MATERNITY: "产�?�",
        OTHER: "其他"
      },
      form: {
        newTitle: "新增请�?�申请",
        employee: "选择员工",
        type: "请�?�类型",
        startDate: "开始日期",
        endDate: "结�?�日期",
        reason: "原因 / 备注",
        save: "�?存",
        saving: "�?存中...",
        cancel: "�?�消"
      }
    },
    advance: {
      title: "预支工资",
      newBtn: "+ 申请预支",
      columns: { id: "工�?�", name: "姓�??", amount: "金�? ($)", date: "日期", monthYear: "月份/年份", reason: "原因", status: "状�?", actions: "�?作" },
      form: { newTitle: "新预支申请", employee: "员工", amount: "金�? ($)", requestDate: "日期", month: "月份", year: "年份", reason: "原因", save: "�?存", saving: "�?存中...", cancel: "�?�消" }
    },
    header: {
      adminUser: "管�?�员"
    },
    dashboard: {
      totalEmployees: "员工总数",
      totalPayroll: "本月总薪资",
      todayAttendance: "今日出勤",
      onLeave: "请�?�人数"
    },
    employee: {
      listTitle: "员工主数�?�",
      searchPlaceholder: "�?�索姓�??或ID...",
      searchButton: "�?�索",
      newEmployeeBtn: "+ 新增员工",
      noData: "暂无数�?�",
      edit: "编辑",
      delete: "删除",
      confirmDelete: "您确定�?删除此数�?��?�？",
      columns: {
        id: "工�?�",
        nameKh: "高棉语姓�??",
        nameEn: "英文姓�??",
        gender: "性别",
        dob: "出生日期",
        hireDate: "入�?�日期",
        position: "�?��?",
        department: "部门",
        salary: "薪资",
        phone: "电�?",
        actions: "�?作"
      },
      form: {
        newTitle: "新增员工",
        editTitle: "编辑员工信�?�",
        employeeId: "工�?�",
        firstNameEn: "�?? (英文)",
        lastNameEn: "姓 (英文)",
        firstNameKh: "�?? (高棉语)",
        lastNameKh: "姓 (高棉语)",
        gender: "性别",
        male: "男",
        female: "女",
        dob: "出生日期",
        hireDate: "入�?�日期",
        position: "�?��?",
        department: "部门",
        basicSalary: "基本薪资 ($)",
        phone: "电�?�?��?",
        address: "当�?地�?�",
        save: "�?存数�?�",
        saving: "�?存中...",
        cancel: "�?�消",
        back: "返回"
      }
    },
    exports: {
      title: "导出文件",
      employeeReport: "员工报告",
      employeeDesc: "以Excel�?PDF或Word格�?下载所有员工列表。",
      attendanceReport: "出勤报告",
      attendanceDesc: "下载员工出勤记录。（功能开�?�中）",
      payrollReport: "薪资报告",
      payrollDesc: "下载员工工资�?�。（功能开�?�中）"
    },
    payroll: {
      title: "薪资表",
      generateBtn: "+ 生�?薪资",
      filterBtn: "筛选",
      noData: "本月无薪资记录。点击“生�?薪资�?开始。",
      columns: {
        no: "�?�?�",
        id: "工�?�",
        name: "姓�??",
        dept: "部门",
        line: "生产线",
        position: "�?��?",
        shift: "�?�次",
        sex: "性别",
        child: "�?女",
        bSalary: "基本工资",
        wDay: "出勤天数",
        wSalary: "出勤工资",
        payScale: "�?�级津贴",
        otHour: "加�?�(�?时)",
        otWage: "加�?�(金�?)",
        sunOt: "周日加�?�(�?时)",
        sunWage: "周日加�?�(金�?)",
        nightOt: "夜�?�加�?�(�?时)",
        nightWage: "夜�?�加�?�(金�?)",
        annualLeave: "年�?�",
        attBonus: "全勤奖",
        transport: "交通贴",
        lunch: "�?��?贴",
        otMeal: "加�?��?补",
        dayCare: "托儿贴",
        seniority: "工龄奖",
        indemnity: "补�?�金",
        prodInc: "生产奖",
        adjust: "调整",
        totalSalary: "总薪资",
        severance: "SX(5%)",
        tax: "税金",
        loan: "扣款/借款",
        union: "工会费",
        netUsd: "实�?�薪资($)",
        netRiel: "实�?�薪资(៛)",
        actions: "�?作"
      }
    },
    kpi: {
      title: "人力资�?KPI示例",
      columns: {
        kpi: "KPI",
        target: "目标"
      },
      items: {
        attendanceRate: "出勤率",
        turnover: "员工�?失率",
        training: "培训完�?率",
        leadTime: "招�?�周期",
        probation: "试用期通过率",
        satisfaction: "员工满�?度"
      },
      evidenceTitle: "�?�?� (Evidence)",
      evidence: {
        policy: "人力资�?KPI政策",
        matrix: "KPI矩阵",
        orgChart: "组织架构图",
        jd: "�?��?�??述",
        approvalRecord: "KPI审批记录",
        managementApproval: "管�?�层审批"
      },
      dashboard: {
        overview: "概览",
        totalDepts: "部门总数",
        assignedKPIs: "已分�?KPI",
        avgScore: "平�?�得分",
        deptAssignments: "�?�部门KPI分�?",
        viewDetails: "查看详情",
        progress: "进度",
        noData: "暂无分�?数�?�"
      },
      smart: {
        title: "S.M.A.R.T 原则",
        s: { title: "Specific (具体)", desc: "目标明确具体" },
        m: { title: "Measurable (�?�衡�?)", desc: "数�?�化�?�测�?" },
        a: { title: "Achievable (�?�实现)", desc: "有挑战但�?�达到" },
        r: { title: "Relevant (相关性)", desc: "与战略目标一致" },
        t: { title: "Time-bound (时�?性)", desc: "明确的截止期�?" }
      },
      tabs: {
        overview: "概览",
        setting: "KPI设定表",
        master: "主KPI管�?�",
        approval: "KPI审批",
        plan: "年度计划",
        matrix: "KPI矩阵",
        formulas: "数�?�与公�?"
      },
      formulas: {
        title: "3. 数�?�定义与测�?",
        subtitle: "HRM系统必须从以下模�?��??�?�数�?�：",
        sources: ["考勤", "休�?�", "招�?�", "培训", "薪资", "加�?�", "绩效", "纪律", "员工档案"],
        exampleTitle: "公�?示例",
        formulaLabel: "公�?:",
        items: [
          { name: "出勤率 (Attendance Rate)", formula: "Present Days ÷ Working Days × 100%" },
          { name: "离�?�率 (Turnover Rate)", formula: "Resigned Employee ÷ Average Headcount × 100%" },
          { name: "培训完�?率 (Training Completion)", formula: "Completed ÷ Planned × 100%" }
        ]
      },
      setting: {
        title: "新建KPI录入表",
        refDoc: "�?�考文件*",
        docDate: "文件日期",
        employee: "员工姓�?? (选择ID或姓�??)",
        kpi: "KPI",
        kpiDesc: "KPI�??述",
        measure: "测�? %",
        target: "目标",
        actual: "实际达�?",
        timeSheet: "新时间表 (New Time Sheet)",
        submitBtn: "�??交"
      },
      approval: {
        title: "KPI审批",
        table: { employee: "员工", kpi: "KPI", target: "目标", status: "状�?", action: "�?作" },
        approveBtn: "批准",
        rejectBtn: "拒�?"
      },
      plan: {
        title: "年度KPI计划",
        q1: "第一季度", q2: "第二季度", q3: "第三季度", q4: "第四季度"
      },
      matrix: {
        title: "部门KPI矩阵",
        companyGoal: "公�?�目标",
        deptGoal: "部门目标",
        alignment: "对�?度 (Alignment)"
      }
    }
  }
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof dictionaries['kh'];
