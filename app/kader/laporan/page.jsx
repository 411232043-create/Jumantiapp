'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listPemeriksaan } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate, hitungABJ } from '@/lib/utils';
import { Eye } from 'lucide-react';

export default function LaporanSayaPage() {
  const user = useCurrentUser();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    listPemeriksaan(where('id_kader', '==', user.uid))
      .then((d) => setItems(d.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))))
      .catch(console.error);
  }, [user]);

  if (user === undefined || !items) return <PageLoader />;

  const laporan = items.filter((p) => p.status !== STATUS.DRAFT);
  const approved = laporan.filter((p) => p.status === STATUS.APPROVED);
  const bebas = approved.filter((p) => p.kesimpulan === 'bebas_jentik').length;

  const ringkasan = [
    { l: 'Total Laporan Dikirim', v: laporan.length },
    { l: 'Menunggu Verifikasi', v: laporan.filter((p) => p.status === STATUS.PENDING).length },
    { l: 'Disetujui', v: approved.length },
    { l: 'Perlu Revisi', v: laporan.filter((p) => p.status === STATUS.REVISION).length },
    { l: 'ABJ (Disetujui)', v: `${hitungABJ(approved.length, bebas)}%` },
  ];

  return (
    <div>
      <PageHeader title="Laporan Saya" subtitle="Rekapitulasi laporan yang telah Anda kirim" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-5">
        {ringkasan.map(({ l, v }) => (
          <Card key={l} className="p-4 text-center">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">{l}</p>
            <p className="text-2xl font-extrabold gradient-text mt-1">{v}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5" hover={false}>
        <CardHeader title="Daftar Laporan" />
        <DataTable data={laporan} searchKeys={['nama_warga', 'nama_wilayah']}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
            { key: 'aksi', label: 'Aksi', render: (r) => <Link href={`/kader/pemeriksaan/${r.id}`} className="btn btn-ghost !p-2"><Eye size={14} /></Link> },
          ]} />
      </Card>
    </div>
  );
}
