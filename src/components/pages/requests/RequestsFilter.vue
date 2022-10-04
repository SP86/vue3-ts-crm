<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useRouter, useRoute } from 'vue-router'
import { TeProjectsData } from '/@src/interfaces/api_interfaces'

const { t } = useI18n()
const api = useApi()
const router = useRouter()
const route = useRoute()

const filter = reactive({
  type: route.query.type,
  project_id: route.query.project_id,
  user_id: route.query.user_id,
})

const data = reactive({
  users: [],
  projects: [],
})

const emit = defineEmits(['update'])

watch(filter, async (currentValue) => {
  const query = {
    type: currentValue.type ? currentValue.type : undefined,
    project_id: currentValue.project_id ? currentValue.project_id : undefined,
    user_id: currentValue.user_id ? currentValue.user_id : undefined,
  }
  await router.push({ query })
  emit('update')
})

const fetchData = async () => {
  const { data: projects } = await api.get(`/api/v1/te-project`)
  data.projects = projects.items.filter(
    (item: TeProjectsData) => item.status !== 'ARCHIVED'
  )

  const { data: users } = await api.get(`/api/v1/users`)
  data.users = users.items
}

const clearFilter = async () => {
  filter.type = ''
  filter.project_id = ''
  filter.user_id = ''
  await router.push({ query: {} })
  emit('update')
}

fetchData()
</script>

<template>
  <div class="columns">
    <VField class="column is-3">
      <VSelect v-model="filter.type" class="select is-rounded is-info-focus">
        <VOption value="">{{ t('requests.filters.type') }}</VOption>
        <VOption value="investment_request">
          {{ t('requests.requestsTypes.investment_request') }}
        </VOption>
        <VOption value="request_cashback">
          {{ t('requests.requestsTypes.request_cashback') }}
        </VOption>
        <VOption value="sell_investment_request">
          {{ t('requests.requestsTypes.sell_investment_request') }}
        </VOption>
      </VSelect>
    </VField>

    <VField class="column is-3">
      <VSelect v-model="filter.project_id" class="select is-rounded is-info-focus">
        <VOption value="">{{ t('requests.filters.project') }}</VOption>
        <VOption v-for="project in data.projects" :key="project.id" :value="project.id">
          {{ project.title }}
        </VOption>
      </VSelect>
    </VField>

    <VField class="column is-3">
      <VSelect v-model="filter.user_id" class="select is-rounded is-info-focus">
        <VOption value="">{{ t('requests.filters.user') }}</VOption>
        <VOption v-for="user in data.users" :key="user.id" :value="user.id">
          {{ user.first_name }} {{ user.last_name }}
        </VOption>
      </VSelect>
    </VField>
    <VField class="column is-3 is-flex is-justify-content-end">
      <VButton color="primary" rounded raised @click="clearFilter">
        {{ t('requests.filters.clear') }}
      </VButton>
    </VField>
  </div>
</template>

<style lang="scss">

</style>
