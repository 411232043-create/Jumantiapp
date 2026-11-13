'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from './ui/Card';
import { Badge } from './ui/Badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { listDocs, where } from '@/services/firestore';
import { Bug, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';

export function PemeriksaanDetail({ p }) {
  const [riwayat, setRiwayat] = useState([]);
  const [verifikasi, setVerifikasi] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!p?.id) return;
    const desc = (a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
    listDocs('riwayat_status', where('id_pemeriksaan', '==', p.id))
      .then((d) => setRiwayat(d.sort(desc))).catch(() => {});
    listDocs('verifikasi', where('id_pemeriksaan', '==', p.id))
      .then((d) => setVerifikasi(d.sort(desc))).catch(() => {});
  }, [p?.id]);

  if (!p) return null;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5" hover={false}>
          <CardHeader title="Identitas Pemeriksaan" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm px-1 pb-2">
            <Item l="Kader" v={p.nama_kader} />
            <Item l="Wilayah" v={p.nama_wilayah} />
            <Item l="Pemilik Rumah" v={p.nama_warga} />
            <Item l="Alamat" v={p.alamat_rumah} />
            <Item l="Tanggal" v={formatDate(p.tanggal_pemeriksaan)} />
            <Item l="Waktu" v={p.waktu_pemeriksaan} />
            <Item l="Status" v={<Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABELS[p.status]}</Badge>} />
            <Item l="Kesimpulan" v={
              <Badge variant={p.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>
                {KESIMPULAN_LABELS[p.kesimpulan] || '-'}
              </Badge>} />
          </dl>
        </Card>

        <Card className="p-5" hover={false}>
          <CardHeader title="Kesimpulan & Tindakan" />
          <div className="space-y-3 text-sm px-1 pb-2">
            <Item l="Catatan Pemeriksaan" v={p.catatan || '-'} full />
            <Item l="Edukasi yang Diberikan" v={p.edukasi || '-'} full />
            <Item l="Tindakan yang Dilakukan" v={p.tindakan || '-'} full />
            <Item l="Rekomendasi Tindak Lanjut" v={p.rekomendasi || '-'} full />
          </div>
        </Card>
      </div>

      <Card className="p-5" hover={false}>
        <CardHeader title="Pemeriksaan Tempat Penampungan Air"
          subtitle={`${(p.detail || []).length} tempat diperiksa`} />
        <div className="tbl-wrap overflow-x-auto mx-1 mb-2">
          <table className="tbl min-w-[560px]">
            <thead><tr><th>Tempat Penampungan</th><th>Kondisi</th><th>Jumlah</th><th>Jentik</th><th>Catatan</th></tr></thead>
            <tbody>
              {(p.detail || []).map((d, i) => (
                <tr key={i}>
                  <td className="font-medium">{d.nama_tempat_penampungan}</td>
                  <td>{d.kondisi || '-'}</td>
                  <td>{d.jumlah_wadah || 1}</td>
                  <td>
                    {d.ditemukan_jentik
                      ? <span className="inline-flex items-center gap-1 text-rose-300 font-semibold"><Bug size={14} /> Ya</span>
                      : <span className="inline-flex items-center gap-1 text-emerald-300"><XCircle size={14} /> Tidak</span>}
                  </td>
                  <td className="text-muted">{d.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5" hover={false}>
        <CardHeader title="Dokumentasi Foto" subtitle={`${(p.fotos || []).length} foto`} />
        <div className="flex flex-wrap gap-3 px-1 pb-2">
          {(p.fotos || []).map((f, i) => (
            <button key={i} onClick={() => setPreview(f.url)}
              className="w-28 h-28 rounded-xl overflow-hidden border border-emerald-500/25 hover:border-lime-400/60 transition shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.nama_file || 'dokumentasi'} className="w-full h-full object-cover" />
            </button>
          ))}
          {!(p.fotos || []).length && (
            <p className="text-sm text-muted flex items-center gap-2"><ImageIcon size={16} /> Tidak ada foto dokumentasi.</p>
          )}
        </div>
      </Card>

      {!!verifikasi.length && (
        <Card className="p-5" hover={false}>
          <CardHeader title="Riwayat Verifikasi" />
          <div className="space-y-3 px-1 pb-2">
            {verifikasi.map((v) => (
              <div key={v.id} className="flex gap-3 text-sm border-l-2 border-emerald-500/30 pl-3">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {v.keputusan === STATUS.APPROVED
                      ? <><CheckCircle2 size={15} className="text-emerald-400" /> Disetujui</>
                      : <><XCircle size={15} className="text-rose-400" /> Perlu Revisi</>}
                    <span className="text-muted font-normal">oleh {v.nama_verifikator}</span>
                  </p>
                  {v.catatan_verifikasi && <p className="text-muted mt-1">{v.catatan_verifikasi}</p>}
                  <p className="text-[11px] text-muted mt-1">{formatDateTime(v.tanggal_verifikasi || v.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!!riwayat.length && (
        <Card className="p-5" hover={false}>
          <CardHeader title="Riwayat Status" />
          <div className="space-y-2.5 px-1 pb-2">
            {riwayat.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-lime-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-muted">{r.status_sebelumnya ? `${STATUS_LABELS[r.status_sebelumnya]} → ` : ''}</span>
                  <Badge variant={STATUS_BADGE[r.status_baru]}>{STATUS_LABELS[r.status_baru]}</Badge>
                  <span className="text-muted ml-2">{r.keterangan} — {r.nama_pengguna}</span>
                </div>
                <span className="text-[11px] text-muted">{formatDateTime(r.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {preview && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4" onClick={() => setPreview(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function Item({ l, v, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-[11px] uppercase tracking-wider text-muted font-semibold">{l}</dt>
      <dd className="mt-0.5">{v ?? '-'}</dd>
    </div>
  );
}
