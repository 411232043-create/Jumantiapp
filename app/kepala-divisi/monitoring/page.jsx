'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { listPemeriksaan, listWilayah, listUsersByRole } from '@/services/firestore';
import { orderBy } from 'firebase/firestore';
import { STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';

export default function MonitoringPage() {
  const [items, setItems] = useState(null);
  const [wilayah, setWilayah] = useState([]);
  const [kaders, setKaders] = useState([]);
  const [f, setF] = useState({ status: '', id_wilayah: '', id_kader: '', dari: '', sampai: '' });

  useEffect(() => {
    Promise.all([listPemeriksaan(orderBy('created_at', 'desc')), listWilayah(), listUsersByRole('kader')])
      .then(([p, w, k]) => { setItems(p); setWilayah(w); setKaders(k); })
      .catch(console.error);
  }, []);

  if (!items) return <PageLoader />;

  const filtered = items.filter((p) =>
    (!f.status || p.status === f.status) &&
    (!f.id_wilayah || p.id_wilayah === f.id_wilayah) &&
    (!f.id_kader || p.id_kader === f.id_kader) &&
    (!f.dari || (p.tanggal_pemeriksaan || '') >= f.dari) &&
    (!f.sampai || (p.tanggal_pemeriksaan || '') <= f.sampai));

  return (
    <div>
      <PageHeader title="Monitoring Pemeriksaan" subtitle="Seluruh aktivitas pemeriksaan kader" />
      <Card className="p-5" hover={false}>
        <DataTable data={filtered} searchKeys={['nama_kader', 'nama_warga']} searchPlaceholder="Cari..."
          filters={<>
            <select className="select !w-40" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="select !w-40" value={f.id_wilayah} onChange={(e) => setF({ ...f, id_wilayah: e.target.value })}>
              <option value="">Semua Wilayah</option>
              {wilayah.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
            <select className="select !w-40" value={f.id_kader} onChange={(e) => setF({ ...f, id_kader: e.target.value })}>
              <option value="">Semua Kader</option>
              {kaders.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <input type="date" className="input !w-40" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} title="Dari tanggal" />
            <input type="date" className="input !w-40" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} title="Sampai tanggal" />
          </>}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_kader', label: 'Kader' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
            { key: 'aksi', label: 'Aksi', render: (r) => <Link href={`/kepala-divisi/verifikasi/${r.id}`} className="btn btn-ghost !p-2"><Eye size={14} /></Link> },
          ]} />
      </Card>
    </div>
  );
}
