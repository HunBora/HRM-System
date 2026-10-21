'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export interface AppointmentRecord {
  id: string;
  refNo: string;
  employeeId: string;
  employee: {
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
  oldPosition?: string;
  oldDepartment?: string;
  newPosition: string;
  newDepartment: string;
  reportsTo?: string;
  effectiveDate: string | Date;
  probationMonths: number;
  newSalary?: number | null;
  positionAllowance?: number | null;
  benefits?: string;
  dutiesJson: string;
  preambleLaw?: string;
  preambleInternalRule?: string;
  preamblePerformance?: string;
  preambleNeeds?: string;
  signLocation?: string;
  signDate?: string | Date;
  signatoryTitle?: string;
  signatoryName?: string;
  ccList?: string;
  templateStyle: string;
  status: string;
  notes?: string;
  createdAt: string | Date;
}

const DUTY_SUGGESTIONS = [
  'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
  'រៀបចំផែនការផលិតកម្ម បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
  'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដារ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ',
  'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបច្ចេកទេស និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ',
  'ចូលរួមវាយតម្លៃការបំពេញការងារ (KPI) និងបណ្តុះបណ្តាលបង្កើនសមត្ថភាពដល់បុគ្គលិកក្នុងក្រុម',
  'គ្រប់គ្រងការប្រើប្រាស់សម្ភារៈ ឧបករណ៍ និងកាត់បន្ថយការខូចខាត ឬការខ្ជះខ្ជាយក្នុងសង្វាក់ផលិតកម្ម'
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
                    🪪 {selectedEmp.nationalId}
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 120 }} onClick={() => setIsOpen(false)} />
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
                      <img src={emp.photoUrl} alt="Photo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
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
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{nameKh}</span>
                        {nameEn && <span style={{ fontSize: '11.5px', color: '#64748b' }}>({nameEn})</span>}
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

export default function AppointmentClient({
  initialAppointments,
  employees,
  settings,
  userRole
}: {
  initialAppointments: any[];
  employees: any[];
  settings?: any;
  userRole?: string;
}) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(initialAppointments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formOldPosition, setFormOldPosition] = useState('');
  const [formOldDepartment, setFormOldDepartment] = useState('');
  const [formNewPosition, setFormNewPosition] = useState('');
  const [formNewDepartment, setFormNewDepartment] = useState('');
  const [formReportsTo, setFormReportsTo] = useState('នាយកចាត់ការទូទៅ (General Manager)');
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProbationMonths, setFormProbationMonths] = useState('0');
  const [formNewSalary, setFormNewSalary] = useState('');
  const [formPositionAllowance, setFormPositionAllowance] = useState('');
  const [formBenefits, setFormBenefits] = useState('កាតទូរស័ព្ទ, ប្រេងសាំង, ប្រាក់លើកទឹកចិត្តតាមស្នាដៃ');
  const [formDuties, setFormDuties] = useState<string[]>([
    'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
    'រៀបចំផែនការផលិតកម្ម បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
    'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដាររបស់រោងចក្រ',
    'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបច្ចេកទេស និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ'
  ]);
  const [formPreambleLaw, setFormPreambleLaw] = useState('យោងតាមក្រមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា');
  const [formPreambleInternalRule, setFormPreambleInternalRule] = useState('យោងតាមលក្ខន្តិកៈ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន');
  const [formPreamblePerformance, setFormPreamblePerformance] = useState('យោងតាមសមត្ថភាព ចំណេះដឹង បទពិសោធន៍ ស្នាដៃការងារ និងភាពស្មោះត្រង់របស់បុគ្គលិក');
  const [formPreambleNeeds, setFormPreambleNeeds] = useState('យោងតាមតម្រូវការការងារជាក់ស្តែង និងការសម្រេចរបស់គណៈគ្រប់គ្រងរោងចក្រ/ក្រុមហ៊ុន');
  const [formSignLocation, setFormSignLocation] = useState('រាជធានីភ្នំពេញ');
  const [formSignatoryTitle, setFormSignatoryTitle] = useState('អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)');
  const [formSignatoryName, setFormSignatoryName] = useState('');
  const [formCcList, setFormCcList] = useState(
    '- ក្រុមប្រឹក្សាភិបាល (Board of Directors)\n- នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin)\n- នាយកដ្ឋានគណនេយ្យ និងហិរញ្ញវត្ថុ (Accounting & Finance)\n- សាមីខ្លួន "ដើម្បីអនុវត្ត" (Appointee)\n- ឯកសារ - កាលប្បវត្តិ (Company Archives)'
  );

  // Selected Employee object
  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.id === formEmployeeId);
  }, [employees, formEmployeeId]);

  // When an employee is chosen via combobox
  const handleSelectEmployee = (emp: any) => {
    setFormEmployeeId(emp.id);
    setFormOldPosition(emp.position || '');
    setFormOldDepartment(emp.department || '');
    if (!formNewDepartment) {
      setFormNewDepartment(emp.department || '');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormEmployeeId('');
    setFormOldPosition('');
    setFormOldDepartment('');
    setFormNewPosition('');
    setFormNewDepartment('');
    setFormReportsTo('នាយកចាត់ការទូទៅ (General Manager)');
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormProbationMonths('0');
    setFormNewSalary('');
    setFormPositionAllowance('');
    setFormBenefits('កាតទូរស័ព្ទ, ប្រេងសាំង, ប្រាក់លើកទឹកចិត្តតាមស្នាដៃ');
    setFormDuties([
      'ដឹកនាំ គ្រប់គ្រង និងត្រួតពិនិត្យការងារប្រតិបត្តិការប្រចាំថ្ងៃក្នុងផ្នែកឱ្យទទួលបានទិន្នផលខ្ពស់',
      'រៀបចំផែនការផលិតកម្ម បែងចែកភារកិច្ច និងតាមដានវឌ្ឍនភាពការងាររបស់បុគ្គលិកក្រោមឱវាទ',
      'ធានានូវគុណភាព សុវត្ថិភាពការងារ និងការគោរពវិន័យតាមស្តង់ដាររបស់រោងចក្រ',
      'សម្របសម្រួលដោះស្រាយបញ្ហាប្រឈមបច្ចេកទេស និងរាយការណ៍ជូនថ្នាក់ដឹកនាំជាប្រចាំ'
    ]);
    setFormSignLocation('រាជធានីភ្នំពេញ');
    setFormSignatoryTitle('អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)');
    setFormSignatoryName('');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (appt: AppointmentRecord) => {
    setEditingId(appt.id);
    setFormEmployeeId(appt.employeeId);
    setFormOldPosition(appt.oldPosition || '');
    setFormOldDepartment(appt.oldDepartment || '');
    setFormNewPosition(appt.newPosition);
    setFormNewDepartment(appt.newDepartment);
    setFormReportsTo(appt.reportsTo || 'នាយកចាត់ការទូទៅ (General Manager)');
    setFormEffectiveDate(new Date(appt.effectiveDate).toISOString().split('T')[0]);
    setFormProbationMonths(String(appt.probationMonths || 0));
    setFormNewSalary(appt.newSalary ? String(appt.newSalary) : '');
    setFormPositionAllowance(appt.positionAllowance ? String(appt.positionAllowance) : '');
    setFormBenefits(appt.benefits || '');
    try {
      const parsed = JSON.parse(appt.dutiesJson);
      setFormDuties(Array.isArray(parsed) && parsed.length > 0 ? parsed : ['ភារកិច្ចស្នូលទី ១']);
    } catch {
      setFormDuties(['ភារកិច្ចស្នូលទី ១']);
    }
    setFormPreambleLaw(appt.preambleLaw || 'យោងតាមក្រមច្បាប់ស្តីពីការងារ នៃព្រះរាជាណាចក្រកម្ពុជា');
    setFormPreambleInternalRule(appt.preambleInternalRule || 'យោងតាមលក្ខន្តិកៈ និងបទបញ្ជាផ្ទៃក្នុងរបស់រោងចក្រ/ក្រុមហ៊ុន');
    setFormPreamblePerformance(appt.preamblePerformance || 'យោងតាមសមត្ថភាព ចំណេះដឹង បទពិសោធន៍ ស្នាដៃការងារ និងភាពស្មោះត្រង់របស់បុគ្គលិក');
    setFormPreambleNeeds(appt.preambleNeeds || 'យោងតាមតម្រូវការការងារជាក់ស្តែង និងការសម្រេចរបស់គណៈគ្រប់គ្រងរោងចក្រ/ក្រុមហ៊ុន');
    setFormSignLocation(appt.signLocation || 'រាជធានីភ្នំពេញ');
    setFormSignatoryTitle(appt.signatoryTitle || 'អគ្គនាយកក្រុមហ៊ុន (General Manager / CEO)');
    setFormSignatoryName(appt.signatoryName || '');
    setFormCcList(appt.ccList || '');
    setIsModalOpen(true);
  };

  // Add / remove / update duty
  const handleAddDuty = () => {
    setFormDuties([...formDuties, `ភារកិច្ច និងការទទួលខុសត្រូវទី ${formDuties.length + 1}`]);
  };

  const handleUpdateDuty = (index: number, val: string) => {
    const next = [...formDuties];
    next[index] = val;
    setFormDuties(next);
  };

  const handleRemoveDuty = (index: number) => {
    if (formDuties.length <= 1) return;
    const next = [...formDuties];
    next.splice(index, 1);
    setFormDuties(next);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) {
      alert('សូមជ្រើសរើសបុគ្គលិកដែលត្រូវតែងតាំង');
      return;
    }
    if (!formNewPosition.trim() || !formNewDepartment.trim()) {
      alert('សូមបញ្ជាក់មុខតំណែងថ្មី និងផ្នែកថ្មី');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: formEmployeeId,
        oldPosition: formOldPosition,
        oldDepartment: formOldDepartment,
        newPosition: formNewPosition.trim(),
        newDepartment: formNewDepartment.trim(),
        reportsTo: formReportsTo,
        effectiveDate: formEffectiveDate,
        probationMonths: Number(formProbationMonths) || 0,
        newSalary: formNewSalary ? Number(formNewSalary) : null,
        positionAllowance: formPositionAllowance ? Number(formPositionAllowance) : null,
        benefits: formBenefits,
        duties: formDuties,
        preambleLaw: formPreambleLaw,
        preambleInternalRule: formPreambleInternalRule,
        preamblePerformance: formPreamblePerformance,
        preambleNeeds: formPreambleNeeds,
        signLocation: formSignLocation,
        signatoryTitle: formSignatoryTitle,
        signatoryName: formSignatoryName,
        ccList: formCcList
      };

      const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments';
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
      const savedItem = resData.appointment;

      if (editingId) {
        setAppointments((prev) => prev.map((a) => (a.id === editingId ? savedItem : a)));
      } else {
        setAppointments((prev) => [savedItem, ...prev]);
      }

      setIsModalOpen(false);
      window.location.href = `/dashboard/appointments/${savedItem.id}`;
    } catch (err: any) {
      alert(err.message || 'មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Appointment
  const handleDelete = async (id: string, refNo: string) => {
    if (!confirm(`តើលោកអ្នកពិតជាចង់លុបលិខិតតែងតាំងលេខ ${refNo} នេះមែនទេ?`)) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('បរាជ័យក្នុងការលុប');
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'មិនអាចលុបបាន');
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchStatus;

      const empNameKh = `${a.employee?.lastNameKh || ''} ${a.employee?.firstNameKh || ''}`.toLowerCase();
      const empNameEn = `${a.employee?.firstNameEn || ''} ${a.employee?.lastNameEn || ''}`.toLowerCase();
      const empId = (a.employee?.employeeId || '').toLowerCase();
      const natId = (a.employee?.nationalId || '').toLowerCase();
      const ref = (a.refNo || '').toLowerCase();
      const newPos = (a.newPosition || '').toLowerCase();
      const newDept = (a.newDepartment || '').toLowerCase();

      const matchQ =
        ref.includes(q) ||
        empNameKh.includes(q) ||
        empNameEn.includes(q) ||
        empId.includes(q) ||
        natId.includes(q) ||
        newPos.includes(q) ||
        newDept.includes(q);

      return matchStatus && matchQ;
    });
  }, [appointments, statusFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '16px' }}>
      {/* Top Banner Header */}
      <div
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
            📜
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }} className="kh-text">
              លិខិតតែងតាំងតួនាទី (Letter of Appointment / Promotion)
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0 0' }}>
              ទម្រង់ស្តង់ដារសម្រាប់រោងចក្រ និងក្រុមហ៊ុន • គាំទ្រ ៣ ភាសា (ខ្មែរ/English/中文) • បំពេញទិន្នន័យអូតូ និង Export Word/PDF
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
          <span>បង្កើតលិខិតតែងតាំងថ្មី (New Appointment)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#eff6ff' }}>📜</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>លិខិតតែងតាំងសរុប (Total)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{appointments.length}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#ecfdf5' }}>🟢</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 600 }}>កំពុងមានប្រសិទ្ធភាព (Active)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>
              {appointments.filter((a) => a.status === 'ACTIVE').length}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#fef3c7' }}>⭐</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600 }}>ដំឡើងតំណែងថ្មី (Promotions)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>
              {appointments.filter((a) => a.oldPosition && a.oldPosition !== a.newPosition).length}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg, #ffffff)', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '28px', padding: '10px', borderRadius: '8px', backgroundColor: '#f3e8ff' }}>👥</div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6b21a8', fontWeight: 600 }}>បុគ្គលិកសរុបក្នុងប្រព័ន្ធ</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#581c87' }}>{employees.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
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
            placeholder="🔍 ស្វែងរកតាមលេខយោង, ឈ្មោះបុគ្គលិក, ID, អត្តសញ្ញាណប័ណ្ណ, មុខតំណែង..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '360px'
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">ស្ថានភាពទាំងអស់ (All Status)</option>
            <option value="ACTIVE">🟢 កំពុងមានប្រសិទ្ធភាព (Active)</option>
            <option value="CANCELLED">🔴 បានបោះបង់ (Cancelled)</option>
          </select>
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          បង្ហាញ <strong>{filteredAppointments.length}</strong> / <strong>{appointments.length}</strong> លិខិត
        </div>
      </div>

      {/* Main Table */}
      <div
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
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>សាមីខ្លួន (Employee)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>មុខតំណែងចាស់</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>មុខតំណែងថ្មី (Appointed Role)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>កាលបរិច្ឆេទចូលកាន់តំណែង</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>ស្ថានភាព</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    ពុំទាន់មានទិន្នន័យលិខិតតែងតាំងនៅឡើយទេ
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  const empName = `${appt.employee?.lastNameKh || ''} ${appt.employee?.firstNameKh || ''}`.trim() || appt.employee?.firstNameEn;
                  const effectiveDateStr = new Date(appt.effectiveDate).toLocaleDateString('en-GB');

                  return (
                    <tr
                      key={appt.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>
                        <span style={{ backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                          {appt.refNo}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {appt.employee?.photoUrl ? (
                            <img src={appt.employee.photoUrl} alt="Photo" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                              {empName?.charAt(0) || 'E'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }} className="kh-text">
                              {empName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              ID: {appt.employee?.employeeId} {appt.employee?.nationalId ? `• 🪪 ${appt.employee.nationalId}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {appt.oldPosition || '---'}
                        {appt.oldDepartment && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{appt.oldDepartment}</div>}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af' }}>
                          {appt.newPosition}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#0369a1', fontWeight: 600 }}>
                          🏢 {appt.newDepartment}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          📅 {effectiveDateStr}
                        </div>
                        {appt.probationMonths > 0 && (
                          <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
                            (សាកល្បង {appt.probationMonths} ខែ)
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {appt.status === 'ACTIVE' ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            ● មានប្រសិទ្ធភាព
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            ✕ បានបោះបង់
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/dashboard/appointments/${appt.id}`}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🖨️</span>
                            <span>មើល / បោះពុម្ព</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(appt)}
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
                            onClick={() => handleDelete(appt.id, appt.refNo)}
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
              maxWidth: '920px',
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
                  {editingId ? '✏️ កែប្រែលិខិតតែងតាំង (Edit Appointment Letter)' : '➕ បង្កើតលិខិតតែងតាំងថ្មី (New Appointment Letter)'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  តែងតាំង ឬដំឡើងតំណែងបុគ្គលិក • បំពេញព័ត៌មានអូតូតាម ឈ្មោះ, អត្តលេខ, អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, តួនាទី
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* SECTION 1: EMPLOYEE SELECTION WITH SMART AUTO-FILL */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e3a8a' }}>
                    👤 ជ្រើសរើសបុគ្គលិកដែលត្រូវតែងតាំង (Employee / 被委任人) - បំពេញអូតូ៖
                  </div>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    ⚡ ស្វែងរកតាម ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី
                  </span>
                </div>

                <EmployeeCombobox
                  employees={employees}
                  selectedId={formEmployeeId}
                  onSelect={handleSelectEmployee}
                  placeholder="🔍 វាយបញ្ចូល ឈ្មោះ, អត្តលេខ (ID), អត្តសញ្ញាណប័ណ្ណ, ផ្នែក, ឬ តួនាទី ដើម្បីបំពេញអូតូ..."
                  required
                />
              </div>

              {/* SECTION 2: POSITION & APPOINTMENT DETAILS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  💼 ព័ត៌មានមុខតំណែង និងផ្នែកថ្មី (New Position & Department):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      មុខតំណែងថ្មី (New Position) *
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ប្រធានផ្នែកផលិតកម្ម (Production Supervisor)..."
                      value={formNewPosition}
                      onChange={(e) => setFormNewPosition(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ផ្នែក / រោងចក្រថ្មី (Department) *
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ផ្នែកផលិតកម្ម (Production Department)..."
                      value={formNewDepartment}
                      onChange={(e) => setFormNewDepartment(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      រាយការណ៍ផ្ទាល់ជូន (Reports To)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. នាយកចាត់ការទូទៅ (General Manager)..."
                      value={formReportsTo}
                      onChange={(e) => setFormReportsTo(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      កាលបរិច្ឆេទចូលកាន់តំណែង *
                    </label>
                    <input
                      type="date"
                      value={formEffectiveDate}
                      onChange={(e) => setFormEffectiveDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      រយៈពេលសាកល្បង (ខែ)
                    </label>
                    <select
                      value={formProbationMonths}
                      onChange={(e) => setFormProbationMonths(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="0">ពេញសិទ្ធិភ្លាមៗ (គ្មានសាកល្បង)</option>
                      <option value="1">សាកល្បង ១ ខែ</option>
                      <option value="2">សាកល្បង ២ ខែ</option>
                      <option value="3">សាកល្បង ៣ ខែ</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ប្រាក់បៀវត្សថ្មី ($) (ជម្រើស)
                    </label>
                    <input
                      type="number"
                      placeholder="ឧ. 650"
                      value={formNewSalary}
                      onChange={(e) => setFormNewSalary(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ប្រាក់ឧបត្ថម្ភតួនាទី ($) (ជម្រើស)
                    </label>
                    <input
                      type="number"
                      placeholder="ឧ. 80"
                      value={formPositionAllowance}
                      onChange={(e) => setFormPositionAllowance(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    អត្ថប្រយោជន៍ និងសម្ភារៈបន្ថែម (Benefits & Equipment)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. កាតទូរស័ព្ទ, ប្រេងសាំង, កុំព្យូទ័រយួរដៃ, ប្រាក់លើកទឹកចិត្ត..."
                    value={formBenefits}
                    onChange={(e) => setFormBenefits(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* SECTION 3: KEY DUTIES & RESPONSIBILITIES */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#312e81' }}>
                    📋 តួនាទី ភារកិច្ច និងការទទួលខុសត្រូវ (Duties & Responsibilities):
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDuty}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + បន្ថែមភារកិច្ច
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {formDuties.map((duty, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ede9fe', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={duty}
                        onChange={(e) => handleUpdateDuty(idx, e.target.value)}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                      />
                      {formDuties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDuty(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' }}
                          title="លុបភារកិច្ចនេះ"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Duty Suggestions Chips */}
                <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginBottom: '4px' }}>
                  💡 ជម្រើសភារកិច្ចគំរូរហ័សសម្រាប់រោងចក្រ/ក្រុមហ៊ុន៖
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {DUTY_SUGGESTIONS.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setFormDuties([...formDuties, sug])}
                      style={{
                        fontSize: '10.5px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e0e7ff',
                        backgroundColor: '#ffffff',
                        color: '#4338ca',
                        cursor: 'pointer'
                      }}
                    >
                      + {sug.slice(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 4: PREAMBLE & SIGNATURES */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  ✍️ កាលបរិច្ឆេទ ទីកន្លែង និងអ្នកចុះហត្ថលេខា (Signer & Location):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ទីកន្លែងធ្វើលិខិត
                    </label>
                    <input
                      type="text"
                      value={formSignLocation}
                      onChange={(e) => setFormSignLocation(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      តំណែងអ្នកចុះហត្ថលេខា
                    </label>
                    <input
                      type="text"
                      value={formSignatoryTitle}
                      onChange={(e) => setFormSignatoryTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ឈ្មោះអ្នកចុះហត្ថលេខា (អគ្គនាយក)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. ឧកញ៉ា... / Mr..."
                      value={formSignatoryName}
                      onChange={(e) => setFormSignatoryName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 18px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 24px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isSubmitting ? 'កំពុងរក្សាទុក...' : editingId ? '💾 រក្សាទុកការកែប្រែ' : '✓ បង្កើតលិខិតតែងតាំង & មើលគំរូ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
