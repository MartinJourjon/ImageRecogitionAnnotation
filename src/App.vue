<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabase'
import AnnotationForm from './components/AnnotationForm.vue'

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
    console.error(error)
    lastError.value = error.message
  } else {
    record.value = data?.[0] || null
  }
  loading.value = false
}

function handleSaved() {
  // après sauvegarde, charger suivant
  loadNext()
}

onMounted(loadNext)
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-toolbar title="Image annotation" color="primary" dark></v-toolbar>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* ... */
</style>
