<template>
  <div class="dashboard-header">
    <div class="main-header">
      <img src="@/assets/images/logo.png" alt="Zenythium" class="logo" />
    </div>

    <!-- Main Action Grid 3x2 -->
    <div class="action-grid card-grid-2">
      <div class="grid-item" @click="$emit('navigate', '/select-plan')">
        <div class="grid-card modern-card">
          <i class="fas fa-play grid-icon"></i>
          <h3>Начать тренировку</h3>
        </div>
      </div>

      <div class="grid-item" @click="$emit('navigate', '/training-programs')">
        <div class="grid-card modern-card">
          <i class="fas fa-layer-group grid-icon"></i>
          <h3>Программы</h3>
        </div>
      </div>

      <div class="grid-item" @click="$emit('navigate', '/tabs/plans')">
        <div class="grid-card modern-card">
          <i class="fas fa-book grid-icon"></i>
          <h3>Планы</h3>
        </div>
      </div>

      <div class="grid-item" @click="$emit('navigate', '/tabs/cycles')">
        <div class="grid-card modern-card">
          <i class="fas fa-sync-alt grid-icon"></i>
          <h3>Циклы</h3>
        </div>
      </div>

      <div class="grid-item" @click="$emit('navigate', '/exercises')">
        <div class="grid-card modern-card">
          <i class="fas fa-list grid-icon"></i>
          <h3>Упражнения</h3>
        </div>
      </div>

      <div class="grid-item" @click="$emit('navigate', '/statistics')">
        <div class="grid-card modern-card">
          <i class="fas fa-chart-bar grid-icon"></i>
          <h3>Статистика</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

defineEmits<{
  navigate: [path: string];
}>();
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 32px;
}

.main-header {
  text-align: center;
  margin-bottom: 12px;
}

.main-header .logo {
  max-width: 200px;
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

/* Action Grid 2x2 */
.action-grid {
  margin-bottom: 32px;
}

.grid-item {
  cursor: pointer;
  position: relative;
}

.grid-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px !important;
  text-align: center;
  min-height: 80px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  margin: 0 !important;
  position: relative;
  overflow: hidden;
}

.grid-item:nth-child(1) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(59, 130, 246, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-card.modern-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}

.grid-item:nth-child(1) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(59, 130, 246, 0.3) 60%);
}

.grid-item:nth-child(2) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(139, 92, 246, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-item:nth-child(2) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(139, 92, 246, 0.3) 60%);
}

.grid-item:nth-child(3) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(34, 197, 94, 0.3) 60%);
}

.grid-item:nth-child(4) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(245, 158, 11, 0.3) 60%);
}

.grid-item:nth-child(5) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(239, 68, 68, 0.3) 60%);
}

.grid-item:nth-child(6) .grid-card.modern-card::after {
  background: radial-gradient(circle at center, transparent 0%, rgba(6, 182, 212, 0.3) 60%);
}

.grid-item:nth-child(3) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(34, 197, 94, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-item:nth-child(4) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(245, 158, 11, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-item:nth-child(5) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(239, 68, 68, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-item:nth-child(6) .grid-card.modern-card {
  background: var(--ion-card-background) !important;
  border: 2px solid rgba(6, 182, 212, 0.6) !important;
  position: relative;
  overflow: hidden;
}

.grid-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.grid-item:nth-child(1) .grid-icon {
  color: #3b82f6;
}

.grid-item:nth-child(2) .grid-icon {
  color: #8b5cf6;
}

.grid-item:nth-child(3) .grid-icon {
  color: #22c55e;
}

.grid-item:nth-child(4) .grid-icon {
  color: #f59e0b;
}

.grid-item:nth-child(5) .grid-icon {
  color: #ef4444;
}

.grid-item:nth-child(6) .grid-icon {
  color: #06b6d4;
}

.grid-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  position: relative;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>