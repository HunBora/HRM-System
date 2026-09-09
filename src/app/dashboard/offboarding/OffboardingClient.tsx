'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { initiateTermination, approveTermination, calculateFinalSettlement } from './actions';
import Select from 'react-select';

const ThText = ({ kh, zh, en }: { kh: string; zh: string; en: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
    <span className="kh-text" style={{ fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>{kh}</span>
    <span style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center' }}>{zh}</span>
    <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>{en}</span>
  </div>
);

export default function OffboardingClient({ initialTerminations, employees }: { initialTerminations: any[], employees: any[] }) {
  const [terminations, setTerminations] = useState(initialTerminations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('NO_OFFENSE');
  const [noticeGiven, setNoticeGiven] = useState(true);
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.employeeId} - ${emp.firstNameKh} ${emp.lastNameKh} (${emp.firstNameEn} ${emp.lastNameEn}) - ${emp.department}`
  }));

  const reasonOptions = [
    { value: 'NO_OFFENSE', label: 'បញ្ឈប់គ្មានកំហុស (Termination without cause)' },
    { value: 'SERIOUS_OFFENSE', label: 'បញ្ឈប់មានកំហុសធ្ងន់ធ្ងរ (Termination with serious offense)' },
    { value: 'CLOSURE', label: 'ក្រុមហ៊ុនបិទទ្វារ (Company Closure)' },
    { value: 'RESIGNATION', label: 'លាឈប់ដោយខ្លួនឯង (Resignation)' },
  ];

  const handlePreview = async () => {
    if (!employeeId) return Swal.fire('Error', 'Please select an employee', 'error');
    if (!terminationDate) return Swal.fire('Error', 'Please select a date', 'error');
    
    setLoading(true);
    try {
      const data = await calculateFinalSettlement(employeeId, terminationDate, reason as any, noticeGiven);
      setPreviewData(data);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!previewData) return;
    
    setLoading(true);
    try {
      await initiateTermination({
        employeeId,
        terminationDate,
        reason,
        noticeGiven
      });
      Swal.fire('ជោគជ័យ', 'ទិន្នន័យបញ្ឈប់ការងារត្រូវបានរក្សាទុក', 'success');
      setIsModalOpen(false);
      window.location.reload(); // simple reload to get new data
    } catch (err: any) {
      Swal.fire('បរាជ័យ', err.message, 'error');
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const res = await Swal.fire({
      title: 'តើអ្នកប្រាកដទេ?',
      text: "បន្ទាប់ពីយល់ព្រម បុគ្គលិកនេះនឹងប្តូរស្ថានភាពទៅជា 'បញ្ឈប់' (TERMINATED)",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'យល់ព្រម',
      cancelButtonText: 'បោះបង់'
    });
    
    if (res.isConfirmed) {
      try {
        await approveTermination(id);
        Swal.fire('ជោគជ័យ', 'ត្រូវបានអនុម័ត', 'success');
        window.location.reload();
      } catch (err: any) {
        Swal.fire('បរាជ័យ', err.message, 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="kh-text" style={{ fontSize: '1.6rem', color: '#1e3a8a', margin: 0 }}>
          ការបញ្ចប់ការងារ និង ទូទាត់ប្រាក់ <span>离职与结算</span> (Offboarding & Final Settlement)
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="kh-text no-print"
          style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + បញ្ឈប់បុគ្គលិក (Terminate)
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#fee2e2' }}>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ល.រ" zh="序号" en="No." /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="បុគ្គលិក" zh="员工" en="Employee" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="អត្តលេខ" zh="工号" en="Emp ID" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ថ្ងៃចូលធ្វើការ" zh="入职日期" en="Hire Date" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ថ្ងៃបញ្ឈប់" zh="离职日期" en="Term. Date" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="មូលហេតុ" zh="原因" en="Reason" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ប្រភេទកិច្ចសន្យា" zh="合同类型" en="Contract" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ប្រាក់សរុប" zh="总金额" en="Total Pay" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="ស្ថានភាព" zh="状态" en="Status" /></th>
              <th style={{ padding: '10px 8px', borderBottom: '1px solid #fca5a5' }}><ThText kh="សកម្មភាព" zh="操作" en="Actions" /></th>
            </tr>
          </thead>
          <tbody>
            {terminations.map((t, index) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  {t.employee.firstNameEn} {t.employee.lastNameEn}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                  {t.employee.employeeId}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  {t.employee.hireDate ? new Date(t.employee.hireDate).toLocaleDateString('en-GB') : '-'}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  {new Date(t.terminationDate).toLocaleDateString('en-GB')}
                </td>
                <td className="kh-text" style={{ padding: '10px 8px', textAlign: 'center' }}>
                  {reasonOptions.find(r => r.value === t.reason)?.label || t.reason}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>
                  {t.contractType}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                  $ {t.totalFinalPay.toFixed(2)}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: t.status === 'APPROVED' ? '#dcfce7' : '#fef9c3', color: t.status === 'APPROVED' ? '#166534' : '#854d0e' }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyItems: 'center', justifyContent: 'center' }}>
                    {t.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApprove(t.id)}
                        className="kh-text no-print"
                        style={{ padding: '4px 10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        អនុម័ត (Approve)
                      </button>
                    )}
                    <button 
                      onClick={() => setPrintData(t)}
                      className="kh-text no-print"
                      style={{ padding: '4px 10px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      បោះពុម្ព (Print)
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {terminations.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '20px', textAlign: 'center' }} className="kh-text">មិនមានទិន្នន័យ (No Data)</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="kh-text" style={{ marginTop: 0, color: '#1e293b' }}>ទម្រង់បញ្ចប់ការងារ (Termination Form)</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>ជ្រើសរើសបុគ្គលិក (Select Employee)</label>
                <Select 
                  options={employeeOptions}
                  onChange={(opt) => setEmployeeId(opt?.value || '')}
                  className="kh-text"
                />
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>ថ្ងៃចុងក្រោយ (Last Day)</label>
                <input type="date" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>បានជូនដំណឹងមុនទេ? (Notice Given?)</label>
                <select value={noticeGiven ? 'yes' : 'no'} onChange={e => setNoticeGiven(e.target.value === 'yes')} className="kh-text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="yes">បាទ/ចាស (Yes)</option>
                  <option value="no">ទេ (No)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>មូលហេតុនៃការបញ្ឈប់ (Reason)</label>
                <Select 
                  options={reasonOptions}
                  value={reasonOptions.find(r => r.value === reason)}
                  onChange={(opt) => setReason(opt?.value || 'NO_OFFENSE')}
                  className="kh-text"
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={handlePreview} disabled={loading} className="kh-text" style={{ padding: '8px 20px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? 'កំពុងគណនា...' : 'គណនាប្រាក់ (Calculate)'}
              </button>
            </div>

            {previewData && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <h3 className="kh-text" style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  លទ្ធផលនៃការគណនា (Calculation Result) - កិច្ចសន្យា {previewData.contractType}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                  <div>ប្រាក់ឈ្នួលនៅសល់ (Unpaid Wages):</div><div style={{ textAlign: 'right' }}>$ {previewData.unpaidWages.toFixed(2)}</div>
                  <div>ប្រាក់ជួសការឈប់សម្រាក (Annual Leave):</div><div style={{ textAlign: 'right' }}>$ {previewData.annualLeavePay.toFixed(2)}</div>
                  {previewData.severancePay > 0 && (
                    <><div>ប្រាក់បំណាច់ ៥% (Severance Pay):</div><div style={{ textAlign: 'right' }}>$ {previewData.severancePay.toFixed(2)}</div></>
                  )}
                  {previewData.noticePay > 0 && (
                    <><div>ប្រាក់ជូនដំណឹងមុន (Notice Pay):</div><div style={{ textAlign: 'right' }}>$ {previewData.noticePay.toFixed(2)}</div></>
                  )}
                  {previewData.seniorityIndemnity > 0 && (
                    <><div>ប្រាក់អតីតភាពការងារ (Seniority):</div><div style={{ textAlign: 'right' }}>$ {previewData.seniorityIndemnity.toFixed(2)}</div></>
                  )}
                  {previewData.damagesPay > 0 && (
                    <><div>ប្រាក់ជំងឺចិត្ត (Damages):</div><div style={{ textAlign: 'right' }}>$ {previewData.damagesPay.toFixed(2)}</div></>
                  )}
                  {previewData.unpaidAdvances > 0 && (
                    <>
                      <div style={{ color: '#ef4444' }}>បំណុលបុរេប្រទាន (Advances):</div>
                      <div style={{ textAlign: 'right', color: '#ef4444' }}>-$ {previewData.unpaidAdvances.toFixed(2)}</div>
                    </>
                  )}
                  <div style={{ gridColumn: '1 / -1', borderTop: '2px solid #cbd5e1', margin: '5px 0' }}></div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>សរុបប្រាក់ត្រូវបើក (Total Pay):</div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: '#10b981' }}>$ {previewData.totalFinalPay.toFixed(2)}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setIsModalOpen(false)} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>បោះបង់ (Cancel)</button>
              <button onClick={handleSubmit} disabled={!previewData || loading} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: previewData ? 'pointer' : 'not-allowed', opacity: previewData ? 1 : 0.5 }}>
                រក្សាទុក (Save Termination)
              </button>
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} className="print-modal-content">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
              <button onClick={() => window.print()} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ បោះពុម្ព (Print)</button>
              <button onClick={() => setPrintData(null)} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>បិទ (Close)</button>
            </div>
            
            <div className="payslip-container" style={{ padding: '20px', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
                <h1 className="kh-text" style={{ fontSize: '1.6rem', marginBottom: '5px' }}>ការទូទាត់ប្រាក់បញ្ចប់ការងារ (Final Settlement)</h1>
                <h2 className="kh-text" style={{ fontSize: '1.2rem', color: '#334155' }}>Offboarding Payslip</h2>
                <div style={{ fontSize: '1rem', marginTop: '10px' }}>កាលបរិច្ឆេទបញ្ឈប់ (Termination Date): {new Date(printData.terminationDate).toLocaleDateString('en-GB')}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '1rem' }}>
                <div>
                  <div style={{ marginBottom: '8px' }}><strong>អត្តលេខ (Emp ID):</strong> {printData.employee.employeeId}</div>
                  <div style={{ marginBottom: '8px' }} className="kh-text"><strong>ឈ្មោះ (Name):</strong> {printData.employee.firstNameKh} {printData.employee.lastNameKh}</div>
                  <div style={{ marginBottom: '8px' }}><strong>លេខកាត/អត្តសញ្ញាណប័ណ្ណ (Card/ID):</strong> {printData.employee.cardNo || printData.employee.nationalId || '-'}</div>
                </div>
                <div>
                  <div style={{ marginBottom: '8px' }}><strong>ផ្នែក (Department):</strong> {printData.employee.department}</div>
                  <div style={{ marginBottom: '8px' }}><strong>តួនាទី (Position):</strong> {printData.employee.position}</div>
                  <div style={{ marginBottom: '8px' }}><strong>ថ្ងៃចូលធ្វើការ (Hire Date):</strong> {printData.employee.hireDate ? new Date(printData.employee.hireDate).toLocaleDateString('en-GB') : '-'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 className="kh-text" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '15px' }}>ប្រាក់ចំណូល និងកាត់កង (Earnings & Deductions)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                  <span>ប្រាក់ឈ្នួលនៅសល់ (Unpaid Wages)</span><span>${printData.unpaidWages.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                  <span>ប្រាក់ជួសការឈប់សម្រាក (Annual Leave Pay)</span><span>${printData.annualLeavePay.toFixed(2)}</span>
                </div>
                {printData.severancePay > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                    <span>ប្រាក់បំណាច់ ៥% (Severance Pay 5%)</span><span>${printData.severancePay.toFixed(2)}</span>
                  </div>
                )}
                {printData.noticePay > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                    <span>ប្រាក់ជួសការជូនដំណឹងមុន (Notice Pay)</span><span>${printData.noticePay.toFixed(2)}</span>
                  </div>
                )}
                {printData.seniorityIndemnity > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                    <span>ប្រាក់អតីតភាពការងារ (Seniority Indemnity)</span><span>${printData.seniorityIndemnity.toFixed(2)}</span>
                  </div>
                )}
                {printData.damagesPay > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem' }}>
                    <span>ប្រាក់ជំងឺចិត្ត (Damages)</span><span>${printData.damagesPay.toFixed(2)}</span>
                  </div>
                )}
                {printData.unpaidAdvances > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.05rem', color: '#ef4444' }}>
                    <span>បំណុលបុរេប្រទាន (Unpaid Advances)</span><span>-${printData.unpaidAdvances.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '350px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    <span className="kh-text">ប្រាក់ត្រូវបើកសរុប (NET PAY):</span>
                    <span style={{ color: '#15803d' }}>${printData.totalFinalPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '60px', textAlign: 'center' }}>
                <div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', width: '200px', margin: '0 auto', paddingTop: '10px' }} className="kh-text">
                    ហត្ថលេខាអ្នករៀបចំ (Prepared By)
                  </div>
                </div>
                <div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', width: '200px', margin: '0 auto', paddingTop: '10px' }} className="kh-text">
                    ហត្ថលេខាអ្នកទទួល (Received By)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .payslip-container, .payslip-container * {
            visibility: visible;
          }
          .payslip-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
