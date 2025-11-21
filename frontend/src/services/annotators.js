import { apiClient } from '../lib/api'

export async function getAnnotatorByUserId(userId) {
  return apiClient.get('/annotators/profile')
}

export async function upsertAnnotator(data) {
  return apiClient.post('/annotators/profile', data)
}

export async function addXpAndPoints(userId, rewards) {
  return apiClient.post('/annotators/rewards', rewards)
}

export async function getAnnotatorStats() {
  return apiClient.get('/annotators/stats')
}

export async function refreshAnnotatorStats() {
  return apiClient.post('/annotators/stats/refresh')
}

export async function getLeaderboard(limit = 10) {
  return apiClient.get(`/annotators/leaderboard?limit=${limit}`)
}

// Alias pour compatibilité avec Dashboard.vue
export async function listAnnotators(limit = 10) {
  return getLeaderboard(limit)
}

// Fonction pour récupérer les annotations d'un utilisateur
// Note: Cette fonction retourne un tableau vide car le backend n'a pas d'endpoint pour ça
// Pour l'implémenter complètement, il faudrait créer un endpoint backend
export async function getAnnotationsByUser(userId, days = 14) {
  // TODO: Implémenter un endpoint backend pour récupérer les annotations par utilisateur
  // Pour l'instant, retourne un tableau vide
  return []
}

// Fonction de subscription en temps réel
// Note: Cette fonction retourne un objet factice car il n'y a pas de websocket configuré
// Pour implémenter le temps réel, il faudrait configurer Socket.io ou Server-Sent Events
export function subscribeToAnnotators(callback) {
  // TODO: Implémenter un système de temps réel (websocket, SSE, polling, etc.)
  // Pour l'instant, retourne un objet factice
  return {
    unsubscribe: () => {
      // Rien à faire pour l'instant
    }
  }
}
