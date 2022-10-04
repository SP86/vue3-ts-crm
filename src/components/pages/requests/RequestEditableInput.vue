<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  edit: { type: Boolean, default: false },
  modelValue: { type: [String, Object, Number], default: '' },
  suffix: { type: String, default: '' },
  error: { type: String, default: '' },
  type: { type: String, default: 'text' },
  editable: { type: Boolean, default: false },
})

const isEditing = ref<boolean>(false)
const emits = defineEmits(['update:modelValue', 'edit'])
const value = computed({
  get: () => props.modelValue,
  set: (val) => {
    emits('update:modelValue', val)
    return val
  },
})
const onClickEdit = () => {
  isEditing.value = true
  emits('edit')
}
watch(
  () => props.edit,
  () => {
    if (!props.edit) {
      isEditing.value = false
    }
  }
)
</script>

<template>
  <VField :label="title" horizontal class="request-editable-field">
    <span v-if="!isEditing">{{ value }}</span>
    <VControl v-show="isEditing">
      <VInput v-model="value" :type="type" class="is-info-focus" />
      <p class="help is-danger">
        {{ error }}
      </p>
    </VControl>
    &nbsp;<span v-html="suffix" />

    <VButton
      v-if="editable && !isEditing"
      class="editBtn"
      color="success"
      @click="onClickEdit"
    >
      <i class="iconify" data-icon="feather:edit-3" aria-hidden="true"></i>
    </VButton>
  </VField>
</template>
<style lang="scss">
.request-editable-field {
  position: relative;
  min-height: 33px;
  &.field:not(:last-child) {
    margin-bottom: 0;
  }
  .editBtn {
    position: absolute;
    right: 0;
    top: 50%;
    padding: 0;
    width: 30px;
    height: 30px;
    transform: translateY(-50%);
  }
  .field.is-horizontal {
    align-items: center;
  }
  .field-label {
    min-width: 80px;
    text-align: left;
  }
  .field-body {
    align-items: center;
  }

  .input {
    height: auto;
    padding: 3px 10px;
  }
}
</style>
