<route lang="yaml">
meta:
requiresAuth: true
</route>

<script setup lang="ts">
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle(t('apartments.title'))
</script>

<template>
  <SideblockLayout open-on-mounted nowrap default-sideblock="true">
    <!-- Content Wrapper -->

    <template #subSideBar>
      <ApartmentsSubsidebar />
    </template>

    <RouterView v-slot="{ Component }">
      <Transition name="translate-page-x" mode="out-in">
        <div><component :is="Component" /></div>
      </Transition>
    </RouterView>
  </SideblockLayout>
</template>
