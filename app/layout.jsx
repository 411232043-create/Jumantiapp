import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'SI-JUMANTIK — Sistem Informasi Pemantauan Jentik Nyamuk',
  description: 'Aplikasi pemantauan jentik nyamuk untuk kader Jumantik dan kepala divisi.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('sijumantik-theme');if(t){document.documentElement.dataset.theme=t;}}catch(e){}",
          }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
