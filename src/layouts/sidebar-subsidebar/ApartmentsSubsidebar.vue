<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '/@src/composable/useApi'
import { useRoute, useRouter } from 'vue-router'
import { TeProjectsData } from '/@src/interfaces/api_interfaces'
const router = useRouter()
const route = useRoute()
const api = useApi()
const { t } = useI18n()

const projects = ref<TeProjectsData[]>([])

const fetchData = async () => {
  const { data: data } = await api.get(`/api/v1/te-project`)
  projects.value = data.items.filter(
    (item: TeProjectsData) =>
      item.status !== 'ARCHIVED' && item.project_type === 'meter_in_apartment'
  )
  if (!route.params.project_id && projects.value[0]) {
    await router.push(`/apartments/${projects.value[0].id}/buildings`)
  }
}
fetchData()
</script>

<template>
  <div class="sidebar-panel is-generic">
    <div class="inner px-3 mt-5" data-simplebar>
      <VField class="">
        <VSelect
          v-model="route.params.project_id"
          class="select is-rounded is-info-focus is-heigest"
          @change="router.replace({ params: { project_id: $event.target.value } })"
        >
          <VOption v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.title }}
          </VOption>
        </VSelect>
      </VField>
      <ul v-if="$route.params.project_id">
        <li>
          <router-link :to="`/apartments/${route.params.project_id}/buildings`">
            {{ t('apartments.buildings.title') }}
          </router-link>
        </li>
        <li>
          <router-link :to="`/apartments/${route.params.project_id}/layouts`">
            {{ t('apartments.layouts.title') }}
          </router-link>
        </li>
        <li>
          <router-link :to="`/apartments/${route.params.project_id}/flats`">
            {{ t('apartments.flats.title') }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '/@src/scss/layout/sidebar-panel';
</style>
