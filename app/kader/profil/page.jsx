import { getSessionUser } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProfileForm } from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const user = await getSessionUser();
  return (
    <div>
      <PageHeader title="Profil Saya" subtitle="Kelola data akun Anda" />
      <ProfileForm user={user} />
    </div>
  );
}
