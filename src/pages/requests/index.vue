<script lang="ts">
import 'dragula/dist/dragula.css'
</script>

<script async setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref, reactive } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useRouter, useRoute } from 'vue-router'
import dragula from 'dragula'
import { formatDate } from '/@src/utils/date'

const { t } = useI18n()
const api = useApi()
const route = useRoute()
const router = useRouter()

const CREATED_container = ref<HTMLElement>()
const IN_PROGRESS_container = ref<HTMLElement>()
const WAIT_FOR_PAYMENT_container = ref<HTMLElement>()
const REJECTED_container = ref<HTMLElement>()
const ACTIVE_container = ref<HTMLElement>()

const closeRequest = () => {
  router.push({ query: { ...route.query, id: undefined } })
}

const openRequest = (id: String) => {
  router.push({ query: { ...route.query, id: id } })
}

const breadcrumbs = [
  {
    hideLabel: true,
    icon: 'feather:home',
    to: { name: 'index' },
  },
  {
    label: t('sectionsTitles.requests'),
  },
]

const requests = reactive({
  CREATED: [],
  IN_PROGRESS: [],
  WAIT_FOR_PAYMENT: [],
  REJECTED: [],
  ACTIVE: [],
})

const fetchData = async () => {
  const { data: data } = await api.get(`/api/v1/investment-request`, {
    params: route.query,
  })
  Object.keys(requests).forEach((key: string) => {
    requests[key] = data.items_by_status[key] ? data.items_by_status[key] : []
  })
}

fetchData()

const currentRequest = computed({
  get: () => {
    const id = route.query.id
    let request = undefined
    if (id) {
      Object.keys(requests).some((key: string) => {
        request = requests[key].find((el: object) => el.id === id)
        return !!request
      })
    }
    if (!request) closeRequest()
    return request
  },
  set: (updatedRequest) => {
    let requestIndex = requests.IN_PROGRESS.findIndex(
      (el: object) => el.id === updatedRequest.id
    )
    requests.IN_PROGRESS.splice(requestIndex, 1, updatedRequest)
    return updatedRequest
  },
})

onMounted(async () => {
  if (
    CREATED_container.value &&
    IN_PROGRESS_container.value &&
    WAIT_FOR_PAYMENT_container.value &&
    REJECTED_container.value &&
    ACTIVE_container.value
  ) {
    const drake = dragula(
      [
        CREATED_container.value,
        IN_PROGRESS_container.value,
        WAIT_FOR_PAYMENT_container.value,
        REJECTED_container.value,
        ACTIVE_container.value,
      ],
      {
        //copySortSource: true,
        // invalid: (el) => {
        //   const _el = el as HTMLElement
        //
        //   if (_el) {
        //     if (_el.classList.contains('kanban-card')) {
        //       const id = _el.dataset.id
        //
        //       // if (id) {
        //       //   const task = requests.find((task) => {
        //       //     return task.id === id
        //       //   })
        //       //
        //       //   if (task) {
        //       //     return task.state === 'completed'
        //       //   }
        //       // }
        //     }
        //
        //     return _el.classList.contains('kanban-empty')
        //   }
        //
        //   return true
        // },
      }
    )

    drake.on('drop', (el, target, source, sibling) => {
      const _target = target as HTMLElement
      const _el = el as HTMLElement
      const _source = source as HTMLElement
      const _sibling = sibling as HTMLElement

      if (_el && _target) {
        const id = _el.dataset.id
        const target = _target.dataset.state
        const source = _source.dataset.state
        const sibling_id = _sibling ? _sibling.dataset.id : null

        if (id && target) {
          const dropedElementIndex = requests[source].findIndex(
            (el: { id: string }) => el.id === id
          )
          const dropedElement = requests[source].splice(dropedElementIndex, 1)[0]
          api
            .put(`/api/v1/investment-request/${id}`, {
              status: target,
            })
            .then((resp) => {
              if (sibling_id) {
                const targetPosition = requests[target].findIndex(
                  (el: { id: string }) => el.id === sibling_id
                )
                requests[target].splice(targetPosition, 0, resp.data)
              } else {
                requests[target].push(resp.data)
              }
            })
            .catch((error) => {
              requests[source].splice(dropedElementIndex, 0, dropedElement)
            })
        }
      }
      drake.cancel(true)
    })
  }
})
</script>

<template>
  <div class="page-content-inner requests-page">
    <VBreadcrumb with-icons separator="bullet" :items="breadcrumbs" />
    <RequestsFilter @update="fetchData" />

    <VPageContent class="kanban-content">
      <div class="columns is-kanban-wrapper">
        <div class="column is-one-fifth">
          <div class="kanban-column can-drag">
            <div class="column-title">
              <h3>
                {{ t('requests.requestStatus.CREATED') }} ({{ requests.CREATED.length }})
              </h3>
            </div>
            <div ref="CREATED_container" data-state="CREATED" class="drop-area">
              <RequestCard
                v-for="task in requests.CREATED"
                :key="task.id"
                :data-id="task.id"
                :request="task"
                @click="openRequest(task.id)"
              />
            </div>
          </div>
        </div>

        <div class="column is-one-fifth">
          <div class="kanban-column can-drag">
            <div class="column-title">
              <h3>
                {{ t('requests.requestStatus.IN_PROGRESS') }} ({{
                  requests.IN_PROGRESS.length
                }})
              </h3>
            </div>
            <div ref="IN_PROGRESS_container" data-state="IN_PROGRESS" class="drop-area">
              <RequestCard
                v-for="task in requests.IN_PROGRESS"
                :key="task.id"
                :data-id="task.id"
                :request="task"
                @click="openRequest(task.id)"
              />
            </div>
          </div>
        </div>

        <div class="column is-one-fifth">
          <div class="kanban-column can-drag">
            <div class="column-title">
              <h3>
                {{ t('requests.requestStatus.WAIT_FOR_PAYMENT') }} ({{
                  requests.WAIT_FOR_PAYMENT.length
                }})
              </h3>
            </div>
            <div
              ref="WAIT_FOR_PAYMENT_container"
              data-state="WAIT_FOR_PAYMENT"
              class="drop-area"
            >
              <RequestCard
                v-for="task in requests.WAIT_FOR_PAYMENT"
                :key="task.id"
                :data-id="task.id"
                :request="task"
                @click="openRequest(task.id)"
              />
            </div>
          </div>
        </div>

        <div class="column is-one-fifth">
          <div class="kanban-column can-drag">
            <div class="column-title">
              <h3>
                {{ t('requests.requestStatus.REJECTED') }} ({{
                  requests.REJECTED.length
                }})
              </h3>
            </div>
            <div ref="REJECTED_container" data-state="REJECTED" class="drop-area">
              <RequestCard
                v-for="task in requests.REJECTED"
                :key="task.id"
                :data-id="task.id"
                :request="task"
                @click="openRequest(task.id)"
              />
            </div>
          </div>
        </div>

        <div class="column is-one-fifth">
          <div class="kanban-column can-drag">
            <div class="column-title">
              <h3>
                {{ t('requests.requestStatus.ACTIVE') }} ({{ requests.ACTIVE.length }})
              </h3>
            </div>
            <div ref="ACTIVE_container" data-state="ACTIVE" class="drop-area">
              <RequestCard
                v-for="task in requests.ACTIVE"
                :key="task.id"
                :data-id="task.id"
                :request="task"
                @click="openRequest(task.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </VPageContent>

    <VModal
      v-if="currentRequest"
      :open="!!currentRequest"
      :title="`${t('requests.request')}: ${currentRequest.id}   від: ${formatDate(
        currentRequest.created_at,
        'DD.MM.YYYY'
      )}`"
      size="large"
      class-name="requestModal"
      @close="closeRequest"
      cancel-label="Cancel"
    >
      <template #content>
        <RequestEditor :request="currentRequest" @update="currentRequest = $event" />
      </template>
      <!--      <template #action>-->
      <!--        <VButton color="primary" raised>Confirm</VButton>-->
      <!--      </template>-->
    </VModal>
  </div>
</template>

<style lang="scss">
.requestModal {
  .modal-card-foot {
    display: none;
  }

  .modal-card-body {
    border-bottom-left-radius: var(--radius-large);
    border-bottom-right-radius: var(--radius-large);
  }
}

.is-kanban-wrapper {
  .column {
    padding: 0.35rem !important;
  }

  .kanban-column {
    padding: 6px;
    background: #e6f0ff;
    border-radius: 8px;
    border: 1px solid var(#e6f0ff);
    display: flex;
    flex-direction: column;
    height: 100%;

    .column-title {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin-bottom: 0;
        font-family: var(--font);
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        color: #016bfb;
        opacity: 0.5;
      }

      .input {
        margin-right: 20px;
      }

      svg {
        height: 18px;
        width: 18px;
        color: var(--dark-text);
      }

      .task-count {
        padding-left: 4px;

        &::before {
          content: '(';
        }

        &::after {
          content: ')';
        }
      }

      .dropdown {
        .is-trigger {
          height: 18px;
          width: 18px;
          cursor: pointer;

          svg {
            height: 18px;
            width: 18px;
            color: var(--light-text-dark-8);
          }
        }
      }
    }
    .drop-area {
      flex: 1;
      min-height: 300px;
    }
  }
}

.can-drag {
  .kanban-card {
    // fallback if grab cursor is unsupported
    cursor: move;
    cursor: grab;
    cursor: grab;
    cursor: grab;

    // (Optional) Apply a "closed-hand" cursor during drag operation.
    &:active {
      cursor: grabbing;
    }
  }
}
</style>

