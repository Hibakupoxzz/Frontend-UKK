<template>
  <article class="metric-card">
    <div class="metric-icon" aria-hidden="true">
      <AppIcon :name="icon" />
    </div>
    <div class="metric-copy">
      <p>{{ title }}</p>
      <strong>{{ value }}</strong>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string
  icon: string
}>()
</script>

<style scoped>
.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.metric-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 10px;
  background: #eaf0ff;
  color: var(--primary);
  font-size: 20px;
}

.metric-copy {
  min-width: 0;
}

.metric-copy p {
  margin: 0 0 6px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.4;
}

.metric-copy strong {
  color: var(--text);
  font-size: 20px;
  line-height: 1.2;
}
</style>
