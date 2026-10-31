<template>
  <div ref="root" class="notification-bell">
    <button
      class="bell-button"
      type="button"
      aria-label="Notifikasi"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" class="bell-icon" aria-hidden="true">
        <path
          d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 0 0-5.5-6.83V3a1.5 1.5 0 0 0-3 0v1.17A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"
        />
      </svg>

      <span v-if="unreadCount > 0" class="bell-badge" aria-hidden="true">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div v-if="open" class="notification-panel" role="dialog" aria-label="Daftar notifikasi">
      <header class="panel-header">
        <div>
          <h3>Notifikasi</h3>
          <p v-if="unreadCount > 0">{{ unreadCount }} belum dibaca</p>
          <p v-else>Semua notifikasi sudah dibaca</p>
        </div>

        <button
          v-if="unreadCount > 0"
          type="button"
          class="mark-all"
          :disabled="markingAll"
          @click="handleMarkAll"
        >
          {{ markingAll ? 'Memproses...' : 'Tandai semua' }}
        </button>
      </header>

      <p v-if="loading && items.length === 0" class="panel-state">Memuat notifikasi...</p>
      <p v-else-if="error" class="panel-state error" role="alert">{{ error }}</p>
      <p v-else-if="items.length === 0" class="panel-state">Belum ada notifikasi.</p>

      <ul v-else class="notification-list">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            class="notification-item"
            :class="{ unread: !item.read_at }"
            @click="handleOpen(item)"
          >
            <span class="item-dot" aria-hidden="true"></span>
            <span class="item-body">
              <strong>{{ item.title }}</strong>
              <span class="item-message">{{ item.message }}</span>
              <span class="item-time">{{ relativeTime(item.created_at) }}</span>
            </span>
          </button>
        </li>
      </ul>

      <button
        v-if="hasMore"
        type="button"
        class="load-more"
        :disabled="loading"
        @click="handleLoadMore"
      >
        {{ loading ? 'Memuat...' : 'Muat lebih banyak' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AppNotification } from '~/types/api'
import { useNotifications } from '~/composables/useNotifications'
import { useAuth } from '~/composables/useAuth'

// Polling badge agar angka unread tetap segar tanpa reload halaman.
const POLL_INTERVAL_MS = 60_000

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const markingAll = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const { isAuthenticated } = useAuth()
const {
  items,
  unreadCount,
  meta,
  loading,
  error,
  fetchNotifications,
  loadMore,
  refreshUnreadCount,
  markRead,
  markAllRead,
  resetNotifications,
} = useNotifications()

const hasMore = computed(
  () => meta.value !== null && meta.value.current_page < meta.value.last_page,
)

const handleLoadMore = async () => {
  await loadMore().catch(() => {})
}

const togglePanel = async () => {
  open.value = !open.value

  if (open.value) {
    await fetchNotifications({ force: true }).catch(() => {})
  }
}

const handleMarkAll = async () => {
  if (markingAll.value) return
  markingAll.value = true

  try {
    await markAllRead()
  } catch {
    // Pesan error ditampilkan dari state composable.
  } finally {
    markingAll.value = false
  }
}

const handleOpen = async (item: AppNotification) => {
  try {
    if (!item.read_at) {
      await markRead(item.id)
    }
  } catch {
    // Tetap arahkan pengguna meskipun status baca gagal disimpan.
  }

  open.value = false

  if (item.url) {
    await navigateTo(item.url)
  }
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!open.value) return
  if (root.value && root.value.contains(event.target as Node)) return
  open.value = false
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}

const startPolling = () => {
  stopPolling()

  if (!isAuthenticated.value) return

  pollTimer = setInterval(() => {
    // Jangan polling saat panel terbuka agar daftar tidak bergeser.
    if (!open.value) void refreshUnreadCount()
  }, POLL_INTERVAL_MS)
}

const stopPolling = () => {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// Bersihkan state saat logout agar akun berikutnya tidak melihat sisa notifikasi.
watch(isAuthenticated, (authenticated) => {
  if (!authenticated) {
    open.value = false
    stopPolling()
    resetNotifications()
    return
  }

  void fetchNotifications({ force: true }).catch(() => {})
  startPolling()
})

const relativeTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'Baru saja'

  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return formatter.format(-minutes, 'minute')

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return formatter.format(-hours, 'hour')

  const days = Math.floor(hours / 24)
  if (days < 30) return formatter.format(-days, 'day')

  const months = Math.floor(days / 30)
  if (months < 12) return formatter.format(-months, 'month')

  return formatter.format(-Math.floor(months / 12), 'year')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)

  if (isAuthenticated.value) {
    // Selalu segarkan agar badge tidak tertinggal setelah notifikasi baru.
    void fetchNotifications({ force: true }).catch(() => {})
    startPolling()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
  stopPolling()
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-button {
  position: relative;

  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  padding: 0;

  border: 1px solid var(--border);
  border-radius: 50%;

  background: var(--white);
  color: var(--text);

  cursor: pointer;

  transition: 0.2s ease;
}

.bell-button:hover {
  background: #f5f6f8;
}

.bell-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.bell-icon {
  width: 15px;
  height: 15px;

  fill: currentColor;
}

.bell-badge {
  position: absolute;
  top: -3px;
  right: -3px;

  min-width: 16px;
  height: 16px;
  padding: 0 4px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 2px solid var(--white);
  border-radius: 999px;

  background: #dc2626;
  color: #fff;

  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}

/* PANEL */

.notification-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 1300;

  width: 340px;
  max-height: 430px;

  display: flex;
  flex-direction: column;

  border: 1px solid var(--border);
  border-radius: 12px;

  background: var(--white);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);

  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  padding: 14px 16px;

  border-bottom: 1px solid #edf0f4;
}

.panel-header h3 {
  margin: 0;

  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.panel-header p {
  margin: 4px 0 0;

  color: var(--text-muted);
  font-size: 10px;
}

.mark-all {
  padding: 0;

  border: none;
  background: transparent;
  color: var(--primary);

  font-family: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;
}

.mark-all:disabled {
  opacity: 0.6;
  cursor: wait;
}

.panel-state {
  margin: 0;
  padding: 22px 16px;

  color: var(--text-muted);
  font-size: 11px;
  text-align: center;
}

.panel-state.error {
  color: #b42318;
}

.notification-list {
  margin: 0;
  padding: 0;

  list-style: none;

  overflow-y: auto;
}

.notification-list li + li {
  border-top: 1px solid #f0f2f6;
}

.notification-item {
  width: 100%;

  display: flex;
  align-items: flex-start;
  gap: 10px;

  padding: 12px 16px;

  border: none;
  background: var(--white);

  color: inherit;
  text-align: left;

  cursor: pointer;

  transition: background 0.15s ease;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #f4f7ff;
}

.notification-item.unread:hover {
  background: #edf2ff;
}

.item-dot {
  width: 7px;
  height: 7px;

  flex-shrink: 0;

  margin-top: 5px;

  border-radius: 50%;

  background: transparent;
}

.notification-item.unread .item-dot {
  background: var(--primary);
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 3px;

  min-width: 0;
}

.item-body strong {
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
}

.item-message {
  color: #475569;
  font-size: 10px;
  line-height: 1.45;
}

.item-time {
  color: #94a3b8;
  font-size: 9px;
}

.load-more {
  width: 100%;

  padding: 10px 16px;

  border: none;
  border-top: 1px solid #edf0f4;

  background: var(--white);
  color: var(--primary);

  font-family: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;

  transition: background 0.15s ease;
}

.load-more:hover:not(:disabled) {
  background: #f8fafc;
}

.load-more:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 767px) {
  .bell-button {
    width: 32px;
    height: 32px;
  }

  .bell-icon {
    width: 14px;
    height: 14px;
  }

  .notification-panel {
    position: fixed;
    top: 66px;
    right: 12px;
    left: 12px;

    width: auto;
    max-height: calc(100vh - 90px);
  }
}
</style>
