import type { TripStatus } from '~/types/api'

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: 'Draft',
  diajukan: 'Menunggu Persetujuan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  berjalan: 'Berlangsung',
  selesai: 'Selesai',
  lengkap: 'Lengkap',
}

const STATUS_CLASSES: Record<TripStatus, string> = {
  draft: 'draft',
  diajukan: 'waiting',
  disetujui: 'approved',
  ditolak: 'rejected',
  berjalan: 'ongoing',
  selesai: 'completed',
  lengkap: 'completed',
}

export const formatCurrency = (value: number | null | undefined): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export const formatNumber = (value: number | null | undefined): string => {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0)
}

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export const formatDateRange = (start: string | null | undefined, end: string | null | undefined): string => {
  return `${formatDate(start)} - ${formatDate(end)}`
}

export const tripStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as TripStatus] ?? status
}

export const tripStatusClass = (status: string): string => {
  return STATUS_CLASSES[status as TripStatus] ?? 'draft'
}

export const expenseTypeLabel = (jenis: string): string => {
  const labels: Record<string, string> = {
    transportasi: 'Transportasi',
    penginapan: 'Penginapan',
    konsumsi: 'Konsumsi',
    lainnya: 'Lainnya',
  }

  return labels[jenis] ?? jenis
}

export const periodRange = (period: string): { dari?: string; sampai?: string } => {
  if (!period) return {}

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const pad = (value: number) => String(value).padStart(2, '0')
  const toDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  if (period === 'month' || period === 'bulan-ini') {
    return {
      dari: toDate(new Date(year, month, 1)),
      sampai: toDate(new Date(year, month + 1, 0)),
    }
  }

  if (period === 'quarter' || period === 'kuartal-ini') {
    const quarterStart = Math.floor(month / 3) * 3
    return {
      dari: toDate(new Date(year, quarterStart, 1)),
      sampai: toDate(new Date(year, quarterStart + 3, 0)),
    }
  }

  if (period === 'year' || period === 'tahun-ini') {
    return {
      dari: toDate(new Date(year, 0, 1)),
      sampai: toDate(new Date(year, 11, 31)),
    }
  }

  return {}
}
