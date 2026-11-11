import {
  LayoutDashboard, Users, MapPin, ClipboardList, Home, FileCheck,
  FileBarChart, Settings, User, Building2, UserCheck, ClipboardPlus,
  History, FileText, Activity, CheckSquare, BarChart3, Contact,
} from 'lucide-react';

export const MENUS = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
    { label: 'Data Admin', href: '/admin/users?role=admin', icon: UserCheck },
    { label: 'Data Kepala Divisi', href: '/admin/users?role=kepala_divisi', icon: Contact },
    { label: 'Data Kader', href: '/admin/users?role=kader', icon: Users },
    { label: 'Manajemen Wilayah', href: '/admin/wilayah', icon: MapPin },
    { label: 'Penugasan Kader', href: '/admin/penugasan', icon: ClipboardList },
    { label: 'Data Warga', href: '/admin/warga', icon: Contact },
    { label: 'Data Rumah', href: '/admin/rumah', icon: Home },
    { label: 'Data Pemeriksaan', href: '/admin/pemeriksaan', icon: FileCheck },
    { label: 'Laporan', href: '/admin/laporan', icon: FileBarChart },
    { label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
    { label: 'Profil', href: '/admin/profil', icon: User },
  ],
  kader: [
    { label: 'Dashboard', href: '/kader', icon: LayoutDashboard },
    { label: 'Wilayah Tugas', href: '/kader/wilayah', icon: MapPin },
    { label: 'Data Rumah', href: '/kader/rumah', icon: Home },
    { label: 'Pemeriksaan Baru', href: '/kader/pemeriksaan/baru', icon: ClipboardPlus },
    { label: 'Riwayat Pemeriksaan', href: '/kader/riwayat', icon: History },
    { label: 'Laporan Saya', href: '/kader/laporan', icon: FileText },
    { label: 'Profil', href: '/kader/profil', icon: User },
  ],
  kepala_divisi: [
    { label: 'Dashboard Monitoring', href: '/kepala-divisi', icon: LayoutDashboard },
    { label: 'Data Kader', href: '/kepala-divisi/kader', icon: Users },
    { label: 'Data Wilayah', href: '/kepala-divisi/wilayah', icon: MapPin },
    { label: 'Monitoring Pemeriksaan', href: '/kepala-divisi/monitoring', icon: Activity },
    { label: 'Verifikasi Laporan', href: '/kepala-divisi/verifikasi', icon: CheckSquare },
    { label: 'Statistik Pemeriksaan', href: '/kepala-divisi/statistik', icon: BarChart3 },
    { label: 'Laporan', href: '/kepala-divisi/laporan', icon: FileBarChart },
    { label: 'Profil', href: '/kepala-divisi/profil', icon: User },
  ],
};

export const SECTION_HOME = { admin: '/admin', kader: '/kader', kepala_divisi: '/kepala-divisi' };
export const SECTION_PREFIX = { admin: '/admin', kader: '/kader', kepala_divisi: '/kepala-divisi' };
