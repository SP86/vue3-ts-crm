<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'

import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import sleep from '/@src/utils/sleep'

import { toFormValidator } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z as zod } from 'zod'

const { t } = useI18n()
// Define a validation schema
const validationSchema = toFormValidator(
  zod.object({
    login: zod.string().nonempty(t('auth.errors.login.required')),
    password: zod.string().nonempty(t('auth.errors.password.required')),
  })
)

const { handleSubmit } = useForm({
  validationSchema,
  initialValues: {
    login: '',
    password: '',
  },
})

const isLoading = ref(false)
const router = useRouter()
const route = useRoute()
const notif = useNotyf()
const userSession = useUserSession()
const redirect = route.query.redirect as string

const handleLogin = handleSubmit(async (values) => {
  if (!isLoading.value) {
    isLoading.value = true
    try {
      const loginTenant = await userSession.loginTenant(values.login, values.password)
      if (loginTenant.data && loginTenant.data.token) {
        userSession.setToken(loginTenant.data.token)
        notif.dismissAll()
        notif.success(t('auth.successAuth'))
        if (redirect) {
          router.push(redirect)
        } else {
          router.push({
            name: 'requests',
          })
        }
      }
    } finally {
      isLoading.value = false
    }
  }
})

useHead({
  title: t('sectionsTitles.auth'),
})

onMounted(async () => {
  await userSession.logoutUser()
})
</script>

<template>
  <div class="auth-wrapper-inner is-single">
    <!--Single Centered Form-->
    <div class="single-form-wrap">
      <div class="inner-wrap">
        <!--Form Title-->
        <div class="auth-head">
          <h2>SMART<strong>BRICK</strong></h2>
        </div>

        <!--Form-->
        <div class="form-card">
          <form @submit.prevent="handleLogin">
            <div class="login-form">
              <VField id="login" v-slot="{ field }">
                <VControl icon="feather:user">
                  <VInput
                    type="text"
                    :placeholder="t('auth.placeholder.login')"
                    autocomplete="login"
                    class="is-rounded is-info-focus"
                  />
                  <p v-if="field?.errorMessage" class="help is-danger">
                    {{ field.errorMessage }}
                  </p>
                </VControl>
              </VField>
              <VField id="password" v-slot="{ field }">
                <VControl icon="feather:lock">
                  <VInput
                    type="password"
                    :placeholder="t('auth.placeholder.password')"
                    autocomplete="current-password"
                    class="is-rounded is-info-focus"
                  />
                  <p v-if="field?.errorMessage" class="help is-danger">
                    {{ field.errorMessage }}
                  </p>
                </VControl>
              </VField>

              <!-- Submit -->
              <div class="login">
                <VButton
                  :loading="isLoading"
                  type="submit"
                  color="primary"
                  bold
                  fullwidth
                  raised
                  rounded
                >
                  {{ t('auth.action.signin') }}
                </VButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
