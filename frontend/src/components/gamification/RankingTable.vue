<template>
  <v-card>
    <v-card-title>Leaderboard</v-card-title>
    <v-card-text>
      <v-table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Annotator</th>
            <th>XP</th>
            <th>Level</th>
            <th>Annotations</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(annotator, index) in annotators" :key="annotator.user_id">
            <td>{{ index + 1 }}</td>
            <td>{{ annotator.nickname }}</td>
            <td>{{ annotator.xp }}</td>
            <td>{{ annotator.level }}</td>
            <td>{{ annotator.total_annotations }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  annotators: {
    type: Array,
    default: () => []
  }
})
</script>
