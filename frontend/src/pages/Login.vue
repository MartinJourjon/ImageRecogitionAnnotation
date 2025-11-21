<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const store = useUserStore()

const pseudo = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function signIn() {
  loading.value = true
  error.value = null
  try {
    await store.signIn(pseudo.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = store.error || (e.message || JSON.stringify(e))
  } finally {
    loading.value = false
  }
}

async function goSignUp() {
  router.push('/signup')
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>Login</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error">{{ error }}</v-alert>
            <v-text-field label="Email" v-model="pseudo" />
            <v-text-field label="Password" type="password" v-model="password" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" :loading="loading" @click="signIn">Sign in</v-btn>
          </v-card-actions>
          <v-card-subtitle class="px-4 pb-4">
            Don't have an account? <v-btn variant="text" size="small" @click="goSignUp">Sign up</v-btn>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

