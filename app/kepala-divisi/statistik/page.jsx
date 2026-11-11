'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageLoader } from '@/components/ui/Spinner';
import { MonthlyBarChart, ResultPieChart } from '@/components/Charts';
import { listPemeriksaan, listWilayah } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { STATUS } from '@/lib/constants';
import { hitungABJ } from '@/lib/utils';
import { Home, Bug, CheckCircle2, Percent } from 'lucide-react';

export default function StatistikPage() {
  const [items, setItems] = useState(null);
  const [wilayah, setWilayah] = useState([]);
  const [f, setF] = useState({ dari: '', sampai: '' });

  useEffect(() => {
    Promise.all([listPemeriksaan(where('status', '==', STATUS.APPROVED)), listWilayah()])
      .then(([p, w]) => { setItems(p); setWilayah(w); }).catch(console.error);
  }, []);

  const filtered = useMemo(() => (items || []).filter((p) =>
    (!f.dari || (p.tanggal_pemeriksaan || '') >= f.dari) &&
    (!f.sampai || (p.tanggal_pemeriksaan || '') <= f.sampai)), [items, f]);

  const stats = useMemo(() => {
    const positif = filtered.filter((p) => p.kesimpulan === 'positif_jentik').length;
    const bebas = filtered.length - positif;
    const perWil = wilayah.map((w) => {
      const rows = filtered.filter((p) => p.id_wilayah === w.id);
      const b = rows.filter((p) => p.kesimpulan === 'bebas_jentik').length;
      return { nama: w.nama_wilayah, total: rows.length, positif: rows.length - b, bebas: b, abj: hitungABJ(rows.length, b) };
    }).filter((x) => x.total > 0);
    return { total: filtered.length, positif, bebas, abj: hitungABJ(filtered.length, bebas), perWil };
  }, [filtered, wilayah]);

  if (!items) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Statistik Pemeriksaan" subtitle="Indikator Angka Bebas Jentik (ABJ) dari laporan disetujui"
        action={<div className="flex gap-2 items-center">
          <input type="date" className="input !w-40" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} />
          <span className="text-muted text-xs">s/d</span>
          <input type="date" className="input !w-40" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} />
        </div>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Home} label="Rumah Diperiksa" value={stats.total} />
        <StatCard icon={Bug} label="Positif Jentik" value={stats.positif} />
        <StatCard icon={CheckCircle2} label="Bebas Jentik" value={stats.bebas} />
        <StatCard icon={Percent} label="ABJ" value={`${stats.abj}%`} sub="bebas / diperiksa × 100%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card className="p-5">
          <CardHeader title="ABJ per Wilayah" subtitle="perbandingan antarwilayah" />
          <MonthlyBarChart data={stats.perWil.map((w) => ({ label: w.nama, total: w.abj }))} color="#a3e635" />
        </Card>
        <Card className="p-5">
          <CardHeader title="Distribusi Hasil" />
          <ResultPieChart data={[{ name: 'Bebas Jentik', value: stats.bebas }, { name: 'Positif Jentik', value: stats.positif }]} />
        </Card>
      </div>

      <Card className="p-5" hover={false}>
        <CardHeader title="Rekap per Wilayah" />
        <div className="overflow-x-auto px-1 pb-2">
          <table className="tbl min-w-[560px]">
            <thead><tr><th>Wilayah</th><th>Diperiksa</th><th>Positif</th><th>Bebas</th><th>ABJ</th></tr></thead>
            <tbody>
              {stats.perWil.map((w) => (
                <tr key={w.nama}>
                  <td className="font-medium">{w.nama}</td>
                  <td>{w.total}</td>
                  <td className="text-rose-300">{w.positif}</td>
                  <td className="text-emerald-300">{w.bebas}</td>
                  <td className="font-bold gradient-text">{w.abj}%</td>
                </tr>
              ))}
              {!stats.perWil.length && <tr><td colSpan={5} className="text-center text-muted py-8">Belum ada data disetujui.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
