import { notFound } from 'next/navigation';
import AdminDashboardClient from '@/app/admin/AdminDashboardClient';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default function AdminPreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <div className="admin-theme">
    <div style={{ background: '#f7edd7', color: '#203c49', padding: '12px 24px', fontSize: 14 }}>
      Aperçu du panneau admin · sans données privées
    </div>
    <AdminDashboardClient members={[]} />
  </div>;
}
