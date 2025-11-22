<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import * as annotationsService from '../services/annotations'
import AnnotationForm from './AnnotationForm.vue'

const loading = ref(false)
const record = ref(null)
const lastError = ref('')

// Track a lock locally so we can release it if user leaves without saving
let lockedImgId = null

async function markInProgress(imgId) {
  if (!imgId) return false
  try {
    const { data, error } = await annotationsService.lockAnnotation(imgId)
    if (error) {
      console.warn('Failed to mark in_progress', error)
      return false
    }
    return data && data.success
  } catch (e) {
    console.warn('Failed to mark in_progress', e)
    return false
  }
}

async function releaseLock(imgId) {
  if (!imgId) return
  try {
    await annotationsService.unlockAnnotation(imgId)
  } catch (e) {
    console.warn('Failed to release lock', e)
  }
}

async function loadNext() {
  loading.value = true
  lastError.value = ''

  // Release previous lock if any (user clicked reload)
  if (lockedImgId) {
    await releaseLock(lockedImgId)
    lockedImgId = null
  }

  // Try multiple times to avoid race conditions
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await annotationsService.getNextAnnotation()

    if (error) {
      lastError.value = error
      break
    }

    const candidate = data || null
    if (!candidate) {
      // nothing pending
      record.value = null
      break
    }

    const claimed = await markInProgress(candidate.img_id)
    if (claimed) {
      // Successfully claimed
      record.value = candidate
      lockedImgId = candidate.img_id
      break
    }
    // else someone else claimed it; retry
  }

  loading.value = false
}

function handleSaved() {
  // The form emitted 'saved' after a save/skip/delete; clear local lock (server should be updated by form)
  lockedImgId = null
  // Scroll to top for better UX when loading next annotation
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadNext()
}

onMounted(loadNext)

// When user navigates away within the SPA, release lock if any
onBeforeRouteLeave(async () => {
  if (lockedImgId) {
    await releaseLock(lockedImgId)
    lockedImgId = null
  }
})

// When component unmounts (closing tab or leaving), also try to release lock
onUnmounted(() => {
  if (lockedImgId) {
    releaseLock(lockedImgId)
    lockedImgId = null
  }
})

// Also attempt to release on page unload (best-effort)
window.addEventListener('beforeunload', (event) => {
  if (lockedImgId) {
    releaseLock(lockedImgId)
  }
})

// pagehide is more reliable on mobile and some browsers
window.addEventListener('pagehide', () => {
  if (lockedImgId) {
    releaseLock(lockedImgId)
  }
})
</script>

<template>
  <div style="width:100%">
    <v-alert v-if="!record && !loading && !lastError" type="info" class="mt-4">No pending record.</v-alert>
    <v-alert v-if="lastError" type="error" class="mt-4">Error: {{ lastError }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="my-4" />
    <div v-if="record">
      <v-card class="my-4" variant="outlined" style="width:100%">
        <v-card-title>Image #{{ record.img_id }}</v-card-title>
        <v-card-text>
          <v-img :src="record.image_link || record.img_path" max-height="400" contain></v-img>
          <p class="text-caption mt-2">Source: {{ record.source }}</p>
        </v-card-text>
      </v-card>
      <AnnotationForm :record="record" :table-name="tableName" @saved="handleSaved" />
    </div>
    <v-btn color="secondary" class="mt-4" @click="loadNext" :disabled="loading">Reload</v-btn>
    <v-btn color="primary" class="mt-4 ml-2" to="/annotators">
      <v-icon left>mdi-account-multiple</v-icon>
      Leaderboard
    </v-btn>
  </div>
</template>
