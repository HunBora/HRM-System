'use client';

import React, { useState, useEffect } from 'react';
import { getDepartmentGroups, getMasterKpis, saveMasterKpi, deleteMasterKpi } from '@/app/dashboard/kpiSettingsActions';

type MasterKpi = {
  id: string;
  department: string;
  kpiType: string;
  description: string | null;
};

export default function KpiSettingsManager() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [kpis, setKpis] = useState<MasterKpi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<MasterKpi>>({
    department: '', kpiType: '', description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const depts = await getDepartmentGroups();
      setDepartments(depts.map(d => d.name));
      const kpiData = await getMasterKpis();
      setKpis(kpiData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveMasterKpi(formData as any);
      setFormData({ department: '', kpiType: '', description: '' });
      setIsEditing(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (kpi: MasterKpi) => {
    setFormData(kpi);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('តើអ្នកពិតជាចង់លុប KPI នេះមែនទេ? (Are you sure you want to delete this KPI?)')) return;
    try {
      await deleteMasterKpi(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredKpis = selectedDept === 'All' ? kpis : kpis.filter(k => k.department === selectedDept);

  if (isLoading) return <div>កំពុងទាញយកទិន្នន័យ...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.429em', color: '#1976d2', marginBottom: '10px' }}>ការកំណត់ស្តង់ដារវាយតម្លៃ (Master KPI Settings)</h2>
      <p style={{ color: '#666', marginBottom: '25px' }}>កំណត់ចំណុចវាយតម្លៃគោល (Master KPIs) សម្រាប់ផ្នែកនីមួយៗក្នុងក្រុមហ៊ុន។</p>

      {/* Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>មើលតាមផ្នែក៖</label>
        <select 
          value={selectedDept} 
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="All">ទាំងអស់ (All Departments)</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* List */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>ផ្នែក (Department)</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>ចំណងជើង KPI (Type)</th>
            <th style={{ padding: '12px 15px', textAlign: 'left' }}>ការពិពណ៌នា (Description)</th>
            <th style={{ padding: '12px 15px', textAlign: 'center', width: '150px' }}>សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {filteredKpis.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>មិនទាន់មាន KPI សម្រាប់ផ្នែកនេះទេ</td>
            </tr>
          ) : (
            filteredKpis.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px' }}>
                  <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.857em', fontWeight: 'bold' }}>{k.department}</span>
                </td>
                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{k.kpiType}</td>
                <td style={{ padding: '12px 15px', color: '#555' }}>{k.description}</td>
                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(k)} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#fff3e0', color: '#ef6c00', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>កែប្រែ</button>
                  <button onClick={() => handleDelete(k.id)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>លុប</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Form */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '12px', border: '1px solid #e0e0e0', maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '12px', color: '#333' }}>{isEditing ? 'កែប្រែ KPI (Edit KPI)' : 'បន្ថែម KPI ថ្មី (Add New KPI)'}</h3>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ផ្នែក (Department)</label>
            <select 
              required 
              value={formData.department || ''} 
              onChange={e => setFormData({...formData, department: e.target.value})} 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff' }}
            >
              <option value="" disabled>ជ្រើសរើសផ្នែក (Select Department)</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ចំណងជើង KPI (KPI Type/Name)</label>
            <input 
              required 
              type="text" 
              value={formData.kpiType || ''} 
              onChange={e => setFormData({...formData, kpiType: e.target.value})} 
              placeholder="ឧ. ការគោរពពេលវេលា, គុណភាពការងារ..." 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '1.0em', fontWeight: 'bold' }}>ការពិពណ៌នា / របៀបវាយតម្លៃ (Description & Target)</label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="ពិពណ៌នាពីរបៀបនៃការផ្តល់ពិន្ទុ ឬចំណុចដែលត្រូវសម្រេចឱ្យបាន..." 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px', resize: 'vertical' }} 
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 24px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.071em', opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? 'កំពុងរក្សាទុក...' : (isEditing ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូល KPI ថ្មី')}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ department: '', kpiType: '', description: '' }); }} style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                បោះបង់ (Cancel)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
