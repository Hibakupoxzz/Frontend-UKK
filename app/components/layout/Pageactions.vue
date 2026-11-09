<template>
  <div class="page-actions">

    <!-- Notification -->
    <LayoutNotificationBell />

    <!-- Help -->
    <button
      class="action-button"
      type="button"
      aria-label="Bantuan"
    >
      <AppIcon name="help-circle" class="action-icon" />
    </button>

  </div>
</template>

<style scoped>
.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-button {
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

.action-button:hover {
  background: #f5f6f8;
}

.action-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.action-icon {
  width: 15px;
  height: 15px;
}

@media (max-width: 767px) {
  .page-actions {
    gap: 8px;
  }
}
</style>
