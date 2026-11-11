import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.id_role !== 'kader') redirect('/unauthorized');
  return <AppShell user={user}>{children}</AppShell>;
}
