import { acceptHMRUpdate, defineStore } from 'pinia'
import { useApi } from '/@src/composable/useApi'

export const useInvestements = defineStore('investements', () => {
  const api = useApi()

  async function fetchProjectInvestements(project_id: String) {
    return await api.get(`/api/v1/project/${project_id}/te-investment-item`, {
      params: {
        project_id,
      },
    })
  }

  async function createProjectInvestement(project_id: String, data: Object) {
    return await api.post(`/api/v1/project/${project_id}/te-investment-item`, data)
  }

  async function updateProjectInvestement(project_id: String, optionId: String, data: Object) {
    return await api.put(`/api/v1/project/${project_id}/te-investment-item/${optionId}`, data)
  }

  async function deleteProjectInvestement(project_id: String, id: String) {
    return await api.delete(`/api/v1/project/${project_id}/te-investment-item/${id}`)
  }

  return {
    fetchProjectInvestements,
    createProjectInvestement,
    updateProjectInvestement,
    deleteProjectInvestement
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
  import.meta.hot.accept(acceptHMRUpdate(useInvestements, import.meta.hot))
}
