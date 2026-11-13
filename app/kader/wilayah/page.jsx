'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listWilayahByIds, listDocs, listPenugasanKader } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { formatDate } from '@/lib/utils';
import { MapPin, Home } from 'lucide-react';

export default function WilayahTugasPage() {
  const user = useCurrentUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wilayah = await listWilayahByIds(user.wilayah_ids || []);
      const withRumah = await Promise.all(wilayah.map(async (w) => {
        const rumah = await listDocs('rumah', where('id_wilayah', '==', w.id));
        return { ...w, jumlah_rumah: rumah.length };
      }));
      const penugasan = await listPenugasanKader(user.uid);
      setData({ wilayah: withRumah, penugasan });
    })().catch(console.error);
  }, [user]);

  if (user === undefined || !data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Wilayah Tugas" subtitle="Wilayah kerja yang ditugaskan kepada Anda" />
      {!data.wilayah.length && <EmptyState title="Belum ada wilayah tugas" message="Hubungi admin untuk mendapatkan penugasan wilayah." />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.wilayah.map((w) => (
          <Card key={w.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="glow-icon"><MapPin size={18} /></div>
              <span className="badge badge-aktif">Aktif</span>
            </div>
            <h3 className="font-bold text-lg">{w.nama_wilayah}</h3>
            <p className="text-xs text-muted mt-1">{[w.kelurahan, w.kecamatan].filter(Boolean).join(', ') || '-'}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted"><Home size={14} /> {w.jumlah_rumah} rumah</span>
              <span className="text-muted">RT {w.rt || '-'} / RW {w.rw || '-'}</span>
            </div>
            {w.keterangan && <p className="text-xs text-muted mt-3 border-t divider pt-3">{w.keterangan}</p>}
          </Card>
        ))}
      </div>

      {!!data.penugasan.length && (
        <Card className="p-5 mt-5" hover={false}>
          <CardHeader title="Riwayat Penugasan" />
          <div className="tbl-wrap overflow-x-auto mx-1 mb-2">
            <table className="tbl min-w-[480px]">
              <thead><tr><th>Wilayah</th><th>Tanggal Mulai</th><th>Status</th></tr></thead>
              <tbody>
                {data.penugasan.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nama_wilayah}</td>
                    <td>{formatDate(p.tanggal_mulai)}</td>
                    <td><span className={`badge ${p.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
