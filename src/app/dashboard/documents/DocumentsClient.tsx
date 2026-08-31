'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { createDocument, updateDocument, deleteDocument } from './actions';

const ThText = ({ kh, zh, en }: { kh: string; zh: string; en: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
    <span className="kh-text" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{kh}</span>
    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{zh}</span>
    <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>{en}</span>
  </div>
);

export default function DocumentsClient({ documents, isAdmin }: { documents: any[], isAdmin: boolean }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Policy');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileBase64, setFileBase64] = useState('');

  const filteredDocs = useMemo(() => {
    if (!search) return documents;
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(search.toLowerCase()) || 
      doc.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, documents]);

  const openModal = (doc?: any) => {
    if (doc) {
      setEditId(doc.id);
      setTitle(doc.title);
      setCategory(doc.category);
      setDescription(doc.description || '');
      setFileUrl(doc.fileUrl || '');
      setFileBase64(doc.fileData || '');
    } else {
      setEditId(null);
      setTitle('');
      setCategory('Policy');
      setDescription('');
      setFileUrl('');
      setFileBase64('');
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate size (<3MB)
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ឯកសារធំពេក! (File too large)',
        text: 'សូមជ្រើសរើសឯកសារក្រោម 3MB ឬប្រើទម្រង់ដាក់ Link ជំនួសវិញ។ (Max 3MB)',
        confirmButtonColor: '#2563eb'
      });
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileBase64(event.target.result as string);
        setFileUrl(''); // Clear link if file is uploaded
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title) {
      return Swal.fire({
        icon: 'warning',
        title: 'សូមបញ្ជូលចំណងជើងឯកសារ',
        text: 'Title is required!',
        confirmButtonColor: '#2563eb'
      });
    }
    setLoading(true);
    try {
      const data = { title, category, description, fileData: fileBase64, fileUrl };
      if (editId) {
        await updateDocument(editId, data);
      } else {
        await createDocument(data);
      }
      setIsModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'ជោគជ័យ!',
        text: 'ឯកសារត្រូវបានរក្សាទុក (Document saved)',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'បរាជ័យ!',
        text: 'មានបញ្ហាក្នុងការរក្សាទុក (Error saving document)',
        confirmButtonColor: '#ef4444'
      });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'តើអ្នកពិតជាចង់លុបមែនទេ?',
      text: "អ្នកនឹងមិនអាចទាញទិន្នន័យនេះមកវិញបានទេ! (You won't be able to revert this!)",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'បាទ/ចាស លុប (Delete)',
      cancelButtonText: 'បោះបង់ (Cancel)'
    });

    if (result.isConfirmed) {
      await deleteDocument(id);
      Swal.fire({
        icon: 'success',
        title: 'បានលុបរួចរាល់!',
        text: 'ឯកសារត្រូវបានលុប (Document deleted)',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 className="kh-text" style={{ fontSize: '1.6rem', color: '#1e3a8a', margin: 0 }}>
          ឯកសារក្រុមហ៊ុន (Company Documents) <span>公司文件</span>
        </h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="ស្វែងរកឯកសារ..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="kh-text"
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '250px' }}
          />
          <button 
            onClick={() => window.print()}
            className="kh-text no-print"
            style={{ padding: '8px 15px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🖨️ ព្រីន (Print)
          </button>
          {isAdmin && (
            <button 
              onClick={() => openModal()}
              className="kh-text no-print"
              style={{ padding: '8px 15px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + បន្ថែមឯកសារ (Add New)
            </button>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eef2ff', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 8px' }}><ThText kh="ចំណងជើង" zh="标题" en="TITLE" /></th>
              <th style={{ padding: '10px 8px' }}><ThText kh="ប្រភេទ" zh="类别" en="CATEGORY" /></th>
              <th style={{ padding: '10px 8px' }}><ThText kh="កាលបរិច្ឆេទ" zh="日期" en="DATE" /></th>
              <th style={{ padding: '10px 8px' }}><ThText kh="ឯកសារ" zh="文件" en="FILE" /></th>
              {isAdmin && <th style={{ padding: '10px 8px' }}><ThText kh="សកម្មភាព" zh="操作" en="ACTIONS" /></th>}
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="kh-text" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  មិនមានឯកសារនៅឡើយទេ (No documents found)
                </td>
              </tr>
            ) : (
              filteredDocs.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="kh-text" style={{ padding: '10px 8px', color: '#0f172a', fontWeight: '500', textAlign: 'center' }}>
                    {doc.title}
                    {doc.description && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{doc.description}</div>}
                  </td>
                  <td className="kh-text" style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {doc.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                    {new Date(doc.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {(doc.fileUrl || doc.fileData) ? (
                      <a 
                        href={doc.fileUrl || doc.fileData} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="kh-text"
                        style={{ display: 'inline-block', backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem' }}
                      >
                        មើលឯកសារ (View)
                      </a>
                    ) : (
                      <span className="kh-text" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>គ្មានឯកសារ</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => openModal(doc)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#3b82f6' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(doc.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#ef4444' }}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="kh-text" style={{ marginTop: 0, color: '#1e293b' }}>{editId ? 'កែប្រែឯកសារ (Edit Document)' : 'បន្ថែមឯកសារ (Add Document)'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ចំណងជើង (Title) *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              
              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ប្រភេទ (Category)</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="kh-text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Policy">បទបញ្ជាផ្ទៃក្នុង (Policy)</option>
                  <option value="Profile">ប្រវត្តិក្រុមហ៊ុន (Company Profile)</option>
                  <option value="Announcement">សេចក្តីជូនដំណឹង (Announcement)</option>
                  <option value="Other">ផ្សេងៗ (Other)</option>
                </select>
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ពិពណ៌នា (Description)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div style={{ padding: '15px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <label className="kh-text" style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>ការភ្ជាប់ឯកសារ (Attach File)</label>
                
                <div style={{ marginBottom: '10px' }}>
                  <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>១. ដាក់ Link ឯកសារ (Google Drive, ល...)</label>
                  <input type="text" value={fileUrl} onChange={e => { setFileUrl(e.target.value); setFileBase64(''); }} placeholder="https://..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                
                <div style={{ textAlign: 'center', margin: '10px 0', color: '#94a3b8', fontSize: '0.85rem' }}>ឬ (OR)</div>

                <div>
                  <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>២. Upload ឯកសារផ្ទាល់ (ក្រោម 3MB)</label>
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.png" style={{ width: '100%' }} />
                  {fileBase64 && <div className="kh-text" style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '5px' }}>✓ ឯកសារត្រូវបានជ្រើសរើស (File selected)</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setIsModalOpen(false)} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>បោះបង់ (Cancel)</button>
              <button onClick={handleSave} disabled={loading} className="kh-text" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
