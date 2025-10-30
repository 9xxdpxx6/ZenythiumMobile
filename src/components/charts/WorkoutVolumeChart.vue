<template>
  <div class="workout-volume-chart">
    <div class="chart-container modern-card">
      <div class="chart-header-row">
        <h3>Тренды</h3>
        <div class="mode-switch-pill" role="tablist" aria-label="Интервал">
          <button
            v-for="opt in modeOptions"
            :key="opt.value"
            :class="['pill-segment', { active: selectedMode === opt.value }]"
            @click="selectedMode = opt.value"
            role="tab"
            :aria-selected="selectedMode === opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <Line
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
        <div v-else class="no-data">
          <p>Нет данных для отображения</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface TrendPoint { [key: string]: any }
interface Props {
  monthlyTrends?: Array<{ month: string; workout_count: number; total_volume: number }>;
  weeklyTrends?: Array<{ week: string; workout_count: number; total_volume: number }>;
  initialMode?: 'week' | 'month' | 'year';
}

const props = defineProps<Props>();

const selectedMode = ref<'week' | 'month' | 'year'>(props.initialMode || 'month');

const modeOptions = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
] as const;

const preparedTrends = computed(() => {
  if (selectedMode.value === 'week') {
    const list = props.weeklyTrends || [];
    return {
      labels: list.map(i => formatWeekLabel(i.week)),
      counts: list.map(i => Number((i as any).workout_count) || 0),
      volumes: list.map(i => parseMaybeNumber((i as any).total_volume)),
    };
  }
  if (selectedMode.value === 'year') {
    const list = props.monthlyTrends || [];
    const yearMap = new Map<string, { count: number; volume: number }>();
    for (const item of list) {
      const year = (item.month || '').toString().slice(0, 4);
      const prev = yearMap.get(year) || { count: 0, volume: 0 };
      prev.count += Number(item.workout_count) || 0;
      prev.volume += parseMaybeNumber((item as any).total_volume);
      yearMap.set(year, prev);
    }
    const years = Array.from(yearMap.keys()).sort();
    return {
      labels: years,
      counts: years.map(y => yearMap.get(y)!.count),
      volumes: years.map(y => yearMap.get(y)!.volume),
    };
  }
  // month
  const list = props.monthlyTrends || [];
  return {
    labels: list.map(i => formatMonthLabel(i.month)),
    counts: list.map(i => Number(i.workout_count) || 0),
    volumes: list.map(i => parseMaybeNumber((i as any).total_volume)),
  };
});

const chartData = computed(() => {
  const data = preparedTrends.value;
  if (!data.labels || data.labels.length === 0) return null;

  return {
    labels: data.labels,
    datasets: [
      {
        label: 'Количество тренировок',
        data: data.counts,
        borderColor: '#34d399',
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 3,
        fill: false,
      },
      {
        label: 'Общий объем',
        data: data.volumes,
        borderColor: '#f472b6',
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 3,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      ticks: {
        precision: 0,
        callback: (v: any) => `${Math.round(Number(v))} трен`,
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: (v: any) => formatWeightWithUnits(v as number),
      },
    },
  },
};

function formatMonthLabel(month: string): string {
  // Accept formats like '2025-10' or '2025-10-01'
  const parts = month.includes('-') ? month.split('-') : [];
  if (parts.length >= 2) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  }
  const d = new Date(month);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  }
  return month;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

function formatWeekLabel(week: string): string {
  // Support '2025-W40', '2025-40', or ISO strings
  if (week.includes('W')) {
    const [y, w] = week.split('W');
    return `нед. ${w.trim()}, ${y.replace(/[-]/g, '')}`;
  }
  const hyphenMatch = week.match(/^(\d{4})[-/](\d{1,2})$/);
  if (hyphenMatch) {
    const y = hyphenMatch[1];
    const w = hyphenMatch[2];
    return `нед. ${w}, ${y}`;
  }
  return week;
}

function parseMaybeNumber(val: any): number {
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

function formatWeightWithUnits(val: number): string {
  const n = Number(val);
  if (!isFinite(n)) return '';
  if (Math.abs(n) >= 1000) {
    const tons = n / 1000;
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(tons)} т`;
  }
  return `${formatNumber(n)} кг`;
}
</script>

<style scoped>
.workout-volume-chart {
  margin-bottom: 24px;
}

.chart-container {
  padding: 16px !important;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  padding: 0 4px;
}

.chart-header-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.mode-switch-pill {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  padding: 4px;
  margin-bottom: 16px;
}

.pill-segment {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ion-text-color);
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.pill-segment.active {
  background: var(--ion-color-primary);
  color: #fff; /* keep legible */
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ion-color-medium);
}
</style>
