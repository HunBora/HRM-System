import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/appointments - List all appointment letters
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (q) {
      where.OR = [
        { refNo: { contains: q, mode: 'insensitive' } },
        { newPosition: { contains: q, mode: 'insensitive' } },
        { newDepartment: { contains: q, mode: 'insensitive' } },
        { dutiesJson: { contains: q, mode: 'insensitive' } },
        {
          employee: {
            OR: [
              { firstNameKh: { contains: q } },
              { lastNameKh: { contains: q } },
              { firstNameEn: { contains: q, mode: 'insensitive' } },
              { lastNameEn: { contains: q, mode: 'insensitive' } },
              { employeeId: { contains: q, mode: 'insensitive' } },
              { nationalId: { contains: q, mode: 'insensitive' } },
              { department: { contains: q, mode: 'insensitive' } },
              { position: { contains: q, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const appointments = await prisma.appointmentLetter.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstNameKh: true,
            lastNameKh: true,
            firstNameEn: true,
            lastNameEn: true,
            gender: true,
            dob: true,
            nationalId: true,
            position: true,
            department: true,
            phone: true,
            photoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment letter
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      employeeId,
      oldPosition,
      oldDepartment,
      newPosition,
      newDepartment,
      reportsTo,
      effectiveDate,
      probationMonths,
      newSalary,
      positionAllowance,
      benefits,
      duties, // Array of strings or single string
      preambleLaw,
      preambleInternalRule,
      preamblePerformance,
      preambleNeeds,
      signLocation,
      signDate,
      signatoryTitle,
      signatoryName,
      ccList,
      templateStyle,
      notes
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'សូមជ្រើសរើសបុគ្គលិកដែលត្រូវតែងតាំង' }, { status: 400 });
    }
    if (!newPosition || !newDepartment) {
      return NextResponse.json({ error: 'សូមបញ្ជាក់មុខតំណែងថ្មី និងផ្នែកថ្មី' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'រកមិនឃើញបុគ្គលិកនេះក្នុងប្រព័ន្ធឡើយ' }, { status: 404 });
    }

    // Generate unique Ref No: APPT-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `APPT-${yearMonth}-`;

    const countThisMonth = await prisma.appointmentLetter.count({
      where: {
        refNo: { startsWith: prefix }
      }
    });

    const refNo = `${prefix}${String(countThisMonth + 1).padStart(4, '0')}`;

    const effective = effectiveDate ? new Date(effectiveDate) : now;
    const signing = signDate ? new Date(signDate) : now;

    let dutiesArray: string[] = [];
    if (Array.isArray(duties)) {
      dutiesArray = duties.filter((d) => typeof d === 'string' && d.trim().length > 0);
    } else if (typeof duties === 'string') {
      try {
        const parsed = JSON.parse(duties);
        dutiesArray = Array.isArray(parsed) ? parsed : [duties];
      } catch {
        dutiesArray = duties.split('\n').filter((d) => d.trim().length > 0);
      }
    }

    if (dutiesArray.length === 0) {
      dutiesArray = [
        'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
        'រៀបចំផែនការការងារ បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
        'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដាររបស់រោងចក្រ',
        'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបន្ទាន់ និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ'
      ];
    }

    const appointment = await prisma.appointmentLetter.create({
      data: {
        refNo,
        employeeId,
        oldPosition: oldPosition || employee.position,
        oldDepartment: oldDepartment || employee.department,
        newPosition,
        newDepartment,
        reportsTo: reportsTo || 'នាយកចាត់ការទូទៅ (General Manager)',
        effectiveDate: effective,
        probationMonths: probationMonths ? Number(probationMonths) : 0,
        newSalary: newSalary ? Number(newSalary) : null,
        positionAllowance: positionAllowance ? Number(positionAllowance) : null,
        benefits: benefits || '',
        dutiesJson: JSON.stringify(dutiesArray),
        preambleLaw: preambleLaw || 'យោងតាមក្រមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា',
        preambleInternalRule: preambleInternalRule || 'យោងតាមលក្ខន្តិកៈ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន',
        preamblePerformance: preamblePerformance || 'យោងតាមសមត្ថភាព ចំណេះដឹង បទពិសោធន៍ ស្នាដៃការងារ និងភាពស្មោះត្រង់របស់បុគ្គលិក',
        preambleNeeds: preambleNeeds || 'យោងតាមតម្រូវការការងារជាក់ស្តែង និងការសម្រេចរបស់គណៈគ្រប់គ្រងរោងចក្រ/ក្រុមហ៊ុន',
        signLocation: signLocation || 'រាជធានីភ្នំពេញ',
        signDate: signing,
        signatoryTitle: signatoryTitle || 'អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)',
        signatoryName: signatoryName || '',
        ccList: ccList || '- ក្រុមប្រឹក្សាភិបាល\n- នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល\n- នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ\n- សាមីខ្លួន "ដើម្បីអនុវត្ត"\n- ឯកសារ - កាលប្បវត្តិ',
        templateStyle: templateStyle || 'standard',
        status: 'ACTIVE',
        notes: notes || ''
      },
      include: {
        employee: true
      }
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error creating appointment letter:', error);
    return NextResponse.json({ error: error.message || 'Failed to create appointment letter' }, { status: 500 });
  }
}
