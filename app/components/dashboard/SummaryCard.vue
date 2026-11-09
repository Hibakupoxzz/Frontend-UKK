<template>
  <div class="summary-card">

    <div class="card-icon">
      <AppIcon :name="icon" />
    </div>

    <div class="card-content">
      <p class="card-title">
        {{ title }}
      </p>

      <h2 class="card-value">
        {{ value }}
      </h2>
    </div>

  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },

  value: {
    type: [Number, String],
    required: true
  },

  icon: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;

  min-width: 0;
  min-height: 92px;
  padding: 20px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

/* ICON */

.card-icon {
  width: 48px;
  height: 48px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  background: #edf3ff;
  border-radius: 10px;

  color: var(--primary);
  font-size: 22px;
}

/* TEXT */

.card-content {
  display: flex;
  flex-direction: column;
  gap: 3px;

  min-width: 0;
}

.card-title {
  margin: 0;

  font-size: 12px;
  line-height: 1.35;
  color: var(--text-muted);

  overflow-wrap: break-word;
}

.card-value {
  margin: 0;

  font-size: clamp(22px, 4vw, 28px);
  line-height: 1;

  font-weight: 700;
  color: var(--text);
}

@media (max-width: 540px) {
  .summary-card {
    gap: 12px;
    min-height: 76px;
    padding: 14px;
  }

  .card-icon {
    width: 42px;
    height: 42px;
    font-size: 18px;
  }

  .card-title {
    font-size: 11px;
  }
}
</style>