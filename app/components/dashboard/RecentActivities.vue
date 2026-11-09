<template>
  <div class="recent-activities">
    <div class="section-header">
      <div>
        <h2>Aktivitas Terbaru</h2>
        <p>Aktivitas terbaru pada sistem</p>
      </div>

      <NuxtLink to="/dashboard">
        Lihat Semua
      </NuxtLink>
    </div>

    <div class="activity-list">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
      >
        <div class="activity-icon">
          <AppIcon :name="activity.icon" />
        </div>

        <div class="activity-info">
          <p>{{ activity.title }}</p>
        </div>

        <span
          class="activity-status"
          :class="activity.statusClass"
        >
          {{ activity.status }}
        </span>

        <span class="activity-time">
          {{ activity.time }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const activities = [
  {
    id: 1,
    icon: 'clock',
    title: 'Pengajuan perjalanan dinas ke Jakarta - Bandung',
    status: 'Menunggu Persetujuan',
    statusClass: 'waiting',
    time: 'Baru saja'
  },
  {
    id: 2,
    icon: 'check-circle',
    title: 'Perjalanan dinas Semarang selesai & laporan diunggah',
    status: 'Selesai',
    statusClass: 'completed',
    time: '1 hari lalu'
  },
  {
    id: 3,
    icon: 'receipt',
    title: 'Reimbursement akomodasi Surabaya disetujui pihak keuangan',
    status: 'Disetujui',
    statusClass: 'approved',
    time: '3 hari lalu'
  }
]
</script>

<style scoped>
.recent-activities {
  margin-top: 24px;
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.section-header p {
  margin: 5px 0 0;
  font-size: 10px;
  color: var(--text-muted);
}

.section-header a {
  font-size: 10px;
  color: var(--primary);
  text-decoration: none;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background: #eef3ff;
  border-radius: 50%;
  color: var(--primary);
  font-size: 16px;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-info p {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text);

  overflow-wrap: anywhere;
}

.activity-status {
  margin-right: 14px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 9px;
  white-space: nowrap;
}

.waiting {
  background: #fff4df;
  color: #e99a00;
}

.completed {
  background: #e5f8f0;
  color: #20a77a;
}

.approved {
  background: #e8efff;
  color: var(--primary);
}

.activity-time {
  width: 55px;
  flex-shrink: 0;
  font-size: 9px;
  color: var(--text-muted);
  text-align: right;
}

@media (max-width: 767px) {
  .recent-activities {
    margin-top: 18px;
    padding: 16px;
  }

  .activity-item {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    column-gap: 12px;
    row-gap: 7px;

    align-items: start;

    padding: 12px 0;
  }

  .activity-icon {
    grid-row: 1 / 3;
    margin-right: 0;
  }

  .activity-info {
    grid-column: 2;
  }

  .activity-status {
    grid-column: 2;
    justify-self: start;

    margin-right: 0;
  }

  .activity-time {
    grid-column: 2;
    width: auto;

    text-align: left;
  }
}

@media (max-width: 374px) {
  .recent-activities {
    padding: 12px;
  }

  .activity-info p {
    font-size: 10.5px;
  }
}
</style>    