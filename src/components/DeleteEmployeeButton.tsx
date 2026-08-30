'use client'
import { deleteEmployee } from '@/app/dashboard/employees/actions';

export default function DeleteEmployeeButton({ id, confirmText = 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?', deleteText = 'លុប' }: { id: string, confirmText?: string, deleteText?: string }) {
  return (
    <form action={deleteEmployee} style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <button 
        type="submit" 
        onClick={(e) => {
          if(!confirm(confirmText)) e.preventDefault();
        }}
        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        🗑️ {deleteText}
      </button>
    </form>
  );
}
