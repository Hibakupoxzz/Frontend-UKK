import type { UserRole } from '~/composables/useAuth'
import type { IconName } from '~/utils/icons'

export interface NavItem {
  label: string
  icon: IconName
  to: string
  roles: UserRole[]
  children?: NavItem[]
  activeRoutes?: string[]
}

export const NAV_CONFIG: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    to: '/admin/dashboard',
    roles: ['admin', 'finance', 'hrd', 'pegawai', 'atasan'],
  },
  {
    label: 'Persetujuan',
    icon: 'clipboard-check',
    to: '/atasan/persetujuan',
    roles: ['atasan'],
    activeRoutes: ['/atasan/persetujuan'],
  },
  {
    label: 'Perjalanan Tim',
    icon: 'users',
    to: '/atasan/perjalanan-tim',
    roles: ['atasan'],
    activeRoutes: ['/atasan/perjalanan-tim'],
  },
  {
    label: 'Laporan',
    icon: 'bar-chart',
    to: '/atasan/laporan',
    roles: ['atasan'],
  },
  {
    label: 'Perjalanan Dinas',
    icon: 'route',
    to: '/admin/perjalanan-dinas',
    roles: ['admin'],
    activeRoutes: ['/admin/DetailPerjalanan'],
  },
  {
    label: 'Pengajuan Perjalanan',
    icon: 'file-plus',
    to: '/admin/pengajuan-perjalanan',
    roles: ['admin'],
  },
  {
    label: 'Data Pengguna',
    icon: 'users',
    to: '/admin/data-pengguna',
    roles: ['admin'],
  },
  {
    label: 'Persetujuan',
    icon: 'clipboard-check',
    to: '/admin/persetujuan',
    roles: ['admin'],
  },
  {
    label: 'Pemesanan',
    icon: 'cart',
    to: '/admin/pemesanan',
    roles: ['admin'],
  },
  {
    label: 'Pagu Anggaran',
    icon: 'wallet',
    to: '/admin/anggaran',
    roles: ['admin'],
  },
  {
    label: 'Log Aktivitas',
    icon: 'history',
    to: '/admin/aktivitas',
    roles: ['admin'],
  },
  {
    label: 'Reimbursement',
    icon: 'receipt',
    to: '/admin/reimbursement',
    roles: ['admin'],
  },
  {
    label: 'Pengeluaran',
    icon: 'wallet',
    to: '/finance/pengeluaran',
    roles: ['finance'],
  },
  {
    label: 'Pembayaran',
    icon: 'credit-card',
    to: '/finance/pembayaran',
    roles: ['finance'],
  },
  {
    label: 'Laporan',
    icon: 'bar-chart',
    to: '/admin/laporan',
    roles: ['admin'],
  },
  {
    label: 'Laporan',
    icon: 'bar-chart',
    to: '/finance/laporan',
    roles: ['finance'],
  },
  {
    label: 'Data Pegawai',
    icon: 'users',
    to: '/hrd/data-pegawai',
    roles: ['hrd'],
    activeRoutes: ['/hrd/pegawai-detail'],
  },
  {
    label: 'Pelaksanaan Perjalanan',
    icon: 'route',
    to: '/hrd/pelaksanaan',
    roles: ['hrd', 'pegawai'],
    activeRoutes: ['/hrd/detail-perjalanan'],
  },
  {
    label: 'Persetujuan Akhir',
    icon: 'clipboard-check',
    to: '/hrd/persetujuan',
    roles: ['hrd'],
    activeRoutes: ['/hrd/persetujuan'],
  },
  {
    label: 'Laporan',
    icon: 'bar-chart',
    to: '/hrd/laporan',
    roles: ['hrd'],
  },
  {
    label: 'Rencana Perjalanan',
    icon: 'calendar-plus',
    to: '/pegawai/rencana',
    roles: ['pegawai'],
  },
  {
    label: 'Pengeluaran Perjalanan',
    icon: 'wallet',
    to: '/pegawai/pengeluaran',
    roles: ['pegawai'],
  },
  {
    label: 'Profil',
    icon: 'settings',
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
