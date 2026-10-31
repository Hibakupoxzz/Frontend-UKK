import type { UserRole } from '~/composables/useAuth'

export interface NavItem {
  label: string
  icon: string
  to: string
  roles: UserRole[]
  children?: NavItem[]
  activeRoutes?: string[]
}

export const NAV_CONFIG: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8v-10h-8v10Zm0-18v6h8V3h-8Z',
    to: '/admin/dashboard',
    roles: ['admin', 'finance', 'hrd', 'pegawai', 'atasan'],
  },
  {
    label: 'Persetujuan',
    icon: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z',
    to: '/atasan/persetujuan',
    roles: ['atasan'],
    activeRoutes: ['/atasan/persetujuan'],
  },
  {
    label: 'Perjalanan Tim',
    icon: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z',
    to: '/atasan/perjalanan-tim',
    roles: ['atasan'],
    activeRoutes: ['/atasan/perjalanan-tim'],
  },
  {
    label: 'Laporan',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2ZM8 17H6v-5h2v5Zm5 0h-2V7h2v10Zm5 0h-2v-8h2v8Z',
    to: '/atasan/laporan',
    roles: ['atasan'],
  },
  {
    label: 'Perjalanan Dinas',
    icon: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z',
    to: '/admin/perjalanan-dinas',
    roles: ['admin'],
    activeRoutes: ['/admin/DetailPerjalanan'],
  },
  {
    label: 'Pengajuan Perjalanan',
    icon: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2 14H7v-2h10v2Zm0-4H7v-2h10v2Zm0-4H7V7h10v2Z',
    to: '/admin/pengajuan-perjalanan',
    roles: ['admin'],
  },
  {
    label: 'Data Pengguna',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M17 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    to: '/admin/data-pengguna',
    roles: ['admin'],
  },
  {
    label: 'Persetujuan',
    icon: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z',
    to: '/admin/persetujuan',
    roles: ['admin'],
  },
  {
    label: 'Pemesanan',
    icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2ZM1 2v2h2l3.6 7.59-1.35 2.44C5.09 14.32 5 14.65 5 15c0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03L20.88 5H5.21l-.94-2H1Zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2Z',
    to: '/admin/pemesanan',
    roles: ['admin'],
  },
  {
    label: 'Reimbursement',
    icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 14H4V8h16v10Zm-2-5h-4v2h4v-2Z',
    to: '/admin/reimbursement',
    roles: ['admin'],
  },
  {
    label: 'Pengeluaran',
    icon: 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 21h18M5 21v-4a2 2 0 0 1 2-2h4',
    to: '/finance/pengeluaran',
    roles: ['finance'],
  },
  {
    label: 'Pembayaran',
    icon: 'M12 2a3 3 0 0 0-3 3v7H5a2 2 0 0 0 0 4h12a2 2 0 0 0 0-4h-4V5a3 3 0 0 0-3-3ZM3 3v18h18',
    to: '/finance/pembayaran',
    roles: ['finance'],
  },
  {
    label: 'Laporan',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2ZM8 17H6v-5h2v5Zm5 0h-2V7h2v10Zm5 0h-2v-8h2v8Z',
    to: '/admin/laporan',
    roles: ['admin'],
  },
  {
    label: 'Laporan',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2ZM8 17H6v-5h2v5Zm5 0h-2V7h2v10Zm5 0h-2v-8h2v8Z',
    to: '/finance/laporan',
    roles: ['finance'],
  },
  {
    label: 'Data Pegawai',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M17 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    to: '/hrd/data-pegawai',
    roles: ['hrd'],
    activeRoutes: ['/hrd/pegawai-detail'],
  },
  {
    label: 'Pelaksanaan Perjalanan',
    icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    to: '/hrd/pelaksanaan',
    roles: ['hrd', 'pegawai'],
    activeRoutes: ['/hrd/detail-perjalanan'],
  },
  {
    label: 'Laporan',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM16 8v8M12 12h6M12 16h6',
    to: '/hrd/laporan',
    roles: ['hrd'],
  },
  {
    label: 'Rencana Perjalanan',
    icon: 'M9 11l3 3L22 4M21 12V7H5a2 2 0 0 1 0-4h14v4M3 21h18',
    to: '/pegawai/rencana',
    roles: ['pegawai'],
  },
  {
    label: 'Pengeluaran Perjalanan',
    icon: 'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 21h18M5 21v-4a2 2 0 0 1 2-2h4',
    to: '/pegawai/pengeluaran',
    roles: ['pegawai'],
  },
  {
    label: 'Profil',
    icon: 'M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98L14.5 2.42C14.47 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.5.42L9.12 5.07c-.61.25-1.18.59-1.69.98l-2.49-1c-.23-.08-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.61-.25 1.18-.58 1.69-.98l2.49 1c.23.08.48 0 .6-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z',
    to: '/admin/pengaturan',
    roles: ['admin', 'finance', 'hrd', 'pegawai', 'atasan'],
  },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  finance: 'Finance',
  hrd: 'HRD',
  pegawai: 'Pegawai',
  atasan: 'Atasan',
}

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  finance: '/finance/dashboard',
  hrd: '/hrd/dashboard',
  pegawai: '/pegawai/dashboard',
  atasan: '/atasan/dashboard',
}

const ROLE_NAV_ORDER: Record<UserRole, string[]> = {
  admin: [
    'Dashboard',
    'Pengajuan Perjalanan',
    'Persetujuan',
    'Pemesanan',
    'Reimbursement',
    'Laporan',
    'Perjalanan Dinas',
    'Data Pengguna',
    'Profil',
  ],
  finance: ['Dashboard', 'Pengeluaran', 'Pembayaran', 'Laporan', 'Profil'],
  hrd: ['Dashboard', 'Data Pegawai', 'Pelaksanaan Perjalanan', 'Laporan', 'Profil'],
  pegawai: [
    'Dashboard',
    'Rencana Perjalanan',
    'Pelaksanaan Perjalanan',
    'Pengeluaran Perjalanan',
    'Profil',
  ],
  atasan: ['Dashboard', 'Persetujuan', 'Perjalanan Tim', 'Laporan', 'Profil'],
}

export const getNavForRole = (role: UserRole): NavItem[] => {
  return NAV_CONFIG
    .filter((item) => item.roles.includes(role))
    .sort((left, right) => ROLE_NAV_ORDER[role].indexOf(left.label) - ROLE_NAV_ORDER[role].indexOf(right.label))
    .map((item) => item.label === 'Dashboard'
      ? { ...item, to: ROLE_ROUTES[role] }
      : item)
}