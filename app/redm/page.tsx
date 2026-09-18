import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMember } from '@/lib/auth';
import RedMDashboardClient from './RedMDashboardClient';

export default async function RedMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const member = await getMember(user.id);
  if (member?.status !== 'approved') redirect('/pending');

  return <RedMDashboardClient roles={member.roles} />;
}
