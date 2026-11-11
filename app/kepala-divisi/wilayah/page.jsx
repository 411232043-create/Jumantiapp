'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { listWilayah, listRumah, listPenugasan } from '@/services/firestore';
import { formatDate } from '@/lib/utils';

export default function WilayahPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([listWilayah(), listRumah(), listPenugasan()])
      .then(([w, r, p]) => setData(w.map((x) => ({
        ...x,
        jumlah_rumah: r.filter((h) => h.id_wilayah === x.id).length,
        kader: p.filter((t) => t.id_wilayah === x.id && t.status === 'aktif').map((t) => t.nama_kader),
      })))).catch(console.error);
  }, []);

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Data Wilayah" subtitle="Wilayah kerja dalam divisi" />
      <Card className="p-5" hover={false}>
        <DataTable data={data} searchKeys={['nama_wilayah', 'kecamatan', 'kelurahan']}
          columns={[
            { key: 'nama_wilayah', label: 'Nama Wilayah' },
            { key: 'kecamatan', label: 'Kecamatan' },
            { key: 'kelurahan', label: 'Kelurahan' },
            { key: 'rt_rw', label: 'RT/RW', render: (r) => `${r.rt || '-'} / ${r.rw || '-'}` },
            { key: 'jumlah_rumah', label: 'Jumlah Rumah' },
            { key: 'kader', label: 'Kader Bertugas', render: (r) => r.kader.length ? r.kader.join(', ') : '-' },
          ]} />
      </Card>
    </div>
  );
}
