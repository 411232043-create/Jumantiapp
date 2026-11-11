import { redirect } from 'next/navigation';
import { getSessionUser, roleHome } from '@/lib/auth/session';

export default async function DashboardRedirect() {
  const user = await getSessionUser();
  redirect(user ? roleHome(user.id_role) : '/login');
}
