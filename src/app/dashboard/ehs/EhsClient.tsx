'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  createClinicVisit,
  updateClinicVisit,
  deleteClinicVisit,
  createWorkplaceIncident,
  updateWorkplaceIncident,
  updateIncidentNssfStatus,
  deleteWorkplaceIncident,
  createHealthCheckup,
  deleteHealthCheckup,
} from './actions';

interface Employee {
  id: string;
  employeeId: string;
  firstNameKh?: string | null;
  lastNameKh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  gender?: string | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  nssfNo?: string | null;
  photoUrl?: string | null;
}

interface ClinicVisitRecord {
  id: string;
  visitNumber: string;
  employeeId: string;
  employee: Employee;
  visitDate: string | Date;
  symptoms: string;
  temperature?: number | null;
  bloodPressure?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  medicineDispensed?: string | null;
  restMinutes: number;
  sendHome: boolean;
  referredHospital: boolean;
  hospitalName?: string | null;
  attendantName?: string | null;
  notes?: string | null;
  createdAt: string | Date;
}

interface WorkplaceIncidentRecord {
  id: string;
  incidentNumber: string;
  employeeId: string;
  employee: Employee;
  incidentDate: string | Date;
  incidentTime?: string | null;
  location: string;
  severity: string;
  injuryType: string;
  bodyPart?: string | null;
  description: string;
  rootCause?: string | null;
  correctiveAction?: string | null;
  daysLost: number;
  nssfClaimed: boolean;
  nssfCaseNo?: string | null;
  nssfStatus: string;
  nssfCompensationKhr: number;
  status: string;
  reportedBy?: string | null;
  investigatedBy?: string | null;
  notes?: string | null;
  createdAt: string | Date;
}

interface HealthCheckupRecord {
  id: string;
  employeeId: string;
  employee: Employee;
  checkupYear: number;
  checkupDate: string | Date;
  clinicName: string;
  healthBookNumber?: string | null;
  hasCertificate: boolean;
  fitStatus: string;
  bloodPressure?: string | null;
  vision?: string | null;
  chestXray?: string | null;
  doctorComments?: string | null;
  createdAt: string | Date;
}

const COMMON_SYMPTOMS = [
  'ឈឺក្បាល (Headache)',
  'គ្រុនក្តៅ (Fever)',
  'វិលមុខ / ខ្យល់គរ (Dizziness / Fainting)',
  'ឈឺពោះ (Stomachache)',
  'រាករូស (Diarrhea)',
  'ផ្តាសាយ / ក្អក (Cold / Cough)',
  'រមាស់ / អាឡែកស៊ី (Allergy / Rash)',
  'ឈឺសន្លាក់ / ចុកចង្កេះ (Back / Joint Pain)',
  'ចង្អោរ (Nausea)',
  'រងរបួសស្រាល (Minor Cut / Bruise)',
];

const COMMON_MEDICINES = [
  'Paracetamol 500mg (4 គ្រាប់)',
  'Antacid (2 គ្រាប់)',
  'Oral Rehydration Salts - ORS (1 កញ្ចប់)',
  'Vitamin C 500mg',
  'Cetirizine 10mg (1 គ្រាប់)',
  'Amoxicillin 500mg',
  'ប្រេងកូឡា / ថ្នាំលាប (Tiger Balm)',
  'ថ្នាំបន្តក់ភ្នែក (Eye Drops)',
  'បង់បិទដំបៅ / អាល់កុលសម្លាប់មេរោគ (Plaster / Antiseptic)',
];

export default function EhsClient({
  initialData,
}: {
  initialData: {
    employees: Employee[];
    clinicVisits: ClinicVisitRecord[];
    incidents: WorkplaceIncidentRecord[];
    checkups: HealthCheckupRecord[];
    stats: any;
  };
}) {
  const [activeTab, setActiveTab] = useState<'CLINIC' | 'INCIDENTS' | 'CHECKUP' | 'COMPLIANCE'>('CLINIC');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [editingClinicVisit, setEditingClinicVisit] = useState<ClinicVisitRecord | null>(null);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<WorkplaceIncidentRecord | null>(null);

  const [showCheckupModal, setShowCheckupModal] = useState(false);

  const [showNssfModal, setShowNssfModal] = useState(false);
  const [selectedIncidentForNssf, setSelectedIncidentForNssf] = useState<WorkplaceIncidentRecord | null>(null);

  const [printableVisit, setPrintableVisit] = useState<ClinicVisitRecord | null>(null);

  // Form states
  const [clinicForm, setClinicForm] = useState({
    employeeId: '',
    visitDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    temperature: '',
    bloodPressure: '120/80',
    diagnosis: '',
    treatment: '',
    medicineDispensed: '',
    restMinutes: '0',
    sendHome: false,
    referredHospital: false,
    hospitalName: '',
    attendantName: 'ពេទ្យរោងចក្រប្រចាំការ',
    notes: '',
  });

  const [incidentForm, setIncidentForm] = useState({
    employeeId: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '09:00',
    location: 'អគារផលិតកម្ម A (Building A)',
    severity: 'MINOR',
    injuryType: 'ដាច់រយះ / មុតស្រាល (Cut / Laceration)',
    bodyPart: 'ម្រាមដៃ (Finger)',
    description: '',
    rootCause: '',
    correctiveAction: '',
    daysLost: '0',
    nssfClaimed: false,
    nssfCaseNo: '',
    nssfStatus: 'NOT_FILED',
    nssfCompensationKhr: '0',
    reportedBy: '',
    investigatedBy: '',
    notes: '',
  });

  const [checkupForm, setCheckupForm] = useState({
    employeeId: '',
    checkupYear: new Date().getFullYear(),
    checkupDate: new Date().toISOString().split('T')[0],
    clinicName: 'មន្ទីរពេទ្យបង្អែក / មន្ទីរពេទ្យការងារ',
    healthBookNumber: '',
    hasCertificate: true,
    fitStatus: 'FIT',
    bloodPressure: '120/80',
    vision: 'ធម្មតា (Normal 10/10)',
    chestXray: 'ធម្មតា (Normal)',
    doctorComments: 'សុខភាពល្អ សមស្របសម្រាប់ការងាររោងចក្រ',
  });

  const [nssfForm, setNssfForm] = useState({
    nssfClaimed: true,
    nssfCaseNo: '',
    nssfStatus: 'PENDING',
    nssfCompensationKhr: '0',
  });

  // Filtered lists
  const filteredClinicVisits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialData.clinicVisits;
    return initialData.clinicVisits.filter((v) => {
      const nameKh = `${v.employee.firstNameKh || ''} ${v.employee.lastNameKh || ''}`.toLowerCase();
      const nameEn = `${v.employee.firstNameEn || ''} ${v.employee.lastNameEn || ''}`.toLowerCase();
      const empId = (v.employee.employeeId || '').toLowerCase();
      const sym = (v.symptoms || '').toLowerCase();
      const med = (v.medicineDispensed || '').toLowerCase();
      const num = (v.visitNumber || '').toLowerCase();
      return nameKh.includes(q) || nameEn.includes(q) || empId.includes(q) || sym.includes(q) || med.includes(q) || num.includes(q);
    });
  }, [initialData.clinicVisits, searchQuery]);

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialData.incidents;
    return initialData.incidents.filter((inc) => {
      const nameKh = `${inc.employee.firstNameKh || ''} ${inc.employee.lastNameKh || ''}`.toLowerCase();
      const nameEn = `${inc.employee.firstNameEn || ''} ${inc.employee.lastNameEn || ''}`.toLowerCase();
      const empId = (inc.employee.employeeId || '').toLowerCase();
      const loc = (inc.location || '').toLowerCase();
      const num = (inc.incidentNumber || '').toLowerCase();
      const inj = (inc.injuryType || '').toLowerCase();
      return nameKh.includes(q) || nameEn.includes(q) || empId.includes(q) || loc.includes(q) || num.includes(q) || inj.includes(q);
    });
  }, [initialData.incidents, searchQuery]);

  const filteredCheckups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialData.checkups;
    return initialData.checkups.filter((c) => {
      const nameKh = `${c.employee.firstNameKh || ''} ${c.employee.lastNameKh || ''}`.toLowerCase();
      const nameEn = `${c.employee.firstNameEn || ''} ${c.employee.lastNameEn || ''}`.toLowerCase();
      const empId = (c.employee.employeeId || '').toLowerCase();
      const book = (c.healthBookNumber || '').toLowerCase();
      return nameKh.includes(q) || nameEn.includes(q) || empId.includes(q) || book.includes(q);
    });
  }, [initialData.checkups, searchQuery]);

  // Handle Clinic Submit
  const handleSaveClinicVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicForm.employeeId) {
      return Swal.fire('Error', 'សូមជ្រើសរើសបុគ្គលិក (Please select an employee)', 'warning');
    }
    if (!clinicForm.symptoms.trim()) {
      return Swal.fire('Error', 'សូមបញ្ជាក់អាការៈជំងឺ (Please enter symptoms)', 'warning');
    }

    setLoading(true);
    try {
      if (editingClinicVisit) {
        await updateClinicVisit(editingClinicVisit.id, {
          symptoms: clinicForm.symptoms,
          temperature: clinicForm.temperature ? parseFloat(clinicForm.temperature) : null,
          bloodPressure: clinicForm.bloodPressure,
          diagnosis: clinicForm.diagnosis,
          treatment: clinicForm.treatment,
          medicineDispensed: clinicForm.medicineDispensed,
          restMinutes: parseInt(clinicForm.restMinutes || '0'),
          sendHome: clinicForm.sendHome,
          referredHospital: clinicForm.referredHospital,
          hospitalName: clinicForm.hospitalName,
          attendantName: clinicForm.attendantName,
          notes: clinicForm.notes,
        });
        Swal.fire('Success', 'បានកែប្រែកំណត់ត្រាគ្លីនិកជោគជ័យ (Clinic visit updated)', 'success');
      } else {
        await createClinicVisit({
          employeeId: clinicForm.employeeId,
          visitDate: clinicForm.visitDate,
          symptoms: clinicForm.symptoms,
          temperature: clinicForm.temperature ? parseFloat(clinicForm.temperature) : null,
          bloodPressure: clinicForm.bloodPressure,
          diagnosis: clinicForm.diagnosis,
          treatment: clinicForm.treatment,
          medicineDispensed: clinicForm.medicineDispensed,
          restMinutes: parseInt(clinicForm.restMinutes || '0'),
          sendHome: clinicForm.sendHome,
          referredHospital: clinicForm.referredHospital,
          hospitalName: clinicForm.hospitalName,
          attendantName: clinicForm.attendantName,
          notes: clinicForm.notes,
        });
        Swal.fire('Success', 'បានកត់ត្រាការពិគ្រោះជំងឺ និងបើកថ្នាំរួចរាល់ (Clinic visit recorded)', 'success');
      }
      setShowClinicModal(false);
      setEditingClinicVisit(null);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Clinic Visit
  const handleDeleteClinic = async (id: string, num: string) => {
    const res = await Swal.fire({
      title: 'លុបកំណត់ត្រាពិគ្រោះជំងឺ?',
      text: `តើអ្នកពិតជាចង់លុបប័ណ្ណលេខ ${num} នេះមែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'បាទ/ចាស, លុប (Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)',
    });
    if (!res.isConfirmed) return;

    try {
      await deleteClinicVisit(id);
      Swal.fire('Deleted', 'កំណត់ត្រាត្រូវបានលុប (Deleted)', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Handle Incident Submit
  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.employeeId) {
      return Swal.fire('Error', 'សូមជ្រើសរើសបុគ្គលិករងគ្រោះ (Select employee)', 'warning');
    }
    if (!incidentForm.description.trim()) {
      return Swal.fire('Error', 'សូមពិពណ៌នាអំពីហេតុការណ៍ (Enter description)', 'warning');
    }

    setLoading(true);
    try {
      if (editingIncident) {
        await updateWorkplaceIncident(editingIncident.id, {
          location: incidentForm.location,
          severity: incidentForm.severity,
          injuryType: incidentForm.injuryType,
          bodyPart: incidentForm.bodyPart,
          description: incidentForm.description,
          rootCause: incidentForm.rootCause,
          correctiveAction: incidentForm.correctiveAction,
          daysLost: parseInt(incidentForm.daysLost || '0'),
          reportedBy: incidentForm.reportedBy,
          investigatedBy: incidentForm.investigatedBy,
          notes: incidentForm.notes,
        });
        Swal.fire('Success', 'បានកែប្រែកំណត់ត្រាគ្រោះថ្នាក់ជោគជ័យ (Incident updated)', 'success');
      } else {
        await createWorkplaceIncident({
          employeeId: incidentForm.employeeId,
          incidentDate: incidentForm.incidentDate,
          incidentTime: incidentForm.incidentTime,
          location: incidentForm.location,
          severity: incidentForm.severity,
          injuryType: incidentForm.injuryType,
          bodyPart: incidentForm.bodyPart,
          description: incidentForm.description,
          rootCause: incidentForm.rootCause,
          correctiveAction: incidentForm.correctiveAction,
          daysLost: parseInt(incidentForm.daysLost || '0'),
          nssfClaimed: incidentForm.nssfClaimed,
          nssfCaseNo: incidentForm.nssfCaseNo,
          nssfStatus: incidentForm.nssfStatus,
          nssfCompensationKhr: parseFloat(incidentForm.nssfCompensationKhr || '0'),
          reportedBy: incidentForm.reportedBy,
          investigatedBy: incidentForm.investigatedBy,
          notes: incidentForm.notes,
        });
        Swal.fire('Success', 'បានកត់ត្រាគ្រោះថ្នាក់ការងាររួចរាល់ (Incident recorded)', 'success');
      }
      setShowIncidentModal(false);
      setEditingIncident(null);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Incident
  const handleDeleteIncident = async (id: string, num: string) => {
    const res = await Swal.fire({
      title: 'លុបកំណត់ត្រាគ្រោះថ្នាក់ការងារ?',
      text: `តើអ្នកចង់លុបរបាយការណ៍លេខ ${num} នេះមែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'បាទ/ចាស, លុប (Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)',
    });
    if (!res.isConfirmed) return;

    try {
      await deleteWorkplaceIncident(id);
      Swal.fire('Deleted', 'របាយការណ៍ត្រូវបានលុប (Deleted)', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Handle NSSF Update
  const handleUpdateNssf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForNssf) return;

    setLoading(true);
    try {
      await updateIncidentNssfStatus(selectedIncidentForNssf.id, {
        nssfClaimed: nssfForm.nssfClaimed,
        nssfCaseNo: nssfForm.nssfCaseNo,
        nssfStatus: nssfForm.nssfStatus,
        nssfCompensationKhr: parseFloat(nssfForm.nssfCompensationKhr || '0'),
      });
      Swal.fire('Success', 'បានធ្វើបច្ចុប្បន្នភាពសំណង ប.ស.ស (NSSF status updated)', 'success');
      setShowNssfModal(false);
      setSelectedIncidentForNssf(null);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Health Checkup Submit
  const handleSaveCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkupForm.employeeId) {
      return Swal.fire('Error', 'សូមជ្រើសរើសបុគ្គលិក (Select employee)', 'warning');
    }

    setLoading(true);
    try {
      await createHealthCheckup({
        employeeId: checkupForm.employeeId,
        checkupYear: parseInt(checkupForm.checkupYear.toString()),
        checkupDate: checkupForm.checkupDate,
        clinicName: checkupForm.clinicName,
        healthBookNumber: checkupForm.healthBookNumber,
        hasCertificate: checkupForm.hasCertificate,
        fitStatus: checkupForm.fitStatus,
        bloodPressure: checkupForm.bloodPressure,
        vision: checkupForm.vision,
        chestXray: checkupForm.chestXray,
        doctorComments: checkupForm.doctorComments,
      });
      Swal.fire('Success', 'បានកត់ត្រាការពិនិត្យសុខភាពប្រចាំឆ្នាំ (Health checkup recorded)', 'success');
      setShowCheckupModal(false);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Checkup
  const handleDeleteCheckup = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'លុបកំណត់ត្រាពិនិត្យសុខភាព?',
      text: `តើអ្នកចង់លុបកំណត់ត្រារបស់ ${name} មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'បាទ/ចាស, លុប (Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)',
    });
    if (!res.isConfirmed) return;

    try {
      await deleteHealthCheckup(id);
      Swal.fire('Deleted', 'កំណត់ត្រាត្រូវបានលុប (Deleted)', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Quick symptom tag click
  const addSymptomTag = (tag: string) => {
    const cleanTag = tag.split(' (')[0];
    if (!clinicForm.symptoms.includes(cleanTag)) {
      setClinicForm((prev) => ({
        ...prev,
        symptoms: prev.symptoms ? `${prev.symptoms}, ${cleanTag}` : cleanTag,
      }));
    }
  };

  // Quick medicine tag click
  const addMedicineTag = (tag: string) => {
    if (!clinicForm.medicineDispensed.includes(tag)) {
      setClinicForm((prev) => ({
        ...prev,
        medicineDispensed: prev.medicineDispensed ? `${prev.medicineDispensed} + ${tag}` : tag,
      }));
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
          borderRadius: '12px',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🏥</span>
            <h1 className="kh-text" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '0.2px' }}>
              សុខភាព សុវត្ថិភាពការងារ & គ្លីនិករោងចក្រ (EHS & Factory Clinic)
            </h1>
          </div>
          <p
            className="kh-text"
            style={{
              margin: '6px 0 0',
              fontSize: '0.85rem',
              color: '#d1fae5',
              lineHeight: 1.4,
              opacity: 0.95,
            }}
          >
            កំណត់ត្រាពិគ្រោះជំងឺ បើកថ្នាំ គ្រោះថ្នាក់ការងារ សំណង ប.ស.ស និងការពិនិត្យសុខភាពប្រចាំឆ្នាំ (BFC / MoLVT Compliance)
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setEditingClinicVisit(null);
              setClinicForm({
                employeeId: '',
                visitDate: new Date().toISOString().split('T')[0],
                symptoms: '',
                temperature: '36.8',
                bloodPressure: '120/80',
                diagnosis: '',
                treatment: 'សម្រាក ពិនិត្យអាការៈ និងបើកថ្នាំជូន',
                medicineDispensed: '',
                restMinutes: '0',
                sendHome: false,
                referredHospital: false,
                hospitalName: '',
                attendantName: 'ពេទ្យរោងចក្រប្រចាំការ',
                notes: '',
              });
              setShowClinicModal(true);
            }}
            className="kh-text"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#065f46',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            🩺 + កត់ត្រាពិគ្រោះ/បើកថ្នាំ
          </button>

          <button
            onClick={() => {
              setEditingIncident(null);
              setIncidentForm({
                employeeId: '',
                incidentDate: new Date().toISOString().split('T')[0],
                incidentTime: '09:30',
                location: 'អគារផលិតកម្ម A (Building A - Line 1)',
                severity: 'MINOR',
                injuryType: 'ដាច់រយះ / មុតស្រាល (Cut / Laceration)',
                bodyPart: 'ម្រាមដៃ (Finger)',
                description: '',
                rootCause: '',
                correctiveAction: '',
                daysLost: '0',
                nssfClaimed: false,
                nssfCaseNo: '',
                nssfStatus: 'NOT_FILED',
                nssfCompensationKhr: '0',
                reportedBy: '',
                investigatedBy: '',
                notes: '',
              });
              setShowIncidentModal(true);
            }}
            className="kh-text"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            ⚠️ + រាយការណ៍គ្រោះថ្នាក់
          </button>

          <button
            onClick={() => {
              setCheckupForm({
                employeeId: '',
                checkupYear: new Date().getFullYear(),
                checkupDate: new Date().toISOString().split('T')[0],
                clinicName: 'មន្ទីរពេទ្យបង្អែក / មន្ទីរពេទ្យការងារ',
                healthBookNumber: '',
                hasCertificate: true,
                fitStatus: 'FIT',
                bloodPressure: '120/80',
                vision: 'ធម្មតា (Normal 10/10)',
                chestXray: 'ធម្មតា (Normal)',
                doctorComments: 'សុខភាពល្អ សមស្របសម្រាប់ការងាររោងចក្រ',
              });
              setShowCheckupModal(true);
            }}
            className="kh-text"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            📋 + ពិនិត្យសុខភាពប្រចាំឆ្នាំ
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Stat 1: Clinic Visits */}
        <div
          style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            🩺
          </div>
          <div>
            <div className="kh-text" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              អ្នកមកពិគ្រោះខែនេះ / សរុប
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {initialData.stats.totalVisitsThisMonth}{' '}
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                / {initialData.stats.allTimeVisits} នាក់
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2: Bed Rest & Referrals */}
        <div
          style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            🛏️
          </div>
          <div>
            <div className="kh-text" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              សម្រាកលើគ្រែ & ពេទ្យក្រៅ
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af' }}>
              {initialData.stats.restInBedCount} នាក់{' '}
              <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                ({initialData.stats.referredHospitalCount} បញ្ជូន)
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Incidents & Days Lost */}
        <div
          style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            ⚠️
          </div>
          <div>
            <div className="kh-text" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              គ្រោះថ្នាក់ & ថ្ងៃបាត់បង់ការងារ
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c' }}>
              {initialData.stats.totalIncidents} ករណី{' '}
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                ({initialData.stats.totalDaysLost} ថ្ងៃ)
              </span>
            </div>
          </div>
        </div>

        {/* Stat 4: NSSF Claims */}
        <div
          style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            🇰🇭
          </div>
          <div>
            <div className="kh-text" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              សំណង ប.ស.ស (NSSF Claims)
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
              {initialData.stats.nssfClaimsApproved} ជាប់{' '}
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                / {initialData.stats.nssfClaimsPending} រង់ចាំ
              </span>
            </div>
          </div>
        </div>

        {/* Stat 5: Health Checkup Fit Rate */}
        <div
          style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
            }}
          >
            📋
          </div>
          <div>
            <div className="kh-text" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              សុខភាពសមស្របការងារ (Fit)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6d28d9' }}>
              {initialData.stats.fitRate}%{' '}
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                ({initialData.stats.totalCheckups} កំណត់ត្រា)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          backgroundColor: '#ffffff',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('CLINIC')}
            className="kh-text"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'CLINIC' ? '#059669' : '#f1f5f9',
              color: activeTab === 'CLINIC' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            🩺 គ្លីនិករោងចក្រ & បើកថ្នាំ ({initialData.clinicVisits.length})
          </button>

          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className="kh-text"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'INCIDENTS' ? '#dc2626' : '#f1f5f9',
              color: activeTab === 'INCIDENTS' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            ⚠️ គ្រោះថ្នាក់ការងារ & សំណង ប.ស.ស ({initialData.incidents.length})
          </button>

          <button
            onClick={() => setActiveTab('CHECKUP')}
            className="kh-text"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'CHECKUP' ? '#7c3aed' : '#f1f5f9',
              color: activeTab === 'CHECKUP' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            📋 ពិនិត្យសុខភាពប្រចាំឆ្នាំ ({initialData.checkups.length})
          </button>

          <button
            onClick={() => setActiveTab('COMPLIANCE')}
            className="kh-text"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'COMPLIANCE' ? '#0284c7' : '#f1f5f9',
              color: activeTab === 'COMPLIANCE' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            📑 ស្តង់ដារអនុលោមភាព BFC / MoLVT
          </button>
        </div>

        {/* Live Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ស្វែងរក ឈ្មោះ, អត្តលេខ, អាការៈ..."
            className="kh-text"
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              fontSize: '0.82rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* 4. Tab 1: Clinic Visits & Medicine Dispensation */}
      {activeTab === 'CLINIC' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '50px' }}>
                    ល.រ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '110px' }}>
                    លេខកូដពិគ្រោះ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '100px' }}>
                    កាលបរិច្ឆេទ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '200px' }}>
                    បុគ្គលិក / ផ្នែក
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569' }}>
                    អាការៈជំងឺ & សញ្ញាជីវិត
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569' }}>
                    ថ្នាំពេទ្យដែលបានបើកជូន
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '130px' }}>
                    លទ្ធផល / ចំណាត់ការ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '100px' }}>
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClinicVisits.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }} className="kh-text">
                      គ្មានកំណត់ត្រាពិគ្រោះជំងឺទេ (No clinic visits recorded)
                    </td>
                  </tr>
                ) : (
                  filteredClinicVisits.map((visit, idx) => {
                    const emp = visit.employee;
                    const empName = `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn || '';
                    return (
                      <tr
                        key={visit.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                          {visit.visitNumber}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {new Date(visit.visitDate).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{empName}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            ID: <span style={{ fontWeight: 600 }}>{emp.employeeId}</span> • {emp.department || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{visit.symptoms}</div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '0.74rem', color: '#64748b' }}>
                            {visit.temperature && (
                              <span style={{ backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '4px', color: '#92400e' }}>
                                🌡️ {visit.temperature}°C
                              </span>
                            )}
                            {visit.bloodPressure && (
                              <span style={{ backgroundColor: '#eff6ff', padding: '1px 6px', borderRadius: '4px', color: '#1e40af' }}>
                                💓 BP: {visit.bloodPressure}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {visit.medicineDispensed ? (
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: '#ecfdf5',
                                color: '#065f46',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              💊 {visit.medicineDispensed}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>គ្មានបើកថ្នាំ</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {visit.referredHospital ? (
                            <span
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              🚑 បញ្ជូនទៅពេទ្យ
                            </span>
                          ) : visit.sendHome ? (
                            <span
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              🏠 ទៅផ្ទះសម្រាក
                            </span>
                          ) : visit.restMinutes > 0 ? (
                            <span
                              style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              🛏️ សម្រាក {visit.restMinutes} នាទី
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                              }}
                            >
                              ✅ ត្រឡប់ធ្វើការធម្មតា
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              onClick={() => setPrintableVisit(visit)}
                              title="ព្រីនប័ណ្ណពិគ្រោះ / វេជ្ជបញ្ជា"
                              style={{
                                border: 'none',
                                background: '#f1f5f9',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              🖨️
                            </button>
                            <button
                              onClick={() => {
                                setEditingClinicVisit(visit);
                                setClinicForm({
                                  employeeId: visit.employeeId,
                                  visitDate: new Date(visit.visitDate).toISOString().split('T')[0],
                                  symptoms: visit.symptoms,
                                  temperature: visit.temperature ? visit.temperature.toString() : '',
                                  bloodPressure: visit.bloodPressure || '',
                                  diagnosis: visit.diagnosis || '',
                                  treatment: visit.treatment || '',
                                  medicineDispensed: visit.medicineDispensed || '',
                                  restMinutes: visit.restMinutes.toString(),
                                  sendHome: visit.sendHome,
                                  referredHospital: visit.referredHospital,
                                  hospitalName: visit.hospitalName || '',
                                  attendantName: visit.attendantName || '',
                                  notes: visit.notes || '',
                                });
                                setShowClinicModal(true);
                              }}
                              title="កែប្រែ"
                              style={{
                                border: 'none',
                                background: '#f1f5f9',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClinic(visit.id, visit.visitNumber)}
                              title="លុប"
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
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
      )}

      {/* 5. Tab 2: Workplace Incidents & NSSF Claims */}
      {activeTab === 'INCIDENTS' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '50px' }}>
                    ល.រ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '110px' }}>
                    លេខកូដគ្រោះថ្នាក់
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '100px' }}>
                    កាលបរិច្ឆេទ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '190px' }}>
                    បុគ្គលិករងគ្រោះ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '110px' }}>
                    កម្រិតគ្រោះថ្នាក់
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569' }}>
                    ទីតាំង & ប្រភេទរបួស
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '110px' }}>
                    បាត់បង់ការងារ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '180px' }}>
                    សំណង ប.ស.ស (NSSF)
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '100px' }}>
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }} className="kh-text">
                      គ្មានកំណត់ត្រាគ្រោះថ្នាក់ការងារទេ (No workplace incidents recorded)
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc, idx) => {
                    const emp = inc.employee;
                    const empName = `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn || '';
                    const sevColors: Record<string, { bg: string; text: string; label: string }> = {
                      MINOR: { bg: '#ecfdf5', text: '#065f46', label: 'ស្រាល (Minor)' },
                      MODERATE: { bg: '#fef3c7', text: '#92400e', label: 'មធ្យម (Moderate)' },
                      SEVERE: { bg: '#fee2e2', text: '#991b1b', label: 'ធ្ងន់ធ្ងរ (Severe)' },
                      FATAL: { bg: '#4c0519', text: '#ffe4e6', label: 'ស្លាប់ (Fatal)' },
                    };
                    const sev = sevColors[inc.severity] || sevColors.MINOR;

                    return (
                      <tr
                        key={inc.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                          {inc.incidentNumber}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {new Date(inc.incidentDate).toLocaleDateString('en-GB')}{' '}
                          {inc.incidentTime && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{inc.incidentTime}</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{empName}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            ID: <span style={{ fontWeight: 600 }}>{emp.employeeId}</span> • {emp.department || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              backgroundColor: sev.bg,
                              color: sev.text,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                            }}
                          >
                            {sev.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>
                            📍 {inc.location}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '2px' }}>
                            🩹 {inc.injuryType} {inc.bodyPart && `(${inc.bodyPart})`}
                          </div>
                          {inc.description && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>
                              &quot;{inc.description.slice(0, 70)}...&quot;
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {inc.daysLost > 0 ? (
                            <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>
                              {inc.daysLost} ថ្ងៃ
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>0 ថ្ងៃ</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {inc.nssfStatus === 'APPROVED' || inc.nssfStatus === 'PAID' ? (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  ✅ បានអនុម័តសំណង
                                </span>
                              ) : inc.nssfStatus === 'PENDING' ? (
                                <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  ⏳ កំពុងរង់ចាំ ប.ស.ស
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                                  ⚪ មិនទាន់ដាក់ពាក្យ
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedIncidentForNssf(inc);
                                  setNssfForm({
                                    nssfClaimed: inc.nssfClaimed,
                                    nssfCaseNo: inc.nssfCaseNo || '',
                                    nssfStatus: inc.nssfStatus,
                                    nssfCompensationKhr: inc.nssfCompensationKhr ? inc.nssfCompensationKhr.toString() : '0',
                                  });
                                  setShowNssfModal(true);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#0284c7',
                                  cursor: 'pointer',
                                  fontSize: '0.76rem',
                                  textDecoration: 'underline',
                                  padding: 0,
                                }}
                              >
                                កែប្រែ
                              </button>
                            </div>
                            {inc.nssfCaseNo && (
                              <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                                សំណុំរឿង: <b>{inc.nssfCaseNo}</b>
                              </div>
                            )}
                            {inc.nssfCompensationKhr > 0 && (
                              <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                                សំណង: {inc.nssfCompensationKhr.toLocaleString()} ៛
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              onClick={() => {
                                setEditingIncident(inc);
                                setIncidentForm({
                                  employeeId: inc.employeeId,
                                  incidentDate: new Date(inc.incidentDate).toISOString().split('T')[0],
                                  incidentTime: inc.incidentTime || '09:00',
                                  location: inc.location,
                                  severity: inc.severity,
                                  injuryType: inc.injuryType,
                                  bodyPart: inc.bodyPart || '',
                                  description: inc.description,
                                  rootCause: inc.rootCause || '',
                                  correctiveAction: inc.correctiveAction || '',
                                  daysLost: inc.daysLost.toString(),
                                  nssfClaimed: inc.nssfClaimed,
                                  nssfCaseNo: inc.nssfCaseNo || '',
                                  nssfStatus: inc.nssfStatus,
                                  nssfCompensationKhr: inc.nssfCompensationKhr.toString(),
                                  reportedBy: inc.reportedBy || '',
                                  investigatedBy: inc.investigatedBy || '',
                                  notes: inc.notes || '',
                                });
                                setShowIncidentModal(true);
                              }}
                              title="កែប្រែ"
                              style={{
                                border: 'none',
                                background: '#f1f5f9',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteIncident(inc.id, inc.incidentNumber)}
                              title="លុប"
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
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
      )}

      {/* 6. Tab 3: Annual Health Checkup (BFC / MoLVT) */}
      {activeTab === 'CHECKUP' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '50px' }}>
                    ល.រ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '80px', textAlign: 'center' }}>
                    ឆ្នាំពិនិត្យ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '100px' }}>
                    កាលបរិច្ឆេទ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '200px' }}>
                    បុគ្គលិក / ផ្នែក
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', width: '160px' }}>
                    លេខសៀវភៅការងារ
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '130px' }}>
                    លទ្ធផលសុខភាព
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569' }}>
                    សម្ពាធឈាម / គំហើញ / សួត
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#475569', textAlign: 'center', width: '80px' }}>
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }} className="kh-text">
                      គ្មានកំណត់ត្រាពិនិត្យសុខភាពប្រចាំឆ្នាំទេ (No health checkups recorded)
                    </td>
                  </tr>
                ) : (
                  filteredCheckups.map((c, idx) => {
                    const emp = c.employee;
                    const empName = `${emp.firstNameKh || ''} ${emp.lastNameKh || ''}`.trim() || emp.firstNameEn || '';
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#7c3aed', fontSize: '0.85rem' }}>
                          {c.checkupYear}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                          {new Date(c.checkupDate).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{empName}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            ID: <span style={{ fontWeight: 600 }}>{emp.employeeId}</span> • {emp.department || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.82rem' }}>
                            📘 {c.healthBookNumber || 'មិនទាន់មាន'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {c.fitStatus === 'FIT' ? (
                            <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                              ✅ សមស្រប (Fit)
                            </span>
                          ) : c.fitStatus === 'RESTRICTED' ? (
                            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                              ⚠️ សមស្របមានលក្ខខណ្ឌ
                            </span>
                          ) : (
                            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                              ❌ មិនសមស្រប (Unfit)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#475569' }}>
                          <div>BP: <b>{c.bloodPressure || 'N/A'}</b> • គំហើញ: <b>{c.vision || 'N/A'}</b></div>
                          {c.doctorComments && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                              &quot;{c.doctorComments}&quot;
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteCheckup(c.id, empName)}
                            title="លុប"
                            style={{
                              border: 'none',
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Compliance & Better Factories Cambodia (BFC) Audit Checklist */}
      {activeTab === 'COMPLIANCE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Card 1: MoLVT & BFC Infirmary Requirements */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 className="kh-text" style={{ fontSize: '1rem', fontWeight: 700, color: '#065f46', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏥 បទប្បញ្ញត្តិបន្ទប់ពេទ្យ / គ្លីនិករោងចក្រ (MoLVT & BFC)
            </h3>
            <ul className="kh-text" style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.7', color: '#334155' }}>
              <li>រោងចក្រដែលមានកម្មករចាប់ពី <b>៥០ នាក់ឡើងទៅ</b> ត្រូវតែមានបន្ទប់ពេទ្យប្រចាំការ និងសម្ភារៈសង្គ្រោះបឋម (First Aid Kit)។</li>
              <li>ត្រូវមាន <b>គិលានុបដ្ឋាយិកា ឬគ្រូពេទ្យស្របច្បាប់</b> ប្រចាំការរាល់ម៉ោងធ្វើការ។</li>
              <li>រាល់ការពិគ្រោះជំងឺ និងការបើកថ្នាំ ត្រូវកត់ត្រាក្នុង <b>សៀវភៅតាមដានអ្នកជំងឺ</b> (ប្រព័ន្ធនេះកត់ត្រាឌីជីថលស្របច្បាប់)។</li>
              <li>មានគ្រែសម្រាកគ្រប់គ្រាន់ ថ្នាំសង្គ្រោះបឋមមិនផុតកំណត់ និងប្រព័ន្ធបញ្ជូនអ្នកជំងឺបន្ទាន់ (Emergency Ambulance Contact)។</li>
            </ul>
          </div>

          {/* Card 2: Workplace Injury & NSSF Protocol */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 className="kh-text" style={{ fontSize: '1rem', fontWeight: 700, color: '#b91c1c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ នីតិវិធីគ្រោះថ្នាក់ការងារ & សំណង ប.ស.ស
            </h3>
            <ul className="kh-text" style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.7', color: '#334155' }}>
              <li>ពេលមានគ្រោះថ្នាក់ការងារ ត្រូវរាយការណ៍ជូន <b>ប.ស.ស ក្នុងរយៈពេល ៤៨ ម៉ោង</b> យ៉ាងយូរបំផុត។</li>
              <li>និយោជកត្រូវកត់ត្រា <b>មូលហេតុដើម (Root Cause)</b> និងវិធានការកែប្រែការពារកុំឱ្យកើតមានឡើងវិញ។</li>
              <li>កម្មករ-និយោជិតដែលរងគ្រោះថ្នាក់ការងារ មានសិទ្ធិទទួលបាន <b>ការព្យាបាលឥតគិតថ្លៃ ១០០%</b> នៅមន្ទីរពេទ្យដៃគូ ប.ស.ស។</li>
              <li>ទទួលបានប្រាក់បំណាច់ប្រចាំថ្ងៃពេលសម្រាកព្យាបាល និងប្រាក់សោហ៊ុយបូជាសព (ករណីមរណភាព)។</li>
            </ul>
          </div>

          {/* Card 3: Annual Health Checkup Protocol */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 className="kh-text" style={{ fontSize: '1rem', fontWeight: 700, color: '#6d28d9', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 សៀវភៅសុខភាពការងារ & ពិនិត្យសុខភាពប្រចាំឆ្នាំ
            </h3>
            <ul className="kh-text" style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.7', color: '#334155' }}>
              <li>កម្មករនិយោជិតទាំងអស់ត្រូវមាន <b>សៀវភៅសុខភាពការងារ</b> ចេញដោយនាយកដ្ឋានពេទ្យការងារ។</li>
              <li>ត្រូវធ្វើការ <b>ពិនិត្យសុខភាពយ៉ាងតិចម្តងក្នុង ១ ឆ្នាំ</b> ដោយមន្ទីរពេទ្យទទួលស្គាល់ដោយក្រសួង។</li>
              <li>រក្សាទុកឯកសារសុខភាពយ៉ាងតិច <b>៥ ឆ្នាំ</b> សម្រាប់ត្រួតពិនិត្យដោយអធិការកិច្ចការងារ។</li>
            </ul>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 1: CLINIC VISIT (ពិគ្រោះជំងឺ & បើកថ្នាំ) */}
      {/* ================================================= */}
      {showClinicModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
              <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                🩺 {editingClinicVisit ? 'កែប្រែកំណត់ត្រាពិគ្រោះជំងឺ' : 'កត់ត្រាការពិគ្រោះជំងឺ & បើកថ្នាំថ្មី (Clinic Visit)'}
              </h3>
              <button
                onClick={() => setShowClinicModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClinicVisit} style={{ padding: '20px' }}>
              {/* Row 1: Employee Select & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ជ្រើសរើសបុគ្គលិក / កម្មករ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={clinicForm.employeeId}
                    onChange={(e) => setClinicForm({ ...clinicForm, employeeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="">-- ជ្រើសរើសបុគ្គលិក --</option>
                    {initialData.employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameKh} {emp.lastNameKh} ({emp.firstNameEn} {emp.lastNameEn}) - {emp.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    កាលបរិច្ឆេទ
                  </label>
                  <input
                    type="date"
                    value={clinicForm.visitDate}
                    onChange={(e) => setClinicForm({ ...clinicForm, visitDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 2: Symptoms & Quick Tag Suggestions */}
              <div style={{ marginBottom: '14px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  អាការៈជំងឺ (Symptoms) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={clinicForm.symptoms}
                  onChange={(e) => setClinicForm({ ...clinicForm, symptoms: e.target.value })}
                  placeholder="ឧ. ឈឺក្បាល គ្រុនក្តៅ ឈឺពោះ វិលមុខ..."
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {COMMON_SYMPTOMS.map((sym, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addSymptomTag(sym)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      + {sym.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Vital Signs (Temperature & Blood Pressure) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    🌡️ សីតុណ្ហភាព (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={clinicForm.temperature}
                    onChange={(e) => setClinicForm({ ...clinicForm, temperature: e.target.value })}
                    placeholder="36.8"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    💓 សម្ពាធឈាម (Blood Pressure)
                  </label>
                  <input
                    type="text"
                    value={clinicForm.bloodPressure}
                    onChange={(e) => setClinicForm({ ...clinicForm, bloodPressure: e.target.value })}
                    placeholder="120/80"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 4: Medicines Dispensed & Quick Medicines */}
              <div style={{ marginBottom: '14px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  💊 ថ្នាំពេទ្យដែលបានបើកជូន (Medicines Dispensed)
                </label>
                <input
                  type="text"
                  value={clinicForm.medicineDispensed}
                  onChange={(e) => setClinicForm({ ...clinicForm, medicineDispensed: e.target.value })}
                  placeholder="ឧ. Paracetamol 500mg (4 គ្រាប់) + Antacid (2 គ្រាប់)"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {COMMON_MEDICINES.slice(0, 5).map((med, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addMedicineTag(med)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#065f46',
                      }}
                    >
                      + {med.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Bed Rest & Outcome */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    🛏️ រយៈពេលសម្រាកលើគ្រែពេទ្យ (នាទី)
                  </label>
                  <input
                    type="number"
                    value={clinicForm.restMinutes}
                    onChange={(e) => setClinicForm({ ...clinicForm, restMinutes: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }} className="kh-text">
                    <input
                      type="checkbox"
                      checked={clinicForm.sendHome}
                      onChange={(e) => setClinicForm({ ...clinicForm, sendHome: e.target.checked })}
                    />
                    <span>🏠 អនុញ្ញាតឱ្យទៅផ្ទះសម្រាក (ចេញច្បាប់ឈឺ)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }} className="kh-text">
                    <input
                      type="checkbox"
                      checked={clinicForm.referredHospital}
                      onChange={(e) => setClinicForm({ ...clinicForm, referredHospital: e.target.checked })}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>🚑 បញ្ជូនទៅមន្ទីរពេទ្យក្រៅ</span>
                  </label>
                </div>
              </div>

              {clinicForm.referredHospital && (
                <div style={{ marginBottom: '14px' }}>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ឈ្មោះមន្ទីរពេទ្យបញ្ជូនទៅ (Hospital Name)
                  </label>
                  <input
                    type="text"
                    value={clinicForm.hospitalName}
                    onChange={(e) => setClinicForm({ ...clinicForm, hospitalName: e.target.value })}
                    placeholder="ឧ. មន្ទីរពេទ្យបង្អែកពោធិ៍ចិនតុង / មន្ទីរពេទ្យលោកសង្ឃ"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Attendant Name */}
              <div style={{ marginBottom: '20px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  គ្រូពេទ្យ / គិលានុបដ្ឋាយិកាប្រចាំការ
                </label>
                <input
                  type="text"
                  value={clinicForm.attendantName}
                  onChange={(e) => setClinicForm({ ...clinicForm, attendantName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowClinicModal(false)}
                  className="kh-text"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុកកំណត់ត្រា'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: WORKPLACE INCIDENT (រាយការណ៍គ្រោះថ្នាក់) */}
      {/* ================================================= */}
      {showIncidentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2' }}>
              <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#b91c1c' }}>
                ⚠️ {editingIncident ? 'កែប្រែកំណត់ត្រាគ្រោះថ្នាក់' : 'រាយការណ៍គ្រោះថ្នាក់ការងារ (Report Workplace Incident)'}
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIncident} style={{ padding: '20px' }}>
              {/* Row 1: Employee Select & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    បុគ្គលិករងគ្រោះ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={incidentForm.employeeId}
                    onChange={(e) => setIncidentForm({ ...incidentForm, employeeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="">-- ជ្រើសរើសបុគ្គលិក --</option>
                    {initialData.employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameKh} {emp.lastNameKh} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    កាលបរិច្ឆេទ
                  </label>
                  <input
                    type="date"
                    value={incidentForm.incidentDate}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incidentDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ម៉ោងកើតហេតុ
                  </label>
                  <input
                    type="time"
                    value={incidentForm.incidentTime}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incidentTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 2: Location, Severity & Injury Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    📍 ទីតាំងកើតហេតុ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                    placeholder="អគារ A - ខ្សែសង្វាក់ដេរ Line 4"
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    កម្រិតធ្ងន់ធ្ងរ (Severity)
                  </label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="MINOR">🟢 ស្រាល (Minor - បឋមព្យាបាល)</option>
                    <option value="MODERATE">🟡 មធ្យម (Moderate - សម្រាកព្យាបាល)</option>
                    <option value="SEVERE">🔴 ធ្ងន់ធ្ងរ (Severe - បញ្ជូនទៅពេទ្យ)</option>
                    <option value="FATAL">⚫ គ្រោះថ្នាក់ដល់ជីវិត (Fatal)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Injury Type & Body Part */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    🩹 ប្រភេទរបួស (Injury Type)
                  </label>
                  <input
                    type="text"
                    value={incidentForm.injuryType}
                    onChange={(e) => setIncidentForm({ ...incidentForm, injuryType: e.target.value })}
                    placeholder="ដាច់រយះ, មុតម្ជុល, បាក់ឆ្អឹង, រលាក..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ផ្នែករាងកាយ (Body Part)
                  </label>
                  <input
                    type="text"
                    value={incidentForm.bodyPart}
                    onChange={(e) => setIncidentForm({ ...incidentForm, bodyPart: e.target.value })}
                    placeholder="ម្រាមដៃ, ជើង, ក្បាល, ភ្នែក..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '14px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  ការពិពណ៌នាហេតុការណ៍ (Description) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="រៀបរាប់ដំណើររឿងពីរបៀបដែលគ្រោះថ្នាក់បានកើតឡើង..."
                  rows={2}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Root Cause & Corrective Action */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    🔍 មូលហេតុដើម (Root Cause)
                  </label>
                  <textarea
                    value={incidentForm.rootCause}
                    onChange={(e) => setIncidentForm({ ...incidentForm, rootCause: e.target.value })}
                    placeholder="ឧ. មិនពាក់ស្រោមដៃការពារ, ម៉ាស៊ីនខ្វះរបាំង..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    🛡️ វិធានការការពារ (Corrective Action)
                  </label>
                  <textarea
                    value={incidentForm.correctiveAction}
                    onChange={(e) => setIncidentForm({ ...incidentForm, correctiveAction: e.target.value })}
                    placeholder="ឧ. បំពាក់របាំងការពារ និងបណ្តុះបណ្តាលសុវត្ថិភាព..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Days Lost & NSSF claim */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ចំនួនថ្ងៃបាត់បង់ការងារ (Days Lost)
                  </label>
                  <input
                    type="number"
                    value={incidentForm.daysLost}
                    onChange={(e) => setIncidentForm({ ...incidentForm, daysLost: e.target.value })}
                    placeholder="0"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }} className="kh-text">
                    <input
                      type="checkbox"
                      checked={incidentForm.nssfClaimed}
                      onChange={(e) => setIncidentForm({ ...incidentForm, nssfClaimed: e.target.checked })}
                    />
                    <span style={{ fontWeight: 700, color: '#991b1b' }}>🇰🇭 ដាក់ពាក្យទាមទារសំណង ប.ស.ស (Claim NSSF)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="kh-text"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុករបាយការណ៍'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 3: UPDATE NSSF CLAIM STATUS */}
      {/* ================================================= */}
      {showNssfModal && selectedIncidentForNssf && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef3c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="kh-text" style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#92400e' }}>
                🇰🇭 បច្ចុប្បន្នភាពសំណង ប.ស.ស ({selectedIncidentForNssf.incidentNumber})
              </h3>
              <button
                onClick={() => setShowNssfModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateNssf} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  ស្ថានភាពសំណង ប.ស.ស (NSSF Status)
                </label>
                <select
                  value={nssfForm.nssfStatus}
                  onChange={(e) => setNssfForm({ ...nssfForm, nssfStatus: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  <option value="NOT_FILED">⚪ មិនទាន់ដាក់ពាក្យ (Not Filed)</option>
                  <option value="PENDING">⏳ កំពុងដំណើរការ / រង់ចាំ (Pending)</option>
                  <option value="APPROVED">✅ បានអនុម័ត (Approved)</option>
                  <option value="PAID">💵 បានទូទាត់រួចរាល់ (Paid)</option>
                  <option value="REJECTED">❌ បដិសេធ (Rejected)</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  លេខសំណុំរឿង ប.ស.ស (NSSF Case Number)
                </label>
                <input
                  type="text"
                  value={nssfForm.nssfCaseNo}
                  onChange={(e) => setNssfForm({ ...nssfForm, nssfCaseNo: e.target.value })}
                  placeholder="ឧ. NSSF-PP-2026-9812"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  ទឹកប្រាក់សំណងទទួលបាន (រៀល - KHR)
                </label>
                <input
                  type="number"
                  value={nssfForm.nssfCompensationKhr}
                  onChange={(e) => setNssfForm({ ...nssfForm, nssfCompensationKhr: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNssfModal(false)}
                  className="kh-text"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  {loading ? 'រក្សាទុក...' : '💾 រក្សាទុកបច្ចុប្បន្នភាព'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 4: ANNUAL HEALTH CHECKUP */}
      {/* ================================================= */}
      {showCheckupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f5f3ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#6d28d9' }}>
                📋 កត់ត្រាការពិនិត្យសុខភាពប្រចាំឆ្នាំ (Annual Health Checkup)
              </h3>
              <button
                onClick={() => setShowCheckupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCheckup} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ជ្រើសរើសបុគ្គលិក <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={checkupForm.employeeId}
                    onChange={(e) => setCheckupForm({ ...checkupForm, employeeId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="">-- ជ្រើសរើសបុគ្គលិក --</option>
                    {initialData.employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeId} - {emp.firstNameKh} {emp.lastNameKh} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    ឆ្នាំពិនិត្យ
                  </label>
                  <input
                    type="number"
                    value={checkupForm.checkupYear}
                    onChange={(e) => setCheckupForm({ ...checkupForm, checkupYear: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    កាលបរិច្ឆេទពិនិត្យ
                  </label>
                  <input
                    type="date"
                    value={checkupForm.checkupDate}
                    onChange={(e) => setCheckupForm({ ...checkupForm, checkupDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    លេខសៀវភៅការងារ
                  </label>
                  <input
                    type="text"
                    value={checkupForm.healthBookNumber}
                    onChange={(e) => setCheckupForm({ ...checkupForm, healthBookNumber: e.target.value })}
                    placeholder="HB-2026-9912"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    លទ្ធផលសមស្រប (Fit Status)
                  </label>
                  <select
                    value={checkupForm.fitStatus}
                    onChange={(e) => setCheckupForm({ ...checkupForm, fitStatus: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="FIT">✅ សមស្របសម្រាប់ការងារ (Fit for Duty)</option>
                    <option value="RESTRICTED">⚠️ សមស្របដោយមានលក្ខខណ្ឌ (Fit with Restrictions)</option>
                    <option value="UNFIT">❌ មិនទាន់សមស្រប (Unfit)</option>
                  </select>
                </div>
                <div>
                  <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                    សម្ពាធឈាម (BP)
                  </label>
                  <input
                    type="text"
                    value={checkupForm.bloodPressure}
                    onChange={(e) => setCheckupForm({ ...checkupForm, bloodPressure: e.target.value })}
                    placeholder="120/80"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="kh-text" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '5px' }}>
                  យោបល់របស់វេជ្ជបណ្ឌិត (Doctor Comments)
                </label>
                <input
                  type="text"
                  value={checkupForm.doctorComments}
                  onChange={(e) => setCheckupForm({ ...checkupForm, doctorComments: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckupModal(false)}
                  className="kh-text"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kh-text"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#7c3aed', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  {loading ? 'រក្សាទុក...' : '💾 រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 5: PRINTABLE MEDICAL VISIT SLIP */}
      {/* ================================================= */}
      {printableVisit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Slip Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #065f46', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.4rem' }}>🏥</div>
              <h2 className="kh-text" style={{ margin: '4px 0 2px', fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
                ប័ណ្ណពិគ្រោះជំងឺ & វេជ្ជបញ្ជាគ្លីនិករោងចក្រ
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>FACTORY INFIRMARY & PRESCRIPTION SLIP</div>
              <div style={{ marginTop: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                លេខកូដ: {printableVisit.visitNumber} • កាលបរិច្ឆេទ: {new Date(printableVisit.visitDate).toLocaleDateString('en-GB')}
              </div>
            </div>

            {/* Slip Body */}
            <div style={{ fontSize: '0.85rem', lineHeight: '1.7', color: '#334155' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div>
                  ឈ្មោះបុគ្គលិក: <b>{printableVisit.employee.firstNameKh} {printableVisit.employee.lastNameKh}</b>
                </div>
                <div>
                  អត្តលេខ (ID): <b>{printableVisit.employee.employeeId}</b>
                </div>
                <div>
                  ផ្នែក (Dept): <b>{printableVisit.employee.department}</b>
                </div>
                <div>
                  ភេទ: <b>{printableVisit.employee.gender || 'N/A'}</b>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                អាការៈជំងឺ: <b>{printableVisit.symptoms}</b>{' '}
                {printableVisit.temperature && `(កម្តៅ: ${printableVisit.temperature}°C)`}
                {printableVisit.bloodPressure && ` (BP: ${printableVisit.bloodPressure})`}
              </div>

              <div style={{ marginBottom: '8px' }}>
                ថ្នាំដែលបានបើកជូន:{' '}
                <span style={{ color: '#065f46', fontWeight: 700 }}>
                  {printableVisit.medicineDispensed || 'គ្មានបើកថ្នាំ'}
                </span>
              </div>

              <div style={{ marginBottom: '8px' }}>
                លទ្ធផល/ចំណាត់ការ:{' '}
                <b>
                  {printableVisit.sendHome
                    ? 'អនុញ្ញាតឱ្យត្រឡប់ទៅផ្ទះសម្រាក'
                    : printableVisit.referredHospital
                    ? `បញ្ជូនទៅមន្ទីរពេទ្យ (${printableVisit.hospitalName || 'ក្រៅ'})`
                    : printableVisit.restMinutes > 0
                    ? `សម្រាកលើគ្រែពេទ្យ ${printableVisit.restMinutes} នាទី`
                    : 'ត្រឡប់ទៅបំពេញការងារធម្មតា'}
                </b>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '40px' }}>ហត្ថលេខាបុគ្គលិក</div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {printableVisit.employee.firstNameKh} {printableVisit.employee.lastNameKh}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '40px' }}>គ្រូពេទ្យ / គិលានុបដ្ឋាយិកា</div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {printableVisit.attendantName || 'ពេទ្យរោងចក្រ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setPrintableVisit(null)}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                បិទ (Close)
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#065f46', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                🖨️ បោះពុម្ព (Print)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
