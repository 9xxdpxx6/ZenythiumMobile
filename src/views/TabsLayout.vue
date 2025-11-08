<template>
  <ion-page>
    <div 
      class="pages-container"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Current page -->
      <ion-tabs class="swipe-page current-page">
        <ion-router-outlet 
          :style="{ transform: `translateX(${translateX}px)` }" 
          :class="{ 'swiping': isSwiping, 'completing': isCompleting }"
        ></ion-router-outlet>
        <ion-tab-bar slot="bottom" class="tab-bar-with-indicator">
          <!-- Animated indicator background -->
          <div 
            class="tab-indicator" 
            :style="activeTabIndicatorStyle"
            :class="{ 'swiping': isSwiping, 'completing': isCompleting }"
          ></div>
          
          <ion-tab-button tab="cycles" href="/tabs/cycles">
            <i class="fas fa-sync-alt"></i>
          </ion-tab-button>

          <ion-tab-button tab="plans" href="/tabs/plans">
            <i class="fas fa-book"></i>
          </ion-tab-button> 

          <ion-tab-button tab="home" href="/tabs/home">
            <i class="fas fa-home"></i>
          </ion-tab-button>

          <ion-tab-button tab="workouts" href="/tabs/workouts">
            <i class="fas fa-dumbbell"></i>
          </ion-tab-button>

          <ion-tab-button tab="profile" href="/tabs/profile">
            <i class="fas fa-user"></i>
          </ion-tab-button>
      </ion-tab-bar>
      </ion-tabs>
      
      <!-- Next page (preview during swipe and completion) -->
      <component
        v-if="nextTab && (isSwiping || isCompleting)"
        :key="nextTab"
        :is="nextPageComponent"
        class="swipe-page next-page"
        :style="{ transform: `translateX(${nextPageTranslateX}px)` }"
        :class="{ 'completing': isCompleting }"
      />
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Component } from 'vue';
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
} from '@ionic/vue';
import { useTabSwipeNavigation } from '@/composables';

// Import page components
import CyclesPage from '@/views/CyclesPage.vue';
import PlansPage from '@/views/PlansPage.vue';
import HomePage from '@/views/HomePage.vue';
import WorkoutsPage from '@/views/WorkoutsPage.vue';
import ProfilePage from '@/views/ProfilePage.vue';

const PAGE_COMPONENTS: Record<string, Component> = {
  cycles: CyclesPage,
  plans: PlansPage,
  home: HomePage,
  workouts: WorkoutsPage,
  profile: ProfilePage,
};

// Tab order: cycles (0) → plans (1) → home (2) → workouts (3) → profile (4)
const TAB_ORDER = ['cycles', 'plans', 'home', 'workouts', 'profile'] as const;

type TabName = typeof TAB_ORDER[number];

const route = useRoute();
const router = useRouter();

// Get current tab from route path
const currentTab = computed(() => {
  const path = route.path;
  if (path.startsWith('/tabs/')) {
    const tabName = path.replace('/tabs/', '') as TabName;
    return TAB_ORDER.includes(tabName) ? tabName : 'home';
  }
  return 'home';
});

// Handle swipe navigation
const handleSwipe = (direction: 'left' | 'right'): void => {
  const currentIndex = TAB_ORDER.indexOf(currentTab.value as TabName);
  if (currentIndex === -1) return;

  let nextIndex: number;
  // When swiping left (page moves left), next page appears from right → go to next tab (index + 1)
  // When swiping right (page moves right), previous page appears from left → go to previous tab (index - 1)
  if (direction === 'left') {
    nextIndex = currentIndex + 1;
  } else {
    nextIndex = currentIndex - 1;
  }

  // Check bounds
  if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

  const nextTab = TAB_ORDER[nextIndex];
  // Use replace instead of push to avoid history stack, and disable Ionic animations
  router.replace(`/tabs/${nextTab}`);
};

// Use swipe navigation composable
const { translateX, nextPageTranslateX, isSwiping, isCompleting, nextTab, activeTabIndicatorStyle, handleTouchStart, handleTouchMove, handleTouchEnd } = 
  useTabSwipeNavigation({
    currentTab,
    tabs: TAB_ORDER,
    onSwipe: handleSwipe,
  });

// Get next page component
const nextPageComponent = computed(() => {
  if (!nextTab.value) return null;
  return PAGE_COMPONENTS[nextTab.value] || null;
});
</script>

<style scoped>
/* Increase tab bar icon size */
ion-tab-button i {
  font-size: 1.3rem !important;
}

/* Increase tab bar height to accommodate larger icons */
ion-tab-bar {
  --height: 60px !important;
}

/* Center icons vertically */
ion-tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Keep tab bar visible during swipe animation */
.swipe-page.current-page ion-tab-bar {
  position: relative;
  z-index: 10;
}

/* Tab bar with animated indicator */
.tab-bar-with-indicator {
  position: relative;
}

/* Animated indicator background */
.tab-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.tab-indicator.swiping {
  transition: none;
}

.tab-indicator.completing {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ensure tab buttons are above indicator */
.tab-bar-with-indicator ion-tab-button {
  position: relative;
  z-index: 1;
}

/* Disable default Ionic tab selection background (we use custom indicator) */
.tab-bar-with-indicator ion-tab-button.tab-selected {
  background: transparent !important;
  border: none !important;
}
</style>
