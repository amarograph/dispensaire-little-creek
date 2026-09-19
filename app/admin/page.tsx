import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { listMembers } from '@/actions/members';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/redm');
  }

  const members = await listMembers();

  return <AdminDashboardClient members={members} />;
}
