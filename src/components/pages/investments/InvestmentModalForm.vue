<script setup lang="ts">
export interface InvestItem {
  currency?: string
  percent?: number
  term_months?: number
  return_option?: boolean
}

export interface InvestItemProps {
  item: InvestItem
}

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Field, useForm, useResetForm } from 'vee-validate'
import * as yup from 'yup'

const props = withDefaults(defineProps<InvestItemProps>(), {
  item: () => ({}),
})

const itemEdit = ref<InvestItem>(props.item)

const currentCurency = 'UAH'
const schema = yup.object({
  percent: yup.string().required('Поле не може бути пустим'),
  term: yup.string().required('Поле не може бути пустим'),
})

const { handleSubmit } = useForm({
  validationSchema: schema,
})

const resetForm = useResetForm()

const { t } = useI18n()

const emit = defineEmits(['close', 'save'])

const closeForm = () => {
  resetForm()
  emit('close')
}

const saveForm = handleSubmit(async () => {
  resetForm()
  emit('save', itemEdit.value)
})

onMounted(() => {
  if (
    (itemEdit.value?.return_option && itemEdit.value.return_option === true) ||
    itemEdit.value.return_option === false
  ) {
    itemEdit.value.return_option = itemEdit.value.return_option
  } else {
    itemEdit.value.return_option = true
  }

  if (itemEdit.value?.currency) {
    itemEdit.value.currency = itemEdit.value.currency
  } else {
    itemEdit.value.currency = currentCurency
  }
})
</script>

<template>
  <div class="m-b-5">
    <form>
      <Field v-slot="{ field, errorMessage }" v-model="itemEdit.percent" name="percent">
        <VField :label="t('investments.columnName.percent')" horizontal>
          <VControl :has-error="Boolean(errorMessage)" icon="feather:percent" fullwidth>
            <input v-bind="field" type="number" class="input is-rounded is-info-focus" />
            <p v-if="errorMessage" class="help is-danger">{{ errorMessage }}</p>
          </VControl>
        </VField>
      </Field>

      <VField :label="t('investments.columnName.currency')" horizontal>
        <VControl fullwidth>
          <div class="pt-1 p-l-5">{{ itemEdit.currency }}</div>
        </VControl>
      </VField>

      <Field v-slot="{ field, errorMessage }" v-model="itemEdit.term_months" name="term">
        <VField :label="t('investments.columnName.term')" horizontal>
          <VControl :has-error="Boolean(errorMessage)" fullwidth>
            <input v-bind="field" type="number" class="input is-rounded is-info-focus" />
            <p class="help">К-сть місяців</p>
            <p v-if="errorMessage" class="help is-danger">{{ errorMessage }}</p>
          </VControl>
        </VField>
      </Field>

      <VField :label="t('investments.columnName.earlyReturn')" horizontal>
        <VControl fullwidth>
          <VSelect v-model="itemEdit.return_option" class="is-rounded">
            <VOption :value="true">{{ t('investments.yes') }}</VOption>
            <VOption :value="false">{{ t('investments.no') }}</VOption>
          </VSelect>
        </VControl>
      </VField>
    </form>
    <div class="is-flex is-justify-content-end pt-3">
      <VButton rounded raised class="m-r-10" @click="closeForm">
        {{ t('cancelLabel') }}
      </VButton>
      <VButton color="primary" rounded raised @click="saveForm">
        {{ t('saveLabel') }}
      </VButton>
    </div>
  </div>
</template>
