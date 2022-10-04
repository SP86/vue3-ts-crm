import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'

export type UserData = Record<string, any> | null

export const useUserSession = defineStore('userSession', () => {
  // token will be synced with local storage
  // @see https://vueuse.org/core/usestorage/
  const token = useStorage('token', '')
  const api = useApi()

  const user = ref<Partial<UserData>>()
  const loading = ref(true)

  const isLoggedIn = computed(() => token.value !== undefined && token.value !== '')

  // Tenant Login
  async function loginTenant(login: String, password: String) {
    return await api.post('/api/v1/login', {
      login,
      password,
    })
  } 

  function setUser(newUser: Partial<UserData>) {
    user.value = newUser
  }

  function setToken(newToken: string) {
    token.value = newToken
  }

  function setLoading(newLoading: boolean) {
    loading.value = newLoading
  }

  async function logoutUser() {
    token.value = undefined
  }

  return {
    user,
    token,
    isLoggedIn,
    loading,
    loginTenant,
    logoutUser,
    setUser,
    setToken,
    setLoading,
  } as const
})

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserSession, import.meta.hot))
}
