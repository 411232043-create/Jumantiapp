'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/DataTable';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { listWilayahByIds, listDocs, listPemeriksaan, listPenugasanKader, getDocById } from '@/services/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { MapPin, Home, CheckCircle2, Bug, Clock, FileCheck, AlertTriangle, ClipboardPlus } from 'lucide-react';

export default function KaderDashboard() {
  const user = useCurrentUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wilayah = await listWilayahByIds(user.wilayah_ids || []);
      const wIds = wilayah.map((w) => w.id);
      const rumah = wIds.length
        ? await listDocs('rumah', where('id_wilayah', 'in', wIds.slice(0, 30)))
        : [];
      const pemeriksaan = await listPemeriksaan(where('id_kader', '==', user.uid));
      const terbaru = [...pemeriksaan]
        .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)).slice(0, 8);
      const pengaturan = await getDocById('pengaturan', 'app').catch(() => null);
      const periodeHari = pengaturan?.periode_pemantauan_hari || 30;
      const batas = new Date(); batas.setDate(batas.getDate() - periodeHari);
      const batasStr = batas.toISOString().slice(0, 10);
      const diperiksaIds = new Set(
        pemeriksaan.filter((p) => p.status === STATUS.APPROVED && (p.tanggal_pemeriksaan || '') >= batasStr)
          .map((p) => p.id_rumah));
      setData({
        wilayah, rumah, pemeriksaan, terbaru,
        rumahDiperiksa: diperiksaIds.size,
        belumDiperiksa: Math.max(0, rumah.length - diperiksaIds.size),
        positif: pemeriksaan.filter((p) => p.kesimpulan === 'positif_jentik' && p.status === STATUS.APPROVED).length,
        bebas: pemeriksaan.filter((p) => p.kesimpulan === 'bebas_jentik' && p.status === STATUS.APPROVED).length,
        pending: pemeriksaan.filter((p) => p.status === STATUS.PENDING).length,
        approved: pemeriksaan.filter((p) => p.status === STATUS.APPROVED).length,
        revision: pemeriksaan.filter((p) => p.status === STATUS.REVISION).length,
      });
    })().catch(console.error);
  }, [user]);

  if (user === undefined || !data) return <PageLoader />;
  if (!user) return <p className="text-muted">Sesi berakhir. Silakan login kembali.</p>;

  return (
    <div>
      <PageHeader title={`Halo, ${user.nama}`}
        subtitle={`Wilayah tugas: ${data.wilayah.map((w) => w.nama_wilayah).join(', ') || 'Belum ditugaskan'}`}
        action={<Link href="/kader/pemeriksaan/baru" className="btn btn-primary"><ClipboardPlus size={16} /> Pemeriksaan Baru</Link>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MapPin} label="Wilayah Tugas" value={data.wilayah.length} />
        <StatCard icon={Home} label="Rumah di Wilayah" value={data.rumah.length} />
        <StatCard icon={CheckCircle2} label="Sudah Diperiksa" value={data.rumahDiperiksa} sub="periode pemantauan" />
        <StatCard icon={AlertTriangle} label="Belum Diperiksa" value={data.belumDiperiksa} sub="periode pemantauan" />
        <StatCard icon={Bug} label="Positif Jentik" value={data.positif} sub="disetujui" />
        <StatCard icon={CheckCircle2} label="Bebas Jentik" value={data.bebas} sub="disetujui" />
        <StatCard icon={Clock} label="Menunggu Verifikasi" value={data.pending} />
        <StatCard icon={FileCheck} label="Disetujui / Revisi" value={`${data.approved} / ${data.revision}`} />
      </div>

      <Card className="p-5" hover={false}>
        <CardHeader title="Riwayat Pemeriksaan Terbaru"
          action={<Link href="/kader/riwayat" className="btn btn-ghost !py-1.5 !px-3 text-xs">Lihat Semua</Link>} />
        <DataTable data={data.terbaru} pageSize={8}
          empty={<EmptyState title="Belum ada pemeriksaan" message="Mulai pemeriksaan pertama Anda."
            action={<Link href="/kader/pemeriksaan/baru" className="btn btn-primary"><ClipboardPlus size={15} /> Buat Pemeriksaan</Link>} />}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_warga', label: 'Pemilik Rumah' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
          ]} />
      </Card>
    </div>
  );
}
