<route lang="yaml">
meta:
  requiresAuth: true
</route>

<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useViewWrapper } from '/@src/stores/viewWrapper'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(t('sectionsTitles.requests'))

useHead({
  title: t('sectionsTitles.requests'),
})
</script>

<template>
  <SideblockLayout open-on-mounted nowrap>
    <RouterView v-slot="{ Component }">
      <Transition name="translate-page-x" mode="out-in">
        <div><component :is="Component" /></div>
      </Transition>
    </RouterView>
  </SideblockLayout>
</template>
