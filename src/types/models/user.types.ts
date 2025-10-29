/**
 * User domain types
 */

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profile?: UserProfile;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  heightUnit: 'cm' | 'in';
  weightUnit: 'kg' | 'lbs';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  bio?: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    workoutReminders: boolean;
    cycleReminders: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showStats: boolean;
  };
  units: {
    weight: 'kg' | 'lbs';
    distance: 'km' | 'mi';
    height: 'cm' | 'in';
  };
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  heightUnit?: 'cm' | 'in';
  weightUnit?: 'kg' | 'lbs';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  bio?: string;
}

export interface UpdateSettingsDto {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  units?: Partial<UserSettings['units']>;
}

