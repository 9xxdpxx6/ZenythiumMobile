/**
 * Statistics domain types
 */

export interface Statistics {
  userId: string;
  overview: StatisticsOverview;
  recentWorkouts: RecentWorkout[];
  personalRecords: PersonalRecord[];
  muscleGroupDistribution: MuscleGroupDistribution[];
}

export interface StatisticsOverview {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalDuration: number;
  averageWorkoutsPerWeek: number;
  lastWorkoutDate?: string;
}

export interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  duration: number;
  volume: number;
  sets: number;
  reps: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'duration' | 'distance';
  value: number;
  unit: string;
  date: string;
  workoutId: string;
}

export interface MuscleGroupDistribution {
  muscleGroupId: string;
  muscleGroupName: string;
  volume: number;
  sets: number;
  percentage: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ProgressData {
  exerciseId: string;
  exerciseName: string;
  dataPoints: ProgressDataPoint[];
}

export interface ProgressDataPoint {
  date: string;
  value: number;
  workoutId: string;
}

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface WorkoutHistoryParams extends DateRangeParams {
  groupBy?: 'day' | 'week' | 'month';
}

