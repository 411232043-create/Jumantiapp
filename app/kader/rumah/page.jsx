'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listDocs, listWilayahByIds, listPemeriksaan } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { formatDate } from '@/lib/utils';
import { STATUS } from '@/lib/constants';

export default function RumahPage() {
  const user = useCurrentUser();
  const [data, setData] = useState(null);
  const [wilayahMap, setWilayahMap] = useState({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wIds = user.wilayah_ids || [];
      const wilayah = await listWilayahByIds(wIds);
      const map = Object.fromEntries(wilayah.map((w) => [w.id, w.nama_wilayah]));
      const rumah = wIds.length ? await listDocs('rumah', where('id_wilayah', 'in', wIds.slice(0, 30))) : [];
      const pemeriksaan = await listPemeriksaan(
        where('id_kader', '==', user.uid), where('status', '==', STATUS.APPROVED));
      const terakhir = {};
      for (const p of pemeriksaan) {
        if (!terakhir[p.id_rumah] || (p.tanggal_pemeriksaan || '') > terakhir[p.id_rumah])
          terakhir[p.id_rumah] = p.tanggal_pemeriksaan;
      }
      setData(rumah.map((r) => ({ ...r, terakhir_diperiksa: terakhir[r.id] })));
      setWilayahMap(map);
    })().catch(console.error);
  }, [user]);

  if (user === undefined || !data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Data Rumah" subtitle="Rumah warga di wilayah tugas Anda" />
      <Card className="p-5" hover={false}>
        <DataTable data={data} searchKeys={['nama_warga', 'alamat']} searchPlaceholder="Cari warga / alamat..."
          empty={<EmptyState title="Belum ada rumah" message="Data rumah dikelola oleh admin." />}
          columns={[
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'alamat', label: 'Alamat' },
            { key: 'rt_rw', label: 'RT/RW', render: (r) => `${r.rt || '-'} / ${r.rw || '-'}` },
            { key: 'id_wilayah', label: 'Wilayah', render: (r) => wilayahMap[r.id_wilayah] || '-' },
            { key: 'terakhir_diperiksa', label: 'Terakhir Diperiksa', render: (r) => r.terakhir_diperiksa ? formatDate(r.terakhir_diperiksa) : <span className="text-amber-300">Belum pernah</span> },
          ]} />
      </Card>
    </div>
  );
}
