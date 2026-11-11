# Panduan Deployment

## 1. Firebase (wajib sebelum app berfungsi penuh)

```bash
npm install -g firebase-tools
firebase login                 # gunakan akun pemilik project jumantik-f2c68
firebase deploy --only firestore:rules,firestore:indexes,storage --project jumantik-f2c68
```

Pastikan di Firebase Console:
- Authentication → Sign-in method → Email/Password: **Enabled**
- Firestore Database: sudah dibuat
- Storage: sudah dibuat (bucket sesuai NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)

## 2. Provisioning akun awal

```bash
node scripts/provision-users.mjs
```

## 3. Vercel

1. Push repo ke GitHub.
2. Import project di Vercel (framework: Next.js, auto-detect).
3. Masukkan environment variables (lihat `.env.example`):
   - `NEXT_PUBLIC_FIREBASE_*` (6 variabel)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `INITIAL_*_PASSWORD` (opsional, hanya untuk provisioning ulang)
4. Deploy.
5. Tambahkan domain Vercel di Firebase Console →
   Authentication → Settings → Authorized domains.

## 4. Verifikasi produksi

- Login 3 akun awal → masing-masing diarahkan ke dashboard rolenya.
- Kader: buat pemeriksaan, upload foto, kirim laporan.
- Kepala divisi: setujui / minta revisi.
- Admin: tambah pengguna & wilayah.
- Ekspor PDF/Excel di halaman Laporan.
