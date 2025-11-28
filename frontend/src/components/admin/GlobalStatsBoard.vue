<script setup>
import { ref, onMounted, computed } from 'vue'
import * as annotationsService from '../../services/annotations'

const loading = ref(true)
const stats = ref(null)
const error = ref(null)

// Computed pour les données du graphique des annotations par jour
const dailyChartData = computed(() => {
  if (!stats.value?.daily_stats) return { categories: [], series: [] }

  const sortedData = [...stats.value.daily_stats].reverse() // Inverser pour avoir ordre chronologique
  const categories = sortedData.map(d => new Date(d.date).toLocaleDateString('fr-FR'))
  const data = sortedData.map(d => parseInt(d.count))

  return {
    categories,
    series: [{ name: 'Annotations complétées', data }]
  }
})

// Charger les statistiques
async function loadStats() {
  loading.value = true
  error.value = null
  try {
    const { data, error: err } = await annotationsService.getGlobalStats()
    if (err) throw new Error(err)
    stats.value = data
  } catch (e) {
    console.error('[GlobalStatsBoard] Error loading stats:', e)
    error.value = e.message || 'Erreur lors du chargement des statistiques'
  } finally {
    loading.value = false
  }
}

// Calculer le pourcentage de complétion
const completionRate = computed(() => {
  if (!stats.value?.status_stats) return 0
  const { total, done } = stats.value.status_stats
  if (total === 0) return 0
  return ((parseInt(done) / parseInt(total)) * 100).toFixed(1)
})

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div>
    <v-card v-if="loading" class="pa-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-4">Chargement des statistiques...</span>
    </v-card>

    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-else-if="stats">
      <!-- Statistiques principales -->
      <v-row class="mb-4">
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-h4 font-weight-bold primary--text">{{ stats.status_stats.total }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Total d'images</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-h4 font-weight-bold success--text">{{ stats.status_stats.done }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Complétées</div>
            <v-progress-linear
              :model-value="completionRate"
              color="success"
              class="mt-2"
              height="6"
            ></v-progress-linear>
            <div class="text-caption mt-1">{{ completionRate }}%</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-h4 font-weight-bold warning--text">{{ stats.status_stats.pending }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">En attente</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-h4 font-weight-bold info--text">{{ stats.avg_stats?.total_annotators || 0 }}</div>
            <div class="text-subtitle-2 text-medium-emphasis">Annotateurs actifs</div>
            <div class="text-caption mt-2">
              Moyenne: {{ stats.avg_stats?.avg_annotations_per_annotator || 0 }} annotations/annotateur
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Graphique des annotations par jour -->
      <v-card class="pa-4 mb-4">
        <h3 class="mb-4">Annotations complétées (30 derniers jours)</h3>
        <apexchart
          v-if="dailyChartData.categories.length > 0"
          type="line"
          :options="{
            xaxis: { categories: dailyChartData.categories },
            chart: { toolbar: { show: true } },
            stroke: { curve: 'smooth', width: 3 },
            colors: ['#4CAF50'],
            dataLabels: { enabled: false },
            markers: { size: 4 }
          }"
          :series="dailyChartData.series"
          height="300"
        />
        <div v-else class="text-center text-medium-emphasis py-8">
          Aucune donnée disponible pour les 30 derniers jours
        </div>
      </v-card>

      <v-row>
        <!-- Top 5 annotateurs -->
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <h3 class="mb-4">Top 5 Annotateurs</h3>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Annotateur</th>
                  <th class="text-right">Annotations</th>
                  <th class="text-right">XP</th>
                  <th class="text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(annotator, index) in stats.top_annotators" :key="index">
                  <td>
                    <v-chip size="small" :color="index === 0 ? 'warning' : 'default'" class="mr-2">
                      {{ index + 1 }}
                    </v-chip>
                    {{ annotator.nickname }}
                  </td>
                  <td class="text-right font-weight-bold">{{ annotator.annotations_count }}</td>
                  <td class="text-right">{{ annotator.xp }}</td>
                  <td class="text-right">{{ annotator.total_points }}</td>
                </tr>
              </tbody>
            </v-table>
            <div v-if="stats.top_annotators.length === 0" class="text-center text-medium-emphasis py-4">
              Aucun annotateur actif
            </div>
          </v-card>
        </v-col>

        <!-- Activité récente -->
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <h3 class="mb-4">Activité récente</h3>
            <v-list density="compact">
              <v-list-item
                v-for="(activity, index) in stats.recent_activity"
                :key="index"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon color="success" size="small">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>
                  Image #{{ activity.img_id }}
                  <span class="text-medium-emphasis">par {{ activity.annotator_nickname || 'Inconnu' }}</span>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ new Date(activity.annotation_timestamp).toLocaleString('fr-FR') }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-if="stats.recent_activity.length === 0" class="text-center text-medium-emphasis py-4">
              Aucune activité récente
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- État du système -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="pa-4">
            <h3 class="mb-4">État du système</h3>
            <v-row>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="x-large" color="warning">mdi-clock-outline</v-icon>
                  <div class="text-h6 mt-2">{{ stats.status_stats.in_progress }}</div>
                  <div class="text-caption text-medium-emphasis">En cours</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="x-large" color="error">mdi-skip-next</v-icon>
                  <div class="text-h6 mt-2">{{ stats.status_stats.skipped }}</div>
                  <div class="text-caption text-medium-emphasis">Ignorées</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="x-large" color="success">mdi-chart-line</v-icon>
                  <div class="text-h6 mt-2">{{ completionRate }}%</div>
                  <div class="text-caption text-medium-emphasis">Progression</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <v-icon size="x-large" color="info">mdi-account-group</v-icon>
                  <div class="text-h6 mt-2">{{ stats.avg_stats?.total_annotators || 0 }}</div>
                  <div class="text-caption text-medium-emphasis">Contributeurs</div>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.v-card {
  transition: transform 0.2s;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
