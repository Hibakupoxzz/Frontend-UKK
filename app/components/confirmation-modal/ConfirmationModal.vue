<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      role="presentation"
      @click.self="$emit('cancel')"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <header class="modal-header">
          <h2 id="confirmation-modal-title">{{ title }}</h2>

          <button
            type="button"
            class="modal-close"
            aria-label="Tutup"
            @click="$emit('cancel')"
          >
            <AppIcon name="x" />
          </button>
        </header>

        <div class="modal-body">
          <slot name="confirm-description">
            <slot />
          </slot>
        </div>

        <footer class="modal-actions">
          <button
            type="button"
            class="button-cancel"
            @click="$emit('cancel')"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            class="button-confirm"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

defineProps({
  title: {
    type: String,
    default: 'Konfirmasi',
  },
  confirmText: {
    type: String,
    default: 'Konfirmasi',
  },
  cancelText: {
    type: String,
    default: 'Batal',
  },
})

const emit = defineEmits(['confirm', 'cancel'])

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  if (!import.meta.client) return

  window.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  if (!import.meta.client) return

  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(15, 23, 42, 0.5);
}

.modal {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 40px);

  overflow-y: auto;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  padding: 20px 20px 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);
}

.modal-close {
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  padding: 0;

  border: 1px solid var(--border);
  border-radius: 50%;

  background: var(--white);
  color: var(--text-muted);

  cursor: pointer;
}

.modal-close:hover {
  background: #f5f6f8;
  color: var(--text);
}

.modal-close svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 16px 20px 20px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

.modal-body :deep(p) {
  margin: 0;
}

.modal-body :deep(p + p) {
  margin-top: 10px;
}

.modal-body :deep(strong) {
  color: var(--text);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  padding: 14px 20px 20px;
  border-top: 1px solid var(--border);
}

.button-cancel,
.button-confirm {
  min-height: 38px;
  padding: 0 16px;

  border-radius: 7px;

  font-family: inherit;
  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.button-cancel {
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text);
}

.button-cancel:hover {
  background: #f5f6f8;
}

.button-confirm {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
}

.button-confirm:hover {
  background: var(--primary-dark);
}

@media (max-width: 480px) {
  .modal-actions {
    flex-direction: column-reverse;
  }

  .button-cancel,
  .button-confirm {
    width: 100%;
  }
}
</style>
