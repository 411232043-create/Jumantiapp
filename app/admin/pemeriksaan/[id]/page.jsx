'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/Spinner';
import { PemeriksaanDetail } from '@/components/PemeriksaanDetail';
import { getDocById } from '@/services/firestore';
import { ArrowLeft } from 'lucide-react';

export default function DetailPage({ params }) {
  const { id } = use(params);
  const [p, setP] = useState(undefined);

  useEffect(() => { getDocById('pemeriksaan', id).then(setP); }, [id]);

  if (p === undefined) return <PageLoader />;
  if (!p) return <p className="text-muted">Data tidak ditemukan.</p>;

  return (
    <div>
      <PageHeader title="Detail Pemeriksaan" subtitle="Informasi lengkap laporan pemeriksaan"
        action={<Link href="/admin/pemeriksaan" className="btn btn-ghost"><ArrowLeft size={15} /> Kembali</Link>} />
      <PemeriksaanDetail p={p} />
    </div>
  );
}
