<script setup lang="ts">
export interface Value {
  itemValue?: object | any
  type?: string
}

import { ref, reactive } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useObjectCharacteristics } from '/@src/stores/objects/objectCharacteristics'
import { useI18n } from 'vue-i18n'
import { useField, useForm, useResetForm } from 'vee-validate'

import { toFormValidator } from '@vee-validate/zod'
import * as zod from 'zod'

const objectsCharacteristicsStore = useObjectCharacteristics()

const validationSchema = toFormValidator(
  zod.object({
    itemValue: zod.string().nonempty('Поле не може бути пустим'),
  })
)

const { handleSubmit, errors } = useForm({
  validationSchema,
  initialValues: {
    itemValue: props.itemValue.value,
  },
})

const { t } = useI18n()
const resetForm = useResetForm()

const props = defineProps<Value>()
const emit = defineEmits(['close', 'save'])

const editItem = reactive({
  itemValue: useField('itemValue'),
})

const editItemDate = reactive({
  itemValue: props.itemValue.value,
})

const notif = useNotyf()
const btnLoading = ref(false)

const cancelEdit = () => {
  emit('close')
}

const validateAndSave = handleSubmit(async (values) => {
  updateData(values)
})

const updateData = async (values: Object) => {
  notif.dismissAll()
  try {
    btnLoading.value = true

    const attrubuteObj = {
      id: props.itemValue.id,
      project_id: props.itemValue.project_id,
      attribute_id: props.itemValue.attribute_id,
      attribute_key: props.itemValue.attribute_key,
      value: props.type === 'price' ? values.itemValue : editItemDate.itemValue,
    }

    await objectsCharacteristicsStore.saveCharacteristics(
      attrubuteObj,
      attrubuteObj.project_id
    )
    props.type === 'date'
      ? (props.itemValue.value = editItemDate.itemValue)
      : (props.itemValue.value = values.itemValue)

    props.type === 'price'
      ? notif.success(t('investments.pricePerUnitChangeSuccess'))
      : notif.success(t('investments.dateEndChangeSuccess'))
  } finally {
    emit('close')
    btnLoading.value = false
    resetForm()
  }
}
</script>

<template>
  <form>
    <VField v-if="props.type !== 'date'" addons>
      <VControl>
        <VInput v-model="editItem.itemValue.value" class="is-info-focus"></VInput>
        <p class="help is-danger">
          {{ errors.itemValue }}
        </p>
      </VControl>
      <VControl>
        <VIconButton
          icon="feather:check"
          color="success"
          :loading="btnLoading"
          @click="validateAndSave"
        />
      </VControl>
      <VControl>
        <VIconButton
          icon="feather:x"
          color="danger"
          :loading="btnLoading"
          @click="cancelEdit"
        />
      </VControl>
    </VField>

    <VFlex v-else align-items="center">
      <VField addons>
        <VDatePicker v-model="editItemDate.itemValue" color="green" trim-weeks>
          <template #default="{ inputValue, inputEvents }">
            <VField class="mb-0">
              <VControl>
                <VInput :value="inputValue" v-on="inputEvents" />
              </VControl>
            </VField>
          </template>
        </VDatePicker>
        <VControl>
          <VIconButton
            type="button"
            icon="feather:check"
            color="success"
            :loading="btnLoading"
            @click="updateData"
          />
        </VControl>
        <VControl>
          <VIconButton
            icon="feather:x"
            color="danger"
            :loading="btnLoading"
            @click="cancelEdit"
          />
        </VControl>
      </VField>
    </VFlex>
  </form>
</template>
