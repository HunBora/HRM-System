'use client';

import React, { useState, useMemo } from 'react';
import { submitExpenseClaim, updateExpenseStatus } from './actions';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ExpenseClient({ role, currentEmployeeId, claims, l, locale }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const parseDescription = (desc: string) => {
    if (!desc) return { realDesc: '', name: '', id: '', phone: '' };
    const match = desc.match(/\n\((.*?)\)$/);
    if (!match) return { realDesc: desc, name: '', id: '', phone: '' };
    const extraStr = match[1];
    const realDesc = desc.replace(/\n\((.*?)\)$/, '');
    let name = ''; let id = ''; let phone = '';
    extraStr.split(', ').forEach((p: string) => {
      if (p.startsWith('Name: ')) name = p.substring(6);
      if (p.startsWith('ID: ')) id = p.substring(4);
      if (p.startsWith('Phone: ')) phone = p.substring(7);
    });
    return { realDesc, name, id, phone };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const empId = formData.get('empId') as string;
    const empName = formData.get('empName') as string;
    const empPhone = formData.get('empPhone') as string;
    let desc = formData.get('description') as string;
    
    let extraInfo = [];
    if (empId) extraInfo.push('ID: ' + empId);
    if (empName) extraInfo.push('Name: ' + empName);
    if (empPhone) extraInfo.push('Phone: ' + empPhone);
    
    if (extraInfo.length > 0) {
      desc = desc + '\n(' + extraInfo.join(', ') + ')';
      formData.set('description', desc);
    }

    const res = await submitExpenseClaim(formData);
    
    setIsSubmitting(false);
    if (res?.error) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ',
        text: res.error,
        confirmButtonText: 'យល់ព្រម'
      });
    } else {
      setShowForm(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'បានបញ្ជូនការស្នើសុំដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const result = await Swal.fire({
      title: 'បញ្ជាក់',
      text: 'តើអ្នកពិតជាចង់ផ្លាស់ប្តូរស្ថានភាពមែនទេ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'យល់ព្រម',
      cancelButtonText: 'បោះបង់'
    });
    
    if (!result.isConfirmed) return;
    
    const res = await updateExpenseStatus(id, status);
    if (res?.error) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ',
        text: res.error,
        confirmButtonText: 'យល់ព្រម'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ',
        text: 'ស្ថានភាពត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const printSingleClaim = (claim: any) => {
    const doc = new jsPDF();
    doc.text('Expense Claim Detail', 14, 15);
    doc.text(`Date: ${new Date(claim.date).toLocaleDateString('en-GB')}`, 14, 25);
    doc.text(`Employee: ${claim.employee ? (claim.employee.firstNameKh ? claim.employee.firstNameKh + ' ' + claim.employee.lastNameKh : claim.employee.firstNameEn + ' ' + claim.employee.lastNameEn) : 'N/A'}`, 14, 35);
    doc.text(`Category: ${claim.category}`, 14, 45);
    doc.text(`Amount: ${claim.amount} ${claim.currency}`, 14, 55);
    doc.text(`Status: ${claim.status}`, 14, 65);
    doc.text(`Description: ${claim.description || 'N/A'}`, 14, 75);
    
    doc.save(`Expense_${claim.id}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      ...(() => {
        const p = parseDescription(c.description);
        return {
          Date: new Date(c.date).toLocaleDateString('en-GB'),
          Department: c.employee?.department || '',
          Employee: c.employee?.firstNameKh?.trim() ? c.employee.firstNameKh + ' ' + (c.employee.lastNameKh || '') : (c.employee?.firstNameEn?.trim() ? c.employee.firstNameEn + ' ' + (c.employee.lastNameEn || '') : p.name),
          'Emp ID': c.employee?.employeeId || p.id,
          Type: c.category,
          Amount: c.amount,
          Currency: c.currency,
          Status: c.status,
          Description: p.realDesc
        };
      })()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      ...(() => {
        const p = parseDescription(c.description);
        return {
          Date: new Date(c.date).toLocaleDateString('en-GB'),
          Department: c.employee?.department || '',
          Employee: c.employee?.firstNameKh?.trim() ? c.employee.firstNameKh + ' ' + (c.employee.lastNameKh || '') : (c.employee?.firstNameEn?.trim() ? c.employee.firstNameEn + ' ' + (c.employee.lastNameEn || '') : p.name),
          'Emp ID': c.employee?.employeeId || p.id,
          Type: c.category,
          Amount: c.amount,
          Currency: c.currency,
          Status: c.status,
          Description: p.realDesc
        };
      })()
    })));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expenses.csv';
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Expense Claims', 14, 15);
    (doc as any).autoTable({
      head: [['Date', 'Dept', 'Employee', 'Emp ID', 'Type', 'Amount', 'Currency', 'Status']],
      body: claims.map((c: any) => [
        new Date(c.date).toLocaleDateString('en-GB'),
        c.employee?.department || '',
        c.employee ? (c.employee.firstNameKh ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : c.employee.firstNameEn + ' ' + c.employee.lastNameEn) : '',
        c.employee?.employeeId || '',
        c.category,
        c.amount,
        c.currency,
        c.status
      ]),
      startY: 20
    });
    doc.save('expenses.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const t = l.expenses;

  const statusColors: any = {
    'PENDING': { bg: '#fef3c7', text: '#92400e', label: t.status.pending },
    'APPROVED_DEPT': { bg: '#e0e7ff', text: '#3730a3', label: t.status.approved_dept },
    'APPROVED_HR': { bg: '#dbeafe', text: '#1e40af', label: t.status.approved_hr },
    'REJECTED': { bg: '#fee2e2', text: '#991b1b', label: t.status.rejected },
    'PAID': { bg: '#d1fae5', text: '#065f46', label: t.status.paid }
  };

  const getCategoryLabel = (cat: string) => {
    const map: any = {
      'TRANSPORT': t.categories.transport,
      'MEAL': t.categories.meal,
      'SUPPLIES': t.categories.supplies,
      'ACCOMMODATION': t.categories.accommodation,
      'OTHER': t.categories.other
    };
    return map[cat] || cat;
  };

  const metrics = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter((c: any) => c.status === 'PENDING').length;
    const approved = claims.filter((c: any) => ['APPROVED_DEPT', 'APPROVED_HR', 'PAID'].includes(c.status)).length;
    const totalUsd = claims.reduce((sum: number, c: any) => {
      const amt = Number(c.amount) || 0;
      return sum + (c.currency === 'USD' ? amt : amt / 4050);
    }, 0);
    return { total, pending, approved, totalUsd };
  }, [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c: any) => {
      const parsed = parseDescription(c.description);
      const firstKh = c.employee?.firstNameKh?.trim();
      const firstEn = c.employee?.firstNameEn?.trim();
      const empName = (firstKh ? `${firstKh} ${c.employee?.lastNameKh?.trim() || ''}` : (firstEn ? `${firstEn} ${c.employee?.lastNameEn?.trim() || ''}` : parsed.name)).toLowerCase();
      const empId = (c.employee?.employeeId || parsed.id || '').toLowerCase();
      const desc = (parsed.realDesc || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || empName.includes(q) || empId.includes(q) || desc.includes(q);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [claims, searchQuery, statusFilter, categoryFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        background: '#ffffff',
        padding: '6px 12px',
        borderRadius: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            flexShrink: 0
          }}>
            💳
          </div>
          <div>
            <h1 className="kh-text" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              ស្នើសុំចំណាយ / Expenses
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
              Expense Reimbursement & Claims
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="kh-text"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showForm ? '#f1f5f9' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            color: showForm ? '#475569' : '#ffffff',
            border: showForm ? '1px solid #cbd5e1' : 'none',
            borderRadius: '6px',
            padding: '4px 10px',
            fontWeight: 700,
            fontSize: '0.78rem',
            height: '28px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            boxShadow: showForm ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{showForm ? '✖' : '➕'}</span>
          <span>{showForm ? 'បិទ' : '+ ស្នើសុំចំណាយ'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '8px'
      }}>
        {/* Total Claims */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '6px 12px',
            border: statusFilter === 'ALL' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0
          }}>
            📋
          </div>
          <div>
            <div className="kh-text" style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', lineHeight: 1.2 }}>សំណើសរុប</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Total Claims</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', lineHeight: 1.1, marginTop: '1px' }}>
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Pending */}
        <div 
          onClick={() => setStatusFilter('PENDING')}
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '6px 12px',
            border: statusFilter === 'PENDING' ? '2px solid #d97706' : '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0
          }}>
            ⏳
          </div>
          <div>
            <div className="kh-text" style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', lineHeight: 1.2 }}>រង់ចាំ</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Pending</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1, marginTop: '1px' }}>
              {metrics.pending}
            </div>
          </div>
        </div>

        {/* Approved / Paid */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            padding: '6px 12px',
            border: statusFilter === 'PAID' ? '2px solid #16a34a' : '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0
          }}>
            ✅
          </div>
          <div>
            <div className="kh-text" style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', lineHeight: 1.2 }}>អនុម័ត/បើកប្រាក់</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Approved/Paid</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1, marginTop: '1px' }}>
              {metrics.approved}
            </div>
          </div>
        </div>

        {/* Total USD Amount */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '6px 12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            background: '#f1f5f9',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            flexShrink: 0
          }}>
            💵
          </div>
          <div>
            <div className="kh-text" style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', lineHeight: 1.2 }}>ទឹកប្រាក់ (~USD)</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Total Value</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '1px' }}>
              ${metrics.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card animate-fade-in" style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 className="kh-text" style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>{t.form.title}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                កាលបរិច្ឆេទ (Date)
              </label>
              <input type="date" name="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                ប្រភេទចំណាយ (Category)
              </label>
              <select name="category" required className="input-field" style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }}>
                <option value="TRANSPORT">{t.categories.transport}</option>
                <option value="MEAL">{t.categories.meal}</option>
                <option value="SUPPLIES">{t.categories.supplies}</option>
                <option value="ACCOMMODATION">{t.categories.accommodation}</option>
                <option value="OTHER">{t.categories.other}</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                ទឹកប្រាក់ (Amount)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ width: '100%', minWidth: '70px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
                <select name="currency" className="input-field" style={{ width: '80px', flexShrink: 0, padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }}>
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </select>
              </div>
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                អត្តលេខ (Emp ID)
              </label>
              <input type="text" name="empId" className="input-field" placeholder="e.g. EMP-001" style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                ឈ្មោះ (Name)
              </label>
              <input type="text" name="empName" className="input-field" placeholder="e.g. Sokha" style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                ទូរស័ព្ទ (Phone)
              </label>
              <input type="text" name="empPhone" className="input-field" placeholder="e.g. 012345678" style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                ឯកសារយោង (Receipt Link)
              </label>
              <input type="url" name="receiptUrl" className="input-field" placeholder="Drive / Link..." style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', height: '28px' }} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="kh-text" style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                មូលហេតុចំណាយ (Description)
              </label>
              <textarea name="description" required className="input-field" rows={2} placeholder="មូលហេតុ និងលម្អិត..." style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="kh-text" 
                style={{ padding: '4px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', height: '28px' }}
              >
                {t.closeBtn || 'បោះបង់'}
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="kh-text" 
                style={{ padding: '4px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', height: '28px' }}
              >
                {isSubmitting ? "កំពុងបញ្ជូន..." : "បញ្ជូនការស្នើសុំ"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '6px',
        background: '#ffffff',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', flex: 1, minWidth: '260px' }}>
          {/* Live Search */}
          <div style={{ position: 'relative', minWidth: '180px', flex: 1 }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94a3b8' }}>🔍</span>
            <input 
              type="text"
              placeholder="ស្វែងរកឈ្មោះ, អត្តលេខ, បរិយាយ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kh-text"
              style={{
                width: '100%',
                height: '26px',
                padding: '2px 8px 2px 26px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="kh-text"
            style={{
              height: '26px',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">គ្រប់ស្ថានភាព (All Status)</option>
            <option value="PENDING">រង់ចាំ (Pending)</option>
            <option value="APPROVED_DEPT">អនុម័តផ្នែក (Dept)</option>
            <option value="APPROVED_HR">អនុម័តរដ្ឋបាល (HR)</option>
            <option value="PAID">បើកប្រាក់រួច (Paid)</option>
            <option value="REJECTED">បដិសេធ (Rejected)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="kh-text"
            style={{
              height: '26px',
              padding: '2px 6px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">គ្រប់ប្រភេទចំណាយ (All Categories)</option>
            <option value="TRANSPORT">ធ្វើដំណើរ (Transport)</option>
            <option value="MEAL">អាហារ (Meal)</option>
            <option value="SUPPLIES">សម្ភារៈ (Supplies)</option>
            <option value="ACCOMMODATION">ស្នាក់នៅ (Accommodation)</option>
            <option value="OTHER">ផ្សេងៗ (Other)</option>
          </select>
        </div>

        {/* Export and Print actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select 
            className="input-field kh-text"
            style={{ 
              height: '26px', 
              padding: '2px 6px', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              cursor: 'pointer', 
              fontSize: '0.78rem', 
              background: '#fff' 
            }}
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'pdf') exportToPDF();
              else if (val === 'excel') exportToExcel();
              else if (val === 'csv') exportToCSV();
              e.target.value = "";
            }}
          >
            <option value="" disabled>📥 Export...</option>
            <option value="excel">📊 Excel (.xlsx)</option>
            <option value="csv">📑 CSV</option>
            <option value="pdf">📄 PDF</option>
          </select>
          
          <button 
            onClick={handlePrint} 
            style={{ 
              height: '26px',
              padding: '2px 8px', 
              background: '#ffffff', 
              color: '#334155', 
              border: '1px solid #cbd5e1', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            🖨️ <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="card" style={{ padding: '0', overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th className="kh-text" style={thStyle}>
                កាលបរិច្ឆេទ (Date)
              </th>
              {role !== 'EMPLOYEE' && (
                <th className="kh-text" style={thStyle}>
                  ផ្នែក (Dept)
                </th>
              )}
              {role !== 'EMPLOYEE' && (
                <th className="kh-text" style={thStyle}>
                  បុគ្គលិក (Employee)
                </th>
              )}
              {role !== 'EMPLOYEE' && (
                <th className="kh-text" style={thStyle}>
                  អត្តលេខ (ID)
                </th>
              )}
              <th className="kh-text" style={thStyle}>
                ប្រភេទ & បរិយាយ
              </th>
              <th className="kh-text" style={{ ...thStyle, textAlign: 'right' }}>
                ទឹកប្រាក់ ($)
              </th>
              <th className="kh-text" style={{ ...thStyle, textAlign: 'center' }}>
                ស្ថានភាព
              </th>
              <th className="kh-text" style={{ ...thStyle, textAlign: 'center' }}>
                សកម្មភាព
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim: any, idx: number) => {
              const parsed = parseDescription(claim.description);
              const firstKh = claim.employee?.firstNameKh?.trim();
              const firstEn = claim.employee?.firstNameEn?.trim();
              const empName = firstKh ? `${firstKh} ${claim.employee?.lastNameKh?.trim() || ''}` : (firstEn ? `${firstEn} ${claim.employee?.lastNameEn?.trim() || ''}` : parsed.name);
              const empId = claim.employee?.employeeId || parsed.id;
              
              return (
                <tr 
                  key={claim.id} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 1 ? 'rgba(248, 250, 252, 0.6)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 1 ? 'rgba(248, 250, 252, 0.6)' : 'transparent'; }}
                >
                  <td style={{ ...tdStyle, color: '#475569', whiteSpace: 'nowrap' }}>
                    {new Date(claim.date).toLocaleDateString('en-GB')}
                  </td>
                  {role !== 'EMPLOYEE' && (
                    <td style={tdStyle} className="kh-text">
                      <div style={{ fontWeight: 600, color: '#334155' }}>{claim.employee?.department || '-'}</div>
                    </td>
                  )}
                  {role !== 'EMPLOYEE' && (
                    <td style={tdStyle} className="kh-text">
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {empName?.trim() ? empName : '-'}
                      </div>
                    </td>
                  )}
                  {role !== 'EMPLOYEE' && (
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
                        {empId || '-'}
                      </span>
                    </td>
                  )}
                  <td style={tdStyle}>
                    <div className="kh-text" style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                      {getCategoryLabel(claim.category)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {parsed.realDesc || '-'}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, fontSize: '0.86rem', color: claim.currency === 'USD' ? '#059669' : '#2563eb', whiteSpace: 'nowrap' }}>
                    {claim.currency === 'USD' ? '$' : '៛'} {claim.amount.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span className="kh-text" style={{ 
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                      backgroundColor: statusColors[claim.status]?.bg || '#f1f5f9',
                      color: statusColors[claim.status]?.text || '#475569',
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}>
                      {statusColors[claim.status]?.label || claim.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        onClick={() => printSingleClaim(claim)} 
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: '#10b981', fontSize: '0.76rem' }} 
                        title="Print / ព្រីន"
                      >
                        🖨️
                      </button>
                      {claim.receiptUrl && (
                        <a 
                          href={claim.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 6px', color: '#2563eb', textDecoration: 'none', fontSize: '0.76rem' }} 
                          title="មើលវិក្កយបត្រ"
                        >
                          📎
                        </a>
                      )}
                      
                      {role === 'DEPT_HEAD' && claim.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <button onClick={() => handleUpdateStatus(claim.id, 'APPROVED_DEPT')} style={{ border: 'none', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>អនុម័ត</button>
                          <button onClick={() => handleUpdateStatus(claim.id, 'REJECTED')} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>បដិសេធ</button>
                        </div>
                      )}

                      {(role === 'ADMIN' || role === 'HR_MANAGER' || role === 'PAYROLL_ADMIN') && (
                        <select 
                          value={claim.status} 
                          onChange={(e) => handleUpdateStatus(claim.id, e.target.value)}
                          style={{ fontSize: '0.72rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED_DEPT">APPROVED (Dept)</option>
                          <option value="APPROVED_HR">APPROVED (HR)</option>
                          <option value="PAID">PAID</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredClaims.length === 0 && (
              <tr>
                <td colSpan={role !== 'EMPLOYEE' ? 8 : 5} style={{ padding: '28px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      💳
                    </div>
                    <div className="kh-text" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                      មិនទាន់មានទិន្នន័យស្នើសុំចំណាយទេ (No Expense Records)
                    </div>
                    <div className="kh-text" style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '340px' }}>
                      {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                        ? 'មិនមានលទ្ធផលត្រូវគ្នានឹងការស្វែងរក ឬចម្រោះទិន្នន័យនេះឡើយ'
                        : 'នៅមិនទាន់មានបុគ្គលិកណាដាក់ពាក្យស្នើសុំទូទាត់ចំណាយនៅឡើយទេ'}
                    </div>
                    <button
                      onClick={() => setShowForm(true)}
                      className="kh-text"
                      style={{
                        marginTop: '4px',
                        background: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + ស្នើសុំចំណាយថ្មី
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px dashed #e2e8f0',
  color: '#475569',
  fontWeight: 700,
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
  lineHeight: 1.2
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #f1f5f9',
  borderRight: '1px dashed #f8fafc',
  verticalAlign: 'middle',
  fontSize: '0.8rem'
};
