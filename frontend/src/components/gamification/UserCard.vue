<template>
  <div class="d-flex align-center">
    <v-avatar size="64" color="indigo darken-2" class="mr-4">
      <span class="white--text text-h6">{{ initial }}</span>
    </v-avatar>
    <div>
      <div class="text-h6">{{ nicknameDisplay }}</div>
      <div class="text-caption">Role: {{ role }}</div>
      <div class="mt-2">Level <strong>{{ level }}</strong> • XP <strong>{{ xp }}</strong></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ nickname: { type: String, default: '' }, role: { type: String, default: 'annotator' }, level: { type: Number, default: 1 }, xp: { type: Number, default: 0 } })

const nicknameDisplay = computed(() => props.nickname || 'Anonymous')
const initial = computed(() => (nicknameDisplay.value[0] || '?').toUpperCase())
</script>

