import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'SI-JUMANTIK — Sistem Informasi Pemantauan Jentik Nyamuk',
  description: 'Aplikasi pemantauan jentik nyamuk untuk kader Jumantik dan kepala divisi.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
