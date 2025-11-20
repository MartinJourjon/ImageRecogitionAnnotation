<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import AnnotationForm from './AnnotationForm.vue'

const loading = ref(false)
const record = ref(null)
const tableName = 'annotations'
const lastError = ref('')

// Track a lock locally so we can release it if user leaves without saving
let lockedImgId = null

async function markInProgress(imgId) {
  if (!imgId) return false
  try {
    // Try to atomically claim only if still 'pending'
    const { data, error } = await supabase
      .from(tableName)
      .update({ status: 'in_progress' })
      .eq('img_id', imgId)
      .eq('status', 'pending')
      .select('img_id')
    if (error) {
      console.warn('Failed to mark in_progress', error)
      return false
    }
    // If data is empty, someone else claimed it
    return Array.isArray(data) && data.length > 0
  } catch (e) {
    console.warn('Failed to mark in_progress', e)
    return false
  }
}

// Network-first release using fetch keepalive, fallback to supabase client
async function releaseLockNetwork(imgId) {
  if (!imgId) return
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?img_id=eq.${encodeURIComponent(imgId)}&status=eq.in_progress`
  const body = JSON.stringify({ status: 'pending' })
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    // Prefer minimal response to reduce payload
    'Prefer': 'return=minimal'
  }
  try {
    // try fetch with keepalive (may succeed on beforeunload)
    if (typeof fetch === 'function') {
      await fetch(url, { method: 'PATCH', headers, body, keepalive: true })
      return
    }
  } catch (e) {
    console.warn('keepalive fetch failed, falling back to client supabase', e)
  }
  // Fallback best-effort using supabase client (may not complete on unload)
  try {
    await supabase
      .from(tableName)
      .update({ status: 'pending' })
      .eq('img_id', imgId)
      .eq('status', 'in_progress')
  } catch (e) {
    console.warn('Fallback release failed', e)
  }
}

async function releaseLock(imgId) {
  // keep the previous server-client variant for normal operations
  if (!imgId) return
  try {
    // Only set back to pending if it's still in_progress
    await supabase
      .from(tableName)
      .update({ status: 'pending' })
      .eq('img_id', imgId)
      .eq('status', 'in_progress')
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
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('status', 'pending')
      .order('img_id', { ascending: true })
      .limit(1)

    if (error) {
      lastError.value = error.message
      break
    }

    const candidate = data?.[0] || null
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
    // Best-effort: try fetch keepalive, otherwise fallback
    releaseLockNetwork(lockedImgId)
    lockedImgId = null
  }
})

// Also attempt to release on page unload (best-effort) using keepalive fetch
window.addEventListener('beforeunload', (event) => {
  if (lockedImgId) {
    // Fire-and-forget best-effort network release — keepalive may succeed in modern browsers
    releaseLockNetwork(lockedImgId)
  }
})

// pagehide is more reliable on mobile and some browsers
window.addEventListener('pagehide', () => {
  if (lockedImgId) {
    releaseLockNetwork(lockedImgId)
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
    <v-btn color="primary" class="mt-4 ml-2" to="/annotators" tag="router-link">
      <v-icon left>mdi-account-multiple</v-icon>
      Annotators
    </v-btn>
  </div>
</template>
