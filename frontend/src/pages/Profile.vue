<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import * as annotatorsService from '../services/annotators'

const store = useUserStore()
const editing = ref(false)
const nickname = ref(store.user ? (store.user.user_metadata?.nickname || store.user.email.split('@')[0]) : '')
const loading = ref(false)
const message = ref('')

async function save() {
  if (!store.user) return
  loading.value = true
  message.value = ''
  try {
    await annotatorsService.upsertAnnotator({ user_id: store.user.id, nickname: nickname.value })
    await store.fetchProfile()
    message.value = 'Profile updated.'
    editing.value = false
  } catch (e) {
    message.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}

// simple XP history from annotations (approx)
const history = ref([])
async function loadHistory() {
  if (!store.user) return
  history.value = await annotatorsService.getAnnotationsByUser(store.user.id, 30)
}

onMounted(() => {
  loadHistory()
})

async function claimDailyBonus() {
  if (!store.user) return
  loading.value = true
  try {
    // Award 50 XP as daily bonus
    await store.addRewards({ xp: 50, points: 0, annotations: 0 })
    message.value = 'Daily bonus added (+50 XP)'
    await loadHistory()
  } catch (e) {
    message.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between">
            <div>
              <div class="text-h6">Profile</div>
              <div class="text-caption">Manage your profile and stats</div>
            </div>
            <v-btn variant="text" size="small" @click="editing = !editing">{{ editing ? 'Cancel' : 'Edit' }}</v-btn>
          </div>

          <v-divider class="my-4" />

          <v-text-field v-if="editing" label="Nickname" v-model="nickname" />
          <div v-else>
            <div><strong>Nickname:</strong> {{ store.user?.email ? (store.user.user_metadata?.nickname || store.user.email.split('@')[0]) : '—' }}</div>
            <div><strong>Role:</strong> {{ store.role }}</div>
            <div class="mt-2"><strong>Level:</strong> {{ store.level }} — <strong>XP:</strong> {{ store.xp }}</div>
            <div><strong>Points:</strong> {{ store.points }}</div>
            <div><strong>Total annotations:</strong> {{ store.total_annotations }}</div>
          </div>

          <v-card-actions class="mt-4">
            <v-btn color="primary" :loading="loading" @click="save" v-if="editing">Save</v-btn>
            <v-btn color="secondary" @click="claimDailyBonus">Daily Bonus (+50 XP)</v-btn>
          </v-card-actions>

          <v-alert v-if="message" class="mt-4" type="success">{{ message }}</v-alert>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="text-h6">History (30 days)</div>
          <v-list>
            <v-list-item v-for="it in history" :key="it.id">
              <v-list-item-title>Annotation</v-list-item-title>
              <v-list-item-subtitle>{{ new Date(it.created_at).toLocaleString() }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="history.length === 0">
              <v-list-item-title>No recent activity.</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

