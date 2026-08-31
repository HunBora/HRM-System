'use client';
import { useRouter } from 'next/navigation';

export default function SearchFilter({ q, dept, departments, t }: { q: string, dept: string, departments: string[], t: any }) {
  const router = useRouter();
  
  return (
    <form method="GET" style={{ display: 'flex', gap: '10px', flexGrow: 1, maxWidth: '600px' }}>
      <select 
        name="dept" 
        defaultValue={dept} 
        onChange={(e) => e.target.form?.submit()}
        className="input-field kh-text"
        style={{ padding: '8px', minWidth: '150px' }}
      >
        <option value="">គ្រប់ផ្នែកទាំងអស់ (All Depts)</option>
        {departments.map((d: any) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <input 
        type="text" 
        name="q" 
        defaultValue={q} 
        placeholder={t.employee.searchPlaceholder} 
        className="input-field kh-text" 
        style={{ width: '100%', margin: 0 }} 
      />
      <button type="submit" className="btn-secondary kh-text">{t.employee.searchButton}</button>
    </form>
  );
}
