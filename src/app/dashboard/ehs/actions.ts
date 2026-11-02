'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to format ID codes
function generateCode(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

export async function getEhsDashboardData() {
  try {
    const [employees, clinicVisits, incidents, checkups] = await Promise.all([
      prisma.employee.findMany({
        where: { status: { not: 'RESIGNED' } },
        select: {
          id: true,
          employeeId: true,
          firstNameKh: true,
          lastNameKh: true,
          firstNameEn: true,
          lastNameEn: true,
          gender: true,
          department: true,
          position: true,
          phone: true,
          nationalId: true,
          nssfNo: true,
          photoUrl: true,
        },
        orderBy: { employeeId: 'asc' },
      }),
      prisma.clinicVisit.findMany({
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
              department: true,
              position: true,
              phone: true,
            },
          },
        },
        orderBy: { visitDate: 'desc' },
        take: 300,
      }),
      prisma.workplaceIncident.findMany({
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
              department: true,
              position: true,
              phone: true,
              nssfNo: true,
            },
          },
        },
        orderBy: { incidentDate: 'desc' },
        take: 200,
      }),
      prisma.annualHealthCheckup.findMany({
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
              department: true,
              position: true,
            },
          },
        },
        orderBy: { checkupDate: 'desc' },
        take: 300,
      }),
    ]);

    // Computed Stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyVisits = clinicVisits.filter((v) => {
      const d = new Date(v.visitDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const restInBedCount = monthlyVisits.filter((v) => v.restMinutes > 0).length;
    const referredHospitalCount = monthlyVisits.filter((v) => v.referredHospital).length;

    const totalDaysLost = incidents.reduce((sum, inc) => sum + (inc.daysLost || 0), 0);
    const nssfClaimsPending = incidents.filter((inc) => inc.nssfClaimed && inc.nssfStatus === 'PENDING').length;
    const nssfClaimsApproved = incidents.filter((inc) => inc.nssfClaimed && (inc.nssfStatus === 'APPROVED' || inc.nssfStatus === 'PAID')).length;
    const totalNssfCompKhr = incidents.reduce((sum, inc) => sum + (inc.nssfCompensationKhr || 0), 0);

    const fitCount = checkups.filter((c) => c.fitStatus === 'FIT').length;
    const fitRate = checkups.length > 0 ? Math.round((fitCount / checkups.length) * 100) : 100;

    return {
      success: true,
      employees,
      clinicVisits,
      incidents,
      checkups,
      stats: {
        totalVisitsThisMonth: monthlyVisits.length,
        allTimeVisits: clinicVisits.length,
        restInBedCount,
        referredHospitalCount,
        totalIncidents: incidents.length,
        totalDaysLost,
        nssfClaimsPending,
        nssfClaimsApproved,
        totalNssfCompKhr,
        totalCheckups: checkups.length,
        fitRate,
      },
    };
  } catch (error: any) {
    console.error('Error in getEhsDashboardData:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 1. CLINIC VISIT CRUD
// ==========================================

export async function createClinicVisit(formData: {
  employeeId: string;
  visitDate?: Date | string;
  symptoms: string;
  temperature?: number | null;
  bloodPressure?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  medicineDispensed?: string | null;
  restMinutes?: number;
  sendHome?: boolean;
  referredHospital?: boolean;
  hospitalName?: string | null;
  attendantName?: string | null;
  notes?: string | null;
}) {
  try {
    const totalCount = await prisma.clinicVisit.count();
    const visitNumber = generateCode('CLN', totalCount);

    const visit = await prisma.clinicVisit.create({
      data: {
        visitNumber,
        employeeId: formData.employeeId,
        visitDate: formData.visitDate ? new Date(formData.visitDate) : new Date(),
        symptoms: formData.symptoms.trim(),
        temperature: formData.temperature ? Number(formData.temperature) : null,
        bloodPressure: formData.bloodPressure?.trim() || null,
        diagnosis: formData.diagnosis?.trim() || null,
        treatment: formData.treatment?.trim() || null,
        medicineDispensed: formData.medicineDispensed?.trim() || null,
        restMinutes: Number(formData.restMinutes || 0),
        sendHome: Boolean(formData.sendHome),
        referredHospital: Boolean(formData.referredHospital),
        hospitalName: formData.hospitalName?.trim() || null,
        attendantName: formData.attendantName?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
      include: { employee: true },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, visit };
  } catch (error: any) {
    console.error('Error creating clinic visit:', error);
    return { success: false, error: error.message };
  }
}

export async function updateClinicVisit(
  id: string,
  formData: {
    symptoms?: string;
    temperature?: number | null;
    bloodPressure?: string | null;
    diagnosis?: string | null;
    treatment?: string | null;
    medicineDispensed?: string | null;
    restMinutes?: number;
    sendHome?: boolean;
    referredHospital?: boolean;
    hospitalName?: string | null;
    attendantName?: string | null;
    notes?: string | null;
  }
) {
  try {
    const visit = await prisma.clinicVisit.update({
      where: { id },
      data: {
        symptoms: formData.symptoms?.trim(),
        temperature: formData.temperature !== undefined ? (formData.temperature ? Number(formData.temperature) : null) : undefined,
        bloodPressure: formData.bloodPressure?.trim() || null,
        diagnosis: formData.diagnosis?.trim() || null,
        treatment: formData.treatment?.trim() || null,
        medicineDispensed: formData.medicineDispensed?.trim() || null,
        restMinutes: formData.restMinutes !== undefined ? Number(formData.restMinutes) : undefined,
        sendHome: formData.sendHome,
        referredHospital: formData.referredHospital,
        hospitalName: formData.hospitalName?.trim() || null,
        attendantName: formData.attendantName?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, visit };
  } catch (error: any) {
    console.error('Error updating clinic visit:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteClinicVisit(id: string) {
  try {
    await prisma.clinicVisit.delete({ where: { id } });
    revalidatePath('/dashboard/ehs');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting clinic visit:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. WORKPLACE INCIDENT CRUD
// ==========================================

export async function createWorkplaceIncident(formData: {
  employeeId: string;
  incidentDate: Date | string;
  incidentTime?: string | null;
  location: string;
  severity: string;
  injuryType: string;
  bodyPart?: string | null;
  description: string;
  rootCause?: string | null;
  correctiveAction?: string | null;
  daysLost?: number;
  nssfClaimed?: boolean;
  nssfCaseNo?: string | null;
  nssfStatus?: string;
  nssfCompensationKhr?: number;
  status?: string;
  reportedBy?: string | null;
  investigatedBy?: string | null;
  notes?: string | null;
}) {
  try {
    const totalCount = await prisma.workplaceIncident.count();
    const incidentNumber = generateCode('INC', totalCount);

    const incident = await prisma.workplaceIncident.create({
      data: {
        incidentNumber,
        employeeId: formData.employeeId,
        incidentDate: new Date(formData.incidentDate),
        incidentTime: formData.incidentTime?.trim() || null,
        location: formData.location.trim(),
        severity: formData.severity || 'MINOR',
        injuryType: formData.injuryType.trim(),
        bodyPart: formData.bodyPart?.trim() || null,
        description: formData.description.trim(),
        rootCause: formData.rootCause?.trim() || null,
        correctiveAction: formData.correctiveAction?.trim() || null,
        daysLost: Number(formData.daysLost || 0),
        nssfClaimed: Boolean(formData.nssfClaimed),
        nssfCaseNo: formData.nssfCaseNo?.trim() || null,
        nssfStatus: formData.nssfStatus || 'NOT_FILED',
        nssfCompensationKhr: Number(formData.nssfCompensationKhr || 0),
        status: formData.status || 'OPEN',
        reportedBy: formData.reportedBy?.trim() || null,
        investigatedBy: formData.investigatedBy?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
      include: { employee: true },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, incident };
  } catch (error: any) {
    console.error('Error creating workplace incident:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkplaceIncident(
  id: string,
  formData: {
    location?: string;
    severity?: string;
    injuryType?: string;
    bodyPart?: string | null;
    description?: string;
    rootCause?: string | null;
    correctiveAction?: string | null;
    daysLost?: number;
    status?: string;
    reportedBy?: string | null;
    investigatedBy?: string | null;
    notes?: string | null;
  }
) {
  try {
    const incident = await prisma.workplaceIncident.update({
      where: { id },
      data: {
        location: formData.location?.trim(),
        severity: formData.severity,
        injuryType: formData.injuryType?.trim(),
        bodyPart: formData.bodyPart?.trim() || null,
        description: formData.description?.trim(),
        rootCause: formData.rootCause?.trim() || null,
        correctiveAction: formData.correctiveAction?.trim() || null,
        daysLost: formData.daysLost !== undefined ? Number(formData.daysLost) : undefined,
        status: formData.status,
        reportedBy: formData.reportedBy?.trim() || null,
        investigatedBy: formData.investigatedBy?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, incident };
  } catch (error: any) {
    console.error('Error updating workplace incident:', error);
    return { success: false, error: error.message };
  }
}

export async function updateIncidentNssfStatus(
  id: string,
  nssfData: {
    nssfClaimed: boolean;
    nssfCaseNo?: string | null;
    nssfStatus: string;
    nssfCompensationKhr?: number;
  }
) {
  try {
    const incident = await prisma.workplaceIncident.update({
      where: { id },
      data: {
        nssfClaimed: Boolean(nssfData.nssfClaimed),
        nssfCaseNo: nssfData.nssfCaseNo?.trim() || null,
        nssfStatus: nssfData.nssfStatus,
        nssfCompensationKhr: Number(nssfData.nssfCompensationKhr || 0),
      },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, incident };
  } catch (error: any) {
    console.error('Error updating incident NSSF status:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorkplaceIncident(id: string) {
  try {
    await prisma.workplaceIncident.delete({ where: { id } });
    revalidatePath('/dashboard/ehs');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workplace incident:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 3. ANNUAL HEALTH CHECKUP CRUD
// ==========================================

export async function createHealthCheckup(formData: {
  employeeId: string;
  checkupYear?: number;
  checkupDate?: Date | string;
  clinicName?: string;
  healthBookNumber?: string | null;
  hasCertificate?: boolean;
  fitStatus?: string;
  bloodPressure?: string | null;
  vision?: string | null;
  chestXray?: string | null;
  doctorComments?: string | null;
}) {
  try {
    const checkup = await prisma.annualHealthCheckup.create({
      data: {
        employeeId: formData.employeeId,
        checkupYear: Number(formData.checkupYear || new Date().getFullYear()),
        checkupDate: formData.checkupDate ? new Date(formData.checkupDate) : new Date(),
        clinicName: formData.clinicName?.trim() || 'មន្ទីរពេទ្យបង្អែក / ពេទ្យការងារ',
        healthBookNumber: formData.healthBookNumber?.trim() || null,
        hasCertificate: formData.hasCertificate !== undefined ? Boolean(formData.hasCertificate) : true,
        fitStatus: formData.fitStatus || 'FIT',
        bloodPressure: formData.bloodPressure?.trim() || null,
        vision: formData.vision?.trim() || null,
        chestXray: formData.chestXray?.trim() || null,
        doctorComments: formData.doctorComments?.trim() || null,
      },
      include: { employee: true },
    });

    revalidatePath('/dashboard/ehs');
    return { success: true, checkup };
  } catch (error: any) {
    console.error('Error creating health checkup:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteHealthCheckup(id: string) {
  try {
    await prisma.annualHealthCheckup.delete({ where: { id } });
    revalidatePath('/dashboard/ehs');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting health checkup:', error);
    return { success: false, error: error.message };
  }
}
