'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { DataTable } from '@/components/DataTable';
import { MonthlyBarChart, ResultPieChart } from '@/components/Charts';
import { listUsersByRole, listWilayah, listRumah, listPemeriksaan, listPenugasan } from '@/services/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate, hitungABJ } from '@/lib/utils';
import { Users, MapPin, Home, Bug, CheckCircle2, Clock, AlertTriangle, FileCheck, Activity } from 'lucide-react';

export default function KadivDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      listUsersByRole('kader'), listWilayah(), listRumah(), listPemeriksaan(),
      listPemeriksaan(orderBy('created_at', 'desc'), limit(8)), listPenugasan(),
    ]).then(([kaders, wilayah, rumah, pemeriksaan, terbaru, penugasan]) => {
      const approved = pemeriksaan.filter((p) => p.status === STATUS.APPROVED);
      const bulanan = {};
      const perWil = {};
      for (const p of approved) {
        const bln = (p.tanggal_pemeriksaan || '').slice(0, 7);
        if (bln) bulanan[bln] = (bulanan[bln] || 0) + 1;
        const w = p.nama_wilayah || 'Lainnya';
        perWil[w] = perWil[w] || { name: w, value: 0 };
        perWil[w].value++;
      }
      const progres = penugasan.filter((p) => p.status === 'aktif').map((p) => {
        const total = rumah.filter((r) => r.id_wilayah === p.id_wilayah).length;
        const done = new Set(approved.filter((x) => x.id_wilayah === p.id_wilayah).map((x) => x.id_rumah)).size;
        return { ...p, total, done, pct: total ? Math.round((done / total) * 100) : 0 };
      });
      setData({
        kadersAktif: kaders.filter((k) => k.status === 'aktif'), wilayah, rumah,
        pemeriksaan, terbaru, approved, progres,
        rumahDiperiksa: new Set(approved.map((p) => p.id_rumah)).size,
        positif: approved.filter((p) => p.kesimpulan === 'positif_jentik').length,
        bebas: approved.filter((p) => p.kesimpulan === 'bebas_jentik').length,
        pending: pemeriksaan.filter((p) => p.status === STATUS.PENDING).length,
        revision: pemeriksaan.filter((p) => p.status === STATUS.REVISION).length,
        bulananArr: Object.keys(bulanan).sort().slice(-8).map((k) => ({ label: k.slice(5) + '/' + k.slice(2, 4), total: bulanan[k] })),
        perWilArr: Object.values(perWil),
      });
    }).catch(console.error);
  }, []);

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Dashboard Monitoring" subtitle="Pantau aktivitas kader dan hasil pemeriksaan jentik"
        action={<Link href="/kepala-divisi/verifikasi" className="btn btn-primary"><FileCheck size={16} /> Verifikasi Laporan {data.pending > 0 && `(${data.pending})`}</Link>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Kader Aktif" value={data.kadersAktif.length} />
        <StatCard icon={MapPin} label="Wilayah" value={data.wilayah.length} />
        <StatCard icon={Home} label="Rumah Terdaftar" value={data.rumah.length} />
        <StatCard icon={Activity} label="Rumah Diperiksa" value={data.rumahDiperiksa} sub="disetujui" />
        <StatCard icon={Bug} label="Positif Jentik" value={data.positif} />
        <StatCard icon={CheckCircle2} label="Bebas Jentik" value={data.bebas} sub={`ABJ ${hitungABJ(data.rumahDiperiksa ? data.approved.length : 0, data.bebas)}%`} />
        <StatCard icon={Clock} label="Menunggu Verifikasi" value={data.pending} />
        <StatCard icon={AlertTriangle} label="Perlu Revisi" value={data.revision} sub={`${data.approved.length} disetujui`} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <Card className="lg:col-span-3 p-5">
          <CardHeader title="Pemeriksaan Disetujui per Bulan" />
          <MonthlyBarChart data={data.bulananArr} />
        </Card>
        <Card className="lg:col-span-2 p-5">
          <CardHeader title="Hasil per Wilayah" subtitle="laporan disetujui" />
          {data.perWilArr.length ? <ResultPieChart data={data.perWilArr} /> : <p className="text-sm text-muted py-10 text-center">Belum ada data.</p>}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5" hover={false}>
          <CardHeader title="Laporan Terbaru"
            action={<Link href="/kepala-divisi/monitoring" className="btn btn-ghost !py-1.5 !px-3 text-xs">Semua</Link>} />
          <DataTable data={data.terbaru} pageSize={6}
            columns={[
              { key: 'tanggal_pemeriksaan', label: 'Tanggal', render: (r) => formatDate(r.tanggal_pemeriksaan) },
              { key: 'nama_kader', label: 'Kader' },
              { key: 'nama_wilayah', label: 'Wilayah' },
              { key: 'status', label: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
            ]} />
        </Card>
        <Card className="p-5" hover={false}>
          <CardHeader title="Progres Kader" subtitle="Rumah diperiksa & disetujui per penugasan" />
          <div className="space-y-4 px-1 pb-2">
            {data.progres.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{p.nama_kader} <span className="text-muted">— {p.nama_wilayah}</span></span>
                  <span className="text-muted">{p.done}/{p.total} ({p.pct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-emerald-500/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.pct}%`, background: 'linear-gradient(90deg,#a3e635,#10b981)', boxShadow: '0 0 10px rgba(163,230,53,.5)' }} />
                </div>
              </div>
            ))}
            {!data.progres.length && <p className="text-sm text-muted">Belum ada penugasan aktif.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
