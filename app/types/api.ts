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

export type PaymentStatus = 'diajukan' | 'disetujui' | 'ditolak' | 'dibayar'

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

export interface TripPaymentSummary {
  id: number
  status: PaymentStatus
  status_label: string
  jumlah_diajukan: number
  jumlah_disetujui: number | null
  created_at: string
}

export interface Trip {
  id: number
  tujuan: string
  tanggal_berangkat: string
  tanggal_pulang: string
  keperluan: string
  status: TripStatus
  status_label: string
  estimasi_biaya: number | null
  total_biaya: number
  selisih_biaya: number | null
  created_at: string
  user?: TripUser
  needs?: TripNeed[]
  documents?: TripDocument[]
  approvals?: TripApproval[]
  payments?: TripPaymentSummary[]
}

export interface Payment {
  id: number
  trip_id: number
  status: PaymentStatus
  status_label: string
  jumlah_diajukan: number
  jumlah_disetujui: number | null
  metode: 'transfer' | 'tunai' | null
  no_referensi: string | null
  catatan: string | null
  bukti_url: string | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
  trip?: {
    id: number
    tujuan: string
    tanggal_berangkat: string
    tanggal_pulang: string
    status: TripStatus
    status_label: string
    user: TripUser | null
  }
  requested_by?: { id: number; name: string }
  verified_by?: { id: number; name: string } | null
  paid_by?: { id: number; name: string } | null
}

export interface PaymentQuery {
  page?: number
  per_page?: number
  status?: PaymentStatus | ''
  trip_id?: number | string
  q?: string
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
  total_estimasi: number
  total_selisih: number
  perjalanan_dengan_estimasi: number
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
  no_hp?: string | null
  jabatan?: string | null
  foto_url?: string | null
  is_active?: boolean
  role: UserRole | null
  roles: UserRole[]
  atasan?: { id: number; name: string } | null
  created_at?: string
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
  no_hp?: string | null
  jabatan?: string | null
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  department?: string | null
  no_hp?: string | null
  jabatan?: string | null
  is_active?: boolean
  atasan_id?: number | null
}

export type UpdateUserPayload = Partial<CreateUserPayload>

export interface ApiErrorData {
  message?: string
  errors?: Record<string, string[]>
}

export interface TripQuery {
  page?: number
  per_page?: number
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
  estimasi_biaya?: number | null
  needs?: { jenis: 'transportasi' | 'penginapan'; keterangan?: string | null }[]
}

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  url: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationListResponse {
  data: AppNotification[]
  unread_count: number
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface NotificationPreferences {
  email: boolean
  in_app: boolean
  travel_reminder: boolean
  payment_updates: boolean
}

export interface CreateExpensePayload {
  jenis: ExpenseType
  jumlah: number
  tanggal: string
  keterangan?: string | null
}

export interface UserQuery {
  page?: number
  per_page?: number
  q?: string
  role?: UserRole | ''
  is_active?: boolean | ''
}
