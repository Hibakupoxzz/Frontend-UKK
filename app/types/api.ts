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
  approval_level: number
  approval_level_label: string
  is_archived: boolean
  verification_code: string | null
  estimasi_biaya: number | null
  total_biaya: number
  selisih_biaya: number | null
  created_at: string
  user?: TripUser
  needs?: TripNeed[]
  documents?: TripDocument[]
  approvals?: TripApproval[]
  payments?: TripPaymentSummary[]
  bookings?: TripBookingSummary[]
}

export interface TripBookingSummary {
  id: number
  jenis: string
  jenis_label: string
  vendor: string | null
  vendor_id: number | null
  vendor_name: string | null
  kode_booking: string | null
  tanggal: string
  harga: number
  status: BookingStatus
  status_label: string
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

export interface DashboardActivity {
  id: string
  kind: 'approval' | 'trip' | 'payment'
  title: string
  detail: string | null
  at: string | null
  trip_id: number
  tone: 'info' | 'success' | 'warning' | 'danger'
}

export interface DashboardSummary {
  total_perjalanan: number
  per_status: Record<TripStatus, number>
  total_biaya: number
  total_estimasi: number
  total_selisih: number
  perjalanan_dengan_estimasi: number
  aktivitas_terbaru: DashboardActivity[]
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

export interface AnalyticsMonth {
  month: string
  label: string
  estimasi: number
  realisasi: number
  trips: number
}

export interface AnalyticsDepartment {
  department: string
  estimasi: number
  realisasi: number
  trips: number
}

export interface AnalyticsDestination {
  tujuan: string
  trips: number
  realisasi: number
}

export interface AnalyticsData {
  year: number
  monthly: AnalyticsMonth[]
  departments: AnalyticsDepartment[]
  destinations: AnalyticsDestination[]
}

export interface ApiUser {
  id: number
  name: string
  email: string
  department: string | null
  no_hp?: string | null
  jabatan?: string | null
  foto_url?: string | null
  signature_url?: string | null
  is_active?: boolean
  role: UserRole | null
  roles: UserRole[]
  atasan?: { id: number; name: string } | null
  created_at?: string
  password_expires_in_days?: number
  password_expired?: boolean
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
  department?: string
  tanggal?: string
  dari?: string
  sampai?: string
  q?: string
  pegawai?: string
  arsip?: 'aktif' | 'arsip' | 'semua'
}

export interface CreateTripPayload {
  tujuan: string
  tanggal_berangkat: string
  tanggal_pulang: string
  keperluan: string
  estimasi_biaya?: number | null
  needs?: { jenis: 'transportasi' | 'penginapan'; keterangan?: string | null }[]
}

export type BookingJenis =
  | 'tiket_pesawat'
  | 'tiket_kereta'
  | 'hotel'
  | 'transport_lokal'
  | 'lainnya'

export type BookingStatus = 'dipesan' | 'dikonfirmasi' | 'selesai' | 'dibatalkan'

export interface BookingTrip {
  id: number
  tujuan: string
  status: TripStatus
  user: { id: number; name: string } | null
}

export interface Booking {
  id: number
  trip_id: number
  jenis: BookingJenis
  jenis_label: string
  vendor: string | null
  vendor_id: number | null
  vendor_name: string | null
  kode_booking: string | null
  tanggal: string
  harga: number
  status: BookingStatus
  status_label: string
  catatan: string | null
  created_at: string
  trip?: BookingTrip
}

export interface CreateBookingPayload {
  jenis: BookingJenis
  vendor?: string | null
  vendor_id?: number | null
  kode_booking?: string | null
  tanggal: string
  harga: number
  catatan?: string | null
}

export interface UpdateBookingPayload {
  jenis?: BookingJenis
  vendor?: string | null
  vendor_id?: number | null
  kode_booking?: string | null
  tanggal?: string
  harga?: number
  status?: BookingStatus
  catatan?: string | null
}

export interface BookingQuery {
  page?: number
  per_page?: number
  trip_id?: number | string
  jenis?: BookingJenis | ''
  status?: BookingStatus | ''
}

export type VendorJenis = 'maskapai' | 'kereta' | 'hotel' | 'transport' | 'lainnya'

export interface Vendor {
  id: number
  nama: string
  jenis: VendorJenis
  kontak: string | null
  kota: string | null
  harga_acuan: number | null
  is_active: boolean
  created_at: string
}

export interface CreateVendorPayload {
  nama: string
  jenis: VendorJenis
  kontak?: string | null
  kota?: string | null
  harga_acuan?: number | null
  is_active?: boolean
}

export interface Budget {
  id: number
  department: string
  periode: string
  pagu: number
  terpakai: number
  sisa: number
  created_at: string
}

export interface CreateBudgetPayload {
  department: string
  periode: string
  pagu: number
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
  booking_updates: boolean
  comment_updates: boolean
}

export interface TripComment {
  id: number
  trip_id: number
  body: string
  user: { id: number; name: string } | null
  created_at: string | null
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
