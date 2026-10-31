<template>
  <div class="upcoming-trips">
    <div class="section-header">
      <div>
        <h2>Perjalanan Mendatang</h2>
        <p>Jadwal perjalanan yang akan datang</p>
      </div>

      <NuxtLink to="/admin/perjalanan-dinas">
        Lihat Semua
      </NuxtLink>
    </div>

    <div class="trip-list">
      <div
        v-for="trip in trips"
        :key="trip.id"
        class="trip-item"
      >
        <div class="trip-top">
          <span class="route">{{ trip.route }}</span>
          <span class="date">{{ trip.date }}</span>
        </div>

        <p>{{ trip.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const trips = [
  {
    id: 1,
    route: 'Jakarta - Bandung',
    date: '24 Jan 2026',
    description: 'Pertemuan dengan Direksi & Vendor lokal.'
  },
  {
    id: 2,
    route: 'Jakarta - Surabaya',
    date: '05 Feb 2026',
    description: 'Training regional & evaluasi kuartal.'
  }
]
</script>

<style scoped>
.upcoming-trips {
  width: 300px;
  flex-shrink: 0;
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.section-header p {
  margin: 5px 0 0;
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.4;
}

.section-header a {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--primary);
  text-decoration: none;
}

.trip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip-item {
  padding: 12px;
  background: #f6f7f9;
  border-radius: 8px;
}

.trip-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.route {
  padding: 4px 7px;
  background: #e8f0ff;
  border-radius: 4px;
  font-size: 10px;
  color: var(--primary);

  overflow-wrap: anywhere;
}

.date {
  font-size: 9px;
  color: var(--text-muted);
}

.trip-item p {
  margin: 9px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text);
}
@media (max-width: 1023px) {
  .upcoming-trips {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .upcoming-trips {
    padding: 16px;
  }

  .section-header {
    margin-bottom: 12px;
  }
}
</style>