import { createRouter, createWebHistory } from 'vue-router'
import AnnotationPage from './components/AnnotationPage.vue'
import GuideLines from './components/GuideLines.vue'
import AnnotatorList from './components/AnnotatorList.vue'
import LoginPage from './pages/Login.vue'
import DashboardPage from './pages/Dashboard.vue'
import ProfilePage from './pages/Profile.vue'
import SignupPage from './pages/Signup.vue'
import { useUserStore } from './stores/user'
import { apiClient } from './lib/api'

const routes = [
  { path: '/', component: AnnotationPage, meta: { requiresAuth: true } },
  { path: '/guidelines', component: GuideLines, meta: { requiresAuth: true } },
  { path: '/annotators', component: AnnotatorList, meta: { requiresAuth: true } },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignupPage },
  { path: '/dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global guard: vérifie l'auth via le store Pinia
router.beforeEach(async (to, from, next) => {
  const store = useUserStore()

  // Initialize API client with stored token
  const token = localStorage.getItem('auth_token')
  if (token) {
    apiClient.setToken(token)
  }

  // fetchProfile résout l'état authentifié si nécessaire
  if (!store._initialized && token) {
    try { await store.fetchProfile() } catch (e) { /* ignore */ }
  }

  if (to.meta.requiresAuth && !store.user) {
    return next({ path: '/login' })
  }
  next()
})

export default router
