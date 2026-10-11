'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface CompanyAnnouncement {
  id: string;
  title: string;
  content: string;
  category: string;
  targetDept: string;
  priority: string;
  isPinned: boolean;
  effectiveDate: string;
  expiryDate?: string | null;
  authorName: string;
  attachmentUrl?: string | null;
  viewsCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialAnnouncements: CompanyAnnouncement[];
  departments: string[];
  userRole?: string;
}

const CATEGORY_CONFIG: Record<string, { labelKh: string; labelEn: string; labelZh: string; icon: string; bg: string; text: string }> = {
  GENERAL: { labelKh: 'ទូទៅ', labelEn: 'General', labelZh: '综合通知', icon: '📢', bg: '#e0f2fe', text: '#0369a1' },
  HOLIDAY: { labelKh: 'ឈប់សម្រាកបុណ្យជាតិ', labelEn: 'Public Holiday', labelZh: '节假日', icon: '🏖️', bg: '#dcfce7', text: '#15803d' },
  URGENT: { labelKh: 'បន្ទាន់/សំខាន់', labelEn: 'Urgent Notice', labelZh: '紧急通报', icon: '🚨', bg: '#fee2e2', text: '#dc2626' },
  EVENT: { labelKh: 'កម្មវិធី & ជប់លៀង', labelEn: 'Company Event', labelZh: '公司活动', icon: '🎉', bg: '#fef3c7', text: '#b45309' },
  POLICY: { labelKh: 'គោលការណ៍ផ្ទៃក្នុង', labelEn: 'Company Policy', labelZh: '政策规章', icon: '📜', bg: '#f3e8ff', text: '#7e22ce' }
};

const PRIORITY_CONFIG: Record<string, { labelKh: string; labelEn: string; color: string; badgeBg: string }> = {
  URGENT: { labelKh: 'បន្ទាន់បំផុត', labelEn: 'Urgent', color: '#dc2626', badgeBg: '#fee2e2' },
  HIGH: { labelKh: 'អាទិភាពខ្ពស់', labelEn: 'High Priority', color: '#ea580c', badgeBg: '#ffedd5' },
  NORMAL: { labelKh: 'ធម្មតា', labelEn: 'Normal', color: '#2563eb', badgeBg: '#eff6ff' },
  LOW: { labelKh: 'កម្រិតទាប', labelEn: 'Low Priority', color: '#64748b', badgeBg: '#f1f5f9' }
};

export default function AnnouncementClient({
  initialAnnouncements,
  departments,
  userRole = 'ADMIN'
}: Props) {
  const isHR = userRole === 'ADMIN' || userRole === 'HR_MANAGER' || userRole === 'HR';

  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>(initialAnnouncements);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'feed' | 'table'>('feed');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CompanyAnnouncement | null>(null);
  const [printNotice, setPrintNotice] = useState<CompanyAnnouncement | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    targetDept: 'ALL',
    priority: 'NORMAL',
    isPinned: false,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    authorName: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
    status: 'PUBLISHED'
  });

  // Filtered Announcements
  const filtered = useMemo(() => {
    return announcements.filter(item => {
      const matchesSearch = !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        item.authorName.toLowerCase().includes(search.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesPri = priorityFilter === 'ALL' || item.priority === priorityFilter;
      const matchesDept = deptFilter === 'ALL' || item.targetDept === deptFilter || item.targetDept === 'ALL';

      return matchesSearch && matchesCat && matchesPri && matchesDept;
    });
  }, [announcements, search, categoryFilter, priorityFilter, deptFilter]);

  // Statistics
  const stats = useMemo(() => {
    let urgent = 0;
    let holidays = 0;
    let pinned = 0;

    announcements.forEach(a => {
      if (a.priority === 'URGENT' || a.priority === 'HIGH') urgent++;
      if (a.category === 'HOLIDAY') holidays++;
      if (a.isPinned) pinned++;
    });

    return {
      total: announcements.length,
      urgent,
      holidays,
      pinned
    };
  }, [announcements]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      content: '',
      category: 'GENERAL',
      targetDept: 'ALL',
      priority: 'NORMAL',
      isPinned: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      authorName: 'ការិយាល័យធនធានមនុស្ស (HR Dept)',
      status: 'PUBLISHED'
    });
    setShowModal(true);
  };

  // Open Edit
  const handleOpenEdit = (item: CompanyAnnouncement) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      targetDept: item.targetDept,
      priority: item.priority,
      isPinned: item.isPinned,
      effectiveDate: new Date(item.effectiveDate).toISOString().split('T')[0],
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      authorName: item.authorName,
      status: item.status
    });
    setShowModal(true);
  };

  // Toggle Pin
  const handleTogglePin = async (item: CompanyAnnouncement) => {
    if (!isHR) return;
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isPinned: !item.isPinned
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete
  const handleDelete = async (item: CompanyAnnouncement) => {
    const result = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ? (Are you sure?)',
      text: `ចង់លុបសេចក្តីជូនដំណឹង "${item.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'បាទ/ចាស លុប (Yes, Delete)',
      cancelButtonText: 'បោះបង់'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/announcements?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== item.id));
        Swal.fire({
          icon: 'success',
          title: 'បានលុប (Deleted)',
          timer: 1200,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      Swal.fire('Warning', 'សូមបំពេញចំណងជើង និងខ្លឹមសារសេចក្តីជូនដំណឹង', 'warning');
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingItem);
      const url = '/api/announcements';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { id: editingItem!.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const savedData: CompanyAnnouncement = await res.json();

      if (isEditing) {
        setAnnouncements(prev => prev.map(a => a.id === savedData.id ? savedData : a));
      } else {
        setAnnouncements(prev => [savedData, ...prev]);
      }

      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ (Saved)',
        text: isEditing ? 'បានកែប្រែសេចក្តីជូនដំណឹងរួចរាល់' : 'បានផ្សព្វផ្សាយសេចក្តីជូនដំណឹងថ្មីដោយជោគជ័យ',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit helper for Excel exports
  const autoFitColumns = (data: any[]) => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.max(maxLen + 4, 16) };
    });
  };

  // Export to Excel with 3-language headers
  const exportToExcel = () => {
    try {
      const exportData = filtered.map((item, index) => {
        const catConf = CATEGORY_CONFIG[item.category] || { labelKh: item.category, labelEn: item.category, labelZh: item.category };
        const priConf = PRIORITY_CONFIG[item.priority] || { labelKh: item.priority, labelEn: item.priority };

        return {
          'ល.រ\nNo.\n序号': index + 1,
          'ចំណងជើង\nTitle\n公告标题': item.title,
          'ប្រភេទ\nCategory\n公告类别': `${catConf.labelKh} (${catConf.labelEn} / ${catConf.labelZh})`,
          'កម្រិតអាទិភាព\nPriority\n优先级': `${priConf.labelKh} (${priConf.labelEn})`,
          'ផ្នែកទទួល\nTarget Dept\n送达部门': item.targetDept === 'ALL' ? 'បុគ្គលិកទាំងអស់ (All)' : item.targetDept,
          'កាលបរិច្ឆេទប្រសិទ្ធភាព\nEffective Date\n生效日期': new Date(item.effectiveDate).toISOString().split('T')[0],
          'អ្នកផ្សព្វផ្សាយ\nPublished By\n发布人': item.authorName,
          'ស្ថានភាព\nStatus\n状态': item.status,
          'ចំនួនចូលមើល\nViews\n浏览量': item.viewsCount,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = autoFitColumns(exportData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Announcements');
      XLSX.writeFile(wb, `Company_Announcements_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'ទាញយកជោគជ័យ (Exported)',
        text: 'ឯកសារ Excel ត្រូវបានទាញយករួចរាល់!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        background: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>📣</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              សេចក្តីជូនដំណឹង និងសេចក្តីប្រកាស
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
              Company Broadcast Notices, Holidays & Policy Updates • 公司公告、节假日通知与规章制度
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Switch View Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('feed')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'feed' ? '#ffffff' : 'transparent',
                color: viewMode === 'feed' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'feed' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              📰 ក្តារព័ត៌មាន (Feed)
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              📋 តារាង (Table)
            </button>
          </div>

          {isHR && (
            <button
              onClick={handleOpenCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <span>➕</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>ប្រកាសព័ត៌មានថ្មី</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>New Notice • 发布新公告</div>
              </div>
            </button>
          )}

          <button
            onClick={exportToExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <span>📥</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div>ទាញយក Excel</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Export Excel • 导出表格</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3-Language Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📢
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>សេចក្តីជូនដំណឹងសរុប</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Announcements • 公告总数</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Card 2: Urgent */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🚨
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បន្ទាន់/សំខាន់</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Urgent & High • 紧急重要</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
              {stats.urgent}
            </div>
          </div>
        </div>

        {/* Card 3: Holidays */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🏖️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>ថ្ងៃឈប់សម្រាក</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Holidays & Off • 节假日放假</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.holidays}
            </div>
          </div>
        </div>

        {/* Card 4: Pinned */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📌
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>បានបិទភ្ជាប់លើគេ</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Pinned Notices • 置顶公告</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
              {stats.pinned}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="ស្វែងរកចំណងជើង ឬខ្លឹមសារ (Search)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">💡 គ្រប់ប្រភេទ (All Categories)</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.labelKh}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">⚡ គ្រប់អាទិភាព (All Priorities)</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.labelKh}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value="ALL">🏢 គ្រប់ផ្នែក (All Departments)</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FEED VIEW (Notice Board Cards) */}
      {viewMode === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📣</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>មិនមានសេចក្តីជូនដំណឹងត្រូវបង្ហាញទេ</div>
              <div style={{ fontSize: '0.85rem' }}>No announcements found matching the filter</div>
            </div>
          ) : (
            filtered.map(item => {
              const catConf = CATEGORY_CONFIG[item.category] || { labelKh: item.category, labelEn: item.category, icon: '📢', bg: '#f1f5f9', text: '#475569' };
              const priConf = PRIORITY_CONFIG[item.priority] || { labelKh: item.priority, labelEn: item.priority, color: '#64748b', badgeBg: '#f1f5f9' };

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: item.isPinned ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    boxShadow: item.isPinned ? '0 8px 24px rgba(59, 130, 246, 0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Top Badges Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Pinned Pill */}
                      {item.isPinned && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fef3c7',
                          color: '#b45309',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: '1px solid #fde68a'
                        }}>
                          📌 បិទភ្ជាប់លើគេ (Pinned)
                        </span>
                      )}

                      {/* Category Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: catConf.bg,
                        color: catConf.text,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        <span>{catConf.icon}</span>
                        <span>{catConf.labelKh}</span>
                      </span>

                      {/* Priority Badge */}
                      <span style={{
                        background: priConf.badgeBg,
                        color: priConf.color,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        {priConf.labelKh}
                      </span>

                      {/* Target Dept */}
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        🏢 {item.targetDept === 'ALL' ? 'បុគ្គលិកទាំងអស់' : item.targetDept}
                      </span>
                    </div>

                    {/* Published Date */}
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      កាលបរិច្ឆេទ: <strong>{new Date(item.effectiveDate).toISOString().split('T')[0]}</strong>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                    {item.title}
                  </h2>

                  {/* Content Body */}
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#334155',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {item.content}
                  </div>

                  {/* Footer Action & Author */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '12px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      ផ្សព្វផ្សាយដោយ: <strong>{item.authorName}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Print Notice Slip */}
                      <button
                        onClick={() => setPrintNotice(item)}
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#16a34a',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}
                      >
                        🖨️ បោះពុម្ពសេចក្តីប្រកាស (Print)
                      </button>

                      {isHR && (
                        <>
                          <button
                            onClick={() => handleTogglePin(item)}
                            title={item.isPinned ? 'ដោះចេញពីលើគេ' : 'បិទភ្ជាប់លើគេ'}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.82rem'
                            }}
                          >
                            {item.isPinned ? '📍 ដោះ Pin' : '📌 Pin'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="កែប្រែ"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="លុប"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE VIEW (3-Languages on All TH) */}
      {viewMode === 'table' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {/* 1: No */}
                  <th style={{ padding: '14px 16px', width: '60px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ល.រ</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>No.</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>序号</div>
                  </th>

                  {/* 2: Title */}
                  <th style={{ padding: '14px 16px', minWidth: '240px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ចំណងជើងសេចក្តីប្រកាស</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Announcement Title</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>公告标题</div>
                  </th>

                  {/* 3: Category */}
                  <th style={{ padding: '14px 16px', minWidth: '160px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ប្រភេទ</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Category</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>类别</div>
                  </th>

                  {/* 4: Priority */}
                  <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>កម្រិតអាទិភាព</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Priority</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>优先级</div>
                  </th>

                  {/* 5: Target Dept */}
                  <th style={{ padding: '14px 16px', minWidth: '150px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>ផ្នែកទទួល</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Target Dept</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>送达部门</div>
                  </th>

                  {/* 6: Date */}
                  <th style={{ padding: '14px 16px', minWidth: '130px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>កាលបរិច្ឆេទ</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Effective Date</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>生效日期</div>
                  </th>

                  {/* 7: Actions */}
                  <th style={{ padding: '14px 16px', minWidth: '160px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>សកម្មភាព</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Actions</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>操作</div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>📣</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>មិនមានសេចក្តីជូនដំណឹងត្រូវបង្ហាញទេ</div>
                      <div style={{ fontSize: '0.85rem' }}>No announcements found</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => {
                    const catConf = CATEGORY_CONFIG[item.category] || { labelKh: item.category, labelEn: item.category, icon: '📢', bg: '#f1f5f9', text: '#475569' };
                    const priConf = PRIORITY_CONFIG[item.priority] || { labelKh: item.priority, labelEn: item.priority, color: '#64748b', badgeBg: '#f1f5f9' };

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: index % 2 === 0 ? '#ffffff' : '#fcfcfd',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Index */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>
                          {index + 1}
                        </td>

                        {/* Title */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.isPinned && <span title="Pinned">📌</span>}
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{item.title}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            ដោយ: {item.authorName}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: catConf.bg,
                            color: catConf.text,
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            <span>{catConf.icon}</span>
                            <span>{catConf.labelKh}</span>
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: priConf.badgeBg,
                            color: priConf.color,
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}>
                            {priConf.labelKh}
                          </span>
                        </td>

                        {/* Target Dept */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                          {item.targetDept === 'ALL' ? 'បុគ្គលិកទាំងអស់' : item.targetDept}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#334155' }}>
                          {new Date(item.effectiveDate).toISOString().split('T')[0]}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setPrintNotice(item)}
                              title="បោះពុម្ព (Print)"
                              style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#16a34a',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🖨️
                            </button>
                            {isHR && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  title="កែប្រែ"
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  title="លុប"
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  🗑️
                                </button>
                              </>
                            )}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingItem ? 'កែប្រែសេចក្តីជូនដំណឹង' : 'ផ្សព្វផ្សាយសេចក្តីជូនដំណឹងថ្មី'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#bae6fd', marginTop: '4px' }}>
                  {editingItem ? 'Edit Company Announcement' : 'Broadcast Company Announcement • 发布公司公告'}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ចំណងជើងសេចក្តីប្រកាស (Announcement Title) *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. សេចក្តីជូនដំណឹងស្តីពីការឈប់សម្រាកបុណ្យភ្ជុំបិណ្ឌ..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Category & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ប្រភេទ (Category) *
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.labelKh}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    កម្រិតអាទិភាព (Priority) *
                  </label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.labelKh} ({v.labelEn})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Dept & Effective Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    ផ្នែកទទួល (Target Audience) *
                  </label>
                  <select
                    value={form.targetDept}
                    onChange={e => setForm({ ...form, targetDept: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="ALL">🏢 បុគ្គលិកទាំងអស់ (All Departments)</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    កាលបរិច្ឆេទផ្សាយ (Effective Date) *
                  </label>
                  <input
                    type="date"
                    value={form.effectiveDate}
                    onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                  ខ្លឹមសារសេចក្តីជូនដំណឹង (Content Details) *
                </label>
                <textarea
                  rows={6}
                  placeholder="សរសេរខ្លឹមសារលម្អិតនៃសេចក្តីជូនដំណឹង..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Author & Pin to Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    អ្នកផ្សព្វផ្សាយ (Published By)
                  </label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={e => setForm({ ...form, authorName: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    📌 បិទភ្ជាប់លើគេ (Pin to Top)
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {loading ? 'កំពុងរក្សាទុក...' : '📢 ផ្សព្វផ្សាយ (Publish)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Notice Slip */}
      {printNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '94vh',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Top Toolbar */}
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '14px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📣</span>
                <span>ទម្រង់សេចក្តីប្រកាសផ្លូវការ (Official Announcement Notice)</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#22c55e',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  🖨️ បោះពុម្ព (Print)
                </button>
                <button
                  onClick={() => setPrintNotice(null)}
                  style={{
                    background: '#334155',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  ✕ បិទ
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div style={{
              padding: '50px 60px',
              overflowY: 'auto',
              background: '#ffffff',
              color: '#000000',
              fontFamily: 'serif',
              lineHeight: 1.8
            }}>
              {/* National Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a' }}>
                  ព្រះរាជាណាចក្រកម្ពុជា
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  ជាតិ សាសនា ព្រះមហាក្សត្រ
                </div>
                <div style={{ letterSpacing: '4px', fontSize: '12px', marginTop: '4px' }}>❖ ❖ ❖</div>
              </div>

              {/* Company Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>ក្រុមហ៊ុន / ស្ថាប័ន (COMPANY HRM SYSTEM)</div>
                  <div style={{ fontSize: '0.88rem' }}>ការិយាល័យធនធានមនុស្ស និងរដ្ឋបាល (HR & Admin Department)</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.88rem' }}>
                  <div>កាលបរិច្ឆេទ: <strong>{new Date(printNotice.effectiveDate).toISOString().split('T')[0]}</strong></div>
                  <div>ផ្ញើជូន: <strong>{printNotice.targetDept === 'ALL' ? 'បុគ្គលិកគ្រប់ផ្នែក' : printNotice.targetDept}</strong></div>
                </div>
              </div>

              {/* Notice Title */}
              <div style={{ textAlign: 'center', margin: '28px 0' }}>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                  សេចក្តីជូនដំណឹង
                </h2>
                <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', color: '#475569' }}>
                  OFFICIAL COMPANY ANNOUNCEMENT
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e40af', marginTop: '12px' }}>
                  « {printNotice.title} »
                </div>
              </div>

              {/* Notice Content */}
              <div style={{
                fontSize: '1.05rem',
                textAlign: 'justify',
                lineHeight: 2.0,
                whiteSpace: 'pre-line',
                margin: '24px 0',
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#fafafa'
              }}>
                {printNotice.content}
              </div>

              {/* Notice Signoff */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: '40px',
                paddingTop: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>កន្លែងទទួល:</div>
                  <div style={{ fontSize: '0.85rem' }}>- គ្រប់ផ្នែកពាក់ព័ន្ធ</div>
                  <div style={{ fontSize: '0.85rem' }}>- ក្តារខៀនព័ត៌មានក្រុមហ៊ុន</div>
                  <div style={{ fontSize: '0.85rem' }}>- រក្សាទុកឯកសារ</div>
                </div>

                <div style={{ textAlign: 'center', width: '240px' }}>
                  <div style={{ fontSize: '0.88rem' }}>ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី {new Date().getDate()} ខែ {new Date().getMonth() + 1} ឆ្នាំ {new Date().getFullYear()}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '6px' }}>តាងនាមគណៈគ្រប់គ្រងក្រុមហ៊ុន</div>
                  <div style={{ height: '70px', margin: '10px 0', borderBottom: '1px dashed #94a3b8' }}></div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{printNotice.authorName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Authorized Signature & Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
