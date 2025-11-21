<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

const drawer = ref(false)
const router = useRouter()
const store = useUserStore()

function goProfile() {
  router.push('/profile')
}

async function logout() {
  await store.signOut()
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer app v-model="drawer" temporary>
      <v-list>
        <v-list-item>
          <v-list-item-title class="text-h6">Image Annotation</v-list-item-title>
          <v-list-item-subtitle>Gamified Platform</v-list-item-subtitle>
        </v-list-item>

        <v-divider />

        <v-list-item :to="{ path: '/dashboard' }" prepend-icon="mdi-view-dashboard">
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ path: '/' }" prepend-icon="mdi-image-search">
          <v-list-item-title>Annotate</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ path: '/guidelines' }" prepend-icon="mdi-book-open-page-variant">
          <v-list-item-title>Guidelines</v-list-item-title>
        </v-list-item>

        <v-list-item :to="{ path: '/annotators' }" prepend-icon="mdi-account-group">
          <v-list-item-title>Leaderboard</v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-list-item>
          <v-btn variant="text" size="small" v-if="!store.user" :to="{ path: '/login' }">Login</v-btn>
          <div v-else>
            <div class="text-subtitle-2">{{ store.user.email || store.user.id }}</div>
            <v-btn variant="text" size="small" @click="goProfile">Profile</v-btn>
            <v-btn variant="text" size="small" color="error" @click="logout">Logout</v-btn>
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>Image Annotation Platform</v-toolbar-title>
      <v-spacer />
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>

    <v-footer padless>
      <v-col class="text-center">© {{ new Date().getFullYear() }} Image Annotation Platform</v-col>
    </v-footer>
  </v-app>
</template>

<style>
/* App-wide styles */
</style>
