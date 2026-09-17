'use client';

import React, { useState } from 'react';
import { submitExpenseClaim, updateExpenseStatus } from './actions';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


export default function ExpenseClient({ role, currentEmployeeId, claims, l, locale }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    doc.text(`Employee: ${claim.employee ? claim.employee.firstNameKh + ' ' + claim.employee.lastNameKh : 'N/A'}`, 14, 35);
    doc.text(`Category: ${claim.category}`, 14, 45);
    doc.text(`Amount: ${claim.amount} ${claim.currency}`, 14, 55);
    doc.text(`Status: ${claim.status}`, 14, 65);
    doc.text(`Description: ${claim.description || 'N/A'}`, 14, 75);
    
    doc.save(`Expense_${claim.id}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Department: c.employee?.department || '',
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      'Emp ID': c.employee?.employeeId || '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(claims.map((c: any) => ({
      Date: new Date(c.date).toLocaleDateString('en-GB'),
      Department: c.employee?.department || '',
      Employee: c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
      'Emp ID': c.employee?.employeeId || '',
      Type: c.category,
      Amount: c.amount,
      Currency: c.currency,
      Status: c.status,
      Description: c.description
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
        c.employee ? c.employee.firstNameKh + ' ' + c.employee.lastNameKh : '',
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title kh-text">ស្នើសុំចំណាយ / Expense Claims / 报销申请</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary kh-text"
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showForm ? t.closeBtn : t.newBtn}
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '20px', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 className="kh-text" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{t.form.title}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text"><div>កាលបរិច្ឆេទ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Date</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>日期</div></label>
              <input type="date" name="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">ប្រភេទ / Category / 类别</label>
              <select name="category" required className="input-field">
                <option value="TRANSPORT">{t.categories.transport}</option>
                <option value="MEAL">{t.categories.meal}</option>
                <option value="SUPPLIES">{t.categories.supplies}</option>
                <option value="ACCOMMODATION">{t.categories.accommodation}</option>
                <option value="OTHER">{t.categories.other}</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text"><div>ទឹកប្រាក់</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Amount</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>金额</div></label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" name="amount" step="0.01" min="0.01" required className="input-field" placeholder="15.50" style={{ width: '100%', minWidth: '80px' }} />
                <select name="currency" className="input-field" style={{ width: '90px', flexShrink: 0 }}>
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </select>
              </div>
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">លេខសម្គាល់បុគ្គលិក / Emp ID (Optional)</label>
              <input type="text" name="empId" className="input-field" placeholder="e.g. EMP-001" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">ឈ្មោះ / Name (Optional)</label>
              <input type="text" name="empName" className="input-field" placeholder="e.g. Sokha" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">លេខទូរស័ព្ទ / Phone (Optional)</label>
              <input type="text" name="empPhone" className="input-field" placeholder="e.g. 012345678" />
            </div>
<div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">ឯកសារយោង / Receipt Link / 收据链接</label>
              <input type="url" name="receiptUrl" className="input-field" placeholder="Google Drive Link..." />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">មូលហេតុ / Description / 原因</label>
              <textarea name="description" required className="input-field" rows={3} placeholder="..."></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isSubmitting} className="btn-primary kh-text" style={{ padding: '8px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? "កំពុងបញ្ជូន... / Submitting..." : "បញ្ជូនការស្នើសុំ / Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginBottom: '15px' }} className="print-hidden">
        <select 
          className="input-field kh-text"
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', width: '250px' }}
          defaultValue=""
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'pdf') exportToPDF();
            else if (val === 'excel') exportToExcel();
            else if (val === 'csv') exportToCSV();
            e.target.value = "";
          }}
        >
          <option value="" disabled>ទាញយករបាយការណ៍ / Export...</option>
          <option value="pdf">📄 ទាញយកជា PDF</option>
          <option value="excel">📊 ទាញយកជា Excel</option>
          <option value="csv">📑 ទាញយកជា CSV</option>
        </select>
        
        <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🖨️ Print
        </button>
      </div>
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>កាលបរិច្ឆេទ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Date</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>日期</div></th>
                            {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>ផ្នែក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Dept</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>部门</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>បុគ្គលិក</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Employee</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>员工</div></th>}
              {role !== 'EMPLOYEE' && <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>អត្តលេខ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Emp ID</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>工号</div></th>}
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}><div>ប្រភេទ</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Type</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>类别</div></th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}><div>ទឹកប្រាក់</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Amount</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>金额</div></th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}><div>ស្ថានភាព</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Status</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>状态</div></th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}><div>សកម្មភាព</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>Action</div><div style={{fontSize:'0.75rem',color:'#64748b'}}>操作</div></th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim: any) => (
              <tr key={claim.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px' }}>{new Date(claim.date).toLocaleDateString('en-GB')}</td>
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    <div style={{ fontSize: '0.85rem' }}>{claim.employee?.department || '-'}</div>
                  </td>
                )}
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    {claim.employee?.firstNameKh} {claim.employee?.lastNameKh}
                  </td>
                )}
                {role !== 'EMPLOYEE' && (
                  <td style={{ padding: '12px 15px' }} className="kh-text">
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{claim.employee?.employeeId || '-'}</div>
                  </td>
                )}
                <td style={{ padding: '12px 15px' }}>
                  <div style={{ fontWeight: 'bold' }}>{getCategoryLabel(claim.category)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{claim.description}</div>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                  {claim.currency === 'USD' ? '$' : '៛'} {claim.amount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <span className="kh-text" style={{ 
                    padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: statusColors[claim.status]?.bg || '#f1f5f9',
                    color: statusColors[claim.status]?.text || '#475569'
                  }}>
                    {statusColors[claim.status]?.label || claim.status}
                  </span>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <button onClick={() => printSingleClaim(claim)} style={{ display: 'inline-block', marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Print / ព្រីន">
                      🖨️
                    </button>
                    {claim.receiptUrl && (
                    <a href={claim.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginRight: '10px', color: '#3b82f6', textDecoration: 'none' }} title="មើលវិក្កយបត្រ">
                      📎
                    </a>
                  )}
                  
                  {role === 'DEPT_HEAD' && claim.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
                      <button onClick={() => handleUpdateStatus(claim.id, 'APPROVED_DEPT')} style={{ border: 'none', background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>អនុម័ត</button>
                      <button onClick={() => handleUpdateStatus(claim.id, 'REJECTED')} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>បដិសេធ</button>
                    </div>
                  )}

                  {(role === 'ADMIN' || role === 'HR_MANAGER' || role === 'PAYROLL_ADMIN') && (
                    <select 
                      value={claim.status} 
                      onChange={(e) => handleUpdateStatus(claim.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '5px' }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED_DEPT">APPROVED (Dept)</option>
                      <option value="APPROVED_HR">APPROVED (HR)</option>
                      <option value="PAID">PAID</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }} className="kh-text">
                  {t.table.noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
