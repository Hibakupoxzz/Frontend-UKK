<template>
  <section class="calendar-card">
    <div class="calendar-header">
      <div>
        <h2>Kalender Perjalanan</h2>
        <p>Jadwal keberangkatan dan kepulangan perjalanan dinas.</p>
      </div>

      <div class="calendar-nav">
        <button type="button" aria-label="Bulan sebelumnya" :disabled="loading" @click="shiftMonth(-1)">
          <AppIcon name="chevron-left" />
        </button>
        <strong>{{ monthLabel }}</strong>
        <button type="button" aria-label="Bulan berikutnya" :disabled="loading" @click="shiftMonth(1)">
          <AppIcon name="chevron-right" />
        </button>
        <button type="button" class="today-button" :disabled="loading" @click="goToday">
          Hari ini
        </button>
      </div>
    </div>

    <p v-if="error" class="calendar-state error" role="alert">{{ error }}</p>
    <p v-else-if="loading && days.length === 0" class="calendar-state">Memuat kalender...</p>

    <div v-else class="calendar-grid" role="grid" aria-label="Kalender perjalanan dinas">
      <span v-for="name in dayNames" :key="name" class="weekday">{{ name }}</span>

      <div
        v-for="day in days"
        :key="day.key"
        class="day-cell"
        :class="{ outside: !day.inMonth, today: day.isToday }"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>

        <button
          v-for="trip in day.trips.slice(0, 3)"
          :key="trip.id"
          type="button"
          class="trip-chip"
          :class="chipClass(trip.status)"
          :title="`${trip.tujuan} — ${tripStatusLabel(trip.status)}`"
          @click="openTrip(trip.id)"
        >
          {{ trip.tujuan }}
        </button>

        <span v-if="day.trips.length > 3" class="more-label">
          +{{ day.trips.length - 3 }} lagi
        </span>
      </div>
    </div>

    <div class="calendar-legend">
      <span><i class="dot waiting" />Diajukan</span>
      <span><i class="dot approved" />Disetujui</span>
      <span><i class="dot ongoing" />Berjalan</span>
      <span><i class="dot completed" />Selesai</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Trip, TripStatus } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { tripStatusLabel } from '~/utils/format'

const props = defineProps<{
  /** Bangun tujuan navigasi dari ID perjalanan (string path, route location, atau fungsi). */
  tripLink: string | Record<string, unknown> | ((id: number) => string | Record<string, unknown>)
}>()

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const cursor = ref(startOfMonth(new Date()))
const { trips, loading, error, fetchTrips } = useTrips()

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cursor.value),
)

const load = async () => {
  const last = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 0)

  // Ambil sebulan ke belakang agar perjalanan lintas bulan tetap tampil;
  // penyaringan tumpang-tindih yang tepat dilakukan di sisi klien.
  const windowStart = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)

  await fetchTrips({ dari: toKey(windowStart), sampai: toKey(last), per_page: 100 }).catch(() => {})
}

const shiftMonth = (delta: number) => {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1)
}

const goToday = () => {
  cursor.value = startOfMonth(new Date())
}

interface DayCell {
  key: string
  date: Date
  inMonth: boolean
  isToday: boolean
  trips: Trip[]
}

const days = computed<DayCell[]>(() => {
  const first = startOfMonth(cursor.value)
  // Kalender mulai hari Minggu mengikuti konvensi id-ID.
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  const todayKey = toKey(new Date())
  const cells: DayCell[] = []

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = toKey(date)

    cells.push({
      key,
      date,
      inMonth: date.getMonth() === cursor.value.getMonth(),
      isToday: key === todayKey,
      trips: trips.value.filter((trip) => trip.tanggal_berangkat <= key && trip.tanggal_pulang >= key),
    })
  }

  return cells
})

const chipClass = (status: TripStatus) => {
  switch (status) {
    case 'diajukan':
      return 'waiting'
    case 'disetujui':
      return 'approved'
    case 'ditolak':
      return 'rejected'
    case 'berjalan':
      return 'ongoing'
    case 'selesai':
    case 'lengkap':
      return 'completed'
    default:
      return 'draft'
  }
}

const openTrip = async (id: number) => {
  const target = typeof props.tripLink === 'function' ? props.tripLink(id) : props.tripLink
  await navigateTo(target as never)
}

watch(cursor, () => {
  void load()
})

onMounted(() => {
  void load()
})
</script>

<style scoped>
.calendar-card {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--white);
}

.calendar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.calendar-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
}

.calendar-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-nav button {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

.calendar-nav button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.calendar-nav strong {
  min-width: 130px;
  color: var(--text);
  font-size: 12px;
  text-align: center;
  text-transform: capitalize;
}

.today-button {
  font-size: 10px !important;
  font-weight: 600;
}

.calendar-state {
  padding: 22px 12px;
  color: #8792a5;
  font-size: 11px;
  text-align: center;
}

.calendar-state.error {
  color: #b42318;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.weekday {
  padding: 6px 4px;
  color: #8792a5;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
}

.day-cell {
  min-height: 64px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.day-cell.outside {
  opacity: 0.45;
}

.day-cell.today {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.day-number {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 700;
}

.day-cell.today .day-number {
  color: var(--primary);
}

.trip-chip {
  display: block;
  width: 100%;
  padding: 2px 5px;
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 8px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.trip-chip.waiting { background: #fff3df; color: #9a6a08; }
.trip-chip.approved { background: #e8efff; color: var(--primary); }
.trip-chip.rejected { background: #ffe8e8; color: #ef5350; }
.trip-chip.ongoing { background: #e8efff; color: #315bb5; }
.trip-chip.completed { background: #dff7ef; color: #18a77c; }
.trip-chip.draft { background: #eef1f5; color: #667085; }

.more-label {
  color: #8792a5;
  font-size: 8px;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: var(--text-muted);
  font-size: 10px;
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.waiting { background: #ef9b16; }
.dot.approved { background: var(--primary); }
.dot.ongoing { background: #315bb5; }
.dot.completed { background: #18a77c; }

@media (max-width: 767px) {
  .calendar-card {
    padding: 14px;
  }

  .day-cell {
    min-height: 44px;
    padding: 3px;
  }

  .trip-chip {
    font-size: 7px;
  }
}
</style>
