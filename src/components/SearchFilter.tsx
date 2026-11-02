'use client';
import { useRouter } from 'next/navigation';

export default function SearchFilter({ q, dept, departments, t }: { q: string, dept: string, departments: string[], t: any }) {
  const router = useRouter();
  
  return (
    <form method="GET" style={{ display: 'flex', gap: '6px', flexGrow: 1, maxWidth: '460px', alignItems: 'center' }}>
      <select 
        name="dept" 
        defaultValue={dept} 
        onChange={(e) => e.target.form?.submit()}
        className="input-field kh-text"
        style={{ padding: '5px 8px', minWidth: '130px', fontSize: '0.8rem', height: '34px' }}
      >
        <option value="">គ្រប់ផ្នែក (All)</option>
        {departments.map((d: any) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <input 
        type="text" 
        name="q" 
        defaultValue={q} 
        placeholder="ស្វែងរកឈ្មោះ / ID..." 
        className="input-field kh-text" 
        style={{ width: '100%', margin: 0, padding: '5px 10px', fontSize: '0.8rem', height: '34px' }} 
      />
      <button 
        type="submit" 
        className="btn-secondary kh-text"
        style={{ padding: '5px 12px', fontSize: '0.8rem', height: '34px', whiteSpace: 'nowrap' }}
      >
        🔍 ស្វែងរក
      </button>
    </form>
  );
}
