'use client';

import React, { useState, useRef } from 'react';
import { createAsset, updateAssetStatus, deleteAsset } from './actions';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function AssetClient({ role, assets, employees, l }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const t = l.assets || {};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);

    const res = await createAsset(formData);
    
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
        text: 'បានរក្សាទុកដោយជោគជ័យ!',
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
    
    const res = await updateAssetStatus(id, status);
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

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'បញ្ជាក់',
      text: 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'លុប',
      cancelButtonText: 'បោះបង់',
      confirmButtonColor: '#d33'
    });
    
    if (!result.isConfirmed) return;
    
    const res = await deleteAsset(id);
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
        text: 'បានលុបដោយជោគជ័យ!',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(assets.map((a: any, i: number) => ({
      'No': i + 1,
      'Asset Code': a.assetCode || '',
      'Item Type': a.itemType || '',
      'Serial Number': a.serialNumber || '',
      'Item Name': a.name || '',
      'Item Description': a.description || '',
      'UoM': a.uom || 'Unit',
      'Qty in List': a.qtyInList || 1,
      'Counting': a.counting || '',
      'Variance': a.variance || '',
      'Quality (Good)': a.quality === 'GOOD' ? 1 : '',
      'Quality (Average)': a.quality === 'AVERAGE' ? 1 : '',
      'Quality (Bad)': a.quality === 'BAD' ? 1 : '',
      'Image': a.imageUrl ? 'Yes' : 'No image available',
      'Remark': a.remarks || (a.employee ? `${a.employee.firstNameKh || ''} ${a.employee.lastNameKh || ''}` : '')
    })));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'assets_inventory.csv';
    link.click();
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(assets.map((a: any, i: number) => ({
      'No': i + 1,
      'Asset Code': a.assetCode || '',
      'Item Type': a.itemType || '',
      'Serial Number': a.serialNumber || '',
      'Item Name': a.name || '',
      'Item Description': a.description || '',
      'UoM': a.uom || 'Unit',
      'Qty in List': a.qtyInList || 1,
      'Counting': a.counting || '',
      'Variance': a.variance || '',
      'Good': a.quality === 'GOOD' ? 1 : '',
      'Average': a.quality === 'AVERAGE' ? 1 : '',
      'Bad': a.quality === 'BAD' ? 1 : '',
      'Image': a.imageUrl ? 'Yes' : 'No image available',
      'Remark': a.remarks || (a.employee ? `${a.employee.firstNameKh || ''} ${a.employee.lastNameKh || ''}` : '')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets Inventory');
    XLSX.writeFile(wb, 'assets_inventory.xlsx');
  };

  const exportToPDF = async () => {
    if (!printRef.current) return;
    printRef.current.classList.remove('no-print-display-none');
    
    Swal.fire({
      title: 'Generating PDF...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      printRef.current.classList.add('no-print-display-none');
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('assets_inventory.pdf');
      Swal.close();
    } catch (e) {
      printRef.current.classList.add('no-print-display-none');
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors: any = {
    'IN_USE': { bg: '#dbeafe', text: '#1e40af', label: t?.status?.IN_USE || 'IN USE' },
    'RETURNED': { bg: '#d1fae5', text: '#065f46', label: t?.status?.RETURNED || 'RETURNED' },
    'LOST': { bg: '#fee2e2', text: '#991b1b', label: t?.status?.LOST || 'LOST' },
    'DAMAGED': { bg: '#fef3c7', text: '#92400e', label: t?.status?.DAMAGED || 'DAMAGED' }
  };

  // Group assets by itemType for the print view
  const groupedAssets = assets.reduce((acc: any, asset: any) => {
    const type = asset.itemType || 'I. បរិក្ខារកុំព្យូទ័រ និងគ្រឿងអេឡិចត្រូនិក / Computer and Electronic Equipment';
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {});

  return (
    <div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .no-print-display-none { display: none; }
        @media print { .no-print-display-none { display: block !important; } }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="title kh-text">{t?.title || 'Company Assets'}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>CSV</button>
          <button onClick={exportToExcel} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Excel</button>
          <button onClick={exportToPDF} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>PDF</button>
          <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>🖨️ Print</button>
          {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary kh-text" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
              {showForm ? (t?.form?.cancel || 'Close') : (t?.newBtn || '+ New Asset')}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card animate-fade-in no-print" style={{ marginBottom: '20px', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 className="kh-text" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{t?.form?.newTitle || 'Assign New Asset'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">Asset Code / លេខកូដទ្រព្យ</label>
              <input type="text" name="assetCode" className="input-field" placeholder="TL-CEE000031" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">Item Type / ប្រភេទសម្ភារៈ</label>
              <input type="text" name="itemType" className="input-field" placeholder="Computer Desktop" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.employee || 'Employee'}</label>
              <select name="employeeId" className="input-field">
                <option value="">-- No Employee (In Storage) --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeId} - {emp.firstNameKh || emp.firstNameEn} {emp.lastNameKh || emp.lastNameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.name || 'Asset Name'}</label>
              <input type="text" name="name" required className="input-field" placeholder="MacBook Pro M2..." />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.serial || 'Serial Number'}</label>
              <input type="text" name="serialNumber" className="input-field" placeholder="C02XXXXXXXXX" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">UoM / ឯកតា</label>
              <input type="text" name="uom" className="input-field" defaultValue="Unit" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">Qty in List / ចំនួន</label>
              <input type="number" name="qtyInList" className="input-field" defaultValue="1" />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.assignDate || 'Assign Date'}</label>
              <input type="date" name="assignDate" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.status || 'Status'}</label>
              <select name="status" required className="input-field" defaultValue="IN_USE">
                <option value="IN_USE">{t?.status?.IN_USE || 'IN USE'}</option>
                <option value="RETURNED">{t?.status?.RETURNED || 'RETURNED'}</option>
                <option value="LOST">{t?.status?.LOST || 'LOST'}</option>
                <option value="DAMAGED">{t?.status?.DAMAGED || 'DAMAGED'}</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">Description / បរិយាយ</label>
              <textarea name="description" className="input-field" rows={2} placeholder="Item description..."></textarea>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="kh-text">{t?.form?.remarks || 'Remarks'}</label>
              <textarea name="remarks" className="input-field" rows={2} placeholder="..."></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary kh-text" style={{ padding: '8px 24px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {t?.form?.cancel || 'Cancel'}
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary kh-text" style={{ padding: '8px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? (t?.form?.saving || 'Saving...') : (t?.form?.save || 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table View */}
      <div className="card no-print" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.assignDate || 'Date'}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.employee || 'Employee'}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.name || 'Asset Name'}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Asset Code</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.serial || 'Serial No'}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.status || 'Status'}</th>
              <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.remarks || 'Remarks'}</th>
              {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
                <th className="kh-text" style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{t?.columns?.actions || 'Actions'}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset: any) => {
              const firstKh = asset.employee?.firstNameKh?.trim();
              const firstEn = asset.employee?.firstNameEn?.trim();
              const empName = firstKh ? `${firstKh} ${asset.employee?.lastNameKh?.trim() || ''}` : (firstEn ? `${firstEn} ${asset.employee?.lastNameEn?.trim() || ''}` : 'In Storage');
              const empId = asset.employee?.employeeId || '-';
              
              return (
              <tr key={asset.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px' }}>{new Date(asset.assignDate).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px 15px' }} className="kh-text">
                  <div style={{ fontWeight: 'bold' }}>{empName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{empId}</div>
                </td>
                <td style={{ padding: '12px 15px' }} className="kh-text">
                  <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{asset.itemType}</div>
                </td>
                <td style={{ padding: '12px 15px', color: '#64748b' }}>
                  {asset.assetCode || '-'}
                </td>
                <td style={{ padding: '12px 15px', color: '#64748b' }}>
                  {asset.serialNumber || '-'}
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <span className="kh-text" style={{ 
                    padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: statusColors[asset.status]?.bg || '#f1f5f9',
                    color: statusColors[asset.status]?.text || '#475569'
                  }}>
                    {statusColors[asset.status]?.label || asset.status}
                  </span>
                  {asset.returnDate && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                      {new Date(asset.returnDate).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 15px', color: '#64748b', fontSize: '0.85rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.remarks || '-'}
                </td>
                {['ADMIN', 'HR_MANAGER', 'HR'].includes(role) && (
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <select 
                      value={asset.status} 
                      onChange={(e) => handleUpdateStatus(asset.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', marginRight: '5px' }}
                    >
                      <option value="IN_USE">IN USE</option>
                      <option value="RETURNED">RETURNED</option>
                      <option value="LOST">LOST</option>
                      <option value="DAMAGED">DAMAGED</option>
                    </select>
                    
                    <button onClick={() => handleDelete(asset.id)} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      លុប
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
            {assets.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }} className="kh-text">
                  មិនមានទិន្នន័យ (No Data)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="print-area" className="no-print-display-none" ref={printRef} style={{ padding: '20px', background: '#fff', fontFamily: 'Khmer OS Siemreap, sans-serif', width: '297mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>របាយការណ៍ សារពើភ័ណ្ឌសម្ភារៈ និងឧបករណ៍ប្រើប្រាស់</h2>
          <p style={{ fontSize: '1rem', margin: '0 0 5px 0' }}>ប្រើប្រាស់នៅ: ក្រុមហ៊ុន HRM System</p>
          <p style={{ fontSize: '1rem', margin: '0' }}>គិតត្រឹមថ្ងៃទី {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>ល.រ<br/>No</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>លេខកូដទ្រព្យ<br/>Asset Code</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>ប្រភេទសម្ភារៈ<br/>Item Type</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>លេខស៊េរី<br/>Serial Number</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>ឈ្មោះទ្រព្យកម្ម<br/>Item Name</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>បរិយាយអំពី ប្រភេទ ម៉ាក ទំហំ និងកម្លាំង<br/>Item Description</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>ឯកតា<br/>UoM</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>ចំនួនក្នុងបញ្ជី<br/>Qty in List</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>រាប់ជាក់ស្តែង<br/>Counting</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>លម្អៀង<br/>Variance</th>
              <th colSpan={3} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>គុណភាព (Quality)</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>រូបភាព<br/>Image</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>សម្គាល់<br/>Remark</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', width: '30px' }}>ល្អ</th>
              <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', width: '30px' }}>មធ្យម</th>
              <th style={{ border: '1px solid #000', padding: '2px', textAlign: 'center', width: '30px' }}>ខូច</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedAssets).map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                <tr>
                  <td colSpan={15} style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                    {group}
                  </td>
                </tr>
                {groupedAssets[group].map((asset: any, idx: number) => {
                  return (
                    <tr key={asset.id}>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{asset.assetCode || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{asset.itemType || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{asset.serialNumber || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{asset.name}</td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>{asset.description || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.uom || 'Unit'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.qtyInList || 1}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.counting || ''}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.variance || ''}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.quality === 'GOOD' ? '1' : ''}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.quality === 'AVERAGE' ? '1' : ''}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{asset.quality === 'BAD' ? '1' : ''}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} alt="Asset" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '0.6rem', color: '#999' }}>No image<br/>available</div>
                        )}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px' }}>
                        {asset.remarks || (asset.employee ? `${asset.employee.firstNameKh || ''} ${asset.employee.lastNameKh || ''}` : '')}
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
