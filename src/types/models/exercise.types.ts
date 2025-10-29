/**
 * Exercise domain types
 */

export enum ExerciseType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  BALANCE = 'balance',
  PLYOMETRIC = 'plyometric',
  OLYMPIC = 'olympic',
}

export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  MACHINE = 'machine',
  CABLE = 'cable',
  BODYWEIGHT = 'bodyweight',
  BAND = 'band',
  OTHER = 'other',
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  type: ExerciseType;
  equipment?: EquipmentType[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isCustom: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface MuscleGroupStats {
  muscleGroupId: string;
  muscleGroupName: string;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  lastWorked?: string;
  exerciseCount: number;
}

export interface CreateExerciseDto {
  name: string;
  description?: string;
  type: ExerciseType;
  equipment?: EquipmentType[];
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface UpdateExerciseDto {
  name?: string;
  description?: string;
  type?: ExerciseType;
  equipment?: EquipmentType[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

