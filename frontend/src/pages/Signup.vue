<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const store = useUserStore()

const email = ref('')
const password = ref('')
const nickname = ref('')
const loading = ref(false)
const error = ref(null)

async function signUp() {
  loading.value = true
  error.value = null
  try {
    await store.signUp(email.value, password.value, nickname.value)
    // après inscription, rediriger vers dashboard
    await store.fetchProfile()
    router.push('/dashboard')
  } catch (e) {
    error.value = store.error || e.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>Create Account</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
            <v-text-field label="Email" v-model="email" />
            <v-text-field label="Nickname (optional)" v-model="nickname" />
            <v-text-field label="Password" type="password" v-model="password" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" :loading="loading" @click="signUp">Sign up</v-btn>
          </v-card-actions>
          <v-card-subtitle class="px-4 pb-4">
            Already have an account? <v-btn variant="text" size="small" to="/login">Login</v-btn>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

