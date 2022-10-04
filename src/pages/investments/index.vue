<script setup lang="ts">
export interface OptionItem {
  id?: number | null
  price_per_unit: number
  currency: string
  percent?: number
  term_months?: number
  return_option?: boolean
  status: string
}

export interface ProjectsData {
  id: number | null
  status?: string
  project_type?: string
}

export interface ProjectData {
  id: number | null
  attributes?: string[]
}

import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useObjects } from '/@src/stores/objects/objects'
import { useInvestements } from '/@src/stores/objects/projectInvestements'
import { useNotyf } from '/@src/composable/useNotyf'

const objectsStore = useObjects()
const investementsStore = useInvestements()
const loading = ref<boolean>(true)
const loadingList = ref<boolean>(true)
const btnLoading = ref<boolean>(false)
const projects = ref<ProjectsData[]>([])
const project = ref<ProjectData>({})
const investmentsList = ref<OptionItem[]>([])
const { t } = useI18n()
const notif = useNotyf()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(t('investments.pageTitle'))

useHead({
  title: t('investments.pageTitle'),
})

const router = useRouter()
const route = useRoute()
const modalOpen = ref(false)
const modalItem = ref<object>({})
const editPrice = ref(false)
const editDate = ref(false)

const currentProjectId = computed({
  get: () => {
    return (route.query?.project as string) ?? ''
  },
  set: (value) => {
    const query = {
      project: value,
    }
    router.push({ query })
  },
})

const currentInvestmentClosedAt = computed(() => {
  const projectAttributes = project.value?.attributes ? project.value.attributes : []
  const investmentCloseValueObj = projectAttributes.find((item: any) => {
    return item.attribute_key === 'investment_closed_at'
  })
  return investmentCloseValueObj?.value ? investmentCloseValueObj : null
})

const currentInvestmentPricePerUnit = computed(() => {
  const projectAttributes = project.value?.attributes ? project.value.attributes : []
  const investmentPricePerUnit = projectAttributes.find((item: any) => {
    return item.attribute_key === 'price_per_unit'
  })
  return investmentPricePerUnit?.value ? investmentPricePerUnit : null
})

const columns = {
  term: {
    label: t('investments.columnName.term') + ' (' + t('investments.monthCount') + ')',
  },
  percent: {
    label: t('investments.columnName.percent'),
    align: 'center',
  },
  earlyReturn: {
    label: t('investments.columnName.earlyReturn'),
    align: 'center',
  },
  status: {
    label: t('investments.columnName.status'),
    align: 'center',
  },
  actions: {
    label: t('investments.columnName.actions'),
    align: 'end',
  },
} as const

watch(currentProjectId, async () => {
  if (currentProjectId.value) {
    loading.value = true
    loadingList.value = true
    await fetchProject()
    await fetchInvestements()
  }
})

const fetchProject = async () => {
  try {
    const { data: data } = await objectsStore.fetchProject(currentProjectId.value)
    project.value = data.length ? data[0] : []
  } finally {
    loading.value = false
    editPrice.value = false
    editDate.value = false
  }
}

const fetchInvestements = async () => {
  loadingList.value = true
  try {
    const { data: data } = await investementsStore.fetchProjectInvestements(
      currentProjectId.value
    )
    investmentsList.value = data?.items ? data.items : []
  } finally {
    loadingList.value = false
  }
}

const updateStatus = async (item: Object) => {
  const currentRow = item

  if (currentRow.status === 'ACTIVE') {
    item.status = 'NOT_ACTIVE'
  } else {
    item.status = 'ACTIVE'
  }

  await saveOption(item)
}

const saveOption = async (item: Object) => {
  modalOpen.value = false
  modalItem.value = {}

  const formData = new FormData()
  formData.append('project_id', currentProjectId.value)
  Object.entries(item).forEach(([key, value]) => {
    formData.append(key, value)
    if (key === 'return_option') {
      formData.append(key, value ? '1' : '0')
    }
  })
  notif.dismissAll()
  if (item.id) {
    await investementsStore.updateProjectInvestement(
      currentProjectId.value,
      item.id,
      formData
    )
    notif.success('Опцію оновлено')
    await fetchInvestements()
  } else {
    formData.append('status', 'ACTIVE')
    const { data: result } = await investementsStore.createProjectInvestement(
      currentProjectId.value,
      formData
    )
    if (result?.id) {
      investmentsList.value.push(result)
    }
    notif.success('Опцію сворено')
    await fetchInvestements()
  }
}

const removeRow = async (id: String) => {
  btnLoading.value = true
  try {
    await investementsStore.deleteProjectInvestement(currentProjectId.value, id)
    notif.success('Опцію видалено')
  } finally {
    btnLoading.value = false
  }
  await fetchInvestements()
}

onMounted(async () => {
  const { data: data } = await objectsStore.fetchProjects()
  projects.value = await data.items.filter((item: Object) => {
    return item.status !== 'ARCHIVED' && item.project_type === 'real_estate_project'
  })

  if (projects.value.length) {
    if (currentProjectId.value) {
      await fetchProject()
      await fetchInvestements()
    } else {
      const listOfProjects = projects.value
      const query = {
        project: listOfProjects[0].id,
      }
      await router.push({ query })
    }
  }
})
</script>

<template>
  <div class="page-content">
    <VLoader size="large" :active="loading" class="loader-top py-2">
      <VFlex
        align-items="center"
        flex-wrap="wrap"
        column-gap="25px"
        row-gap="25px"
        class="m-b-25"
      >
        <VFlexItem flex-basis="50%" flex-grow="1"
          ><h2 v-if="project.title" class="title is-4">
            {{ t('investments.pageProjectTitle') }} "{{ project.title }}"
          </h2>
          <h3
            v-if="currentInvestmentClosedAt"
            class="title is-6 is-flex is-align-items-center"
          >
            <span class="p-r-10">{{ t('investments.dateEnd') }}</span>
            <span
              v-if="!editDate"
              class="investement-date p-l-10 is-flex is-align-items-center"
              >{{ dayjs(currentInvestmentClosedAt.value).format('DD.MM.YYYY') }}
              <a
                class="is-flex is-align-items-center p-l-10"
                tabindex="0"
                @click="editDate = true"
              >
                <i
                  class="iconify is-inline ml-1"
                  data-icon="feather:edit"
                  role="img"
                  aria-label="edit-3"
                ></i> </a
            ></span>
            <InvestmentEditForm
              v-else
              :item-value="currentInvestmentClosedAt"
              type="date"
              @save="editDate = false"
              @close="editDate = false"
            />
          </h3>
          <div
            v-if="currentInvestmentPricePerUnit"
            class="title is-6 is-flex is-align-items-center"
          >
            <span class="p-r-10">{{ t('investments.pricePerUnit') }}</span>
            <span
              v-if="!editPrice"
              class="investement-date p-l-10 is-flex is-align-items-center"
              >{{ currentInvestmentPricePerUnit.value }} UAH
              <a
                class="is-flex is-align-items-center p-l-10"
                tabindex="0"
                @click="editPrice = true"
              >
                <i
                  class="iconify is-inline ml-1"
                  data-icon="feather:edit"
                  role="img"
                  aria-label="edit-3"
                ></i> </a
            ></span>
            <InvestmentEditForm
              v-else
              :item-value="currentInvestmentPricePerUnit"
              type="price"
              @save="editPrice = false"
              @close="editPrice = false"
            /></div
        ></VFlexItem>
        <VFlexItem>
          <VFlex align-items="center" column-gap="25px">
            <VField class="mb-0">
              <VControl>
                <VSelect v-model="currentProjectId" class="is-rounded">
                  <VOption
                    v-for="project in projects"
                    :key="project.id"
                    :value="project.id"
                  >
                    {{ project.title }}
                  </VOption>
                </VSelect>
              </VControl>
            </VField>
            <VButton color="primary" rounded raised @click="modalOpen = true">
              {{ t('investments.addInvestment') }}
            </VButton>
          </VFlex>
        </VFlexItem>
      </VFlex>
    </VLoader>
    <!-- Create/Edit Modal-->
    <VModal
      v-if="modalOpen"
      :open="modalOpen"
      :title="
        modalItem?.id ? t('investments.editInvestment') : t('investments.addInvestment')
      "
      class-name="investmentModal"
      @close=";(modalOpen = false), (modalItem = {})"
    >
      <template #content
        ><InvestmentModalForm
          :item="modalItem"
          @close=";(modalOpen = false), (modalItem = {})"
          @save="saveOption($event)"
      /></template>
    </VModal>
    <div v-if="loadingList" class="m-t-80">
      <VPlaceload v-for="i in 4" :key="i" height="50px" width="100%" class="mb-4" />
    </div>
    <div v-else-if="investmentsList.length && !loadingList" class="columns is-multiline">
      <div class="column is-12 m-t-25">
        <VFlexTable :data="investmentsList" :columns="columns" rounded>
          <template #body-cell="{ row, column }">
            <template v-if="column.key === 'term'">
              {{ row.term_months }}
            </template>
            <template v-if="column.key === 'percent'">
              {{ row.percent }}
            </template>
            <template v-if="column.key === 'earlyReturn'">
              <span v-if="row.return_option">{{ t('investments.yes') }}</span>
              <span v-else>{{ t('investments.no') }}</span>
            </template>
            <template v-if="column.key === 'status'">
              <VTag
                :color="
                  row.status === 'ACTIVE'
                    ? 'success'
                    : row.status === 'NOT_ACTIVE'
                    ? 'danger'
                    : 'solid'
                "
                :label="
                  row.status === 'ACTIVE'
                    ? t('investments.ACTIVE')
                    : row.status === 'NOT_ACTIVE'
                    ? t('investments.NOT_ACTIVE')
                    : t('investments.ARCHIVED')
                "
                curved
                outlined
                class="col-status"
              />
            </template>
            <template v-if="column.key === 'actions'">
              <VFlex column-gap="20px">
                <VIconButton
                  v-if="row.status !== 'ARCHIVED'"
                  color="info"
                  outlined
                  raised
                  icon="feather:edit-2"
                  @click=";(modalItem = row), (modalOpen = true)"
                />
                <VIconButton
                  color="danger"
                  outlined
                  raised
                  icon="feather:trash-2"
                  :loading="btnLoading"
                  @click="removeRow(row.id)"
                />
                <VField
                  v-if="row.status !== 'ARCHIVED'"
                  class="switch-field m-l-5 status-switch"
                >
                  <VControl @change.prevent="updateStatus(row)">
                    <VSwitchBlock thin color="info" :checked="row.status === 'ACTIVE'" />
                  </VControl>
                </VField>
              </VFlex>
            </template>
          </template>
        </VFlexTable>
      </div>
    </div>
    <div v-else>
      <h2 class="title is-6 p-t-25 empty-label">{{ t('investments.dataEmpty') }}</h2>
    </div>
  </div>
</template>

<style lang="scss">
.investement-date {
  color: var(--primary);
}
.empty-label {
  color: var(--danger);
}

.investmentModal {
  .modal-card-foot {
    display: none;
  }

  .modal-card-body {
    border-bottom-left-radius: var(--radius-large);
    border-bottom-right-radius: var(--radius-large);
  }
}
.col-status {
  border: none !important;
  font-weight: 700;
  font-size: 14px !important;
}
.loader-bottom {
  min-height: 100px;
}
.loader-bottom {
  min-height: 300px;
}
.status-switch {
  display: flex;
  align-items: center;
}
</style>
