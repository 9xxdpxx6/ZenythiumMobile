/**
 * Training Program domain types
 */

export interface TrainingProgramAuthor {
  id: number;
  name: string;
}

export interface TrainingProgramStructureExercise {
  name: string;
  muscle_group_id: number;
  description?: string;
}

export interface TrainingProgramStructurePlan {
  name: string;
  exercises: TrainingProgramStructureExercise[];
}

export interface TrainingProgramStructureCycle {
  name: string;
  plans: TrainingProgramStructurePlan[];
}

export interface TrainingProgramStructure {
  cycles: TrainingProgramStructureCycle[];
}

export interface TrainingProgram {
  id: number;
  name: string;
  description?: string;
  author?: TrainingProgramAuthor;
  duration_weeks: number;
  cycles_count?: number;
  plans_count?: number;
  exercises_count?: number;
  installations_count?: number;
  is_active: boolean;
  is_installed: boolean;
  install_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgramDetail extends TrainingProgram {
  structure?: TrainingProgramStructure;
}

export interface InstallTrainingProgramResponse {
  install_id: number;
  cycle_id: number;
  plans_count: number;
  exercises_count: number;
}


