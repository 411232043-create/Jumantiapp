import Link from 'next/link';
import { Bug } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="app-bg" /><div className="orb orb-a" /><div className="orb orb-b" />
      <div className="glass-card p-10 text-center max-w-md">
        <div className="glow-icon mx-auto mb-4 w-fit"><Bug size={28} /></div>
        <h1 className="text-3xl font-extrabold gradient-text">404</h1>
        <p className="text-muted mt-2 text-sm">Halaman yang Anda cari tidak ditemukan.</p>
        <Link href="/" className="btn btn-primary mt-6">Kembali ke Dashboard</Link>
      </div>
    </div>
  );
}
