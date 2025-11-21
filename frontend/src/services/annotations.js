import { apiClient } from '../lib/api'

export async function getNextAnnotation() {
  return apiClient.get('/annotations/next')
}

export async function lockAnnotation(imgId) {
  return apiClient.patch(`/annotations/${imgId}/lock`)
}

export async function unlockAnnotation(imgId) {
  return apiClient.patch(`/annotations/${imgId}/unlock`)
}

export async function updateAnnotation(imgId, data) {
  return apiClient.put(`/annotations/${imgId}`, data)
}

export async function skipAnnotation(imgId) {
  return apiClient.patch(`/annotations/${imgId}/skip`)
}

export async function deleteAnnotation(imgId) {
  return apiClient.delete(`/annotations/${imgId}`)
}
