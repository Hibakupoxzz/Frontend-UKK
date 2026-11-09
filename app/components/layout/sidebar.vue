<template>
  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ open }"
    aria-label="Navigasi utama"
  >
    <!-- Header drawer (mobile) -->
    <div class="sidebar-header">
      <ClientOnly>
        <NuxtLink
          v-if="role"
          :to="dashboardRoute"
          class="sidebar-brand"
          aria-label="Eduabsen Travel App - Dashboard"
          @click="$emit('close')"
        >
          <img
            src="~/assets/image/eduabsen.png"
            alt="Eduabsen"
            class="sidebar-logo"
          />

          <span class="sidebar-brand-text">
            <strong>Eduabsen</strong>
            <small>Travel App</small>
          </span>
        </NuxtLink>
      </ClientOnly>

      <button
        class="sidebar-close"
        type="button"
        aria-label="Tutup menu navigasi"
        @click="$emit('close')"
      >
        <AppIcon name="x" class="close-icon" />
      </button>
    </div>

    <!-- Navigation -->
    <ClientOnly>
      <nav v-if="role" class="menu">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="menu-item"
          :class="{ 'router-link-active': isActive(item) }"
          @click="$emit('close')"
        >
          <AppIcon :name="item.icon" class="menu-icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </ClientOnly>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { getNavForRole, ROLE_ROUTES, type NavItem } from '~/utils/nav'

defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const { user } = useAuth()
const route = useRoute()
const isMounted = ref(false)

const role = computed(() => isMounted.value ? user.value?.role : undefined)
const dashboardRoute = computed(() => role.value ? ROLE_ROUTES[role.value] : '/')
const navItems = computed(() => role.value ? getNavForRole(role.value) : [])
const isActive = (item: NavItem) => [item.to, ...(item.activeRoutes ?? [])]
  .some((path) => {
    const currentPath = route.path.toLowerCase()
    const activePath = path.toLowerCase()
    return currentPath === activePath || currentPath.startsWith(`${activePath}/`)
  })

onMounted(() => {
  isMounted.value = true
})
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;

  width: 215px;
  height: 100vh;
  min-height: 100vh;

  flex-shrink: 0;

  box-sizing: border-box;
  padding: 20px 14px;

  overflow-y: auto;

  background: var(--sidebar);
  color: var(--white);

  z-index: 40;
}

/* HEADER DRAWER (hanya tampil di mobile) */

.sidebar-header {
  display: none;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;

  min-width: 0;

  color: var(--white);
}

.sidebar-logo {
  width: 40px;
  height: 40px;

  flex-shrink: 0;

  object-fit: contain;
}

.sidebar-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;

  min-width: 0;
}

.sidebar-brand-text strong {
  font-size: 16px;
  line-height: 1.1;
}

.sidebar-brand-text small {
  font-size: 9px;
  color: #9db0d8;
}

.sidebar-close {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  padding: 0;

  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.06);
  color: var(--white);

  cursor: pointer;
}

.sidebar-close:hover {
  background: rgba(255, 255, 255, 0.12);
}

.sidebar-close svg {
  width: 18px;
  height: 18px;
}

/* MENU */

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 11px;

  min-height: 42px;
  padding: 11px 10px;

  border-radius: 7px;

  color: #d5dbea;
  text-decoration: none;

  font-size: 13px;
  font-weight: 500;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;

  stroke-width: 1.9;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white);
}

.menu-item.router-link-active {
  background: var(--primary);
  color: var(--white);
}

.menu-item:focus-visible,
.sidebar-close:focus-visible,
.sidebar-brand:focus-visible {
  outline: 2px solid #93b4ff;
  outline-offset: 2px;
}

/* =========================
   TABLET
========================= */

@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 188px;
    padding: 18px 10px;
  }

  .menu {
    gap: 6px;
  }

  .menu-item {
    gap: 9px;
    min-height: 40px;
    padding: 10px 9px;
    font-size: 12.5px;
  }

  .menu-icon {
    width: 16px;
    height: 16px;
  }
}

/* =========================
   MOBILE DRAWER
========================= */

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;

    width: min(82vw, 290px);
    max-width: 290px;
    height: 100dvh;
    min-height: 100dvh;

    padding: 14px 12px 24px;

    transform: translateX(-100%);
    transition: transform 0.25s ease;

    z-index: 1200;

    box-shadow: 8px 0 28px rgba(15, 23, 42, 0.28);

    overscroll-behavior: contain;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    padding: 4px 4px 14px;
    margin-bottom: 10px;

    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .menu {
    gap: 6px;
  }

  .menu-item {
    gap: 12px;

    min-height: 46px;
    padding: 12px;

    font-size: 14px;
  }

  .menu-icon {
    width: 18px;
    height: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .menu-item {
    transition: none;
  }
}
</style>