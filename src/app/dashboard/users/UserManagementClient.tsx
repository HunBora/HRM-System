'use client';

import { useState } from 'react';
import { createUser, updateUser, deleteUser } from './actions';

export default function UserManagementClient({ users, employees }: { users: any[], employees: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenNew = () => {
    setEditingUser(null);
    setShowModal(true);
    setError('');
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    let res;

    if (editingUser) {
      res = await updateUser(editingUser.id, formData);
    } else {
      res = await createUser(formData);
    }

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?')) {
      await deleteUser(id);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleOpenNew} className="btn-primary kh-text">
          + បង្កើតគណនីថ្មី
        </button>
      </div>

      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead style={{ backgroundColor: '#f8fafc' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }} className="kh-text">អ៊ីមែល (Email)</th>
            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }} className="kh-text">សិទ្ធិ (Role)</th>
            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }} className="kh-text">ភ្ជាប់ជាមួយបុគ្គលិក (Employee)</th>
            <th style={{ padding: '15px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }} className="kh-text">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>{user.email}</td>
              <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ 
                  backgroundColor: user.role === 'ADMIN' ? '#fee2e2' : user.role === 'HR' ? '#fef3c7' : '#e0f2fe',
                  color: user.role === 'ADMIN' ? '#991b1b' : user.role === 'HR' ? '#92400e' : '#0369a1',
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }} className="kh-text">
                {user.employee ? `${user.employee.firstNameEn} ${user.employee.lastNameEn}` : '—'}
              </td>
              <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                <button onClick={() => handleOpenEdit(user)} className="kh-text" style={{ marginRight: '10px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>កែប្រែ</button>
                <button onClick={() => handleDelete(user.id)} className="kh-text" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>លុប</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 className="kh-text" style={{ marginBottom: '20px' }}>{editingUser ? 'កែប្រែគណនី' : 'បង្កើតគណនីថ្មី'}</h2>
            
            {error && <div className="kh-text" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>អ៊ីមែល (Email / Username)</label>
                <input type="email" name="email" defaultValue={editingUser?.email || ''} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>
                  លេខសម្ងាត់ (Password) {editingUser && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(ទុកទទេបើមិនចង់ប្តូរ)</span>}
                </label>
                <input type="password" name="password" required={!editingUser} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>តួនាទី (Role)</label>
                <select name="role" defaultValue={editingUser?.role || 'EMPLOYEE'} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="ADMIN">ADMIN - អ្នកគ្រប់គ្រងប្រព័ន្ធ</option>
                  <option value="HR">HR - បុគ្គលិករដ្ឋបាល</option>
                  <option value="EMPLOYEE">EMPLOYEE - បុគ្គលិកទូទៅ (មើលបានតែប្រាក់ខែ)</option>
                </select>
              </div>

              <div>
                <label className="kh-text" style={{ display: 'block', marginBottom: '5px' }}>ភ្ជាប់គណនីនេះទៅបុគ្គលិក (តម្រូវសម្រាប់ Employee Role)</label>
                <select name="employeeId" defaultValue={editingUser?.employeeId || ''} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="">— មិនភ្ជាប់ (សម្រាប់ Admin/HR) —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstNameEn} {emp.lastNameEn} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary kh-text" style={{ padding: '10px 20px' }}>បោះបង់</button>
                <button type="submit" disabled={loading} className="btn-primary kh-text" style={{ padding: '10px 20px' }}>
                  {loading ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
