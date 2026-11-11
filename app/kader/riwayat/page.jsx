'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listPemeriksaan } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Eye, ClipboardPlus } from 'lucide-react';

export default function RiwayatPage() {
  const user = useCurrentUser();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    listPemeriksaan(where('id_kader', '==', user.uid))
      .then((d) => setItems(d.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))))
      .catch(console.error);
  }, [user]);

  if (user === undefined || !items) return <PageLoader />;

  const filtered = items.filter((p) => !filter || p.status === filter);

  return (
    <div>
      <PageHeader title="Riwayat Pemeriksaan" subtitle="Seluruh pemeriksaan yang pernah Anda lakukan"
        action={<Link href="/kader/pemeriksaan/baru" className="btn btn-primary"><ClipboardPlus size={16} /> Pemeriksaan Baru</Link>} />
      <Card className="p-5" hover={false}>
        <DataTable data={filtered} searchKeys={['nama_warga', 'nama_wilayah']} searchPlaceholder="Cari warga / wilayah..."
          filters={
            <select className="select !w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          }
          empty={<EmptyState title="Belum ada riwayat" message="Pemeriksaan yang Anda buat akan tampil di sini." />}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
            { key: 'catatan_verifikasi', label: 'Catatan Verifikasi', render: (r) => r.catatan_verifikasi ? <span className="text-rose-300 text-xs">{r.catatan_verifikasi}</span> : '-' },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <Link href={`/kader/pemeriksaan/${r.id}`} className="btn btn-ghost !p-2"><Eye size={14} /></Link>
            )},
          ]} />
      </Card>
    </div>
  );
}
