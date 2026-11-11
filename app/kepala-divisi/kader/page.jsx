'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { listUsersByRole, listPenugasan } from '@/services/firestore';
import { formatDate } from '@/lib/utils';

export default function KaderPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([listUsersByRole('kader'), listPenugasan()])
      .then(([kaders, penugasan]) => {
        setData(kaders.map((k) => ({
          ...k,
          wilayah: penugasan.filter((p) => p.id_user === k.id && p.status === 'aktif').map((p) => p.nama_wilayah),
        })));
      }).catch(console.error);
  }, []);

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Data Kader" subtitle="Daftar kader jumantik dalam divisi" />
      <Card className="p-5" hover={false}>
        <DataTable data={data} searchKeys={['nama', 'email']} searchPlaceholder="Cari kader..."
          columns={[
            { key: 'nama', label: 'Nama' },
            { key: 'email', label: 'Email' },
            { key: 'no_hp', label: 'Telepon', render: (r) => r.no_hp || '-' },
            { key: 'wilayah', label: 'Wilayah Tugas', render: (r) => r.wilayah.length ? r.wilayah.join(', ') : <span className="text-amber-300">Belum ditugaskan</span> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}>{r.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge> },
            { key: 'created_at', label: 'Bergabung', render: (r) => formatDate(r.created_at) },
          ]} />
      </Card>
    </div>
  );
}
