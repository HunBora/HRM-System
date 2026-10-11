import { prisma } from '@/lib/prisma';

export interface RecordAuditParams {
  action: string; // CREATE, UPDATE, DELETE, LOGIN, EXPORT_EXCEL, PAYROLL_RUN, APPROVE, REJECT
  module: string; // EMPLOYEES, PAYROLL, LOANS, ATTENDANCE, LEAVE, DISCIPLINARY, USERS, SETTINGS, BIOMETRIC
  userId?: string;
  userName?: string;
  userRole?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string; // SUCCESS, WARNING, FAILED
}

export async function recordAudit(params: RecordAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        module: params.module,
        userId: params.userId || null,
        userName: params.userName || 'System User',
        userRole: params.userRole || 'ADMIN',
        targetId: params.targetId || null,
        targetName: params.targetName || null,
        details: params.details || null,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'HRM Web Client',
        status: params.status || 'SUCCESS',
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}
