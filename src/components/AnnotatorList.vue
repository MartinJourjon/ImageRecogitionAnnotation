<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Annotators
            <v-spacer />
            <v-btn color="primary" @click="refreshStats" :loading="refreshLoading" icon>
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
            <v-btn variant="text" to="/" tag="router-link">
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
import { supabase } from '../lib/supabase'

const router = useRouter()
const annotators = ref([])
const loading = ref(false)
const refreshLoading = ref(false)
const error = ref('')

const headers = [
  { title: 'Annotator', key: 'annotator_id', value: 'annotator_id' },
  { title: 'Image count', key: 'image_count', value: 'image_count' },
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
    const { data, error: e } = await supabase
      .from('annotator_stats')
      .select('annotator_id, image_count, last_refreshed')
      .order('image_count', { ascending: false })
    if (e) {
      error.value = e.message || String(e)
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
    // call the SQL function: SELECT public.refresh_annotator_stats();
    const { data, error: e } = await supabase.rpc('refresh_annotator_stats')
    if (e) {
      error.value = e.message || String(e)
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
