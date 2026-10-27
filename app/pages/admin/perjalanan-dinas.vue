<template>
  <div class="perjalanan-page">

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <strong>Perjalanan Dinas</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Daftar Perjalanan Dinas</h1>

      <LayoutPageactions />
    </div>

    <!-- Filter -->
    <div class="filter-card">

      <!-- Search -->
      <div class="filter-group search-group">
        <label>Cari Kota / Keperluan</label>

        <div class="search-input">
          <svg viewBox="0 0 24 24">
            <path
              d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
            />
          </svg>

          <input
            v-model="search"
            type="text"
            placeholder="Cari perjalanan..."
          />
        </div>
      </div>

      <!-- Status -->
      <div class="filter-group status-group">
        <label>Status</label>

        <select v-model="selectedStatus">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="diajukan">Menunggu</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="berjalan">Dalam Perjalanan</option>
          <option value="selesai">Selesai</option>
          <option value="lengkap">Lengkap</option>
        </select>
      </div>

      <!-- Date -->
      <div class="filter-group date-group">
        <label>Rentang Tanggal</label>

        <div class="date-input">
          <input
            v-model="selectedDate"
            type="date"
          />

          <svg viewBox="0 0 24 24">
            <path
              d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 17H5V9h14v10ZM7 11h3v3H7v-3Z"
            />
          </svg>
        </div>
      </div>

    </div>

    <!-- Table Card -->
    <div class="table-card">

      <div class="table-wrapper">

        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Tujuan Kota</th>
              <th>Tanggal Berangkat</th>
              <th>Tanggal Kembali</th>
              <th>Jenis Perjalanan</th>
              <th>Status</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="table-state">
                Memuat data perjalanan...
              </td>
            </tr>

            <tr v-else-if="error">
              <td colspan="7" class="table-state table-error">
                {{ error }}
              </td>
            </tr>

            <tr v-else-if="filteredTrips.length === 0">
              <td colspan="7" class="table-state">
                Tidak ada perjalanan yang sesuai dengan filter.
              </td>
            </tr>

            <tr
              v-for="(trip, index) in filteredTrips"
              v-else-if="filteredTrips.length > 0"
              :key="trip.id"
            >
              <td>{{ index + 1 }}</td>

              <td>
                <NuxtLink
                  :to="{ path: '/admin/DetailPerjalanan', query: { id: trip.id } }"
                  class="destination"
                >
                  {{ trip.destination }}
                </NuxtLink>
              </td>

              <td>{{ trip.startDate }}</td>

              <td>{{ trip.endDate }}</td>

              <td class="travel-type">
                {{ trip.type }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="trip.statusClass"
                >
                  {{ trip.statusLabel }}
                </span>
              </td>

              <td>
                <NuxtLink
                  :to="{ path: '/admin/DetailPerjalanan', query: { id: trip.id } }"
                  class="detail-button"
                >
                  Detail
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      <!-- Mobile cards (data & aksi sama dengan tabel desktop) -->
      <div class="trip-cards">
        <article
          v-for="(trip, index) in filteredTrips"
          :key="`card-${trip.id}`"
          class="trip-card"
        >
          <div class="trip-card-header">
            <span class="trip-card-number">Perjalanan #{{ index + 1 }}</span>

            <span
              class="status-badge"
              :class="trip.statusClass"
            >
              {{ trip.status }}
            </span>
          </div>

          <a href="#" class="trip-card-title">
            {{ trip.destination }}
          </a>

          <dl class="trip-card-details">
            <div>
              <dt>Tanggal Berangkat</dt>
              <dd>{{ trip.startDate }}</dd>
            </div>

            <div>
              <dt>Tanggal Kembali</dt>
              <dd>{{ trip.endDate }}</dd>
            </div>

            <div>
              <dt>Jenis Perjalanan</dt>
              <dd>{{ trip.type }}</dd>
            </div>
          </dl>

          <div class="trip-card-actions">
            <button
              class="detail-button"
              type="button"
            >
              Detail
            </button>
          </div>
        </article>

        <p
          v-if="filteredTrips.length === 0"
          class="trip-empty"
        >
          Tidak ada perjalanan yang sesuai dengan filter.
        </p>
      </div>

      <!-- Table Footer -->
      <div class="table-footer">

        <span class="showing-text">
          Menampilkan {{ filteredTrips.length }} dari 24 perjalanan
        </span>

        <div class="pagination">

          <button class="page-button active">
            1
          </button>

          <button class="page-button">
            2
          </button>

          <button class="page-button">
            3
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const search = ref('')
const selectedStatus = ref('')
const selectedDate = ref('')

const trips = [
  {
    id: 1,
    destination: 'Jakarta - Bandung',
    startDate: '12 Mei 2026',
    endDate: '15 Mei 2026',
    type: 'Kereta Api',
    status: 'Disetujui',
    statusClass: 'approved'
  },
  {
    id: 2,
    destination: 'Jakarta - Surabaya',
    startDate: '20 Mei 2026',
    endDate: '24 Mei 2026',
    type: 'Pesawat Terbang',
    status: 'Menunggu',
    statusClass: 'waiting'
  },
  {
    id: 3,
    destination: 'Jakarta - Semarang',
    startDate: '28 Mei 2026',
    endDate: '31 Mei 2026',
    type: 'Mobil Dinas',
    status: 'Ditolak',
    statusClass: 'rejected'
  },
  {
    id: 4,
    destination: 'Jakarta - Yogyakarta',
    startDate: '02 Juni 2026',
    endDate: '06 Juni 2026',
    type: 'Kereta Api',
    status: 'Selesai',
    statusClass: 'completed'
  },
  {
    id: 5,
    destination: 'Jakarta - Medan',
    startDate: '10 Juni 2026',
    endDate: '15 Juni 2026',
    type: 'Pesawat Terbang',
    status: 'Dalam Perjalanan',
    statusClass: 'ongoing'
  }
]

const filteredTrips = computed(() => {
  return trips.filter((trip) => {

    const searchMatch =
      trip.destination
        .toLowerCase()
        .includes(search.value.toLowerCase()) ||
      trip.type
        .toLowerCase()
        .includes(search.value.toLowerCase())

    const statusMatch =
      !selectedStatus.value ||
      trip.status === selectedStatus.value

    return searchMatch && statusMatch
  })
})
</script>

<style scoped>
/* =========================
   PAGE
========================= */

.perjalanan-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 4px;

  font-size: 9px;
  color: #9aa4b5;
}

.breadcrumb a {
  color: #9aa4b5;
  text-decoration: none;
}

.breadcrumb strong {
  color: var(--text);
  font-weight: 600;
}

/* =========================
   HEADER
========================= */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;

  font-size: 23px;
  font-weight: 700;

  color: var(--text);
}



.header-button svg {
  width: 15px;
  height: 15px;

  fill: currentColor;
}

.header-button span {
  font-size: 13px;
  font-weight: 600;
}

/* =========================
   FILTER
========================= */

.filter-card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 195px 225px;
  gap: 14px;

  padding: 16px;

  margin-bottom: 24px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 9px;
  font-weight: 600;
  color: #667085;
}

/* Search */

.search-input,
.date-input {
  height: 31px;

  display: flex;
  align-items: center;

  border: 1px solid #dce2eb;
  border-radius: 6px;

  background: var(--white);
}

.search-input svg,
.date-input svg {
  width: 14px;
  height: 14px;

  margin: 0 8px;

  fill: #718096;
  flex-shrink: 0;
}

.search-input input,
.date-input input,
.filter-group select {
  width: 100%;
  height: 31px;

  box-sizing: border-box;

  border: 1px solid #dce2eb;
  border-radius: 6px;

  background: var(--white);
  color: var(--text);

  outline: none;

  font-family: inherit;
  font-size: 10px;
}

.search-input input {
  border: none;
}

.date-input input {
  border: none;
  padding: 0 0 0 4px;
}

.search-input input:focus,
.date-input input:focus,
.filter-group select:focus {
  outline: none;
}

.filter-group select {
  padding: 0 10px;
}

/* =========================
   TABLE
========================= */

.table-card {
  background: var(--white);

  border: 1px solid var(--border);
  border-radius: 11px;

  overflow: hidden;
}

.table-wrapper {
  padding: 18px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;

  table-layout: fixed;
}

thead {
  background: #f3f4f6;
}

th {
  padding: 10px 12px;

  text-align: left;

  font-size: 9px;
  font-weight: 600;

  color: #718096;
}

td {
  padding: 14px 12px;

  border-bottom: 1px solid #e5e8ee;

  font-size: 10px;
  color: #344054;

  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

.no-column {
  width: 30px;
}

.action-column {
  width: 55px;
  text-align: center;
}

/* Destination */

.destination {
  display: inline-block;

  max-width: 100%;

  color: #1769ff;
  text-decoration: none;

  font-size: 10px;
  font-weight: 600;

  line-height: 1.15;
  overflow-wrap: anywhere;
}

.destination:hover {
  text-decoration: underline;
}

/* Travel type */

.travel-type {
  color: #718096;
}

/* =========================
   STATUS
========================= */

.status-badge {
  display: inline-flex;
  align-items: center;

  padding: 4px 9px;

  border-radius: 5px;

  font-size: 9px;
  font-weight: 600;

  white-space: nowrap;
}

.approved {
  background: #dff7ef;
  color: #18a77c;
}

.waiting {
  background: #fff3df;
  color: #ef9b16;
}

.rejected {
  background: #ffe8e8;
  color: #ef5350;
}

.completed {
  background: #dff7ef;
  color: #18a77c;
}

.ongoing {
  background: #fff3df;
  color: #ef9b16;
}

/* =========================
   DETAIL
========================= */

.detail-button {
  display: block;

  margin: auto;

  border: none;
  background: transparent;

  color: #1769ff;

  font-family: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;
}

.detail-button:hover {
  text-decoration: underline;
}

/* =========================
   FOOTER
========================= */

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 12px 18px 18px;
}

.showing-text {
  font-size: 9px;
  color: #718096;
}

.pagination {
  display: flex;
  gap: 6px;
}

.page-button {
  width: 25px;
  height: 25px;

  border: 1px solid #dce2eb;
  border-radius: 5px;

  background: var(--white);
  color: var(--text);

  font-family: inherit;
  font-size: 9px;

  cursor: pointer;
}

.page-button.active {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--white);
}

/* =========================
   MOBILE CARDS
========================= */

.trip-cards {
  display: none;
}

.trip-card {
  padding: 14px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.trip-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;

  margin-bottom: 10px;
}

.trip-card-number {
  font-size: 10px;
  color: #9aa4b5;
}

.trip-card-title {
  display: block;

  color: #1769ff;

  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;

  overflow-wrap: anywhere;
}

.trip-card-details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  margin: 12px 0;
}

.trip-card-details > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.trip-card-details dt {
  font-size: 10px;
  color: #8792a5;
}

.trip-card-details dd {
  margin: 0;

  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  text-align: right;
}

.trip-card-actions {
  display: flex;
  justify-content: flex-end;

  padding-top: 10px;
  border-top: 1px solid #eef1f5;
}

.trip-card-actions .detail-button {
  width: 100%;
  min-height: 40px;

  border: 1px solid var(--primary);
  border-radius: 7px;

  background: #f5f8ff;
}

.trip-empty {
  padding: 28px 16px;

  text-align: center;
  font-size: 12px;
  color: #8792a5;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1023px) {
  .perjalanan-page {
    padding: 20px;
  }

  .filter-card {
    grid-template-columns: 1fr 1fr;
  }

  .search-group {
    grid-column: 1 / -1;
  }

  table {
    min-width: 0;
    table-layout: fixed;
  }

  th {
    padding: 9px 6px;
  }

  td {
    padding: 11px 6px;
    font-size: 9px;
  }

  .destination {
    font-size: 9.5px;
  }

  .travel-type {
    font-size: 9px;
  }

  .status-badge {
    padding: 3px 7px;
    font-size: 8.5px;
  }

  .detail-button {
    font-size: 9px;
  }
}

@media (max-width: 767px) {
  .perjalanan-page {
    padding: 16px;
  }

  .filter-card {
    grid-template-columns: 1fr;
    padding: 14px;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-group {
    grid-column: auto;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .filter-group input,
  .filter-group select {
    font-size: 16px;
  }

  .date-input svg {
    display: none;
  }

  .table-wrapper {
    display: none;
  }

  .table-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    padding: 0 14px 14px;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .page-button {
    width: 36px;
    height: 36px;
  }

  .trip-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 14px;
  }

  .table-card {
    border: none;
    background: transparent;
    overflow: visible;
  }
}

@media (max-width: 374px) {
  .perjalanan-page {
    padding: 12px;
  }

  .trip-cards {
    padding: 10px;
  }
}
</style>