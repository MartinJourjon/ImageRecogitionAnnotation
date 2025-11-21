import { defineStore } from 'pinia'
import * as authService from '../services/auth'
import * as annotatorsService from '../services/annotators'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    role: 'annotator',
    level: 1,
    xp: 0,
    points: 0,
    total_annotations: 0,
    _initialized: false,
    error: null
  }),
  actions: {
    async signIn(email, password) {
      this.error = null
      try {
        const { data, error } = await authService.signIn(email, password)
        if (error) throw new Error(error)
        this.user = data.user
        await this.fetchProfile()
        return data
      } catch (e) {
        this.error = e.message || JSON.stringify(e)
        throw e
      }
    },
    async signUp(email, password, nickname = '') {
      this.error = null
      try {
        const { data, error } = await authService.signUp(email, password, nickname || email.split('@')[0])
        if (error) throw new Error(error)
        this.user = data.user
        await this.fetchProfile()
        return data
      } catch (e) {
        this.error = e.message || JSON.stringify(e)
        throw e
      }
    },
    async signOut() {
      this.error = null
      try {
        await authService.signOut()
        this.user = null
        this.role = 'annotator'
        this.level = 1
        this.xp = 0
        this.points = 0
        this.total_annotations = 0
        this._initialized = false
      } catch (e) {
        this.error = e.message || JSON.stringify(e)
        throw e
      }
    },
    async fetchProfile() {
      this.error = null
      try {
        // récupère l'utilisateur courant
        const { data, error } = await authService.getCurrentUser()
        if (error) throw new Error(error)

        this.user = data.user || null
        if (this.user) {
          this.role = this.user.role || 'annotator'
          this.xp = this.user.xp || 0
          this.level = Math.floor((this.user.xp || 0) / 500) + 1
          this.points = this.user.total_points || 0
          this.total_annotations = this.user.total_annotations || 0
        }
        this._initialized = true
        return this.user
      } catch (e) {
        this.error = e.message || JSON.stringify(e)
        this._initialized = true
        // Don't throw here, just mark as initialized
        return null
      }
    },
    // helper to add xp/points after an annotation
    async addRewards({ xp = 0, points = 0, annotations = 0 }) {
      if (!this.user) return
      try {
        const { error } = await annotatorsService.addXpAndPoints(this.user.id, { xp, points, annotations })
        if (error) throw new Error(error)
        // re-fetch profile
        await this.fetchProfile()
      } catch (e) {
        this.error = e.message || JSON.stringify(e)
      }
    }
  }
})
