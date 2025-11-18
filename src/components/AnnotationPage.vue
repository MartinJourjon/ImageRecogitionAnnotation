<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import AnnotationForm from './AnnotationForm.vue'

const loading = ref(false)
const record = ref(null)
const tableName = 'annotations'
const lastError = ref('')

async function loadNext() {
  loading.value = true
  lastError.value = ''
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('status', 'pending')
    .order('img_id', { ascending: true })
    .limit(1)
  if (error) {
    lastError.value = error.message
  } else {
    record.value = data?.[0] || null
  }
  loading.value = false
}

function handleSaved() {
  loadNext()
}

onMounted(loadNext)
</script>

<template>
  <div>
    <v-alert v-if="!record && !loading && !lastError" type="info" class="mt-4">No pending record.</v-alert>
    <v-alert v-if="lastError" type="error" class="mt-4">Error: {{ lastError }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="my-4" />
    <div v-if="record">
      <v-card class="my-4" variant="outlined">
        <v-card-title>Image #{{ record.img_id }}</v-card-title>
        <v-card-text>
          <v-img :src="record.image_link || record.img_path" max-height="400" contain></v-img>
          <p class="text-caption mt-2">Source: {{ record.source }}</p>
        </v-card-text>
      </v-card>
      <AnnotationForm :record="record" :table-name="tableName" @saved="handleSaved" />
    </div>
    <v-btn color="secondary" class="mt-4" @click="loadNext" :disabled="loading">Reload</v-btn>
  </div>
</template>

