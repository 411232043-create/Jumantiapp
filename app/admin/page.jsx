'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { MonthlyBarChart, ResultPieChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { listUsers, listWilayah, listRumah, listPemeriksaan } from '@/services/firestore';
import { orderBy, limit } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Users, MapPin, Home, FileCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      listUsers(), listWilayah(), listRumah(),
      listPemeriksaan(),
      listPemeriksaan(orderBy('created_at', 'desc'), limit(8)),
    ]).then(([users, wilayah, rumah, pemeriksaan, terbaru]) => {
      const kader = users.filter((u) => u.id_role === 'kader');
      const kadiv = users.filter((u) => u.id_role === 'kepala_divisi');
      const bulanan = {};
      const perWilayah = {};
      for (const p of pemeriksaan) {
        const tgl = p.tanggal_pemeriksaan || '';
        const bln = tgl.slice(0, 7);
        if (bln) bulanan[bln] = (bulanan[bln] || 0) + 1;
        if (p.status === STATUS.APPROVED) {
          const w = p.nama_wilayah || 'Lainnya';
          perWilayah[w] = perWilayah[w] || { name: w, value: 0 };
          perWilayah[w].value++;
        }
      }
      const bulananArr = Object.keys(bulanan).sort().slice(-8).map((k) => ({
        label: k.slice(5) + '/' + k.slice(2, 4), total: bulanan[k],
      }));
      setData({
        users, kader, kadiv, wilayah, rumah, pemeriksaan, terbaru,
        bulananArr, perWilayahArr: Object.values(perWilayah),
        pending: pemeriksaan.filter((p) => p.status === STATUS.PENDING).length,
        approved: pemeriksaan.filter((p) => p.status === STATUS.APPROVED).length,
        revision: pemeriksaan.filter((p) => p.status === STATUS.REVISION).length,
      });
    }).catch(console.error);
  }, []);

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Dashboard Admin" subtitle="Ringkasan seluruh aktivitas pemantauan jentik nyamuk" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={Users} label="Total Pengguna" value={data.users.length} />
        <StatCard icon={Users} label="Kader" value={data.kader.length} />
        <StatCard icon={Users} label="Kepala Divisi" value={data.kadiv.length} />
        <StatCard icon={MapPin} label="Wilayah" value={data.wilayah.length} />
        <StatCard icon={Home} label="Rumah Terdaftar" value={data.rumah.length} />
        <StatCard icon={FileCheck} label="Total Pemeriksaan" value={data.pemeriksaan.length} />
        <StatCard icon={Clock} label="Menunggu Verifikasi" value={data.pending} />
        <StatCard icon={CheckCircle2} label="Disetujui" value={data.approved} sub={`${data.revision} perlu revisi`} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <Card className="lg:col-span-3 p-5">
          <CardHeader title="Pemeriksaan per Bulan" subtitle="Jumlah seluruh laporan pemeriksaan" />
          <MonthlyBarChart data={data.bulananArr} />
        </Card>
        <Card className="lg:col-span-2 p-5">
          <CardHeader title="Pemeriksaan Disetujui per Wilayah" />
          {data.perWilayahArr.length
            ? <ResultPieChart data={data.perWilayahArr} />
            : <p className="text-sm text-muted py-10 text-center">Belum ada pemeriksaan disetujui.</p>}
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="Pemeriksaan Terbaru"
          action={<Link href="/admin/pemeriksaan" className="btn btn-ghost !py-1.5 !px-3 text-xs">Lihat Semua</Link>} />
        <DataTable
          data={data.terbaru}
          searchKeys={[]}
          columns={[
            { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
            { key: 'nama_kader', label: 'Kader' },
            { key: 'nama_wilayah', label: 'Wilayah' },
            { key: 'kesimpulan', label: 'Hasil', render: (r) => <Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan] || '-'}</Badge> },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
          ]}
          pageSize={8}
        />
      </Card>
    </div>
  );
}
