<template>
  <div class="d-flex align-center">
    <v-avatar size="48" color="deep-purple accent-4" class="mr-3">
      <span class="white--text">{{ level }}</span>
    </v-avatar>
    <div>
      <div class="text-subtitle-2">Level {{ level }}</div>
      <div class="text-caption">Required XP: {{ level * 500 }}</div>
    </div>
  </div>
</template>

<script setup>
const { level } = defineProps({ level: { type: Number, default: 1 } })
</script>
