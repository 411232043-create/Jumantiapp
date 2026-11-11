'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserFormModal } from '@/components/UserFormModal';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { listUsers } from '@/services/firestore';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Power } from 'lucide-react';

const TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'admin', label: 'Admin' },
  { key: 'kepala_divisi', label: 'Kepala Divisi' },
  { key: 'kader', label: 'Kader' },
];

function UsersPageInner() {
  const params = useSearchParams();
  const [users, setUsers] = useState(null);
  const router = useRouter();
  const tab = params.get('role') || 'semua';
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toggle, setToggle] = useState(null);
  const [toggling, setToggling] = useState(false);
  const toast = useToast();

  const load = () => listUsers().then(setUsers).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const filtered = (users || []).filter((u) => tab === 'semua' || u.id_role === tab);

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/users/${toggle.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toggle.status === 'aktif' ? 'nonaktif' : 'aktif' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Akun ${toggle.status === 'aktif' ? 'dinonaktifkan' : 'diaktifkan'}.`);
      setToggle(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(false);
    }
  };

  if (!users) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Manajemen Pengguna" subtitle="Kelola akun admin, kader, dan kepala divisi"
        action={<button className="btn btn-primary" onClick={() => { setEditUser(null); setModal(true); }}><Plus size={16} /> Tambah Pengguna</button>} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => router.replace(`/admin/users?role=${t.key}`)}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'} !py-2 !px-4 !text-xs`}>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-5" hover={false}>
        <DataTable
          data={filtered}
          searchKeys={['nama', 'email', 'no_hp']}
          searchPlaceholder="Cari nama / email..."
          columns={[
            { key: 'nama', label: 'Nama' },
            { key: 'email', label: 'Email' },
            { key: 'no_hp', label: 'Telepon', render: (r) => r.no_hp || '-' },
            { key: 'id_role', label: 'Role', render: (r) => <Badge variant="badge-role">{ROLE_LABELS[r.id_role] || r.id_role}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge> },
            { key: 'created_at', label: 'Dibuat', render: (r) => formatDate(r.created_at) },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <div className="flex gap-1">
                <button className="btn btn-ghost !p-2" title="Edit" onClick={() => { setEditUser(r); setModal(true); }}><Pencil size={14} /></button>
                <button className="btn btn-ghost !p-2" title={r.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => setToggle(r)}>
                  <Power size={14} className={r.status === 'aktif' ? 'text-rose-300' : 'text-emerald-300'} />
                </button>
              </div>
            )},
          ]}
        />
      </Card>

      <UserFormModal open={modal} onClose={() => setModal(false)} onSaved={load} editUser={editUser}
        defaultRole={tab !== 'semua' ? tab : 'kader'} />
      <ConfirmModal open={!!toggle} onClose={() => setToggle(null)} onConfirm={toggleStatus}
        loading={toggling} danger={toggle?.status === 'aktif'}
        title={toggle?.status === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
        message={`Yakin ingin ${toggle?.status === 'aktif' ? 'menonaktifkan' : 'mengaktifkan'} akun ${toggle?.nama}?`} />
    </div>
  );
}

export default function UsersPage() {
  return <Suspense fallback={<PageLoader />}><UsersPageInner /></Suspense>;
}
