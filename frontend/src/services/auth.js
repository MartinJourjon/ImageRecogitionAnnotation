import { apiClient } from '../lib/api'

export async function signIn(email, password) {
  const { data, error } = await apiClient.post('/auth/signin', { email, password })

  if (data && data.token) {
    apiClient.setToken(data.token)
  }

  return { data, error }
}

export async function signUp(email, password, nickname) {
  const { data, error } = await apiClient.post('/auth/signup', { email, password, nickname })

  if (data && data.token) {
    apiClient.setToken(data.token)
  }

  return { data, error }
}

export async function signOut() {
  apiClient.setToken(null)
  return { data: null, error: null }
}

export async function getCurrentUser() {
  return apiClient.get('/auth/me')
}
