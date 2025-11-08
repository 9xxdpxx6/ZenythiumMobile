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
    <!-- Previous page (rendered behind current page during swipe) -->
    <!-- Use Teleport to render outside ion-page to avoid nested ion-page issues -->
    <Teleport to="body">
      <div
        v-if="shouldRenderPreviousPage && previousPageComponent"
        class="swipe-back-previous-page"
        :style="{ opacity: previousPageOpacity, transform: `translateX(${previousPageTranslateX}px)` }"
        :class="{ 'completing': isCompleting }"
      >
        <component
          :is="previousPageComponent"
          :key="`previous-${route.path}`"
        />
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

<style scoped>
/* Styles are in global swipe-back.css */
</style>

