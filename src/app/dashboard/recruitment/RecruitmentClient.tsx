'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements?: string | null;
  status: string;
  closingDate?: string | null;
  createdAt: string;
  _count?: {
    candidates: number;
  };
}

interface Candidate {
  id: string;
  jobPostingId: string;
  jobPosting?: {
    id: string;
    title: string;
    department: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  status: string;
  notes?: string | null;
  rating?: number | null;
  appliedAt: string;
}

interface Props {
  initialJobs: JobPosting[];
  initialCandidates: Candidate[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; labelKh: string }> = {
  OPEN: { bg: '#e8f5e9', text: '#2e7d32', labelKh: 'បើកទទួល (Open)' },
  CLOSED: { bg: '#ffebee', text: '#c62828', labelKh: 'បិទទទួល (Closed)' },
  DRAFT: { bg: '#fff3e0', text: '#ef6c00', labelKh: 'ព្រាង (Draft)' },
  
  NEW: { bg: '#e0f2fe', text: '#0284c7', labelKh: 'ទើបដាក់ពាក្យ (New)' },
  REVIEWING: { bg: '#fef3c7', text: '#d97706', labelKh: 'កំពុងត្រួតពិនិត្យ (Reviewing)' },
  INTERVIEWING: { bg: '#ede9fe', text: '#7c3aed', labelKh: 'សម្ភាសន៍ (Interviewing)' },
  OFFERED: { bg: '#fbcfe8', text: '#db2777', labelKh: 'ផ្តល់សំណើរ (Offered)' },
  HIRED: { bg: '#dcfce7', text: '#15803d', labelKh: 'ជាប់ជាស្ថាពរ (Hired)' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c', labelKh: 'មិនជាប់ (Rejected)' },
};

export default function RecruitmentClient({ initialJobs, initialCandidates }: Props) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('ALL');
  const [candidateJobFilter, setCandidateJobFilter] = useState('ALL');

  // Job Modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: 'Phnom Penh',
    type: 'FULL_TIME',
    status: 'OPEN',
    closingDate: '',
    description: '',
    requirements: '',
  });

  // Candidate Modal state
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    jobPostingId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
    status: 'NEW',
    notes: '',
    rating: '5',
  });

  // --- Metrics ---
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'OPEN').length;
  const totalCandidates = candidates.length;
  const hiredCandidates = candidates.filter(c => c.status === 'HIRED').length;

  // --- Handlers for Jobs ---
  const openCreateJobModal = () => {
    setEditingJob(null);
    setJobForm({
      title: '',
      department: '',
      location: 'Phnom Penh',
      type: 'FULL_TIME',
      status: 'OPEN',
      closingDate: '',
      description: '',
      requirements: '',
    });
    setShowJobModal(true);
  };

  const openEditJobModal = (job: JobPosting) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      status: job.status,
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split('T')[0] : '',
      description: job.description,
      requirements: job.requirements || '',
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/recruitment/jobs';
      const method = editingJob ? 'PUT' : 'POST';
      const payload = editingJob ? { id: editingJob.id, ...jobForm } : jobForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save job');

      const data = await res.json();
      if (editingJob) {
        setJobs(jobs.map(j => (j.id === data.id ? { ...data, _count: j._count } : j)));
        Swal.fire({ icon: 'success', title: 'បានកែប្រែដោយជោគជ័យ!', timer: 1500, showConfirmButton: false });
      } else {
        setJobs([{ ...data, _count: { candidates: 0 } }, ...jobs]);
        Swal.fire({ icon: 'success', title: 'បានបង្កើតការប្រកាសថ្មី!', timer: 1500, showConfirmButton: false });
      }

      setShowJobModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: `តើអ្នកពិតជាចង់លុបការប្រកាស "${title}" មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'បាទ/ចាស, លុបវា!',
      cancelButtonText: 'បោះបង់',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/recruitment/jobs?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete job');
        setJobs(jobs.filter(j => j.id !== id));
        setCandidates(candidates.filter(c => c.jobPostingId !== id));
        Swal.fire({ icon: 'success', title: 'បានលុបដោយជោគជ័យ!', timer: 1500, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
      }
    }
  };

  // --- Handlers for Candidates ---
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm),
      });

      if (!res.ok) throw new Error('Failed to add candidate');

      const data = await res.json();
      const job = jobs.find(j => j.id === candidateForm.jobPostingId);
      const newCand: Candidate = {
        ...data,
        jobPosting: job ? { id: job.id, title: job.title, department: job.department } : undefined,
      };

      setCandidates([newCand, ...candidates]);
      setJobs(jobs.map(j => (j.id === candidateForm.jobPostingId ? { ...j, _count: { candidates: (j._count?.candidates || 0) + 1 } } : j)));
      
      Swal.fire({ icon: 'success', title: 'បានបញ្ចូលបេក្ខជនដោយជោគជ័យ!', timer: 1500, showConfirmButton: false });
      setShowCandidateModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'មានបញ្ហា!', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/recruitment/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setCandidates(candidates.map(c => (c.id === id ? { ...c, status: newStatus } : c)));
      Swal.fire({ icon: 'success', title: 'បានប្តូរស្ថានភាព!', timer: 1000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
    }
  };

  const handleDeleteCandidate = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'លុបបេក្ខជន?',
      text: `តើអ្នកចង់លុបទិន្នន័យរបស់ "${name}" មែនទេ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'លុប',
      cancelButtonText: 'បោះបង់',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/recruitment/candidates?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete candidate');
        setCandidates(candidates.filter(c => c.id !== id));
        Swal.fire({ icon: 'success', title: 'បានលុបរួចរាល់!', timer: 1500, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'បរាជ័យ!', text: err.message });
      }
    }
  };

  // Filtered lists
  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.department.toLowerCase().includes(jobSearch.toLowerCase());
    const matchStatus = jobStatusFilter === 'ALL' || j.status === jobStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredCandidates = candidates.filter(c => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchSearch = fullName.includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchStatus = candidateStatusFilter === 'ALL' || c.status === candidateStatusFilter;
    const matchJob = candidateJobFilter === 'ALL' || c.jobPostingId === candidateJobFilter;
    return matchSearch && matchStatus && matchJob;
  });

  return (
    <div style={{ fontFamily: 'var(--font-khmer, inherit)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            📢 ការជ្រើសរើសបុគ្គលិក (Recruitment & ATS)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            គ្រប់គ្រងការប្រកាសរើសបុគ្គលិក និងតាមដានបេក្ខជនដាក់ពាក្យក្នុងប្រព័ន្ធ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'jobs' ? (
            <button
              onClick={openCreateJobModal}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
              }}
            >
              ➕ បង្កើតការប្រកាសថ្មី (Post Job)
            </button>
          ) : (
            <button
              onClick={() => {
                if (jobs.length === 0) {
                  Swal.fire({ icon: 'info', title: 'សូមបង្កើត Job Posting ជាមុនសិន!' });
                  return;
                }
                setCandidateForm({
                  jobPostingId: jobs[0].id,
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  resumeUrl: '',
                  coverLetter: '',
                  status: 'NEW',
                  notes: '',
                  rating: '5',
                });
                setShowCandidateModal(true);
              }}
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
              }}
            >
              ➕ បញ្ចូលបេក្ខជន (Add Candidate)
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>ការប្រកាសសរុប (Total Jobs)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginTop: '6px' }}>{totalJobs}</div>
        </div>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 600 }}>កំពុងបើកទទួល (Active Openings)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#15803d', marginTop: '6px' }}>{openJobs}</div>
        </div>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 600 }}>បេក្ខជនសរុប (Total Candidates)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>{totalCandidates}</div>
        </div>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600 }}>ជាប់ជាស្ថាពរ (Hired)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7c3aed', marginTop: '6px' }}>{hiredCandidates}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('jobs')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'jobs' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'jobs' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📌 ដំណឹងជ្រើសរើសការងារ ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'candidates' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'candidates' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          👥 បេក្ខជន & ដំណាក់កាលវាយតម្លៃ ({candidates.length})
        </button>
      </div>

      {/* Tab 1: Job Postings */}
      {activeTab === 'jobs' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="ស្វែងរកតាមចំណងជើង ឬផ្នែក (Search job / department)..."
              value={jobSearch}
              onChange={e => setJobSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
              }}
            />
            <select
              value={jobStatusFilter}
              onChange={e => setJobStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់ស្ថានភាព (All Status)</option>
              <option value="OPEN">កំពុងបើក (Open)</option>
              <option value="CLOSED">បានបិទ (Closed)</option>
              <option value="DRAFT">ព្រាង (Draft)</option>
            </select>
          </div>

          {/* Jobs Grid */}
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
              <h3 style={{ margin: 0, color: '#475569' }}>មិនទាន់មានការប្រកាសការងារនៅឡើយទេ</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>ចុចប៊ូតុង "បង្កើតការប្រកាសថ្មី" ដើម្បីចាប់ផ្ដើម</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {filteredJobs.map(job => {
                const badge = STATUS_COLORS[job.status] || STATUS_COLORS.OPEN;
                return (
                  <div
                    key={job.id}
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>{job.title}</h3>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badge.labelKh}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', color: '#64748b', fontSize: '0.85rem', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span>🏢 {job.department}</span>
                        <span>📍 {job.location}</span>
                        <span>⏱️ {job.type}</span>
                      </div>

                      {job.description && (
                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 14px 0', maxHeight: '72px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
                        👥 បេក្ខជន៖ {job._count?.candidates || 0} នាក់
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditJobModal(job)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#334155',
                          }}
                        >
                          ✏️ កែប្រែ
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#dc2626',
                          }}
                        >
                          🗑️ លុប
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidate Pipeline & Tracking */}
      {activeTab === 'candidates' && (
        <div>
          {/* Candidate Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="ស្វែងរកឈ្មោះ ឬអ៊ីមែលបេក្ខជន (Search candidate name/email)..."
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
              }}
            />

            <select
              value={candidateJobFilter}
              onChange={e => setCandidateJobFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់មុខតំណែង (All Jobs)</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>

            <select
              value={candidateStatusFilter}
              onChange={e => setCandidateStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                background: '#fff',
              }}
            >
              <option value="ALL">គ្រប់ដំណាក់កាល (All Stages)</option>
              <option value="NEW">ទើបដាក់ពាក្យ (New)</option>
              <option value="REVIEWING">កំពុងត្រួតពិនិត្យ (Reviewing)</option>
              <option value="INTERVIEWING">សម្ភាសន៍ (Interviewing)</option>
              <option value="OFFERED">ផ្តល់សំណើរ (Offered)</option>
              <option value="HIRED">ជាប់ជាស្ថាពរ (Hired)</option>
              <option value="REJECTED">មិនជាប់ (Rejected)</option>
            </select>
          </div>

          {/* Candidates Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 18px' }}>បេក្ខជន (Candidate)</th>
                  <th style={{ padding: '14px 18px' }}>មុខតំណែង (Job Applied)</th>
                  <th style={{ padding: '14px 18px' }}>ទំនាក់ទំនង (Contact)</th>
                  <th style={{ padding: '14px 18px' }}>ស្ថានភាព (Status)</th>
                  <th style={{ padding: '14px 18px' }}>ពិន្ទុ (Rating)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>សកម្មភាព (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      មិនមានបេក្ខជនក្នុងលក្ខខណ្ឌនេះទេ
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map(c => {
                    const badge = STATUS_COLORS[c.status] || STATUS_COLORS.NEW;
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {c.firstName} {c.lastName}
                          </div>
                          {c.resumeUrl && (
                            <a
                              href={c.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              📄 មើល CV / Resume
                            </a>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          <div style={{ fontWeight: 500 }}>{c.jobPosting?.title || 'N/A'}</div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.jobPosting?.department}</span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          <div>📧 {c.email}</div>
                          {c.phone && <div>📞 {c.phone}</div>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <select
                            value={c.status}
                            onChange={e => handleUpdateCandidateStatus(c.id, e.target.value)}
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="NEW">NEW - ទើបដាក់ពាក្យ</option>
                            <option value="REVIEWING">REVIEWING - កំពុងពិនិត្យ</option>
                            <option value="INTERVIEWING">INTERVIEWING - សម្ភាសន៍</option>
                            <option value="OFFERED">OFFERED - ផ្តល់ការងារ</option>
                            <option value="HIRED">HIRED - ជាប់ជាស្ថាពរ</option>
                            <option value="REJECTED">REJECTED - មិនជាប់</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: '#eab308', fontWeight: 600 }}>
                            {'⭐'.repeat(c.rating || 5)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteCandidate(c.id, `${c.firstName} ${c.lastName}`)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              color: '#dc2626',
                              fontWeight: 600,
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

      {/* Modal: Job Posting Form */}
      {showJobModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 18px 0', fontSize: '1.3rem', color: '#1e293b' }}>
              {editingJob ? '✏️ កែប្រែការប្រកាសរើសបុគ្គលិក' : '➕ បង្កើតការប្រកាសរើសបុគ្គលិកថ្មី'}
            </h2>

            <form onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ចំណងជើងមុខតំណែង (Job Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. Senior HR Officer / Accountant..."
                  value={jobForm.title}
                  onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ផ្នែក / ដេប៉ាតឺម៉ង់ (Department) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. HR, Accounting, IT..."
                    value={jobForm.department}
                    onChange={e => setJobForm({ ...jobForm, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ទីតាំង (Location)
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ប្រភេទការងារ (Job Type)
                  </label>
                  <select
                    value={jobForm.type}
                    onChange={e => setJobForm({ ...jobForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="FULL_TIME">ពេញម៉ោង (Full Time)</option>
                    <option value="PART_TIME">ក្រៅម៉ោង (Part Time)</option>
                    <option value="CONTRACT">កិច្ចសន្យា (Contract)</option>
                    <option value="INTERNSHIP">កម្មសិក្សា (Internship)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ស្ថានភាព (Status)
                  </label>
                  <select
                    value={jobForm.status}
                    onChange={e => setJobForm({ ...jobForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="OPEN">កំពុងបើក (Open)</option>
                    <option value="CLOSED">បានបិទ (Closed)</option>
                    <option value="DRAFT">ព្រាង (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  កាលបរិច្ឆេទផុតកំណត់ (Closing Date)
                </label>
                <input
                  type="date"
                  value={jobForm.closingDate}
                  onChange={e => setJobForm({ ...jobForm, closingDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ការពិពណ៌នាការងារ (Job Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="រៀបរាប់ពីតួនាទី និងភារកិច្ច..."
                  value={jobForm.description}
                  onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  លក្ខខណ្ឌតម្រូវ (Requirements)
                </label>
                <textarea
                  rows={3}
                  placeholder="លក្ខខណ្ឌជ្រើសរើស (ឧ. បទពិសោធន៍, កម្រិតវប្បធម៌...)"
                  value={jobForm.requirements}
                  onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Candidate Form */}
      {showCandidateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 18px 0', fontSize: '1.3rem', color: '#1e293b' }}>
              ➕ បញ្ចូលបេក្ខជនដាក់ពាក្យ (Add Candidate)
            </h2>

            <form onSubmit={handleSaveCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  ជ្រើសរើសមុខតំណែង (Job Applied) *
                </label>
                <select
                  required
                  value={candidateForm.jobPostingId}
                  onChange={e => setCandidateForm({ ...candidateForm, jobPostingId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    នាមខ្លួន (First Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateForm.firstName}
                    onChange={e => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    គោត្តនាម (Last Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateForm.lastName}
                    onChange={e => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    អ៊ីមែល (Email) *
                  </label>
                  <input
                    type="email"
                    required
                    value={candidateForm.email}
                    onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    លេខទូរស័ព្ទ (Phone)
                  </label>
                  <input
                    type="text"
                    value={candidateForm.phone}
                    onChange={e => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  តំណភ្ជាប់ CV / Resume (Google Drive, Dropbox, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={candidateForm.resumeUrl}
                  onChange={e => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ដំណាក់កាលដំបូង (Initial Status)
                  </label>
                  <select
                    value={candidateForm.status}
                    onChange={e => setCandidateForm({ ...candidateForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="NEW">NEW - ទើបដាក់ពាក្យ</option>
                    <option value="REVIEWING">REVIEWING - កំពុងពិនិត្យ</option>
                    <option value="INTERVIEWING">INTERVIEWING - សម្ភាសន៍</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    ការវាយតម្លៃពិន្ទុ (Rating)
                  </label>
                  <select
                    value={candidateForm.rating}
                    onChange={e => setCandidateForm({ ...candidateForm, rating: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 ផ្កាយ)</option>
                    <option value="4">⭐⭐⭐⭐ (4 ផ្កាយ)</option>
                    <option value="3">⭐⭐⭐ (3 ផ្កាយ)</option>
                    <option value="2">⭐⭐ (2 ផ្កាយ)</option>
                    <option value="1">⭐ (1 ផ្កាយ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  កំណត់សម្គាល់ (HR Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="ចំណាំបន្ថែមលើបេក្ខជន..."
                  value={candidateForm.notes}
                  onChange={e => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? 'កំពុងបញ្ចូល...' : 'បញ្ចូលបេក្ខជន'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
