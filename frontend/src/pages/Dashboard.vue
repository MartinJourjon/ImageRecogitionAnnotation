<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '../stores/user'
import * as annotatorsService from '../services/annotators'
import UserCard from '../components/gamification/UserCard.vue'
import XpBar from '../components/gamification/XpBar.vue'
import LevelBadge from '../components/gamification/LevelBadge.vue'
import RankingTable from '../components/gamification/RankingTable.vue'

const store = useUserStore()
const annotationsSeries = ref([])
const categories = ref([])
const loading = ref(true)
const annotators = ref([])
let channel = null

function computeSeries(days = 14, items = []) {
  const map = {}
  const labels = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map[key] = 0
    labels.push(key)
  }
  items.forEach(it => {
    const k = (new Date(it.created_at)).toISOString().slice(0, 10)
    if (map[k] !== undefined) map[k]++
  })
  return { labels, data: Object.values(map) }
}

async function load() {
  loading.value = true
  try {
    const ann = await annotatorsService.getAnnotationsByUser(store.user?.id || null, 14)
    const { labels, data } = computeSeries(14, ann)
    categories.value = labels
    annotationsSeries.value = [{ name: 'Annotations', data }]

    // Get leaderboard data (apiClient returns { data, error })
    const result = await annotatorsService.listAnnotators(50)
    if (result.data) {
      annotators.value = result.data
      console.log('[Dashboard] Loaded annotators:', result.data)
    } else {
      console.error('[Dashboard] Error loading annotators:', result.error)
      annotators.value = []
    }
  } catch (e) {
    console.error('[Dashboard] Exception loading data:', e)
    annotators.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  // realtime subscription to annotators
  channel = annotatorsService.subscribeToAnnotators(async () => {
    // reload ranking on changes
    try {
      const result = await annotatorsService.listAnnotators(50)
      if (result.data) {
        annotators.value = result.data
      }
    } catch (e) {
      console.error('[Dashboard] Error reloading annotators:', e)
    }
  })
})

onBeforeUnmount(() => {
  if (channel && channel.unsubscribe) channel.unsubscribe()
})
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <user-card :nickname="store.user?.email || store.user?.id" :level="store.level" :xp="store.xp" :points="store.points" :total_annotations="store.total_annotations" />
        </v-card>
        <v-card class="mt-4 pa-4">
          <level-badge :level="store.level" />
          <xp-bar :xp="store.xp" :level="store.level" />
          <div class="mt-2">Points: <strong>{{ store.points }}</strong></div>
          <div>Total annotations: <strong>{{ store.total_annotations }}</strong></div>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <h3>Annotations per Day</h3>
          <apexchart type="area" :options="{ xaxis: { categories }, chart: { toolbar: { show: true } } }" :series="annotationsSeries" height="320" />
        </v-card>
        <v-card class="mt-4 pa-4">
          <h3>Leaderboard</h3>
          <ranking-table :annotators="annotators" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
