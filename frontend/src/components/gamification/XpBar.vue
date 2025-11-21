<template>
  <div>
    <div class="d-flex align-center justify-space-between">
      <div>Level {{ level }}</div>
      <div>{{ xp }} / {{ nextLevelXp }}</div>
    </div>
    <v-progress-linear :value="progress" height="12" color="deep-purple accent-4" class="mt-2" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
const { xp, level } = defineProps({ xp: { type: Number, default: 0 }, level: { type: Number, default: 1 } })

const within = computed(() => xp % 500)
const progress = computed(() => Math.round((within.value / 500) * 100))
const nextLevelXp = computed(() => (level * 500))
</script>
