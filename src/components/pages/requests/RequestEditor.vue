<script setup lang="ts">
import { useApi } from '/@src/composable/useApi'
import { onMounted, watch, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getInitials } from '/@src/utils/users'
import { formatDate } from '/@src/utils/date'
import { useField, useForm } from 'vee-validate'
import { toFormValidator } from '@vee-validate/zod'
import * as zod from 'zod'

const api = useApi()
const { t } = useI18n()

const props = defineProps({
  request: { type: Object, required: true },
})
const emits = defineEmits(['update'])
const isEditing = ref(false)
const numberField = {
  //required_error: 'Обов’язкове поле',
  invalid_type_error: t('requests.validation.requiredNumber'),
}
let validation = {
  quantity: zod.number(numberField),
  price_per_unit: zod.number(numberField),
  percent: zod.any(),
  term_months: zod.any(),
}

if (props.request.project_type === 'real_estate_project') {
  validation = {
    ...validation,
    percent: zod
      .number(numberField)
      .min(0, t('requests.validation.lessThen', { num: 0 }))
      .max(100, t('requests.validation.moreThen', { num: 100 })),
    term_months: zod
      .number(numberField)
      .min(1, t('requests.validation.lessThen', { num: 1 }))
      .max(120, t('requests.validation.moreThen', { num: 120 })),
  }
}
const validationSchema = toFormValidator(zod.object(validation))
const { handleSubmit, errors } = useForm({
  validationSchema,
  initialValues: {
    term_months: props.request.term_months,
    quantity: props.request.quantity,
    price_per_unit: props.request.price_per_unit,
    percent: props.request.percent,
  },
})

const formFields = {
  term_months: reactive(useField('term_months')),
  quantity: reactive(useField('quantity')),
  price_per_unit: reactive(useField('price_per_unit')),
  percent: reactive(useField('percent')),
}

const setDefaults = () => {
  formFields.term_months.value = Number(props.request.term_months)
  formFields.quantity.value = Number(props.request.quantity)
  formFields.price_per_unit.value = Number(props.request.price_per_unit)
  formFields.percent.value = Number(props.request.percent)
}

const validateAndSave = await handleSubmit(async (values) => {
  api
    .put(`/api/v1/investment-request/${props.request.id}`, {
      ...values,
      status: props.request.status,
    })
    .then(({ data }) => {
      emits('update', data)
      isEditing.value = false
      setDefaults()
    })
})

const cancelEditing = () => {
  isEditing.value = false
  setDefaults()
}
watch(() => props.request, setDefaults)

onMounted(() => {
  isEditing.value = true
  setDefaults()
  isEditing.value = false
})

const newComment = ref('')
const saveComment = () => {
  api
    .post(`/api/v1/investment-request/${props.request.id}/comment`, {
      comment: newComment.value,
    })
    .then(({ data }) => {
      props.request.comments.unshift(data)
      newComment.value = ''
    })
}
const removeComment = (comment_id: number) => {
  api
    .delete(`/api/v1/investment-request/${props.request.id}/comment`, {
      params: { comment_id },
    })
    .then(() => {
      const removedIndex = props.request.comments.findIndex(
        (comment: { id: number }) => comment.id === comment_id
      )
      props.request.comments.splice(removedIndex, 1)
    })
}
</script>

<template>
  <div class="requestEditor">
    <h3 class="is-size-3 mb-2">{{ request.project_title }}</h3>
    <div class="columns">
      <div class="column is-8">
        <div class="requestInfo cardBlock p-2">
          <RequestEditableInput
            :title="t(`requests.fields.status`) + ':'"
            :model-value="t(`requests.requestStatus.${request.status}`)"
          />
          <RequestEditableInput
            v-if="request.project_type === 'meter_in_apartment'"
            :title="t(`requests.fields.planing`) + ':'"
            :model-value="request.plan_title"
          />
          <RequestEditableInput
            :title="t(`requests.fields.request_type`) + ':'"
            :model-value="t(`requests.requestsTypes.${request.request_type}`)"
          />
          <RequestEditableInput
            :title="t(`requests.fields.project_type`) + ':'"
            :model-value="t(`requests.projectsTypes.${request.project_type}`)"
          />
          <RequestEditableInput
            v-model="formFields.price_per_unit.value"
            type="number"
            :error="errors.price_per_unit"
            :editable="request.status === 'IN_PROGRESS'"
            :suffix="request.currency"
            :title="t(`requests.fields.price`) + ':'"
            :edit="isEditing"
            @edit="isEditing = true"
          />
          <RequestEditableInput
            v-model="formFields.quantity.value"
            type="number"
            :editable="request.status === 'IN_PROGRESS'"
            :suffix="
              request.project_type === 'real_estate_project' ? '' : 'м<sup>2</sup>'
            "
            :title="
              request.project_type === 'real_estate_project'
                ? t('requests.fields.quantity')
                : t('requests.fields.area')
            "
            :edit="isEditing"
            @edit="isEditing = true"
          />
          <RequestEditableInput
            v-if="request.project_type !== 'meter_in_apartment'"
            v-model="formFields.term_months.value"
            :error="errors.term_months"
            type="number"
            suffix="міс"
            :title="t(`requests.fields.term_months`) + ':'"
          />
          <RequestEditableInput
            v-if="request.project_type !== 'meter_in_apartment'"
            v-model="formFields.percent.value"
            :error="errors.percent"
            type="number"
            suffix="%"
            :title="t(`requests.fields.percent`) + ':'"
          />
          <RequestEditableInput
            :title="t(`requests.fields.total`) + ':'"
            :model-value="formFields.quantity.value * formFields.price_per_unit.value"
            :suffix="request.currency"
          />
        </div>
        <div class="is-flex is-justify-content-end pt-3 actions-row">
          <VButton v-show="isEditing" rounded raised class="mr-2" @click="cancelEditing">
            {{ t('cancelLabel') }}
          </VButton>
          <VButton
            v-show="isEditing"
            color="primary"
            rounded
            raised
            @click="validateAndSave"
          >
            {{ t('saveLabel') }}
          </VButton>
        </div>
      </div>
      <div class="column is-4">
        <RouterLink :to="`/users/${request.user.id}`" class="">
          <VFlex
            class="cardBlock p-2"
            align-items="center"
            justify-content="space-between"
          >
            <div>
              <h3>{{ request.user.first_name }} {{ request.user.last_name }}</h3>
              <span class="light-text">{{ request.user.mobile }}</span>
            </div>
            <VAvatar
              class="mr-1"
              size="small"
              :picture="request.user.photo"
              :initials="getInitials(request.user)"
            />
          </VFlex>
        </RouterLink>

        <CardIcons class="mt-5 cardBlock p-2 pt-3" :request="request" />
      </div>
    </div>
    <div class="request-comments mt-3">
      <h4 class="title is-6 is-narrow mb-2">{{ t('requests.comments') }}</h4>
      <VField addons>
        <VControl expanded>
          <VInput
            v-model="newComment"
            type="text"
            class="input is-rounded"
            placeholder="Додати коментар"
          />
        </VControl>
        <VControl>
          <VButton
            color="primary"
            rounded
            :disabled="!newComment.length"
            @click="saveComment"
          >
            Зберегти</VButton
          >
        </VControl>
      </VField>
      <div v-for="comment in request.comments" class="request-comment">
        <div class="comment-top">
          <span class="light-text">
            {{ formatDate(comment.created_at) }}
          </span>
          <VButton class="remove-btn" color="white" @click="removeComment(comment.id)">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </VButton>
        </div>
        <div class="message">{{ comment.comment }}</div>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.requestEditor {
  .actions-row {
    min-height: 50px;
  }
  .cardBlock {
    background-color: #e6f0ff;
    border-radius: 8px;
  }
  .request-comments {
    max-height: 305px;
    overflow-y: auto;
    padding-right: 20px;
  }
  .request-comment {
    background-color: #f1f2f6;
    margin-bottom: 15px;
    border-radius: 0 12px 12px;
    padding: 8px;
    padding-top: 4px;

    .comment-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }

    .remove-btn {
      width: 25px;
      height: 25px;
      padding: 8px;
      background-color: transparent;

      i {
        color: var(--primary);
      }
    }
  }
}
</style>
