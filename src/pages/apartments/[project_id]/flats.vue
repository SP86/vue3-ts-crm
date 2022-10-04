<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { BuildingData } from '/@src/pages/apartments/[project_id]/buildings.vue'
import { LayoutData } from '/@src/pages/apartments/[project_id]/layouts.vue'

const api = useApi()
const route = useRoute()
const { t } = useI18n()

useHead({
  title: t('apartments.flats.title'),
})

export interface FlatsData {
  id: number | null
  plan: object
  rooms?: number
  price_per_unit?: string
  square?: string
  floors?: string
  available_items?: number
  status?: string
  imageObject?: object | null
  building_id: string
  currency?: string
}

const flats = ref<FlatsData[]>([])
const buildings = ref<BuildingData[]>([])
const layouts = ref<LayoutData[]>([])
const rooms = ref([])
const deleteItem = ref<FlatsData>()
const editItem = ref<FlatsData>()
const loading = ref<boolean>(true)

const fetchData = async () => {
  flats.value = []
  loading.value = true
  const { data: dataFlats } = await api.get(
    `/api/v1/project/${route.params.project_id}/te-investment-item`
  )
  flats.value = dataFlats.items
  flats.value.forEach(async (flat: FlatsData) => {
    flat.imageObject = await getImageObject(flat.plan.file_path)
  })

  //get unique rooms for filter
  rooms.value = [...new Set(flats.value.map((flat: FlatsData) => flat.rooms))]

  const { data: dataBuildings } = await api.get(
    `/api/v1/project/${route.params.project_id}/building`
  )
  buildings.value = dataBuildings.items

  const { data: dataLayouts } = await api.get(
    `/api/v1/plan?project_id=${route.params.project_id}`
  )
  layouts.value = dataLayouts.items
  loading.value = false
}

const filteredFlats = computed(() => {
  const newFlats = flats.value.filter((flat) => {
    const matchBuilding = route.query.building
      ? flat.building_id === route.query.building
      : true
    const matchPlan = route.query.plan ? flat.plan.id === route.query.plan : true
    const matchRoom = route.query.room ? flat.rooms == route.query.room : true
    return matchBuilding && matchPlan && matchRoom
  })
  return newFlats
})

watch(
  () => route.params.project_id,
  () => {
    if (route.params.project_id) fetchData()
  }
)
fetchData()

const columns = {
  plan: t('apartments.flats.fields.plan'),
  rooms: { label: t('apartments.flats.fields.rooms'), align: 'center' },
  price_per_unit: { label: t('apartments.flats.fields.pricePerUnit'), align: 'center' },
  square: { label: t('apartments.flats.fields.square'), align: 'center' },
  floors: { label: t('apartments.flats.fields.floors'), align: 'center' },
  available_items: {
    label: t('apartments.flats.fields.available_items'),
    align: 'center',
  },
  status: { label: t('apartments.flats.fields.status'), align: 'center' },
  actions: {
    label: '',
    align: 'end',
  },
} as const

const addBuilding = () => {
  editItem.value = {
    id: null,
    rooms: undefined,
    building_id: '',
    square: '',
    floors: '',
    available_items: undefined,
    status: '',
    plan: { id: '' },
    currency: '',
  }
}
const deleteBuilding = async () => {
  await api.delete(
    `/api/v1/project/${route.params.project_id}/investment-item/${deleteItem.value.id}`
  )
  deleteItem.value = undefined
  await fetchData()
}

const changeStatus = async (item: FlatsData) => {
  await api.put(`/api/v1/project/${route.params.project_id}/investment-item/${item.id}`, {
    status: item.status === 'ACTIVE' ? 'NOT_ACTIVE' : 'ACTIVE',
  })
  await fetchData()
}

const getImageObject = async (url: string) => {
  const img = new Image()
  await new Promise((resolve) => {
    img.addEventListener('load', resolve)
    img.src = url
  })
  return [
    {
      src: url,
      thumbnail: url,
      w: img.naturalWidth,
      h: img.naturalHeight,
    },
  ]
}
</script>

<template>
  <div class="page-content flats">
    <div class="is-flex is-justify-content-end mb-6">
      <VButton color="primary" rounded raised @click="addBuilding">
        {{ t('apartments.flats.add') }}
      </VButton>
    </div>
    <FlatsFilter :buildings="buildings" :plans="layouts" :rooms="rooms" />
    <div class="flex-list-wrapper flex-list-v2">
      <div v-if="loading" class="m-t-40">
        <VPlaceload v-for="i in 4" :key="i" height="60px" width="100%" class="mb-4" />
      </div>
      <VFlexTable v-else-if="filteredFlats.length" :columns="columns" rounded>
        <template #body>
          <div v-for="item in filteredFlats" :key="item.id" class="flex-table-item">
            <VFlexTableCell>
              <span class="light-text">
                <FotoView :items="item.imageObject" :title="item.plan.title" />
              </span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <span class="">{{ item.rooms }}</span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <span class="">{{ item.price_per_unit }}</span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <span class="">{{ item.square }}</span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <span class="">{{ item.floors }}</span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <span class="">{{ item.available_items }}</span>
            </VFlexTableCell>
            <VFlexTableCell class="cell-center">
              <VTag
                class="flat-status has-text-centered"
                :color="item.status === 'ACTIVE' ? 'success' : 'danger'"
                curved
                outlined
                >{{ t(`apartments.status.${item.status}`) }}</VTag
              >
            </VFlexTableCell>
            <VFlexTableCell :column="{ align: 'end' }">
              <VControl class="m-r-20" @change.prevent="changeStatus(item)">
                <VSwitchBlock thin color="info" :checked="item.status === 'ACTIVE'" />
              </VControl>
              <VDropdown
                class="is-pushed-mobile"
                icon="feather:more-vertical"
                spaced
                right
              >
                <template #content>
                  <a
                    role="menuitem"
                    href="#"
                    class="dropdown-item is-media"
                    @click.prevent="editItem = item"
                  >
                    <div class="icon">
                      <i aria-hidden="true" class="lnil lnil-pencil"></i>
                    </div>
                    <div class="meta">
                      <span>{{ t('apartments.flats.edit') }}</span>
                    </div>
                  </a>

                  <a
                    role="menuitem"
                    href="#"
                    class="dropdown-item is-media"
                    @click.prevent="deleteItem = item"
                  >
                    <div class="icon">
                      <i aria-hidden="true" class="lnil lnil-trash-can-alt"></i>
                    </div>
                    <div class="meta">
                      <span>{{ t('apartments.flats.delete') }}</span>
                    </div>
                  </a>
                </template>
              </VDropdown>
            </VFlexTableCell>
          </div>
        </template>
      </VFlexTable>
      <h3 v-else class="is-size-3 m-t-80">{{ t('apartments.flats.empty') }}</h3>
    </div>

    <!--Edit Modal-->
    <VModal
      v-if="!!editItem"
      :open="!!editItem"
      :title="editItem.id ? t('apartments.flats.edit') : t('apartments.flats.add')"
      class-name="buildingModal"
      cancel-label="cancel"
      @close="editItem = null"
    >
      <template #content>
        <FlatEditor
          :buildings="buildings"
          :plans="layouts"
          :item="editItem"
          @close="editItem = undefined"
          @save="fetchData"
        />
      </template>
    </VModal>

    <!--Delete Modal-->
    <VModal
      :open="!!deleteItem"
      :title="t('apartments.flats.deleteBuilding')"
      actions="center"
      :cancel-label="t('cancelLabel')"
      @close="deleteItem = null"
    >
      <template #content>
        <div class="is-size-4 has-text-centered">{{ t('news.deleteConfirm') }}</div>
      </template>
      <template #action>
        <VButton color="danger" raised @click="deleteBuilding">Видалити</VButton>
      </template>
    </VModal>
  </div>
</template>

<style lang="scss">
.flats {
  .flat-status {
    border: none !important;
    font-weight: 700;
    font-size: 14px !important;
  }
}
.buildingModal {
  .modal-card-foot {
    display: none;
  }

  .modal-card-body {
    border-bottom-left-radius: var(--radius-large);
    border-bottom-right-radius: var(--radius-large);
  }
}
</style>
