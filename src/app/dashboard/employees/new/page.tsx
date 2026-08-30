import EmployeeForm from '@/components/EmployeeForm';
import { getDictionary } from '@/i18n/getDictionary';

export default async function NewEmployeePage() {
  const t = await getDictionary();

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="title kh-text">{t.employee.form.newTitle}</h1>
      </div>
      <EmployeeForm t={t} />
    </div>
  );
}
