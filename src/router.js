import { createRouter, createWebHistory } from 'vue-router'
import AnnotationPage from './components/AnnotationPage.vue'
import GuideLines from './components/GuideLines.vue'

const routes = [
  { path: '/', component: AnnotationPage },
  { path: '/guidelines', component: GuideLines }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
