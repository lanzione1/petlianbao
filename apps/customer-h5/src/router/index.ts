import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import BookingPage from '../pages/BookingPage.vue'
import SuccessPage from '../pages/SuccessPage.vue'
import MyAppointmentsPage from '../pages/MyAppointmentsPage.vue'
import AppointmentDetailPage from '../pages/AppointmentDetailPage.vue'
import AuthPage from '../pages/AuthPage.vue'
import PetsPage from '../pages/PetsPage.vue'
import PetDetailPage from '../pages/PetDetailPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: BookingPage,
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthPage,
  },
  {
    path: '/booking',
    name: 'booking',
    component: BookingPage,
  },
  {
    path: '/success',
    name: 'success',
    component: SuccessPage,
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: MyAppointmentsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/my-appointments',
    redirect: '/appointments'
  },
  {
    path: '/appointment/:id',
    name: 'appointment-detail',
    component: AppointmentDetailPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/pets',
    name: 'pets',
    component: PetsPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/pet/:id',
    name: 'pet-detail',
    component: PetDetailPage,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
