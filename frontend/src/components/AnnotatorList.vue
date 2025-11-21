<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Leaderboard
            <v-spacer />
            <v-btn color="primary" @click="refreshStats" :loading="refreshLoading" icon>
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
            <v-btn variant="text" to="/">
              <v-icon left>mdi-arrow-left</v-icon>Back
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
            <v-skeleton-loader v-if="loading" type="table" />
            <v-data-table
              v-else
              :items="annotators"
              :headers="headers"
              :items-per-page="10"
              class="elevation-1"
            >
              <template #item.last_refreshed="{ item }">
                <span>{{ formatDate(item.last_refreshed) }}</span>
              </template>

              <template #no-data>
                <v-alert type="info">No annotators found.</v-alert>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as annotatorsService from '../services/annotators'

const router = useRouter()
const annotators = ref([])
const loading = ref(false)
const refreshLoading = ref(false)
const error = ref('')

const headers = [
  { title: 'Annotator', key: 'nickname', value: 'nickname' },
  { title: 'Image count', key: 'image_count', value: 'image_count' },
  { title: 'XP', key: 'xp', value: 'xp' },
  { title: 'Points', key: 'total_points', value: 'total_points' },
  { title: 'Last refreshed', key: 'last_refreshed', value: 'last_refreshed' }
]

function formatDate(d) {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return dt.toLocaleString()
  } catch (e) {
    return String(d)
  }
}

async function fetch() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: e } = await annotatorsService.getAnnotatorStats()
    if (e) {
      error.value = e || String(e)
      annotators.value = []
      return
    }
    annotators.value = data || []
  } catch (err) {
    error.value = err.message || String(err)
  } finally {
    loading.value = false
  }
}

async function refreshStats() {
  refreshLoading.value = true
  error.value = ''
  try {
    const { data, error: e } = await annotatorsService.refreshAnnotatorStats()
    if (e) {
      error.value = e || String(e)
      return
    }
    // after successful refresh, reload table
    await fetch()
  } catch (err) {
    error.value = err.message || String(err)
  } finally {
    refreshLoading.value = false
  }
}

function openAnnotator(id) {
  // Navigate to home with a query param to filter by annotator if needed
  router.push({ path: '/', query: { annotator: id } })
}

// initial load
fetch()
</script>

<style scoped>
.v-card-title { align-items: center; }
</style>
