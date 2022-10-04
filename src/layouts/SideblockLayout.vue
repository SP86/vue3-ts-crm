<script setup lang="ts">
import { ref, watchPostEffect, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import type { SideblockTheme } from '/@src/components/navigation/desktop/Sideblock.vue'
import { usePanels } from '/@src/stores/panels'
import { useViewWrapper } from '/@src/stores/viewWrapper'

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    theme?: SideblockTheme
    defaultSideblock?: string
    closeOnChange?: boolean
    openOnMounted?: boolean
    nowrap?: boolean
  }>(),
  {
    defaultSideblock: '',
    theme: 'default',
  }
)

const viewWrapper = useViewWrapper()
const panels = usePanels()
const route = useRoute()
const openSideblockLinks = ref('')
const isMobileSideblockOpen = ref(false)
const isDesktopSideblockOpen = ref(props.openOnMounted)
const activeMobileSubsidebar = ref(props.defaultSideblock)

const activeSubsidebar = ref(null)

/**
 * watchPostEffect callback will be executed each time dependent reactive values has changed
 */
watchPostEffect(() => {
  viewWrapper.setPushedBlock(isDesktopSideblockOpen.value ?? false)
})
onMounted(() => {
  viewWrapper.setPushed(false)
})
watch(
  () => route.fullPath,
  () => {
    isMobileSideblockOpen.value = false

    if (props.closeOnChange && isDesktopSideblockOpen.value) {
      isDesktopSideblockOpen.value = false
    }
  }
)
</script>

<template>
  <div class="sidebar-layout">
    <div class="app-overlay"></div>

    <!-- Mobile navigation -->
    <MobileNavbar
      :is-open="isMobileSideblockOpen"
      @toggle="isMobileSideblockOpen = !isMobileSideblockOpen"
    >
      <template #brand>
        <RouterLink :to="{ name: 'index' }" class="navbar-item is-brand">
          <!-- <AnimatedLogo width="38px" height="38px" /> -->
        </RouterLink>

        <div class="brand-end">
          <UserProfileDropdown />
        </div>
      </template>
    </MobileNavbar>

    <!-- Mobile sidebar links -->
    <MobileSidebar
      :is-open="isMobileSideblockOpen"
      @toggle="isMobileSideblockOpen = !isMobileSideblockOpen"
    >
      <template #links>
        <li>
          <RouterLink :to="{ name: 'users' }">
            <i aria-hidden="true" class="iconify" data-icon="feather:users"></i>
          </RouterLink>
        </li>
        <li>
          <a
            :class="[activeMobileSubsidebar === 'projects' && 'is-active']"
            aria-label="Display objects content"
            tabindex="0"
            @keydown.space.prevent="activeMobileSubsidebar = 'projects'"
            @click="activeMobileSubsidebar = 'projects'"
          >
            <i aria-hidden="true" class="iconify" data-icon="feather:grid"></i>
          </a>
        </li>
        <li>
          <RouterLink :to="{ name: 'requests' }">
            <i aria-hidden="true" class="lnil lnil-layout-alt-1"></i>
          </RouterLink>
        </li>
      </template>
    </MobileSidebar>

    <!-- Mobile subsidebar links -->
    <Transition name="slide-x">
      <ObjectsMobileSubsidebar
        v-if="isMobileSideblockOpen && activeMobileSubsidebar === 'projects'"
      />
    </Transition>

    <Transition name="slide-x">
      <Sideblock v-if="isDesktopSideblockOpen" :theme="props.theme">
        <template #header>
          <UserProfileDropdown down class="m-t-70 p-b-25 m-b-45" />
        </template>
        <template #links>
          <li>
            <RouterLink :to="{ name: 'users' }" class="single-link">
              <span class="icon">
                <i class="lnir lnir-users" aria-hidden="true"></i>
              </span>
              {{ t('sectionsTitles.users') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'projects' }" class="single-link">
              <span class="icon">
                <i class="lnir lnir-house-alt" aria-hidden="true"></i>
              </span>
              {{ t('sectionsTitles.objects') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'apartments' }" class="single-link">
              <span class="icon">
                <i class="lnir lnir-apartment" aria-hidden="true"></i>
              </span>
              {{ t('apartments.title') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'faq' }" class="single-link">
              <span class="icon">
                <i class="lnir lnir-question-circle" aria-hidden="true"></i>
              </span>
              {{ t('faq.title') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'requests' }" class="single-link">
              <span class="icon">
                <i aria-hidden="true" class="lnil lnil-layout-alt-1"></i>
              </span>
              {{ t('sectionsTitles.requests') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'news' }" class="single-link">
              <span class="icon">
                <i class="iconify" data-icon="feather:radio" aria-hidden="true"></i>
              </span>
              {{ t('news.title') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'investments' }" class="single-link">
              <span class="icon">
                <i class="lnil lnil-wallet" aria-hidden="true"></i>
              </span>
              {{ t('investments.pageTitle') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'analytics' }" class="single-link">
              <span class="icon">
                 <i class="lnir lnir-bar-chart" aria-hidden="true"></i>
              </span>
              {{ t('analytics.pageTitle') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'user-investment' }" class="single-link">
              <span class="icon">
                <i class="lnil lnil-wallet-alt-1" aria-hidden="true"></i>
              </span>
              {{ t('userInvestment.pageTitle') }}
            </RouterLink>
          </li>
        </template>
      </Sideblock>
    </Transition>

    <Transition name="fade-slow">
      <KeepAlive>
        <ObjectsSubsidebar
          v-if="activeMobileSubsidebar && activeMobileSubsidebar === 'projects'"
          @close="isDesktopSideblockOpen = true"
        />
        <InvestmentSubsidebar
          v-else-if="activeMobileSubsidebar && activeMobileSubsidebar === 'investments'"
          @close="isDesktopSideblockOpen = true"
        />
        <slot v-else name="subSideBar" />
      </KeepAlive>
    </Transition>

    <VViewWrapper full :class="[activeMobileSubsidebar && 'inner-sidebar']">
      <VPageContentWrapper>
        <template v-if="props.nowrap">
          <slot></slot>
        </template>
        <VPageContent v-else class="is-relative">
          <div class="page-title has-text-centered">
            <!-- Sidebar Trigger -->
            <div
              class="hamburger nav-trigger push-resize"
              tabindex="0"
              @keydown.space.prevent="isDesktopSideblockOpen = !isDesktopSideblockOpen"
              @click="isDesktopSideblockOpen = !isDesktopSideblockOpen"
            >
              <span class="menu-toggle has-chevron">
                <span
                  :class="[isDesktopSideblockOpen && 'active']"
                  class="icon-box-toggle"
                >
                  <span class="rotate">
                    <i aria-hidden="true" class="icon-line-top"></i>
                    <i aria-hidden="true" class="icon-line-center"></i>
                    <i aria-hidden="true" class="icon-line-bottom"></i>
                  </span>
                </span>
              </span>
            </div>

            <div class="title-wrap">
              <h1 class="title is-4">{{ viewWrapper.pageTitle }}</h1>
            </div>
          </div>

          <slot></slot>
        </VPageContent>
      </VPageContentWrapper>
    </VViewWrapper>
  </div>
</template>
