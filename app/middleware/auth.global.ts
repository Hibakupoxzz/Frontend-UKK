import type { UserRole } from '~/composables/useAuth'
import { ROLE_ROUTES } from '~/utils/nav'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { user, isAuthenticated, initAuth } = useAuth()

  if (!isAuthenticated.value) {
    initAuth()
  }

  const publicRoutes = ['/admin/login', '/admin/register']
  const isPublicRoute = publicRoutes.includes(to.path)

  if ((!isAuthenticated.value || !user.value) && !isPublicRoute) {
    return navigateTo('/admin/login')
  }

  if (isAuthenticated.value && user.value && isPublicRoute) {
    return navigateTo(ROLE_ROUTES[user.value.role])
  }

  if (isAuthenticated.value && user.value) {
    const userRole = user.value.role
    const allowedRoutes = getAllowedRoutesForRole(userRole)

    const isAllowed = allowedRoutes.some(route =>
      to.path === route || to.path.startsWith(route + '/')
    )

    if (!isAllowed) {
      return navigateTo(ROLE_ROUTES[userRole])
    }
  }
})

function getAllowedRoutesForRole(role: UserRole): string[] {
  const profileRoute = '/admin/pengaturan'

  switch (role) {
    case 'admin':
      return ['/admin']
    case 'finance':
      return [
        profileRoute,
        '/finance/dashboard',
        '/finance/pengeluaran',
        '/finance/pembayaran',
        '/finance/laporan',
      ]
    case 'hrd':
      return [
        profileRoute,
        '/hrd/dashboard',
        '/hrd/data-pegawai',
        '/hrd/pelaksanaan',
        '/hrd/laporan',
        '/hrd/detail-perjalanan',
        '/hrd/pegawai-detail',
      ]
    case 'pegawai':
      return [
        profileRoute,
        '/pegawai/dashboard',
        '/pegawai/rencana',
        '/hrd/pelaksanaan',
        '/pegawai/pengeluaran',
        '/pegawai/laporan',
      ]
    case 'atasan':
      return [
        profileRoute,
        '/atasan/dashboard',
        '/atasan/persetujuan',
        '/atasan/perjalanan-tim',
        '/atasan/laporan',
      ]
    default:
      return []
  }
}