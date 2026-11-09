import { describe, expect, test } from 'bun:test'
import {
  expenseTypeLabel,
  formatCurrency,
  formatDate,
  formatDateRange,
  formatNumber,
  periodRange,
  tripStatusClass,
  tripStatusLabel,
} from '../../app/utils/format'

describe('formatCurrency', () => {
  test('memformat rupiah tanpa desimal', () => {
    expect(formatCurrency(1500000)).toBe('Rp 1.500.000')
  })

  test('nilai kosong menjadi Rp 0', () => {
    expect(formatCurrency(null)).toBe('Rp 0')
    expect(formatCurrency(undefined)).toBe('Rp 0')
  })

  test('selisih negatif tetap ditampilkan', () => {
    expect(formatCurrency(-150000)).toBe('-Rp 150.000')
  })
})

describe('formatNumber', () => {
  test('memformat ribuan id-ID', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  test('nilai kosong menjadi 0', () => {
    expect(formatNumber(null)).toBe('0')
  })
})

describe('formatDate', () => {
  test('tanggal ISO menjadi format Indonesia', () => {
    expect(formatDate('2026-11-10')).toBe('10 Nov 2026')
  })

  test('nilai kosong atau tidak valid', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal')
  })
})

describe('formatDateRange', () => {
  test('menggabungkan dua tanggal', () => {
    expect(formatDateRange('2026-11-10', '2026-11-12')).toBe('10 Nov 2026 - 12 Nov 2026')
  })
})

describe('tripStatusLabel', () => {
  test('semua status backend terpetakan', () => {
    expect(tripStatusLabel('draft')).toBe('Draft')
    expect(tripStatusLabel('diajukan')).toBe('Menunggu Persetujuan')
    expect(tripStatusLabel('disetujui')).toBe('Disetujui')
    expect(tripStatusLabel('ditolak')).toBe('Ditolak')
    expect(tripStatusLabel('berjalan')).toBe('Berlangsung')
    expect(tripStatusLabel('selesai')).toBe('Selesai')
    expect(tripStatusLabel('lengkap')).toBe('Lengkap')
  })

  test('status tak dikenal dikembalikan apa adanya', () => {
    expect(tripStatusLabel('misterius')).toBe('misterius')
  })
})

describe('tripStatusClass', () => {
  test('selesai dan lengkap berbagi kelas completed', () => {
    expect(tripStatusClass('selesai')).toBe('completed')
    expect(tripStatusClass('lengkap')).toBe('completed')
  })

  test('status tak dikenal jatuh ke draft', () => {
    expect(tripStatusClass('misterius')).toBe('draft')
  })
})

describe('expenseTypeLabel', () => {
  test('jenis baku terpetakan', () => {
    expect(expenseTypeLabel('transportasi')).toBe('Transportasi')
    expect(expenseTypeLabel('penginapan')).toBe('Penginapan')
    expect(expenseTypeLabel('konsumsi')).toBe('Konsumsi')
    expect(expenseTypeLabel('lainnya')).toBe('Lainnya')
  })

  test('jenis tak dikenal dikembalikan apa adanya', () => {
    expect(expenseTypeLabel('tiket_pesawat')).toBe('tiket_pesawat')
  })
})

describe('periodRange', () => {
  test('periode kosong menghasilkan objek kosong', () => {
    expect(periodRange('')).toEqual({})
    expect(periodRange('sembarang')).toEqual({})
  })

  test('bulan ini dari tanggal 1 sampai akhir bulan', () => {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const expected = {
      dari: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      sampai: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`,
    }

    expect(periodRange('bulan-ini')).toEqual(expected)
    expect(periodRange('month')).toEqual(expected)
  })

  test('tahun ini mencakup Januari sampai Desember', () => {
    const year = new Date().getFullYear()
    const range = periodRange('tahun-ini')

    expect(range.dari).toBe(`${year}-01-01`)
    expect(range.sampai).toBe(`${year}-12-31`)
  })

  test('kuartal ini diawali tanggal 1', () => {
    const range = periodRange('kuartal-ini')

    expect(range.dari?.endsWith('-01')).toBe(true)
    expect(range.dari! <= range.sampai!).toBe(true)
  })
})
