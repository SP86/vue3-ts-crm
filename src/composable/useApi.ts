import axios, { AxiosInstance } from 'axios'

import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
const notif = useNotyf()

let api: AxiosInstance

export function createApi() {
  console.log('createApi use')
  // Here we set the base URL for all requests made to the api
  api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: false,
  })

  // We set an interceptor for each request to
  // include Bearer token to the request if user is logged in
  api.interceptors.request.use((config) => {
    const userSession = useUserSession()
    if (userSession.isLoggedIn) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${userSession.token}`,
      }
    }

    return config
  })

  api.interceptors.response.use(
    (response) => {
      //console.log(response, 'response in Api interseptions')
      return response
    },
    (error) => {
      //console.log(error, 'error in Api interseptions')
      notif.dismissAll()
      if (
        error.response.status === 400 ||
        error.response.status === 401 ||
        error.response.status === 403 ||
        error.response.status === 404 ||
        error.response.status === 500
      ) {
        notif.error(error.message)
      }
      return Promise.reject(error.message)
    }
  )

  return api
}

export function useApi() {
  if (!api) {
    createApi()
  }
  return api
}
