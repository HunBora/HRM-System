'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface DelegateeItem {
  employeeId: string;
  nameKh: string;
  nameEn: string;
  position: string;
  department: string;
  phone: string;
  scopeOfWork: string;
  nationalId?: string;
  gender?: string;
  dob?: string;
  financialLimit?: string;
  specificTasks?: string;
}

export interface DelegationRecord {
  id: string;
  refNo: string;
  delegatorId: string;
  delegator: {
    id: string;
    employeeId: string;
    firstNameKh?: string;
    lastNameKh?: string;
    firstNameEn?: string;
    lastNameEn?: string;
    gender?: string;
    dob?: string | Date;
    nationalId?: string;
    position?: string;
    department?: string;
    phone?: string;
    photoUrl?: string;
  };
  reasonType: string;
  reasonDetail?: string;
  missionLocation?: string;
  startDate: string | Date;
  endDate: string | Date;
  totalDays: number;
  delegateesJson: string;
  canApproveLeave: boolean;
  canApproveOt: boolean;
  canSignDailyReports: boolean;
  canApproveExpense: boolean;
  maxExpenseAmount?: number | null;
  canManageOperations: boolean;
  canCoordinateClients: boolean;
  canAccessKeysStamps: boolean;
  restrictions?: string;
  handoverItems?: string;
  notes?: string;
  templateStyle: string;
  status: string;
  approvedByDeptHead?: string;
  approvedByManagement?: string;
  createdAt: string | Date;
}

const REASON_LABELS: Record<string, { labelKh: string; labelEn: string; icon: string }> = {
  MISSION: { labelKh: 'បេសកកម្មការងារ', labelEn: 'Business Mission', icon: '✈️' },
  LEAVE: { labelKh: 'ឈប់សម្រាកប្រចាំឆ្នាំ/ពិសេស', labelEn: 'Annual / Special Leave', icon: '🏖️' },
  SICK: { labelKh: 'សម្រាកព្យាបាលជំងឺ', labelEn: 'Medical / Sick Leave', icon: '🏥' },
  TRAINING: { labelKh: 'វគ្គបណ្តុះបណ្តាល', labelEn: 'Training / Workshop', icon: '🎓' },
  OTHER: { labelKh: 'ផ្សេងៗ', labelEn: 'Other Reasons', icon: '📝' }
};

const SCOPE_SUGGESTIONS = [
  'គ្រប់គ្រងផ្នែកផលិតកម្ម និងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃ',
  'ពិនិត្យ និងចុះហត្ថលេខាលើឯកសាររដ្ឋបាល និងច្បាប់ឈប់សម្រាក',
  'ទំនាក់ទំនង និងសម្របសម្រួលជាមួយអតិថិជន និងអ្នកផ្គត់ផ្គង់',
  'គ្រប់គ្រងការងារឃ្លាំង សម្ភារៈ និងស្តុកទំនិញ',
  'គ្រប់គ្រងការងារហិរញ្ញវត្ថុ និងចំណាយបន្ទាន់តាមការកំណត់',
  'សម្របសម្រួលការងារបច្ចេកទេស និងដោះស្រាយបញ្ហាម៉ាស៊ីនបន្ទាន់'
];

export function EmployeeCombobox({
  employees,
  selectedId,
  onSelect,
  placeholder = '🔍 ស្វែងរកតាម ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី...',
  label,
  required = false
}: {
  employees: any[];
  selectedId?: string;
  onSelect: (emp: any) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.id === selectedId || e.employeeId === selectedId);
  }, [employees, selectedId]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees.slice(0, 30);
    return employees
      .filter((emp) => {
        const nameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.toLowerCase();
        const nameEn = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.toLowerCase();
        const empId = (emp.employeeId || '').toLowerCase();
        const natId = (emp.nationalId || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        const pos = (emp.position || '').toLowerCase();
        const phone = (emp.phone || '').toLowerCase();

        return (
          nameKh.includes(q) ||
          nameEn.includes(q) ||
          empId.includes(q) ||
          natId.includes(q) ||
          dept.includes(q) ||
          pos.includes(q) ||
          phone.includes(q)
        );
      })
      .slice(0, 40);
  }, [employees, searchTerm]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      {selectedEmp ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #93c5fd',
            borderRadius: '8px',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            {selectedEmp.photoUrl ? (
              <img
                src={selectedEmp.photoUrl}
                alt="Avatar"
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0
                }}
              >
                {selectedEmp.lastNameKh?.charAt(0) || selectedEmp.firstNameEn?.charAt(0) || 'E'}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedEmp.lastNameKh} {selectedEmp.firstNameKh} ({selectedEmp.firstNameEn} {selectedEmp.lastNameEn})
              </div>
              <div style={{ fontSize: '11px', color: '#1d4ed8', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  🆔 {selectedEmp.employeeId}
                </span>
                <span style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '4px' }}>
                  💼 {selectedEmp.position}
                </span>
                <span style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '4px' }}>
                  🏢 {selectedEmp.department}
                </span>
                {selectedEmp.nationalId && (
                  <span style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    🪪 អត្តសញ្ញាណ: {selectedEmp.nationalId}
                  </span>
                )}
                {selectedEmp.phone && (
                  <span style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: '4px' }}>
                    📞 {selectedEmp.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(true);
            }}
            style={{
              padding: '5px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              color: '#2563eb',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            🔄 ផ្លាស់ប្តូរ (Change)
          </button>
        </div>
      ) : (
        <div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            >
              🔍
            </span>
          </div>
        </div>
      )}

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 120 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              maxHeight: '260px',
              overflowY: 'auto',
              zIndex: 130
            }}
          >
            <div style={{ padding: '6px 10px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              💡 ស្វែងរកតាម ឈ្មោះ, អត្តលេខ, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី ({filtered.length} លទ្ធផល)
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                រកមិនឃើញបុគ្គលិកត្រូវនឹង &quot;{searchTerm}&quot; ឡើយ
              </div>
            ) : (
              filtered.map((emp) => {
                const nameKh = `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn;
                const nameEn = `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim();
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onSelect(emp);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.12s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt="Photo"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}
                      >
                        {emp.lastNameKh?.charAt(0) || emp.firstNameEn?.charAt(0) || 'E'}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                          {nameKh}
                        </span>
                        {nameEn && (
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            ({nameEn})
                          </span>
                        )}
                        <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          ID: {emp.employeeId}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span>💼 {emp.position || 'គ្មានមុខតំណែង'}</span>
                        <span>•</span>
                        <span>🏢 {emp.department || 'គ្មានផ្នែក'}</span>
                        {emp.nationalId && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#0369a1', fontWeight: 600 }}>🪪 {emp.nationalId}</span>
                          </>
                        )}
                        {emp.phone && (
                          <>
                            <span>•</span>
                            <span>📞 {emp.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DelegationClient({
  initialDelegations,
  employees,
  settings,
  userRole
}: {
  initialDelegations: any[];
  employees: any[];
  settings?: any;
  userRole?: string;
}) {
  const [delegations, setDelegations] = useState<DelegationRecord[]>(initialDelegations);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDelegation, setPreviewDelegation] = useState<DelegationRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'standard' | 'formal-letter' | 'mission'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Form Fields State
  const [formDelegatorId, setFormDelegatorId] = useState('');
  const [formReasonType, setFormReasonType] = useState('MISSION');
  const [formReasonDetail, setFormReasonDetail] = useState('');
  const [formMissionLocation, setFormMissionLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDelegatees, setFormDelegatees] = useState<DelegateeItem[]>([
    {
      employeeId: '',
      nameKh: '',
      nameEn: '',
      position: '',
      department: '',
      phone: '',
      scopeOfWork: 'គ្រប់គ្រងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃ និងសម្របសម្រួលការងារទូទៅ'
    }
  ]);
  const [formCanApproveLeave, setFormCanApproveLeave] = useState(true);
  const [formCanApproveOt, setFormCanApproveOt] = useState(true);
  const [formCanSignDailyReports, setFormCanSignDailyReports] = useState(true);
  const [formCanApproveExpense, setFormCanApproveExpense] = useState(false);
  const [formMaxExpenseAmount, setFormMaxExpenseAmount] = useState('');
  const [formCanManageOperations, setFormCanManageOperations] = useState(true);
  const [formCanCoordinateClients, setFormCanCoordinateClients] = useState(false);
  const [formCanAccessKeysStamps, setFormCanAccessKeysStamps] = useState(false);
  const [formRestrictions, setFormRestrictions] = useState(
    'មិនត្រូវបានអនុញ្ញាតឱ្យបញ្ឈប់បុគ្គលិកពីការងារ, ចុះកិច្ចសន្យារយៈពេលវែង ឬធ្វើការសម្រេចចិត្តហិរញ្ញវត្ថុលើសពីកម្រិតកំណត់ដោយគ្មានការយល់ព្រមពីថ្នាក់ដឹកនាំឡើយ។'
  );
  const [formHandoverItems, setFormHandoverItems] = useState('ត្រាក្រុមហ៊ុន (Company Stamp), កូនសោរការិយាល័យ (Keys), ឯកសារប្រតិបត្តិការ');
  const [formNotes, setFormNotes] = useState('');
  const [formTemplateStyle, setFormTemplateStyle] = useState('standard');
  const [formApprovedByDeptHead, setFormApprovedByDeptHead] = useState('ប្រធានផ្នែក (Department Head)');
  const [formApprovedByManagement, setFormApprovedByManagement] = useState('អគ្គនាយក / នាយកធនធានមនុស្ស (General Manager / HR Director)');

  // Selected delegator object
  const selectedDelegator = useMemo(() => {
    return employees.find((e) => e.id === formDelegatorId);
  }, [employees, formDelegatorId]);

  // Total days calculation in form
  const formTotalDays = useMemo(() => {
    if (!formStartDate || !formEndDate) return 1;
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formStartDate, formEndDate]);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormDelegatorId('');
    setFormReasonType('MISSION');
    setFormReasonDetail('');
    setFormMissionLocation('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    setFormEndDate(nextWeek.toISOString().split('T')[0]);
    setFormDelegatees([
      {
        employeeId: '',
        nameKh: '',
        nameEn: '',
        position: '',
        department: '',
        phone: '',
        scopeOfWork: 'គ្រប់គ្រងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃ និងសម្របសម្រួលការងារទូទៅ'
      }
    ]);
    setFormCanApproveLeave(true);
    setFormCanApproveOt(true);
    setFormCanSignDailyReports(true);
    setFormCanApproveExpense(false);
    setFormMaxExpenseAmount('');
    setFormCanManageOperations(true);
    setFormCanCoordinateClients(false);
    setFormCanAccessKeysStamps(false);
    setFormRestrictions(
      'មិនត្រូវបានអនុញ្ញាតឱ្យបញ្ឈប់បុគ្គលិកពីការងារ, ចុះកិច្ចសន្យារយៈពេលវែង ឬធ្វើការសម្រេចចិត្តហិរញ្ញវត្ថុលើសពីកម្រិតកំណត់ដោយគ្មានការយល់ព្រមពីថ្នាក់ដឹកនាំឡើយ។'
    );
    setFormHandoverItems('ត្រាក្រុមហ៊ុន (Company Stamp), កូនសោរការិយាល័យ (Keys), ឯកសារប្រតិបត្តិការ');
    setFormNotes('');
    setFormTemplateStyle('standard');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (d: DelegationRecord) => {
    setEditingId(d.id);
    setFormDelegatorId(d.delegatorId);
    setFormReasonType(d.reasonType || 'MISSION');
    setFormReasonDetail(d.reasonDetail || '');
    setFormMissionLocation(d.missionLocation || '');
    setFormStartDate(new Date(d.startDate).toISOString().split('T')[0]);
    setFormEndDate(new Date(d.endDate).toISOString().split('T')[0]);
    try {
      const parsed = JSON.parse(d.delegateesJson);
      setFormDelegatees(Array.isArray(parsed) && parsed.length > 0 ? parsed : [
        {
          employeeId: '',
          nameKh: '',
          nameEn: '',
          position: '',
          department: '',
          phone: '',
          scopeOfWork: ''
        }
      ]);
    } catch {
      setFormDelegatees([]);
    }
    setFormCanApproveLeave(d.canApproveLeave);
    setFormCanApproveOt(d.canApproveOt);
    setFormCanSignDailyReports(d.canSignDailyReports);
    setFormCanApproveExpense(d.canApproveExpense);
    setFormMaxExpenseAmount(d.maxExpenseAmount ? String(d.maxExpenseAmount) : '');
    setFormCanManageOperations(d.canManageOperations);
    setFormCanCoordinateClients(d.canCoordinateClients);
    setFormCanAccessKeysStamps(d.canAccessKeysStamps);
    setFormRestrictions(d.restrictions || '');
    setFormHandoverItems(d.handoverItems || '');
    setFormNotes(d.notes || '');
    setFormTemplateStyle(d.templateStyle || 'standard');
    setFormApprovedByDeptHead(d.approvedByDeptHead || '');
    setFormApprovedByManagement(d.approvedByManagement || '');
    setIsModalOpen(true);
  };

  // Quick Preset for delegatees count
  const handleSetDelegateeCount = (count: number) => {
    const current = [...formDelegatees];
    if (current.length < count) {
      while (current.length < count) {
        const idx = current.length + 1;
        const defaultScope =
          idx === 2
            ? 'ពិនិត្យ និងចុះហត្ថលេខាលើឯកសាររដ្ឋបាល និងច្បាប់ឈប់សម្រាក'
            : idx === 3
            ? 'ទំនាក់ទំនង និងសម្របសម្រួលជាមួយអតិថិជន និងអ្នកផ្គត់ផ្គង់'
            : 'សម្របសម្រួលការងារទូទៅប្រចាំថ្ងៃ';
        current.push({
          employeeId: '',
          nameKh: '',
          nameEn: '',
          position: '',
          department: '',
          phone: '',
          scopeOfWork: defaultScope
        });
      }
    } else if (current.length > count) {
      current.splice(count);
    }
    setFormDelegatees(current);
  };

  // Add one more delegatee
  const handleAddDelegatee = () => {
    const idx = formDelegatees.length + 1;
    setFormDelegatees([
      ...formDelegatees,
      {
        employeeId: '',
        nameKh: '',
        nameEn: '',
        position: '',
        department: '',
        phone: '',
        scopeOfWork: `កិច្ចការទទួលខុសត្រូវទី ${idx}`
      }
    ]);
  };

  // Remove delegatee
  const handleRemoveDelegatee = (index: number) => {
    if (formDelegatees.length <= 1) return;
    const next = [...formDelegatees];
    next.splice(index, 1);
    setFormDelegatees(next);
  };

  // Select delegatee via auto-complete
  const handleSelectDelegateeEmployee = (index: number, emp: any) => {
    const next = [...formDelegatees];
    next[index] = {
      ...next[index],
      employeeId: emp.employeeId,
      nameKh: `${emp.lastNameKh || ''} ${emp.firstNameKh || ''}`.trim() || emp.firstNameEn,
      nameEn: `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim(),
      position: emp.position || '',
      department: emp.department || '',
      phone: emp.phone || '',
      nationalId: emp.nationalId || '',
      gender: emp.gender === 'FEMALE' || emp.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស',
      dob: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : ''
    };
    setFormDelegatees(next);
  };

  // Update delegatee field
  const handleUpdateDelegatee = (index: number, field: keyof DelegateeItem, value: any) => {
    const next = [...formDelegatees];
    next[index] = { ...next[index], [field]: value };
    // If employeeId changed, auto-fill name, position, dept, phone, nationalId
    if (field === 'employeeId') {
      const found = employees.find((e) => e.id === value || e.employeeId === value);
      if (found) {
        next[index].employeeId = found.employeeId;
        next[index].nameKh = `${found.lastNameKh || ''} ${found.firstNameKh || ''}`.trim() || found.firstNameEn;
        next[index].nameEn = `${found.firstNameEn || ''} ${found.lastNameEn || ''}`.trim();
        next[index].position = found.position || '';
        next[index].department = found.department || '';
        next[index].phone = found.phone || '';
        next[index].nationalId = found.nationalId || '';
        next[index].gender = found.gender === 'FEMALE' || found.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស';
        next[index].dob = found.dob ? new Date(found.dob).toLocaleDateString('en-GB') : '';
      }
    }
    setFormDelegatees(next);
  };

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDelegatorId) {
      alert('សូមជ្រើសរើសបុគ្គលិកដែលជាអ្នកផ្ទេរសិទ្ធិ (Delegator)');
      return;
    }
    if (!formStartDate || !formEndDate) {
      alert('សូមបញ្ជាក់កាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់');
      return;
    }
    if (formDelegatees.length === 0 || !formDelegatees[0].employeeId) {
      alert('សូមជ្រើសរើសអ្នកទទួលសិទ្ធិយ៉ាងហោចណាស់ ១ នាក់');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        delegatorId: formDelegatorId,
        reasonType: formReasonType,
        reasonDetail: formReasonDetail,
        missionLocation: formMissionLocation,
        startDate: formStartDate,
        endDate: formEndDate,
        delegatees: formDelegatees,
        canApproveLeave: formCanApproveLeave,
        canApproveOt: formCanApproveOt,
        canSignDailyReports: formCanSignDailyReports,
        canApproveExpense: formCanApproveExpense,
        maxExpenseAmount: formCanApproveExpense && formMaxExpenseAmount ? Number(formMaxExpenseAmount) : null,
        canManageOperations: formCanManageOperations,
        canCoordinateClients: formCanCoordinateClients,
        canAccessKeysStamps: formCanAccessKeysStamps,
        restrictions: formRestrictions,
        handoverItems: formHandoverItems,
        notes: formNotes,
        templateStyle: formTemplateStyle,
        approvedByDeptHead: formApprovedByDeptHead,
        approvedByManagement: formApprovedByManagement
      };

      const url = editingId ? `/api/delegations/${editingId}` : '/api/delegations';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'បរាជ័យក្នុងការរក្សាទុក');
      }

      const resData = await res.json();
      const savedItem = resData.delegation;

      if (editingId) {
        setDelegations((prev) => prev.map((d) => (d.id === editingId ? savedItem : d)));
      } else {
        setDelegations((prev) => [savedItem, ...prev]);
      }

      setIsModalOpen(false);
      // Open preview directly
      setPreviewDelegation(savedItem);
      setSelectedTemplate((savedItem.templateStyle as any) || 'standard');
      setIsPreviewOpen(true);
    } catch (err: any) {
      alert(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Delegation
  const handleDelete = async (id: string, refNo: string) => {
    if (!confirm(`តើលោកអ្នកពិតជាចង់លុបលិខិតផ្ទេរសិទ្ធិលេខ ${refNo} នេះមែនទេ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/delegations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('បរាជ័យក្នុងការលុប');
      setDelegations((prev) => prev.filter((d) => d.id !== id));
      if (previewDelegation?.id === id) {
        setIsPreviewOpen(false);
        setPreviewDelegation(null);
      }
    } catch (err: any) {
      alert(err.message || 'មិនអាចលុបបាន');
    }
  };

  // Filtered Delegations
  const filteredDelegations = useMemo(() => {
    return delegations.filter((d) => {
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchReason = reasonFilter === 'ALL' || d.reasonType === reasonFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchStatus && matchReason;

      const dNameKh = `${d.delegator?.lastNameKh || ''} ${d.delegator?.firstNameKh || ''}`.toLowerCase();
      const dNameEn = `${d.delegator?.firstNameEn || ''} ${d.delegator?.lastNameEn || ''}`.toLowerCase();
      const dEmpId = (d.delegator?.employeeId || '').toLowerCase();
      const dRef = (d.refNo || '').toLowerCase();
      const dLoc = (d.missionLocation || '').toLowerCase();
      const dJson = (d.delegateesJson || '').toLowerCase();

      const matchQ =
        dRef.includes(q) ||
        dNameKh.includes(q) ||
        dNameEn.includes(q) ||
        dEmpId.includes(q) ||
        dLoc.includes(q) ||
        dJson.includes(q);

      return matchStatus && matchReason && matchQ;
    });
  }, [delegations, statusFilter, reasonFilter, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = delegations.length;
    const active = delegations.filter((d) => d.status === 'ACTIVE').length;
    const mission = delegations.filter((d) => d.reasonType === 'MISSION').length;
    const leave = delegations.filter((d) => d.reasonType === 'LEAVE' || d.reasonType === 'SICK').length;
    return { total, active, mission, leave };
  }, [delegations]);

  // Export PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const printEl = document.getElementById('doa-print-document');
      if (!printEl) throw new Error('រកមិនឃើញផ្ទាំងឯកសារបោះពុម្ព');

      const canvas = await html2canvas(printEl, {
        scale: 2.8,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`DOA_${previewDelegation?.refNo || 'Delegation'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('មានបញ្ហាក្នុងការទាញយក PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const companyName = settings?.companyName || 'G.S TEXTILE GARMENT (CAMBODIA) CO., LTD.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '16px' }}>
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #doa-print-document, #doa-print-document * {
            visibility: visible !important;
          }
          #doa-print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Top Banner Header */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--card-bg, #ffffff)',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}
          >
            🤝
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }} className="kh-text">
              លិខិតផ្ទេរសិទ្ធិ និងប្រគល់ការងារ (Delegation of Authority - DOA)
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0 0' }}>
              គ្រប់គ្រងការប្រគល់សិទ្ធិពេលបុគ្គលិកចេញបេសកកម្ម ឬទៅយូរថ្ងៃ • អាចប្រគល់ជូន ១នាក់ ទៅ ៣នាក់ ឬច្រើននាក់ • Format ស្តង់ដារ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
          }}
        >
          <span>➕</span>
          <span>បង្កើតលិខិតផ្ទេរសិទ្ធិថ្មី (New DOA)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#eff6ff' }}>📄</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>លិខិតសរុប (Total)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#ecfdf5' }}>🟢</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 600 }}>កំពុងមានសុពលភាព (Active)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#fef3c7' }}>✈️</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600 }}>បេសកកម្មការងារ (Missions)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>{stats.mission}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#f3e8ff' }}>🏖️</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6b21a8', fontWeight: 600 }}>ឈប់សម្រាកយូរថ្ងៃ (On Leave)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#581c87' }}>{stats.leave}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="no-print"
        style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 ស្វែងរកតាមលេខ Ref, ឈ្មោះអ្នកផ្ទេរ/ទទួល, ទីតាំង..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '320px'
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">ស្ថានភាពទាំងអស់ (All Status)</option>
            <option value="ACTIVE">🟢 កំពុងមានសុពលភាព (Active)</option>
            <option value="COMPLETED">⚪ បានបញ្ចប់ (Completed)</option>
            <option value="CANCELLED">🔴 បានបោះបង់ (Cancelled)</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">មូលហេតុទាំងអស់ (All Types)</option>
            <option value="MISSION">✈️ បេសកកម្មការងារ (Mission)</option>
            <option value="LEAVE">🏖️ ឈប់សម្រាកប្រចាំឆ្នាំ (Leave)</option>
            <option value="SICK">🏥 សម្រាកព្យាបាល (Sick)</option>
            <option value="TRAINING">🎓 វគ្គបណ្តុះបណ្តាល (Training)</option>
            <option value="OTHER">📝 ផ្សេងៗ (Other)</option>
          </select>
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          បង្ហាញ <strong>{filteredDelegations.length}</strong> / <strong>{delegations.length}</strong> លិខិត
        </div>
      </div>

      {/* Main Delegations Table */}
      <div
        className="no-print"
        style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>លេខយោង (Ref No)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>អ្នកផ្ទេរសិទ្ធិ (Delegator)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>មូលហេតុ & ទីតាំង</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>កាលបរិច្ឆេទ & រយៈពេល</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>អ្នកទទួលសិទ្ធិ (Delegatees)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>ស្ថានភាព</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    ពុំមានទិន្នន័យលិខិតផ្ទេរសិទ្ធិនៅឡើយទេ
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((d) => {
                  let parsedDelegatees: DelegateeItem[] = [];
                  try {
                    parsedDelegatees = JSON.parse(d.delegateesJson);
                  } catch {
                    parsedDelegatees = [];
                  }

                  const startDateStr = new Date(d.startDate).toLocaleDateString('en-GB');
                  const endDateStr = new Date(d.endDate).toLocaleDateString('en-GB');
                  const delegatorName = `${d.delegator?.lastNameKh || ''} ${d.delegator?.firstNameKh || ''}`.trim() || d.delegator?.firstNameEn;
                  const reasonInfo = REASON_LABELS[d.reasonType] || REASON_LABELS.OTHER;

                  return (
                    <tr
                      key={d.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>
                        <span style={{ backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {d.refNo}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {d.delegator?.photoUrl ? (
                            <img
                              src={d.delegator.photoUrl}
                              alt="Photo"
                              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                              {delegatorName?.charAt(0) || 'D'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }} className="kh-text">
                              {delegatorName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.delegator?.employeeId} • {d.delegator?.position}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#1e293b' }}>
                          <span>{reasonInfo.icon}</span>
                          <span className="kh-text">{reasonInfo.labelKh}</span>
                        </div>
                        {d.missionLocation && (
                          <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>
                            📍 {d.missionLocation}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {startDateStr} - {endDateStr}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                          ⏱️ សរុប {d.totalDays} ថ្ងៃ
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#4338ca' }}>
                            👥 {parsedDelegatees.length} នាក់ទទួលសិទ្ធិ:
                          </div>
                          {parsedDelegatees.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '11px',
                                backgroundColor: '#f5f3ff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd6fe',
                                color: '#5b21b6'
                              }}
                            >
                              <strong>{idx + 1}. {item.nameKh || item.nameEn}</strong> ({item.position})
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {d.status === 'ACTIVE' ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            ● កំពុងអនុវត្ត
                          </span>
                        ) : d.status === 'COMPLETED' ? (
                          <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            ✓ បានបញ្ចប់
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            ✕ បានបោះបង់
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDelegation(d);
                              setSelectedTemplate((d.templateStyle as any) || 'standard');
                              setIsPreviewOpen(true);
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="មើល & បោះពុម្ពទម្រង់"
                          >
                            <span>🖨️</span>
                            <span>បោះពុម្ព</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="កែប្រែ"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(d.id, d.refNo)}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="លុប"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1e293b' }} className="kh-text">
                  {editingId ? '✏️ កែប្រែលិខិតផ្ទេរសិទ្ធិ (Edit Delegation)' : '➕ បង្កើតលិខិតផ្ទេរសិទ្ធិថ្មី (New Delegation Form)'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  កំណត់អ្នកផ្ទេរសិទ្ធិ មូលហេតុ និងអ្នកទទួលសិទ្ធិ (១នាក់ ទៅច្រើននាក់) ព្រមទាំងវិសាលភាពភារកិច្ច
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* SECTION 1: DELEGATOR */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e3a8a' }}>
                    👤 ភាគីអ្នកផ្ទេរសិទ្ធិ (Delegator / 授权人) - ស្វែងរក & បំពេញអូតូ៖
                  </div>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    ⚡ បំពេញអូតូតាម ឈ្មោះ, អត្តលេខ, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី
                  </span>
                </div>

                <EmployeeCombobox
                  employees={employees}
                  selectedId={formDelegatorId}
                  onSelect={(emp) => setFormDelegatorId(emp.id)}
                  placeholder="🔍 វាយបញ្ចូល ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី ដើម្បីបំពេញអូតូ..."
                  required
                />
              </div>

              {/* SECTION 2: PURPOSE & PERIOD */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  🗓️ មូលហេតុ និងកាលបរិច្ឆេទផ្ទេរសិទ្ធិ (Purpose & Period):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ប្រភេទមូលហេតុ *
                    </label>
                    <select
                      value={formReasonType}
                      onChange={(e) => setFormReasonType(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="MISSION">✈️ បេសកកម្មការងារក្រៅ (Business Mission)</option>
                      <option value="LEAVE">🏖️ ឈប់សម្រាកប្រចាំឆ្នាំ (Annual Leave)</option>
                      <option value="SICK">🏥 សម្រាកព្យាបាលជំងឺ (Medical Leave)</option>
                      <option value="TRAINING">🎓 វគ្គបណ្តុះបណ្តាលក្រៅ (Training)</option>
                      <option value="OTHER">📝 ផ្សេងៗ (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ទីតាំងបេសកកម្ម / គោលដៅ
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. សាខាខេត្តសៀមរាប, ប្រទេសចិន, រោងចក្រទី២..."
                      value={formMissionLocation}
                      onChange={(e) => setFormMissionLocation(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ចាប់ពីថ្ងៃទី (From Date) *
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ដល់ថ្ងៃទី (To Date) *
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ចំនួនថ្ងៃសរុប (Total Days)
                    </label>
                    <div style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', borderRadius: '7px', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                      ⏱️ {formTotalDays} ថ្ងៃ (Days)
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    គោលបំណងនៃបេសកកម្ម ឬព័ត៌មានលម្អិត
                  </label>
                  <textarea
                    rows={2}
                    placeholder="បញ្ជាក់ពីគោលបំណង ភារកិច្ចនៃបេសកកម្ម ឬមូលហេតុនៃការផ្ទេរសិទ្ធិ..."
                    value={formReasonDetail}
                    onChange={(e) => setFormReasonDetail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* SECTION 3: DYNAMIC DELEGATEES (1 to 3+ persons) */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#312e81' }}>
                      👥 បញ្ជីអ្នកទទួលសិទ្ធិ (Delegatees - អាចកំណត់ ១ នាក់, ២-៣ នាក់ ឬច្រើននាក់):
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6366f1' }}>
                      រៀបចំអ្នកទទួលខុសត្រូវជំនួស ជាមួយភារកិច្ច និងវិសាលភាពការងារជាក់លាក់រៀងៗខ្លួន
                    </div>
                  </div>

                  {/* Preset Buttons for Quick Count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>ជ្រើសរើសចំនួនរហ័ស:</span>
                    <button
                      type="button"
                      onClick={() => handleSetDelegateeCount(1)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: formDelegatees.length === 1 ? '#4f46e5' : '#ffffff',
                        color: formDelegatees.length === 1 ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ១ នាក់
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDelegateeCount(2)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: formDelegatees.length === 2 ? '#4f46e5' : '#ffffff',
                        color: formDelegatees.length === 2 ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ២ នាក់
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDelegateeCount(3)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: formDelegatees.length === 3 ? '#4f46e5' : '#ffffff',
                        color: formDelegatees.length === 3 ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ៣ នាក់
                    </button>
                  </div>
                </div>

                {/* Delegatees List Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formDelegatees.map((del, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ backgroundColor: '#ede9fe', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                            {idx + 1}
                          </span>
                          <span>អ្នកទទួលសិទ្ធិទី {idx + 1} (Delegatee #{idx + 1})</span>
                        </div>

                        {formDelegatees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDelegatee(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            ✕ លុបចេញ
                          </button>
                        )}
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <EmployeeCombobox
                          employees={employees}
                          selectedId={del.employeeId}
                          onSelect={(emp) => handleSelectDelegateeEmployee(idx, emp)}
                          placeholder={`🔍 ស្វែងរកអ្នកទទួលសិទ្ធិទី ${idx + 1} តាម ឈ្មោះ, អត្តលេខ, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី...`}
                          label={`ជ្រើសរើស ឬស្វែងរកអ្នកទទួលសិទ្ធិទី ${idx + 1} (បំពេញអូតូ) *`}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                            លេខទូរស័ព្ទ / ទំនាក់ទំនងអំឡុងពេលជំនួស
                          </label>
                          <input
                            type="text"
                            placeholder="លេខទូរស័ព្ទ ឬ Telegram..."
                            value={del.phone}
                            onChange={(e) => handleUpdateDelegatee(idx, 'phone', e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                            វិសាលភាព & ភារកិច្ចដែលត្រូវទទួលខុសត្រូវជាក់លាក់ (Scope of Responsibility) *
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="ឧ. គ្រប់គ្រងផ្នែកផលិតកម្ម និងកិច្ចការប្រតិបត្តិការប្រចាំថ្ងៃ..."
                          value={del.scopeOfWork}
                          onChange={(e) => handleUpdateDelegatee(idx, 'scopeOfWork', e.target.value)}
                          required
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginBottom: '6px' }}
                        />

                        {/* Quick Suggestion Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {SCOPE_SUGGESTIONS.slice(0, 4).map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleUpdateDelegatee(idx, 'scopeOfWork', sug)}
                              style={{
                                fontSize: '10px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid #e0e7ff',
                                backgroundColor: '#f5f3ff',
                                color: '#4338ca',
                                cursor: 'pointer'
                              }}
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add More Delegatee Button */}
                <button
                  type="button"
                  onClick={handleAddDelegatee}
                  style={{
                    marginTop: '10px',
                    padding: '7px 14px',
                    backgroundColor: '#ffffff',
                    color: '#4f46e5',
                    border: '1.5px dashed #6366f1',
                    borderRadius: '7px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <span>➕ បន្ថែមអ្នកទទួលសិទ្ធិទៀត (+ Add Another Delegatee)</span>
                </button>
              </div>

              {/* SECTION 4: POWERS & LIMITATIONS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  ⚖️ សិទ្ធិអំណាច និងការកំណត់ព្រំដែន (Powers & Limitations):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanApproveLeave}
                      onChange={(e) => setFormCanApproveLeave(e.target.checked)}
                    />
                    <span>អនុម័តច្បាប់ឈប់សម្រាកបុគ្គលិក (Approve Leave)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanApproveOt}
                      onChange={(e) => setFormCanApproveOt(e.target.checked)}
                    />
                    <span>អនុម័តការងារថែមម៉ោង (Approve Overtime / OT)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanSignDailyReports}
                      onChange={(e) => setFormCanSignDailyReports(e.target.checked)}
                    />
                    <span>ចុះហត្ថលេខាលើរបាយការណ៍ប្រចាំថ្ងៃ (Daily Reports)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanManageOperations}
                      onChange={(e) => setFormCanManageOperations(e.target.checked)}
                    />
                    <span>គ្រប់គ្រងប្រតិបត្តិការទូទៅ (Daily Operations)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanCoordinateClients}
                      onChange={(e) => setFormCanCoordinateClients(e.target.checked)}
                    />
                    <span>សម្របសម្រួលអតិថិជន & អ្នកផ្គត់ផ្គង់ (Clients)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanAccessKeysStamps}
                      onChange={(e) => setFormCanAccessKeysStamps(e.target.checked)}
                    />
                    <span>កាន់កាប់ត្រាក្រុមហ៊ុន & កូនសោរ (Keys & Stamps)</span>
                  </label>
                </div>

                {/* Expense approval toggle & limit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '12px', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formCanApproveExpense}
                      onChange={(e) => setFormCanApproveExpense(e.target.checked)}
                    />
                    <span>សិទ្ធិអនុម័តចំណាយ ឬទិញសម្ភារៈបន្ទាន់ (Expense Approval)</span>
                  </label>

                  {formCanApproveExpense && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>កម្រិតទឹកប្រាក់អតិបរមា ($):</span>
                      <input
                        type="number"
                        placeholder="ឧ. 300"
                        value={formMaxExpenseAmount}
                        onChange={(e) => setFormMaxExpenseAmount(e.target.value)}
                        style={{ width: '100px', padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Explicit Restrictions */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    ការកំណត់ព្រំដែនសិទ្ធិ (Limitations / Explicit Restrictions)
                  </label>
                  <textarea
                    rows={2}
                    value={formRestrictions}
                    onChange={(e) => setFormRestrictions(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>

                {/* Handover Items */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    សម្ភារៈ និងទ្រព្យសម្បត្តិដែលបានប្រគល់ជូន (Handover Items / Assets)
                  </label>
                  <input
                    type="text"
                    value={formHandoverItems}
                    onChange={(e) => setFormHandoverItems(e.target.value)}
                    placeholder="ត្រាក្រុមហ៊ុន, កូនសោរ, Laptop, កាតធនាគារ..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* SECTION 5: APPROVAL SIGNERS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  ✍️ ហត្ថលេខាថ្នាក់គ្រប់គ្រងអនុម័ត (Approval Signatures):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      ប្រធានផ្នែក/អ្នកគ្រប់គ្រងផ្ទាល់ (Department Head)
                    </label>
                    <input
                      type="text"
                      value={formApprovedByDeptHead}
                      onChange={(e) => setFormApprovedByDeptHead(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      នាយកចាត់ការទូទៅ / HR Director (Management)
                    </label>
                    <input
                      type="text"
                      value={formApprovedByManagement}
                      onChange={(e) => setFormApprovedByManagement(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '14px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  បោះបង់
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 5px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isSubmitting ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក & មើលទម្រង់ពុម្ព'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT PREVIEW MODAL */}
      {isPreviewOpen && previewDelegation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
            padding: '16px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Preview Toolbar */}
            <div
              className="no-print"
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>ទម្រង់ (Template):</span>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('standard')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: selectedTemplate === 'standard' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: selectedTemplate === 'standard' ? '#eff6ff' : '#ffffff',
                    color: selectedTemplate === 'standard' ? '#1e40af' : '#475569',
                    fontSize: '12px',
                    fontWeight: selectedTemplate === 'standard' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  📋 ទម្រង់ស្តង់ដារសាជីវកម្ម (Standard DOA Form)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('formal-letter')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: selectedTemplate === 'formal-letter' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: selectedTemplate === 'formal-letter' ? '#eff6ff' : '#ffffff',
                    color: selectedTemplate === 'formal-letter' ? '#1e40af' : '#475569',
                    fontSize: '12px',
                    fontWeight: selectedTemplate === 'formal-letter' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  📜 លិខិតប្រគល់សិទ្ធិផ្លូវការ (Formal Letter)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('mission')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: selectedTemplate === 'mission' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: selectedTemplate === 'mission' ? '#eff6ff' : '#ffffff',
                    color: selectedTemplate === 'mission' ? '#1e40af' : '#475569',
                    fontSize: '12px',
                    fontWeight: selectedTemplate === 'mission' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  ✈️ បេសកកម្ម & ប្រគល់ភារកិច្ច (Field Mission)
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>🖨️</span>
                  <span>បោះពុម្ព (Print Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: isExportingPdf ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>📄</span>
                  <span>{isExportingPdf ? 'កំពុងបង្កើត PDF...' : 'ទាញយក PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Printable Document Paper (A4 Canvas) */}
            <div
              style={{
                overflowY: 'auto',
                padding: '24px',
                backgroundColor: '#94a3b8',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div
                id="doa-print-document"
                style={{
                  backgroundColor: '#ffffff',
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '16mm 18mm',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  color: '#0f172a',
                  fontFamily: "'Kantumruy Pro', 'Noto Sans Khmer', sans-serif",
                  lineHeight: '1.45',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* RENDER THE SELECTED TEMPLATE */}
                {renderDocumentContent(previewDelegation, selectedTemplate, companyName, settings)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// RENDER DOCUMENT CONTENT (STANDARD, FORMAL LETTER, MISSION)
// -------------------------------------------------------------
function renderDocumentContent(
  d: DelegationRecord,
  template: 'standard' | 'formal-letter' | 'mission',
  companyName: string,
  settings?: any
) {
  let delegatees: DelegateeItem[] = [];
  try {
    delegatees = JSON.parse(d.delegateesJson);
  } catch {
    delegatees = [];
  }

  const delegatorNameKh = `${d.delegator?.lastNameKh || ''} ${d.delegator?.firstNameKh || ''}`.trim() || d.delegator?.firstNameEn;
  const delegatorNameEn = `${d.delegator?.firstNameEn || ''} ${d.delegator?.lastNameEn || ''}`.trim();
  const startDateStr = new Date(d.startDate).toLocaleDateString('en-GB');
  const endDateStr = new Date(d.endDate).toLocaleDateString('en-GB');
  const reasonInfo = REASON_LABELS[d.reasonType] || REASON_LABELS.OTHER;

  const companyLogo = settings?.logoUrl;
  const companyPhone = settings?.contactPhone || '+855 (0) 23 888 999';

  // 1. STANDARD CORPORATE DOA FORM
  if (template === 'standard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
        {/* Header Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#1e3a8a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                GS
              </div>
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
                ជី.អេស ថិកស្តាយ ហ្គាមិន (ខេមបូឌា)
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                {companyName}
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                Tel: {companyPhone} • Phnom Penh, Kingdom of Cambodia
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>
              ព្រះរាជាណាចក្រកម្ពុជា • ជាតិ សាសនា ព្រះមហាក្សត្រ
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
              Kingdom of Cambodia • Nation Religion King
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>
              លេខយោង / Ref No: {d.refNo}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              កាលបរិច្ឆេទ / Date: {new Date(d.createdAt).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }} className="kh-text">
            លិខិតផ្ទេរសិទ្ធិ និងប្រគល់ការងារ
          </h1>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.8px', marginTop: '1px' }}>
            DELEGATION OF AUTHORITY AND RESPONSIBILITY FORM (DOA)
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            授权委托与工作交接书
          </div>
        </div>

        {/* Section 1: Delegator Information */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '6px' }}>
            I. ព័ត៌មានអ្នកផ្ទេរសិទ្ធិ / DELEGATOR INFORMATION
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 6px', width: '22%', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>ឈ្មោះ / Full Name:</td>
                <td style={{ padding: '3px 6px', width: '28%', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>{delegatorNameKh} ({delegatorNameEn})</td>
                <td style={{ padding: '3px 6px', width: '22%', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>អត្តលេខ / ID No:</td>
                <td style={{ padding: '3px 6px', width: '28%', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>{d.delegator?.employeeId}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>មុខងារ / Position:</td>
                <td style={{ padding: '3px 6px', border: '1px solid #e2e8f0' }}>{d.delegator?.position}</td>
                <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>ផ្នែក / Department:</td>
                <td style={{ padding: '3px 6px', border: '1px solid #e2e8f0' }}>{d.delegator?.department}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>លេខទូរស័ព្ទ / Phone:</td>
                <td style={{ padding: '3px 6px', border: '1px solid #e2e8f0' }}>{d.delegator?.phone || '-'}</td>
                <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>មូលហេតុ / Reason:</td>
                <td style={{ padding: '3px 6px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e3a8a' }}>
                  {reasonInfo.icon} {reasonInfo.labelKh}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Period & Mission */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '6px' }}>
            II. រយៈពេលផ្ទេរសិទ្ធិ & ទីតាំងបេសកកម្ម / DELEGATION PERIOD & PURPOSE
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 6px', width: '22%', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>កាលបរិច្ឆេទ / Duration:</td>
                <td style={{ padding: '3px 6px', width: '45%', border: '1px solid #e2e8f0' }}>
                  ចាប់ពីថ្ងៃទី <strong>{startDateStr}</strong> ដល់ថ្ងៃទី <strong>{endDateStr}</strong>
                </td>
                <td style={{ padding: '3px 6px', width: '15%', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>ចំនួនថ្ងៃសរុប:</td>
                <td style={{ padding: '3px 6px', width: '18%', border: '1px solid #e2e8f0', fontWeight: 800, color: '#16a34a' }}>
                  {d.totalDays} ថ្ងៃ (Days)
                </td>
              </tr>
              {d.missionLocation && (
                <tr>
                  <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>ទីតាំងបេសកកម្ម / Location:</td>
                  <td colSpan={3} style={{ padding: '3px 6px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0369a1' }}>
                    📍 {d.missionLocation}
                  </td>
                </tr>
              )}
              {d.reasonDetail && (
                <tr>
                  <td style={{ padding: '3px 6px', fontWeight: 700, color: '#475569', border: '1px solid #e2e8f0' }}>គោលបំណង / Purpose:</td>
                  <td colSpan={3} style={{ padding: '3px 6px', border: '1px solid #e2e8f0', color: '#334155' }}>
                    {d.reasonDetail}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: Delegatees Table (1 to 3+ Persons) */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '6px' }}>
            III. បញ្ជីអ្នកទទួលសិទ្ធិ និងភារកិច្ចទទួលខុសត្រូវ / DELEGATEES & ASSIGNED RESPONSIBILITIES
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', width: '30px' }}>ល.រ</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', width: '130px', textAlign: 'left' }}>ឈ្មោះអ្នកទទួលសិទ្ធិ (Name)</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', width: '90px' }}>មុខងារ (Position)</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', width: '85px' }}>ផ្នែក (Dept)</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', textAlign: 'left' }}>វិសាលភាព & ភារកិច្ចទទួលខុសត្រូវ (Scope of Authority)</th>
                <th style={{ padding: '4px 6px', border: '1px solid #cbd5e1', width: '85px' }}>ទូរស័ព្ទ (Phone)</th>
              </tr>
            </thead>
            <tbody>
              {delegatees.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>
                    {item.nameKh}
                    {item.nameEn && <div style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 400 }}>{item.nameEn}</div>}
                  </td>
                  <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1' }}>{item.position || '-'}</td>
                  <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1' }}>{item.department || '-'}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 600, color: '#1e3a8a' }}>
                    {item.scopeOfWork}
                    {item.financialLimit && (
                      <div style={{ fontSize: '8.5px', color: '#b45309' }}>
                        កម្រិតថវិកាអនុម័ត: ${item.financialLimit}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '5px 4px', border: '1px solid #cbd5e1', fontSize: '9.5px' }}>{item.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Delegated Powers & Limitations */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px', marginBottom: '6px' }}>
            IV. វិសាលភាពសិទ្ធិអំណាច និងការកំណត់ព្រំដែន / AUTHORIZED POWERS & RESTRICTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px', fontSize: '9.5px', padding: '6px 8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <div>{d.canApproveLeave ? '☑' : '☐'} អនុម័តច្បាប់ឈប់សម្រាកបុគ្គលិក (Leave Approvals)</div>
            <div>{d.canApproveOt ? '☑' : '☐'} អនុម័តការងារថែមម៉ោង (Overtime Approvals)</div>
            <div>{d.canSignDailyReports ? '☑' : '☐'} ចុះហត្ថលេខាលើរបាយការណ៍ប្រចាំថ្ងៃ (Daily Reports)</div>
            <div>{d.canManageOperations ? '☑' : '☐'} គ្រប់គ្រងប្រតិបត្តិការទូទៅ (Daily Operations)</div>
            <div>{d.canCoordinateClients ? '☑' : '☐'} សម្របសម្រួលអតិថិជន & អ្នកផ្គត់ផ្គង់ (Clients & Suppliers)</div>
            <div>
              {d.canApproveExpense ? '☑' : '☐'} អនុម័តចំណាយបន្ទាន់ (Expenses)
              {d.maxExpenseAmount ? ` (អតិបរមា $${d.maxExpenseAmount})` : ''}
            </div>
          </div>

          {d.restrictions && (
            <div style={{ fontSize: '9.5px', marginTop: '6px', padding: '5px 8px', backgroundColor: '#fffbeb', borderLeft: '3px solid #f59e0b', color: '#78350f' }}>
              ⚠️ <strong>ការកំណត់ព្រំដែនសិទ្ធិ (Restrictions):</strong> {d.restrictions}
            </div>
          )}

          {d.handoverItems && (
            <div style={{ fontSize: '9.5px', marginTop: '4px', padding: '5px 8px', backgroundColor: '#f0fdf4', borderLeft: '3px solid #22c55e', color: '#14532d' }}>
              📦 <strong>សម្ភារៈប្រគល់ជូន (Handover Assets):</strong> {d.handoverItems}
            </div>
          )}
        </div>

        {/* Section 5: Four-Party Signatures */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textAlign: 'center', marginBottom: '8px' }}>
            V. ហត្ថលេខាបញ្ជាក់ និងអនុម័ត ៤ ភាគី / FOUR-PARTY SIGNATURES & APPROVALS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${2 + Math.min(delegatees.length, 2)}, 1fr)`, gap: '10px', textAlign: 'center' }}>
            {/* 1. Delegator */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>អ្នកផ្ទេរសិទ្ធិ</div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>Delegator</div>
              <div style={{ height: '42px' }} />
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', margin: '0 auto' }} />
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{delegatorNameKh}</div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>កាលបរិច្ឆេទ: ____/____/2026</div>
            </div>

            {/* 2. Delegatees Signatures */}
            {delegatees.slice(0, 2).map((del, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>អ្នកទទួលសិទ្ធិទី {i + 1}</div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>Delegatee #{i + 1}</div>
                <div style={{ height: '42px' }} />
                <div style={{ borderBottom: '1px solid #0f172a', width: '80%', margin: '0 auto' }} />
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{del.nameKh || del.nameEn}</div>
                <div style={{ fontSize: '8px', color: '#64748b' }}>កាលបរិច្ឆេទ: ____/____/2026</div>
              </div>
            ))}

            {/* 3. Department Head */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>ប្រធានផ្នែក</div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>Department Head</div>
              <div style={{ height: '42px' }} />
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', margin: '0 auto' }} />
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{d.approvedByDeptHead || 'ប្រធានផ្នែក'}</div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>កាលបរិច្ឆេទ: ____/____/2026</div>
            </div>

            {/* 4. General Manager / HR */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>នាយកប្រតិបត្តិ / HR</div>
              <div style={{ fontSize: '8.5px', color: '#64748b' }}>General Manager / HR</div>
              <div style={{ height: '42px' }} />
              <div style={{ borderBottom: '1px solid #0f172a', width: '80%', margin: '0 auto' }} />
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{d.approvedByManagement || 'នាយកចាត់ការទូទៅ'}</div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>កាលបរិច្ឆេទ: ____/____/2026</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. FORMAL DELEGATION LETTER (AUTHORIZATION LETTER / 授权委托书)
  if (template === 'formal-letter') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', fontSize: '11px', lineHeight: '1.6' }}>
        {/* National Motto */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>KINGDOM OF CAMBODIA • NATION RELIGION KING</div>
          <div style={{ width: '80px', borderBottom: '1px solid #0f172a', margin: '4px auto 0 auto' }} />
        </div>

        {/* Company and Ref */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '12.5px' }}>{companyName}</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>ការិយាល័យរដ្ឋបាល និងធនធានមនុស្ស / HR & Admin Office</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10.5px' }}>
            <div><strong>លេខ / No:</strong> {d.refNo}</div>
            <div>រាជធានីភ្នំពេញ ថ្ងៃទី {new Date(d.createdAt).getDate()} ខែ {new Date(d.createdAt).getMonth() + 1} ឆ្នាំ {new Date(d.createdAt).getFullYear()}</div>
          </div>
        </div>

        {/* Letter Title */}
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            លិខិតផ្ទេរសិទ្ធិ និងប្រគល់ភារកិច្ច
          </h1>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
            LETTER OF DELEGATION OF AUTHORITY (DOA) • 授权委托书
          </div>
        </div>

        {/* Narrative Content */}
        <div style={{ textIndent: '24px', textAlign: 'justify' }}>
          ខ្ញុំបាទ/នាងខ្ញុំឈ្មោះ <strong>{delegatorNameKh}</strong> ({delegatorNameEn}) អត្តលេខ <strong>{d.delegator?.employeeId}</strong> មុខងារ <strong>{d.delegator?.position}</strong> នៃផ្នែក <strong>{d.delegator?.department}</strong> របស់ក្រុមហ៊ុន <strong>{companyName}</strong>។
        </div>

        <div style={{ textIndent: '24px', textAlign: 'justify' }}>
          ដោយមូលហេតុ <strong>{reasonInfo.labelKh}</strong> {d.missionLocation ? `នៅ ${d.missionLocation}` : ''} {d.reasonDetail ? `(${d.reasonDetail})` : ''} ដោយមិនអាចបំពេញភារកិច្ចប្រចាំថ្ងៃបាន ចាប់ពីថ្ងៃទី <strong>{startDateStr}</strong> ដល់ថ្ងៃទី <strong>{endDateStr}</strong> សរុបចំនួន <strong>{d.totalDays} ថ្ងៃ</strong>។ អាស្រ័យហេតុនេះ ខ្ញុំបាទ/នាងខ្ញុំ សូមធ្វើការផ្ទេរសិទ្ធិ និងប្រគល់ភារកិច្ចការងារជូនបុគ្គលិកដូចខាងក្រោម៖
        </div>

        {/* Delegatees Narrative list */}
        <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          {delegatees.map((del, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <strong>{idx + 1}. លោក/លោកស្រី {del.nameKh}</strong> ({del.nameEn}) អត្តលេខ {del.employeeId} មុខងារ {del.position}៖
              <div style={{ paddingLeft: '16px', color: '#1e3a8a', fontWeight: 600 }}>
                • ទទួលបន្ទុកភារកិច្ច៖ {del.scopeOfWork} {del.phone ? `(ទូរស័ព្ទ: ${del.phone})` : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textIndent: '24px', textAlign: 'justify' }}>
          បុគ្គលិកដែលទទួលបានសិទ្ធិខាងលើ មានសិទ្ធិពេញលេញក្នុងការ៖ {d.canApproveLeave ? 'អនុម័តច្បាប់ឈប់សម្រាកបុគ្គលិក, ' : ''}{d.canApproveOt ? 'អនុម័តការងារថែមម៉ោង (OT), ' : ''}{d.canSignDailyReports ? 'ចុះហត្ថលេខាលើរបាយការណ៍ប្រចាំថ្ងៃ, ' : ''}{d.canManageOperations ? 'គ្រប់គ្រងប្រតិបត្តិការទូទៅ, ' : ''}{d.canApproveExpense ? `អនុម័តចំណាយបន្ទាន់មិនលើសពី $${d.maxExpenseAmount || 0}, ` : ''}តាមវិសាលភាពដែលបានកំណត់ក្នុងលិខិតនេះ។
        </div>

        {d.restrictions && (
          <div style={{ padding: '6px 10px', backgroundColor: '#fffbeb', borderRadius: '4px', borderLeft: '3px solid #f59e0b', fontSize: '10.5px' }}>
            <strong>ការកំណត់ព្រំដែន៖</strong> {d.restrictions}
          </div>
        )}

        <div style={{ textIndent: '24px', textAlign: 'justify' }}>
          លិខិតផ្ទេរសិទ្ធិនេះមានសុពលភាពចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ រហូតដល់ថ្ងៃបញ្ចប់ដែលបានកំណត់ខាងលើ។ ខ្ញុំបាទ/នាងខ្ញុំ និងអ្នកទទួលសិទ្ធិ សូមទទួលខុសត្រូវទាំងស្រុងចំពោះមុខក្រុមហ៊ុន និងច្បាប់។
        </div>

        {/* Signatures */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>អ្នកផ្ទេរសិទ្ធិ (Delegator)</div>
            <div style={{ height: '50px' }} />
            <div style={{ fontWeight: 700 }}>{delegatorNameKh}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>អ្នកទទួលសិទ្ធិ (Delegatees)</div>
            <div style={{ height: '50px' }} />
            <div style={{ fontWeight: 700 }}>{delegatees[0]?.nameKh || 'អ្នកទទួលសិទ្ធិ'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>នាយកចាត់ការទូទៅ (Approved)</div>
            <div style={{ height: '50px' }} />
            <div style={{ fontWeight: 700 }}>{d.approvedByManagement || 'Management'}</div>
          </div>
        </div>
      </div>
    );
  }

  // 3. FIELD MISSION & HANDOVER SPECIFIC TEMPLATE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px', fontSize: '10.5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0284c7', paddingBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>{companyName}</div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>OFFICIAL BUSINESS MISSION & AUTHORITY HANDOVER FORM</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>លិខិតបញ្ជាបេសកកម្ម & ផ្ទេរសិទ្ធិ</div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Ref: {d.refNo}</div>
        </div>
      </div>

      {/* Mission Banner */}
      <div style={{ backgroundColor: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', marginBottom: '4px' }}>
          ✈️ ព័ត៌មានបេសកកម្មការងារ (OFFICIAL MISSION DETAILS)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 12px' }}>
          <div><strong>មន្ត្រីចុះបេសកកម្ម:</strong> {delegatorNameKh} ({d.delegator?.position})</div>
          <div><strong>ទីតាំងចុះទៅ:</strong> 📍 {d.missionLocation || 'តាមការចាត់តាំង'}</div>
          <div><strong>កាលបរិច្ឆេទ:</strong> {startDateStr} ដល់ {endDateStr}</div>
          <div><strong>រយៈពេល:</strong> {d.totalDays} ថ្ងៃ</div>
        </div>
        {d.reasonDetail && (
          <div style={{ marginTop: '4px', borderTop: '1px dashed #7dd3fc', paddingTop: '4px', color: '#0369a1' }}>
            <strong>ភារកិច្ចនៃបេសកកម្ម:</strong> {d.reasonDetail}
          </div>
        )}
      </div>

      {/* Handover Delegatees */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', marginBottom: '6px' }}>
          🤝 បុគ្គលិកទទួលសិទ្ធិគ្រប់គ្រងជំនួស (ACTING OFFICERS ON DUTY)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0f2fe' }}>
              <th style={{ padding: '4px', border: '1px solid #bae6fd', width: '30px', textAlign: 'center' }}>ល.រ</th>
              <th style={{ padding: '4px 6px', border: '1px solid #bae6fd', textAlign: 'left' }}>ឈ្មោះបុគ្គលិក</th>
              <th style={{ padding: '4px 6px', border: '1px solid #bae6fd', width: '100px' }}>មុខងារ</th>
              <th style={{ padding: '4px 6px', border: '1px solid #bae6fd', textAlign: 'left' }}>ការទទួលខុសត្រូវជាក់លាក់</th>
              <th style={{ padding: '4px 6px', border: '1px solid #bae6fd', width: '90px' }}>ទូរស័ព្ទ</th>
            </tr>
          </thead>
          <tbody>
            {delegatees.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '5px', border: '1px solid #bae6fd', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #bae6fd', fontWeight: 700 }}>{item.nameKh} ({item.nameEn})</td>
                <td style={{ padding: '5px 6px', border: '1px solid #bae6fd' }}>{item.position}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #bae6fd', fontWeight: 600, color: '#0369a1' }}>{item.scopeOfWork}</td>
                <td style={{ padding: '5px 6px', border: '1px solid #bae6fd' }}>{item.phone || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assets & Items */}
      <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <strong>សម្ភារៈប្រគល់-ទទួល (Physical Handover Items):</strong> {d.handoverItems || 'គ្មាន'}
      </div>

      {/* Signatures */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>មន្ត្រីបេសកកម្ម</div>
          <div style={{ height: '40px' }} />
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '80%', margin: '0 auto' }} />
          <div style={{ fontWeight: 700, marginTop: '2px' }}>{delegatorNameKh}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>អ្នកទទួលសិទ្ធិ</div>
          <div style={{ height: '40px' }} />
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '80%', margin: '0 auto' }} />
          <div style={{ fontWeight: 700, marginTop: '2px' }}>{delegatees[0]?.nameKh || 'អ្នកទទួលសិទ្ធិ'}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>ប្រធានផ្នែក</div>
          <div style={{ height: '40px' }} />
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '80%', margin: '0 auto' }} />
          <div style={{ fontWeight: 700, marginTop: '2px' }}>{d.approvedByDeptHead || 'ប្រធានផ្នែក'}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>អគ្គនាយក / HR</div>
          <div style={{ height: '40px' }} />
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '80%', margin: '0 auto' }} />
          <div style={{ fontWeight: 700, marginTop: '2px' }}>{d.approvedByManagement || 'Management'}</div>
        </div>
      </div>
    </div>
  );
}
