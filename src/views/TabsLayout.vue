<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
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
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/vue';
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
</style>
