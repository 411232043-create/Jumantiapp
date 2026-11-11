import { redirect } from 'next/navigation';
import { getSessionUser, roleHome } from '@/lib/auth/session';

export default async function Home() {
  const user = await getSessionUser();
  redirect(user ? roleHome(user.id_role) : '/login');
}
