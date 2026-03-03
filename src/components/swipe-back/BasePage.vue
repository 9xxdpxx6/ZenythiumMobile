<template>
  <!-- ion-page must be root for Ionic Router to work correctly -->
  <ion-page
    class="swipe-back-page swipe-back-container"
    :style="{ transform: `translateX(${translateX}px)` }"
    :class="{ 'swiping': isSwiping, 'completing': isCompleting }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Lightweight skeleton behind current page during swipe-back (no real component mount) -->
    <Teleport to="body">
      <div
        v-if="shouldRenderPreviousPage"
        class="swipe-back-previous-page"
        :style="{ opacity: previousPageOpacity, transform: `translateX(${previousPageTranslateX}px)` }"
        :class="{ 'completing': isCompleting }"
      >
        <div class="swipe-back-skeleton">
          <div class="swipe-back-skeleton-header"></div>
          <div class="swipe-back-skeleton-body">
            <div class="swipe-back-skeleton-line title"></div>
            <div class="swipe-back-skeleton-line subtitle"></div>
            <div class="swipe-back-skeleton-card"></div>
            <div class="swipe-back-skeleton-card short"></div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Current page content -->
    <slot />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, toValue, Teleport } from 'vue';
import { useRoute } from 'vue-router';
import { IonPage } from '@ionic/vue';
import { useSwipeBack, type UseSwipeBackOptions } from '@/composables';

interface Props {
  // Allow local override of swipe-back options
  swipeBackOptions?: UseSwipeBackOptions;
}

const props = defineProps<Props>();
const route = useRoute();

// Check if swipe-back is disabled for this route
const isSwipeBackDisabled = computed(() => {
  // Disable for tabs pages (they have their own swipe navigation)
  if (route.path.startsWith('/tabs/')) {
    return true;
  }
  // Disable if explicitly set in meta
  return route.meta?.disableSwipeBack === true;
});

// Use swipe-back composable (will be disabled if meta says so)
const swipeBackOptions = computed<UseSwipeBackOptions>(() => {
  const baseOptions = props.swipeBackOptions || {};
  return {
    ...baseOptions,
    enabled: !isSwipeBackDisabled.value && (baseOptions.enabled !== false),
  };
});

const {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  translateX,
  isSwiping,
  isCompleting,
  previousPageComponent,
  previousPageTranslateX,
  shouldRenderPreviousPage,
  previousPageOpacity,
} = useSwipeBack(toValue(swipeBackOptions));
</script>

<style>
/* ── Swipe-back skeleton (global because it's inside Teleport to body) ── */
.swipe-back-skeleton {
  width: 100%;
  height: 100%;
  background: var(--ion-background-color, #1a1a2e);
  display: flex;
  flex-direction: column;
}

.swipe-back-skeleton-header {
  height: 56px;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.swipe-back-skeleton-body {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.swipe-back-skeleton-line {
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.07);
}

.swipe-back-skeleton-line.title {
  width: 55%;
  height: 22px;
}

.swipe-back-skeleton-line.subtitle {
  width: 70%;
  height: 14px;
}

.swipe-back-skeleton-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  height: 90px;
}

.swipe-back-skeleton-card.short {
  height: 60px;
  width: 80%;
}
</style>

