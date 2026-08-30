'use client';

import React, { useState, useEffect } from 'react';

type DeptGroup = {
  id: string;
  name: string;
  color: string;
  textColor: string;
  keywords: string;
  orderIdx: number;
};

export default function DepartmentGroupManager() {
  const [groups, setGroups] = useState<DeptGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DeptGroup>>({
    name: '', color: '#f3f4f6', textColor: '#4b5563', keywords: '', orderIdx: 0
  });

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/department-groups');
      const data = await res.json();
      if (Array.isArray(data)) setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing && formData.id ? 'PUT' : 'POST';
    try {
      await fetch('/api/department-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', color: '#f3f4f6', textColor: '#4b5563', keywords: '', orderIdx: groups.length });
      setIsEditing(false);
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (g: DeptGroup) => {
    setFormData(g);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('តើអ្នកពិតជាចង់លុបក្រុមនេះមែនទេ?')) return;
    try {
      await fetch(`/api/department-groups?id=${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div>កំពុងទាញយកទិន្នន័យ...</div>;

  return (
    <div>
      {/* List */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>លេខរៀង</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>ឈ្មោះក្រុម (Group)</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>ពាក្យគន្លឹះ (Keywords)</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>គំរូពណ៌ (Preview)</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, idx) => (
            <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{g.orderIdx}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{g.name}</td>
              <td style={{ padding: '10px', color: '#666', fontSize: '0.929em' }}>{g.keywords}</td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <span style={{ backgroundColor: g.color, color: g.textColor, padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.857em' }}>{g.name}</span>
              </td>
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <button onClick={() => handleEdit(g)} style={{ marginRight: '10px', padding: '4px 8px', backgroundColor: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>កែប្រែ</button>
                <button onClick={() => handleDelete(g.id)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>លុប</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '12px', border: '1px solid #e0e0e0', maxWidth: '700px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '12px', color: '#333' }}>{isEditing ? 'កែប្រែក្រុម' : 'បង្កើតក្រុមថ្មី'}</h3>
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ឈ្មោះក្រុម</label>
            <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>លេខរៀង (Order)</label>
            <input type="number" value={formData.orderIdx || 0} onChange={e => setFormData({...formData, orderIdx: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ពាក្យគន្លឹះ (ខណ្ឌដោយសញ្ញាក្បៀស)</label>
            <input required type="text" value={formData.keywords || ''} onChange={e => setFormData({...formData, keywords: e.target.value})} placeholder="ឧ. office, admin, hr" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ពណ៌ផ្ទៃ (Background Color)</label>
            <input type="color" value={formData.color || '#f3f4f6'} onChange={e => setFormData({...formData, color: e.target.value})} style={{ width: '100%', height: '42px', cursor: 'pointer', padding: '2px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ពណ៌អក្សរ (Text Color)</label>
            <input type="color" value={formData.textColor || '#4b5563'} onChange={e => setFormData({...formData, textColor: e.target.value})} style={{ width: '100%', height: '42px', cursor: 'pointer', padding: '2px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.071em' }}>
              {isEditing ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមក្រុមថ្មី'}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ name: '', color: '#f3f4f6', textColor: '#4b5563', keywords: '', orderIdx: groups.length }); }} style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                បោះបង់ (Cancel)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}