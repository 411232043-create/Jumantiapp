'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { PemeriksaanDetail } from '@/components/PemeriksaanDetail';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { useToast } from '@/components/ui/Toast';
import { getDocById, verifikasiLaporan } from '@/services/firestore';
import { STATUS } from '@/lib/constants';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function DetailVerifikasi({ params }) {
  const { id } = use(params);
  const user = useCurrentUser();
  const toast = useToast();
  const [p, setP] = useState(undefined);
  const [modal, setModal] = useState(null); // 'approve' | 'revisi'
  const [catatan, setCatatan] = useState('');
  const [working, setWorking] = useState(false);

  const load = () => getDocById('pemeriksaan', id).then(setP);
  useEffect(() => { load(); }, [id]);

  if (p === undefined || user === undefined) return <PageLoader />;
  if (!p) return <p className="text-muted">Laporan tidak ditemukan.</p>;

  const submit = async () => {
    if (modal === 'revisi' && !catatan.trim()) return toast.error('Alasan revisi wajib diisi.');
    setWorking(true);
    try {
      await verifikasiLaporan({
        pemeriksaan: p,
        keputusan: modal === 'approve' ? STATUS.APPROVED : STATUS.REVISION,
        catatan: catatan.trim(), verifikator: user,
      });
      toast.success(modal === 'approve' ? 'Laporan disetujui.' : 'Permintaan revisi dikirim ke kader.');
      setModal(null); setCatatan('');
      load();
    } catch (e) { toast.error(e.message); } finally { setWorking(false); }
  };

  return (
    <div>
      <PageHeader title="Detail & Verifikasi Laporan" subtitle="Periksa hasil pemeriksaan dan dokumentasi sebelum memutuskan"
        action={<div className="flex gap-2">
          <Link href="/kepala-divisi/verifikasi" className="btn btn-ghost"><ArrowLeft size={15} /> Kembali</Link>
          {p.status === STATUS.PENDING && <>
            <button className="btn btn-warning" onClick={() => setModal('revisi')}><XCircle size={15} /> Minta Revisi</button>
            <button className="btn btn-primary" onClick={() => setModal('approve')}><CheckCircle2 size={15} /> Setujui</button>
          </>}
        </div>} />

      <PemeriksaanDetail p={p} />

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'approve' ? 'Setujui Laporan' : 'Minta Revisi'}>
        <p className="text-sm text-muted mb-4">
          {modal === 'approve'
            ? 'Laporan akan masuk rekapitulasi resmi dan tidak dapat diedit kembali oleh kader.'
            : 'Kader akan menerima notifikasi dan dapat memperbaiki laporan ini.'}
        </p>
        <label className="label">Catatan Verifikasi {modal === 'revisi' && <span className="text-rose-400">*</span>}</label>
        <textarea className="textarea" rows={4} value={catatan} onChange={(e) => setCatatan(e.target.value)}
          placeholder={modal === 'approve' ? 'Catatan (opsional)' : 'Jelaskan bagian yang perlu diperbaiki...'} />
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
          <button className={`btn ${modal === 'approve' ? 'btn-primary' : 'btn-warning'}`} onClick={submit} disabled={working}>
            {working && <Spinner size={14} />} {modal === 'approve' ? 'Setujui Laporan' : 'Kirim Revisi'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
