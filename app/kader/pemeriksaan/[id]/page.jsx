'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { PemeriksaanDetail } from '@/components/PemeriksaanDetail';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { useToast } from '@/components/ui/Toast';
import { getDocById, simpanPemeriksaan, hapusPemeriksaan } from '@/services/firestore';
import { STATUS } from '@/lib/constants';
import { ArrowLeft, Pencil, Send, Trash2 } from 'lucide-react';

export default function DetailPemeriksaanKader({ params }) {
  const { id } = use(params);
  const user = useCurrentUser();
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState(undefined);
  const [sending, setSending] = useState(false);
  const [del, setDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => getDocById('pemeriksaan', id).then(setP);
  useEffect(() => { load(); }, [id]);

  if (p === undefined || user === undefined) return <PageLoader />;
  if (!p || (user && p.id_kader !== user.uid)) {
    return <p className="text-muted">Data pemeriksaan tidak ditemukan.</p>;
  }

  const kirim = async () => {
    setSending(true);
    try {
      await simpanPemeriksaan({ id: p.id, payload: { ...p, _status_sebelumnya: p.status }, statusBaru: STATUS.PENDING, user });
      toast.success('Laporan dikirim untuk verifikasi.');
      load();
    } catch (e) { toast.error(e.message); } finally { setSending(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await hapusPemeriksaan(p.id);
      toast.success('Draft dihapus.');
      router.replace('/kader/riwayat');
    } catch (e) { toast.error(e.message); } finally { setDeleting(false); }
  };

  const editable = [STATUS.DRAFT, STATUS.REVISION].includes(p.status);

  return (
    <div>
      <PageHeader title="Detail Pemeriksaan"
        subtitle={p.status === STATUS.REVISION ? `Catatan revisi: ${p.catatan_verifikasi || '-'}` : undefined}
        action={<div className="flex gap-2">
          <Link href="/kader/riwayat" className="btn btn-ghost"><ArrowLeft size={15} /> Kembali</Link>
          {editable && <>
            <Link href={`/kader/pemeriksaan/baru?edit=${p.id}`} className="btn btn-ghost"><Pencil size={15} /> Edit</Link>
            {p.status === STATUS.DRAFT && (
              <button className="btn btn-ghost text-rose-300" onClick={() => setDel(true)}><Trash2 size={15} /> Hapus</button>
            )}
            <button className="btn btn-primary" onClick={kirim} disabled={sending}>{sending ? 'Mengirim...' : <><Send size={15} /> Kirim Laporan</>}</button>
          </>}
        </div>} />
      <PemeriksaanDetail p={p} />
      <ConfirmModal open={del} onClose={() => setDel(false)} onConfirm={doDelete} loading={deleting} danger
        title="Hapus Draft" message="Hapus draft pemeriksaan ini secara permanen?" />
    </div>
  );
}
