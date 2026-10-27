import type { UserRole } from '~/composables/useAuth'

export type { UserRole }

export type TripStatus =
  | 'draft'
  | 'diajukan'
  | 'disetujui'
  | 'ditolak'
  | 'berjalan'
  | 'selesai'
  | 'lengkap'

export type ExpenseType = 'transportasi' | 'penginapan' | 'konsumsi' | 'lainnya'

export interface Paginated<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

export interface TripUser {
  id: number
  name: string
  department: string | null
}

export interface TripNeed {
  id: number
  jenis: 'transportasi' | 'penginapan'
  keterangan: string | null
}

export interface TripDocument {
  id: number
  jenis: string | null
  url: string
}

export interface TripApproval {
  id: number
  status: TripStatus
  catatan: string | null
  approver: string | null
  at: string
}

export interface Trip {
  id: number
  tujuan: string
  tanggal_berangkat: string
  tanggal_pulang: string
  keperluan: string
  status: TripStatus
  status_label: string
  total_biaya: number
  created_at: string
  user?: TripUser
  needs?: TripNeed[]
  documents?: TripDocument[]
  approvals?: TripApproval[]
}

export interface Expense {
  id: number
  trip_id: number
  jenis: ExpenseType
  jumlah: number
  tanggal: string
  keterangan: string | null
  receipts?: { id: number; url: string }[]
}

export interface ExpenseListResponse {
  data: Expense[]
  total_biaya: number
}

export interface DashboardSummary {
  total_perjalanan: number
  per_status: Record<TripStatus, number>
  total_biaya: number
  terbaru: Trip[]
  menunggu_approval?: number
}

export interface DashboardResponse {
  data: DashboardSummary
}

export interface ReportTable {
  title: string
  headings: string[]
  rows: (string | number | null)[][]
  footer: string
}

export interface ApiUser {
  id: number
  name: string
  email: string
  department: string | null
  role: UserRole | null
  roles: UserRole[]
  atasan?: { id: number; name: string } | null
  created_at?: string
}

export interface ApiErrorData {
  message?: string
  errors?: Record<string, string[]>
}

export interface TripQuery {
  page?: number
  status?: TripStatus | ''
  tujuan?: string
  user_id?: number | string
  dari?: string
  sampai?: string
}

export interface CreateTripPayload {
  tujuan: string
  tanggal_berangkat: string
  tanggal_pulang: string
  keperluan: string
  needs?: { jenis: 'transportasi' | 'penginapan'; keterangan?: string | null }[]
}

export interface CreateExpensePayload {
  jenis: ExpenseType
  jumlah: number
  tanggal: string
  keterangan?: string | null
}

export interface UserQuery {
  page?: number
  q?: string
  role?: UserRole | ''
}
