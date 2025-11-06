<template>
  <ion-header :translucent="true">
    <ion-toolbar>
      <!-- Кнопка назад (ion-back-button) -->
      <ion-buttons v-if="showBackButton && !$slots.start" slot="start">
        <ion-back-button :default-href="defaultBackHref"></ion-back-button>
      </ion-buttons>

      <!-- Кастомные кнопки слева через слот -->
      <ion-buttons v-if="$slots.start" slot="start">
        <slot name="start"></slot>
      </ion-buttons>

      <!-- Заголовок -->
      <ion-title>{{ title }}</ion-title>

      <!-- Кнопки справа -->
      <ion-buttons v-if="$slots.end || endButton" slot="end">
        <slot name="end">
          <ion-button v-if="endButton" @click="endButton.onClick" :class="endButton.class">
            <i :class="endButton.icon"></i>
          </ion-button>
        </slot>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
} from '@ionic/vue';

interface EndButton {
  icon: string;
  onClick: () => void;
  class?: string;
}

interface Props {
  title: string;
  showBackButton?: boolean;
  defaultBackHref?: string;
  endButton?: EndButton;
}

withDefaults(defineProps<Props>(), {
  showBackButton: false,
  defaultBackHref: '/',
});
</script>

<style scoped>
/* Центрирование заголовка относительно всей ширины шапки */
:deep(ion-toolbar) {
  position: relative;
}

:deep(ion-title) {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Стили для кнопки добавления, если нужны */
:deep(.add-button) {
  --background: transparent !important;
  --background-hover: transparent !important;
  --background-focused: transparent !important;
  --background-activated: transparent !important;
  --border-width: 0 !important;
  --border-style: none !important;
  --border-color: transparent !important;
  --color: white !important;
  --color-hover: rgba(255, 255, 255, 0.8) !important;
  --color-focused: white !important;
  --color-activated: rgba(255, 255, 255, 0.8) !important;
  --box-shadow: none !important;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  --padding-top: 8px !important;
  --padding-bottom: 8px !important;
  margin: 0 !important;
  width: 40px !important;
  height: 40px !important;
}

:deep(.add-button i) {
  font-size: 20px !important;
  color: white !important;
}
</style>

