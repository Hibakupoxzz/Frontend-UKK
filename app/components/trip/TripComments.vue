<template>
  <section class="panel">
    <div class="panel-heading">
      <h2>Diskusi Perjalanan</h2>
      <span v-if="comments.length" class="count-badge">{{ comments.length }}</span>
    </div>

    <div v-if="loading && comments.length === 0" class="empty-text">Memuat diskusi...</div>
    <p v-else-if="comments.length === 0" class="empty-text">
      Belum ada komentar. Tulis klarifikasi atau instruksi perjalanan di sini.
    </p>
    <ul v-else class="comment-list">
      <li v-for="comment in comments" :key="comment.id" :class="{ mine: isMine(comment) }">
        <div class="comment-head">
          <strong>{{ comment.user?.name ?? 'Pengguna' }}</strong>
          <span>{{ formatTime(comment.created_at) }}</span>
        </div>
        <p class="comment-body">{{ comment.body }}</p>
        <button
          v-if="canDelete(comment)"
          type="button"
          class="text-danger"
          :disabled="deletingId === comment.id"
          @click="handleDelete(comment.id)"
        >
          Hapus
        </button>
      </li>
    </ul>

    <form class="comment-form" @submit.prevent="handleSubmit">
      <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>
      <div class="comment-input-row">
        <input
          v-model="draft"
          type="text"
          placeholder="Tulis komentar... (maks 2000 karakter)"
          maxlength="2000"
          :disabled="submitting"
          aria-label="Tulis komentar"
        />
        <button type="submit" class="primary-button small" :disabled="submitting || !draft.trim()">
          {{ submitting ? '...' : 'Kirim' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { TripComment } from '~/types/api'
import { useTripComments } from '~/composables/useTripComments'
import { useAuth } from '~/composables/useAuth'
import { apiErrorMessage } from '~/composables/useApi'

const props = defineProps<{
  tripId: number | string
}>()

const { user } = useAuth()
const { comments, loading, fetchComments, createComment, deleteComment, resetComments } = useTripComments()

const draft = ref('')
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const formError = ref('')

const isMine = (comment: TripComment) =>
  !!user.value && String(comment.user?.id ?? '') === String(user.value.id)

const canDelete = (comment: TripComment) =>
  isMine(comment) || user.value?.role === 'admin'

const formatTime = (value: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const load = async () => {
  resetComments()
  await fetchComments(props.tripId).catch(() => {})
}

const handleSubmit = async () => {
  const body = draft.value.trim()
  if (!body) return

  formError.value = ''
  submitting.value = true

  try {
    await createComment(props.tripId, body)
    draft.value = ''
    await fetchComments(props.tripId).catch(() => {})
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal mengirim komentar.')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!window.confirm('Hapus komentar ini?')) return

  formError.value = ''
  deletingId.value = id

  try {
    await deleteComment(id)
    await fetchComments(props.tripId).catch(() => {})
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menghapus komentar.')
  } finally {
    deletingId.value = null
  }
}

watch(() => props.tripId, () => {
  draft.value = ''
  formError.value = ''
  void load()
})

onMounted(() => {
  void load()
})
</script>

<style scoped>
.panel {
  margin-top: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading h2 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.count-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eef2ff;
  color: var(--primary);
  font-size: 10px;
  font-weight: 700;
}

.empty-text {
  color: var(--text-muted);
  font-size: 11px;
}

.comment-list {
  display: grid;
  gap: 10px;
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
  max-height: 320px;
  overflow-y: auto;
}

.comment-list li {
  padding: 10px 12px;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background: #fafbfd;
}

.comment-list li.mine {
  border-color: #dbe4ff;
  background: #f4f7ff;
}

.comment-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-head strong {
  color: var(--text);
  font-size: 11px;
}

.comment-head span {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 9px;
}

.comment-body {
  margin: 0 0 6px;
  color: var(--text);
  font-size: 11px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.text-danger {
  padding: 0;
  border: 0;
  background: transparent;
  color: #b42318;
  font: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.text-danger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.comment-form {
  border-top: 1px solid #edf0f4;
  padding-top: 12px;
}

.form-message.error {
  margin: 0 0 8px;
  padding: 8px 10px;
  border: 1px solid #f4c7c7;
  border-radius: 7px;
  background: #fff5f5;
  color: #b42318;
  font-size: 10px;
}

.comment-input-row {
  display: flex;
  gap: 8px;
}

.comment-input-row input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
}

.comment-input-row input:focus {
  border-color: var(--primary);
}

.primary-button.small {
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--primary);
  border-radius: 6px;
  background: var(--primary);
  color: var(--white);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.primary-button.small:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
