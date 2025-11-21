import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import router from './router'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'

const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
})

const app = createApp(App)
app.use(vuetify)
app.use(router)
const pinia = createPinia()
app.use(pinia)
app.use(VueApexCharts)  // Enregistre automatiquement le composant 'apexchart'
app.mount('#app')
