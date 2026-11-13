export const ROLES = { ADMIN: 'admin', KADER: 'kader', KEPALA: 'kepala_divisi' };

export const ROLE_LABELS = {
  admin: 'Admin',
  kader: 'Kader Jumantik',
  kepala_divisi: 'Kepala Divisi',
};

export const STATUS = {
  DRAFT: 'draft',
  PENDING: 'menunggu_verifikasi',
  APPROVED: 'disetujui',
  REVISION: 'perlu_revisi',
};

export const STATUS_LABELS = {
  draft: 'Draft',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  disetujui: 'Disetujui',
  perlu_revisi: 'Perlu Revisi',
};

export const STATUS_BADGE = {
  draft: 'badge-draft',
  menunggu_verifikasi: 'badge-pending',
  disetujui: 'badge-approved',
  perlu_revisi: 'badge-revision',
};

export const KESIMPULAN_LABELS = {
  positif_jentik: 'Positif Jentik',
  bebas_jentik: 'Bebas Jentik',
};

export const TPA_LIST = [
  'Bak Mandi',
  'Ember',
  'Tempat Minum Hewan',
  'Vas Bunga',
  'Drum / Tong',
  'Penampungan Air Luar Rumah',
  'Tempat Penampungan Lainnya',
];

export const KONDISI_TPA = ['Baik', 'Kotor', 'Tertutup', 'Terbuka', 'Rusak'];

export const MAX_FOTO_SIZE = 700 * 1024; // 700 KB
export const FOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
