import { createRouter, createWebHistory } from 'vue-router'
import AnnotationPage from './components/AnnotationPage.vue'
import GuideLines from './components/GuideLines.vue'
import AnnotatorList from './components/AnnotatorList.vue'

const routes = [
  { path: '/', component: AnnotationPage },
  { path: '/guidelines', component: GuideLines },
  { path: '/annotators', component: AnnotatorList }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
