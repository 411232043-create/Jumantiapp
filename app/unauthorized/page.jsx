import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="app-bg" /><div className="orb orb-a" /><div className="orb orb-b" />
      <div className="glass-card p-10 text-center max-w-md">
        <div className="glow-icon mx-auto mb-4 w-fit !text-rose-300"><ShieldAlert size={28} /></div>
        <h1 className="text-2xl font-extrabold gradient-text">Akses Ditolak</h1>
        <p className="text-muted mt-2 text-sm">Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link href="/" className="btn btn-primary mt-6">Kembali ke Dashboard</Link>
      </div>
    </div>
  );
}
