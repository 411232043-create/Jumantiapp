'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { listPemeriksaan, listWilayah } from '@/services/firestore';
import { orderBy } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';

export default function PemeriksaanPage() {
  const [items, setItems] = useState(null);
  const [wilayah, setWilayah] = useState([]);
  const [filter, setFilter] = useState({ status: '', id_wilayah: '' });
  const toast = useToast();

  useEffect(() => {
    Promise.all([listPemeriksaan(orderBy('created_at', 'desc')), listWilayah()])
      .then(([p, w]) => { setItems(p); setWilayah(w); })
      .catch((e) => toast.error(e.message));
  }, []);

  if (!items) return <PageLoader />;

  const filtered = items.filter((p) =>
    (!filter.status || p.status === filter.status) &&
    (!filter.id_wilayah || p.id_wilayah === filter.id_wilayah));

  return (
    <div>
      <PageHeader title="Data Pemeriksaan" subtitle="Seluruh laporan pemeriksaan jentik nyamuk" />
      <Card className="p-5" hover={false}>
        <DataTable data={filtered} searchKeys={['nama_kader', 'nama_wilayah', 'nama_warga']}
          searchPlaceholder="Cari kader / wilayah / warga..."
          filters={<>
            <select className="select !w-44" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="select !w-44" value={filter.id_wilayah} onChange={(e) => setFilter({ ...filter, id_wilayah: e.target.value })}>
              <option value="">Semua Wilayah</option>
              {wilayah.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
          </>}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_kader', label: 'Kader' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
            { key: 'aksi', label: 'Aksi', render: (r) => (
              <Link href={`/admin/pemeriksaan/${r.id}`} className="btn btn-ghost !p-2"><Eye size={14} /></Link>
            )},
          ]} />
      </Card>
    </div>
  );
}
