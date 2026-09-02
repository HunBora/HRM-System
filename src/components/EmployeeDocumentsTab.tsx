'use client';

import React, { useState } from 'react';
import { uploadDocument, deleteDocument } from '@/app/dashboard/employees/[id]/docActions';

export default function EmployeeDocumentsTab({ employeeId, documents }: { employeeId: string, documents: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('employeeId', employeeId);
    
    try {
      await uploadDocument(formData);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('មានបញ្ហាក្នុងការបញ្ចូលឯកសារ! សូមព្យាយាមម្តងទៀត។');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបឯកសារនេះមែនទេ?')) {
      await deleteDocument(docId);
    }
  };

  return (
    <div>
      <h3 className="kh-text" style={{ marginBottom: '20px', color: '#0f172a' }}>ឯកសាររបស់បុគ្គលិក</h3>
      
      <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ចំណងជើងឯកសារ (Title)</label>
          <input type="text" name="title" required placeholder="ឧទាហរណ៍: អត្តសញ្ញាណប័ណ្ណ" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="kh-text" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ប្រភេទ (Type)</label>
          <select name="type" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="kh-text">
            <option value="ID_CARD">អត្តសញ្ញាណប័ណ្ណ (ID Card)</option>
            <option value="CONTRACT">កិច្ចសន្យាការងារ (Contract)</option>
            <option value="CV">ប្រវត្តិរូបសង្ខេប (CV)</option>
            <option value="CERTIFICATE">សញ្ញាបត្រ (Certificate)</option>
            <option value="OTHER">ផ្សេងៗ (Other)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="kh-text" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ជ្រើសរើស File (File)</label>
          <input type="file" name="file" required accept=".pdf,image/*" style={{ width: '100%', padding: '5px' }} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary kh-text" style={{ padding: '8px 20px' }}>
          {loading ? 'កំពុងបញ្ចូល...' : '+ បញ្ចូលឯកសារ'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {documents.length === 0 ? (
          <p className="kh-text text-muted">មិនទាន់មានឯកសារនៅឡើយទេ...</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{doc.type}</span>
              </div>
              <h4 className="kh-text" style={{ marginTop: '0', marginBottom: '15px', paddingRight: '60px' }}>{doc.title}</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary kh-text" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '6px' }}>
                  👁 មើល (View)
                </a>
                <button onClick={() => handleDelete(doc.id)} className="kh-text" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  លុប
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
