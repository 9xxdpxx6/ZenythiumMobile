<template>
  <ion-page>
    <div
      class="pages-container"
      :class="{ swiping: isSwiping, completing: isCompleting }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Current page -->
      <ion-tabs class="swipe-page current-page">
        <ion-router-outlet
          :style="{ transform: `translateX(${outletTranslateX}px)` }"
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
      
      <!-- Lightweight skeleton preview during swipe (no real component mount → no API calls).
           Skipped on the completing phase for already-visited tabs — see showSkeleton. -->
      <div
        v-if="showSkeleton"
        class="swipe-page next-page swipe-skeleton-page"
        :style="{ transform: `translateX(${nextPageTranslateX}px)` }"
        :class="{ 'completing': isCompleting }"
      >
        <div class="skeleton-header-bar"></div>
        <div class="skeleton-body">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line subtitle"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card short"></div>
          <div class="skeleton-card"></div>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
} from '@ionic/vue';
import { useTabSwipeNavigation } from '@/composables';

// Tab order: cycles (0) → plans (1) → home (2) → workouts (3) → profile (4)
const TAB_ORDER = ['cycles', 'plans', 'home', 'workouts', 'profile'] as const;

type TabName = typeof TAB_ORDER[number];

const route = useRoute();
const router = useRouter();

// @ionic/vue-router provides this internally (not part of the public
// useIonRouter() API) — it's what ion-tab-button itself calls on tap to
// switch tabs. It restores a previously visited tab's page instance from
// Ionic's own view-stack cache instead of remounting it, which is why tab
// taps are instant while our old router.replace() for swipes always paid a
// full remount + refetch.
type IonicNavManager = { changeTab: (tab: string, path: string) => void };
const ionRouter = inject<IonicNavManager | null>('navManager', null);

// Get current tab from route path
const currentTab = computed(() => {
  const path = route.path;
  if (path.startsWith('/tabs/')) {
    const tabName = path.replace('/tabs/', '') as TabName;
    return TAB_ORDER.includes(tabName) ? tabName : 'home';
  }
  return 'home';
});

// The tab active when the current drag gesture began. handleSwipe (fired on
// commit) must compute "next tab" from THIS, not from live currentTab —
// once eager navigation (below) switches the route mid-drag for a cached
// tab, currentTab no longer reflects where the gesture started.
const gestureStartTab = ref<TabName | null>(null);
// Whether this gesture already navigated early (mid-drag) to a cached tab.
const eagerNavigated = ref(false);
// Set synchronously by handleSwipe when a gesture commits, so the
// isSwiping watcher below can tell a commit from a cancelled drag.
let committedThisGesture = false;

// Handle swipe navigation (invoked on commit, i.e. finger released past
// the threshold)
const handleSwipe = (direction: 'left' | 'right'): void => {
  committedThisGesture = true;

  const baseTab = gestureStartTab.value ?? (currentTab.value as TabName);
  const currentIndex = TAB_ORDER.indexOf(baseTab);
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

  const nextTabName = TAB_ORDER[nextIndex];
  const path = `/tabs/${nextTabName}`;

  if (ionRouter) {
    // Same path ion-tab-button uses on tap — reuses the cached tab instance.
    // A no-op if eager navigation (below) already got us here mid-drag.
    ionRouter.changeTab(nextTabName, path);
  } else {
    router.replace(path);
  }
};

// Tabs already visited this session already have a live, cached instance
// (Ionic's view-stack, via ionRouter.changeTab). The skeleton exists only
// to hide the mount+fetch cost of a tab's *first* visit, so replaying it
// for a revisit is pure, unjustified extra latency on top of content
// that's already ready underneath.
const visitedTabs = ref<Set<TabName>>(new Set([currentTab.value as TabName]));
watch(currentTab, (tab) => {
  visitedTabs.value.add(tab as TabName);
});

// The composable derives nextTab/nextPageTranslateX/etc. from this tab's
// live index. Eager navigation (below) changes the *real* route mid-drag
// for a cached tab — without freezing what the composable sees, its "next
// tab" calculation would immediately drift one further (e.g. cycles→plans
// mid-drag makes it recompute plans→home) the instant the route changes,
// since it isn't aware a gesture is in progress. Freezing it to the tab
// the gesture started on for the whole active-drag phase keeps every
// derived value stable regardless of what eager navigation does to the
// route underneath it.
const swipeCurrentTab = computed(() => gestureStartTab.value ?? currentTab.value);

// Use swipe navigation composable
const { translateX, nextPageTranslateX, isSwiping, isCompleting, nextTab, activeTabIndicatorStyle, handleTouchStart: startDrag, handleTouchMove, handleTouchEnd } =
  useTabSwipeNavigation({
    currentTab: swipeCurrentTab,
    tabs: TAB_ORDER,
    onSwipe: handleSwipe,
  });

const handleTouchStart = (event: TouchEvent): void => {
  gestureStartTab.value = currentTab.value as TabName;
  eagerNavigated.value = false;
  committedThisGesture = false;
  startDrag(event);
};

// The swipe direction (and therefore nextTab) is locked once, the moment
// the drag is recognized as horizontal — it doesn't change again mid
// gesture. That's the one moment to eagerly jump to an already-visited
// tab: the direction is now known, and the tab is cheap (cached, no
// fetch), so there's no downside to showing it immediately instead of
// waiting for the finger to be released.
watch(nextTab, (tab) => {
  if (!isSwiping.value || !tab || eagerNavigated.value) return;
  if (!visitedTabs.value.has(tab as TabName)) return; // not cached — keep the skeleton path

  eagerNavigated.value = true;
  ionRouter?.changeTab(tab, `/tabs/${tab}`);
});

// Gesture ended (finger lifted). Two cases:
// - Committed: handleSwipe already navigated to the real destination —
//   eagerNavigated stays true so the outlet keeps using the "incoming
//   page" transform (settles to center) through the completing animation.
// - Cancelled (released before the threshold): we're still sitting on the
//   tab we eagerly jumped to mid-drag. Revert the navigation AND flip
//   eagerNavigated back to false in the same tick, so the outlet
//   immediately goes back to the normal "current page returning to
//   center" transform instead of the "next page hiding off screen" one —
//   otherwise the reverted content would fly off-screen instead of
//   settling back in place.
watch(isSwiping, (swiping) => {
  if (swiping || !eagerNavigated.value) return;

  if (committedThisGesture) {
    committedThisGesture = false;
    return;
  }

  eagerNavigated.value = false;
  if (gestureStartTab.value && ionRouter) {
    ionRouter.changeTab(gestureStartTab.value, `/tabs/${gestureStartTab.value}`);
  }
  gestureStartTab.value = null;
});

// Safety net for the committed path: once the whole gesture (including the
// 200ms completing animation) has fully reset, clear the bookkeeping for
// the next gesture.
watch(nextTab, (tab) => {
  if (tab === null) {
    eagerNavigated.value = false;
    gestureStartTab.value = null;
  }
});

// Once eager navigation has swapped the outlet's content to the
// destination tab, that content should behave like the incoming "next
// page" (slides from the edge to center) rather than the outgoing
// "current page" (slides from center to the edge) — same transform the
// skeleton used to follow, just now applied to the real page underneath.
const outletTranslateX = computed(() => (eagerNavigated.value ? nextPageTranslateX.value : translateX.value));

// The skeleton is only needed while the destination tab has never been
// visited (no cached instance to show yet) — for a visited tab, the watch
// above already swaps in the real page the moment the direction locks, so
// it can just follow the finger like the current page always did.
const showSkeleton = computed(() => {
  if (!nextTab.value) return false;
  if (!isSwiping.value && !isCompleting.value) return false;
  return !visitedTabs.value.has(nextTab.value as TabName);
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
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.tab-indicator.swiping {
  transition: none;
}

.tab-indicator.completing {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

/* ── Swipe skeleton preview (lightweight, no component mount) ── */
.swipe-skeleton-page {
  background: var(--ion-background-color, #1a1a2e);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.skeleton-header-bar {
  /* Matches PageHeader.vue's ion-toolbar (--min-height: 46px) plus the
     safe-area inset Ionic adds above it, so the skeleton doesn't visibly
     jump in height once the real header mounts underneath it. */
  height: 46px;
  padding-top: env(safe-area-inset-top, 0px);
  box-sizing: content-box;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.skeleton-body {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skeleton-line {
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.07);
}

.skeleton-line.title {
  width: 55%;
  height: 22px;
}

.skeleton-line.subtitle {
  width: 70%;
  height: 14px;
}

.skeleton-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  height: 90px;
}

.skeleton-card.short {
  height: 60px;
  width: 80%;
}
</style>
