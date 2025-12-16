# 🔌 API Integration Guide

This document provides comprehensive information about the Zenythium API integration, including authentication, endpoints, data models, and best practices.

## 📋 Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Base Configuration](#base-configuration)
- [Core Endpoints](#core-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Testing](#testing)

## 🌐 API Overview

### Base URL
```
Production: https://api-zenythium.ru/
Development: http://localhost:8000/
```

### API Version
- **Current Version**: v1
- **API Format**: RESTful JSON API
- **Documentation**: OpenAPI 3.0 specification

### Key Features
- **JWT Authentication** - Secure token-based authentication
- **RESTful Design** - Standard HTTP methods and status codes
- **Pagination Support** - Efficient data loading
- **Error Handling** - Consistent error response format
- **Rate Limiting** - API usage protection

## 🔐 Authentication

### Authentication Flow

```typescript
// 1. Login Request
const loginData = {
  email: "user@example.com",
  password: "password123"
}

// 2. API Response
const response = {
  token: "1|abc123def456...",
  token_type: "Bearer",
  user: { id: 1, name: "John Doe", email: "user@example.com" }
}

// 3. Store Token
localStorage.setItem('authToken', response.token)

// 4. Use in Requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Authentication Endpoints

#### POST `/api/v1/login`
**Purpose**: User authentication
```typescript
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  token_type: string
  user: User
}
```

#### POST `/api/v1/register`
**Purpose**: User registration
```typescript
interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface RegisterResponse {
  token: string
  token_type: string
  user: User
}
```

#### POST `/api/v1/logout`
**Purpose**: User logout (token invalidation)

## ⚙️ Base Configuration

### Axios Client Setup

```typescript
// src/services/api.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://api-zenythium.ru/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 🎯 Core Endpoints

### User Management

#### GET `/api/v1/user`
**Purpose**: Get current user profile
```typescript
interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}
```

#### PUT `/api/v1/user`
**Purpose**: Update user profile
```typescript
interface UpdateUserRequest {
  name?: string
  email?: string
}
```

### Workout Management

#### POST `/api/v1/workouts`
**Purpose**: Start new workout
```typescript
interface StartWorkoutRequest {
  plan_id?: number
}

interface Workout {
  id: number
  user_id: number
  plan_id: number
  started_at: string
  finished_at: string | null
  status: 'active' | 'completed'
  plan?: Plan
  sets?: WorkoutSet[]
}
```

#### PUT `/api/v1/workouts/{id}`
**Purpose**: Update workout (finish workout)
```typescript
interface FinishWorkoutRequest {
  finished_at: string
}
```

#### GET `/api/v1/workouts`
**Purpose**: Get user workouts with pagination
```typescript
interface WorkoutsResponse {
  data: Workout[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
```

### Plan Management

#### GET `/api/v1/plans`
**Purpose**: Get user training plans
```typescript
interface Plan {
  id: number
  name: string
  order: number
  is_active: boolean
  exercise_count: number
  cycle?: {
    id: number
    name: string
  }
  exercises?: Exercise[]
}
```

#### POST `/api/v1/plans`
**Purpose**: Create new training plan
```typescript
interface CreatePlanRequest {
  name: string
  cycle_id?: number
}
```

#### PUT `/api/v1/plans/{id}`
**Purpose**: Update training plan

#### DELETE `/api/v1/plans/{id}`
**Purpose**: Delete training plan

### Exercise Management

#### GET `/api/v1/exercises`
**Purpose**: Get user exercises with filtering
```typescript
interface Exercise {
  id: number
  name: string
  description: string | null
  muscle_group: {
    id: number
    name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
}
```

#### POST `/api/v1/exercises`
**Purpose**: Create new exercise
```typescript
interface CreateExerciseRequest {
  name: string
  description?: string
  muscle_group_id: number
  is_active?: boolean
}
```

### Statistics & Analytics

#### GET `/api/v1/user/statistics`
**Purpose**: Get user workout statistics
```typescript
interface Statistics {
  total_workouts: number
  completed_workouts: number
  total_training_time: number
  total_volume: number | string
  current_weight: number
  active_cycles_count: number
  weight_change_30_days: number | null
  training_frequency_4_weeks: number
}
```

#### GET `/api/v1/user/time-analytics`
**Purpose**: Get detailed time analytics
```typescript
interface TimeAnalytics {
  weekly_pattern: WeeklyPattern[]
  monthly_trends: MonthlyTrend[]
  muscle_group_stats: MuscleGroupStats[]
  balance_analysis: BalanceAnalysis
}
```

#### GET `/api/v1/user/records`
**Purpose**: Get personal records
```typescript
interface PersonalRecord {
  exercise_name: string
  muscle_group: string
  max_weight: number
  max_reps: number
  max_volume: number
  achieved_date: string
  workout_id: number
}
```

### Metrics Management

#### GET `/api/v1/metrics`
**Purpose**: Get body metrics with pagination
```typescript
interface Metric {
  id: number
  user_id: number
  weight: string
  body_fat_percentage?: string
  muscle_mass?: string
  date: string
  note?: string
  created_at: string
  updated_at: string
}
```

#### POST `/api/v1/metrics`
**Purpose**: Add new body metric
```typescript
interface CreateMetricRequest {
  weight: number
  body_fat_percentage?: number
  muscle_mass?: number
  date: string
  note?: string
}
```

## 📊 Data Models

### Core Entities

```typescript
// User Entity
interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

// Workout Entity
interface Workout {
  id: number
  user_id: number
  plan_id: number
  started_at: string
  finished_at: string | null
  status: 'active' | 'completed'
  plan?: Plan
  sets?: WorkoutSet[]
  exercises?: PlanExercise[]
}

// Plan Entity
interface Plan {
  id: number
  name: string
  order: number
  is_active: boolean
  exercise_count: number
  cycle?: Cycle
  exercises?: Exercise[]
}

// Exercise Entity
interface Exercise {
  id: number
  name: string
  description: string | null
  muscle_group: {
    id: number
    name: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

// Cycle Entity
interface Cycle {
  id: number
  name: string
  weeks: number
  start_date: string | null
  end_date: string | null
  progress_percentage: number
  completed_workouts_count: number
  plans_count: number
  plans?: CyclePlan[]
}
```

### Response Wrappers

```typescript
// Standard API Response
interface ApiResponse<T> {
  data: T
  message?: string
}

// Paginated Response
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

// Error Response
interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
```

## ❌ Error Handling

### Error Response Format

```typescript
// Validation Error
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}

// Server Error
{
  "message": "Internal server error"
}

// Authentication Error
{
  "message": "Unauthenticated."
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Error Handling Implementation

```typescript
// Service method with error handling
export const workoutService = {
  async startWorkout(planId?: number): Promise<Workout> {
    try {
      const response = await apiClient.post<ApiResponse<Workout>>('/api/v1/workouts', {
        plan_id: planId
      })
      return response.data.data
    } catch (error) {
      if (error.response?.status === 422) {
        throw new ValidationError(error.response.data.errors)
      }
      throw new ApiError(error.response?.data?.message || 'Failed to start workout')
    }
  }
}
```

## 🎯 Best Practices

### Request Optimization

```typescript
// Use pagination for large datasets
const getWorkouts = async (page = 1, perPage = 20) => {
  return apiClient.get(`/api/v1/workouts?page=${page}&per_page=${perPage}`)
}

// Use query parameters for filtering
const getExercises = async (filters: ExerciseFilters) => {
  const params = new URLSearchParams()
  if (filters.muscleGroupId) params.append('muscle_group_id', filters.muscleGroupId)
  if (filters.search) params.append('search', filters.search)
  
  return apiClient.get(`/api/v1/exercises?${params}`)
}
```

### Caching Strategy

```typescript
// Cache frequently accessed data
const cache = new Map()

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await fetcher()
  cache.set(key, data)
  return data
}
```

### Loading States

```typescript
// Component with loading state
const { data, loading, error } = useAsyncData(() => 
  workoutService.getWorkouts()
)
```

## 🧪 Testing

### API Testing Setup

```typescript
// Mock API responses for testing
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}

// Test authentication flow
describe('Authentication', () => {
  it('should login user successfully', async () => {
    mockApiClient.post.mockResolvedValue({
      data: {
        token: 'mock-token',
        user: { id: 1, name: 'Test User' }
      }
    })
    
    const result = await authService.login('test@example.com', 'password')
    expect(result.token).toBe('mock-token')
  })
})
```

### Integration Testing

```typescript
// Test API integration
describe('Workout API Integration', () => {
  it('should start workout with plan', async () => {
    const workout = await workoutService.startWorkout(1)
    expect(workout.plan_id).toBe(1)
    expect(workout.status).toBe('active')
  })
})
```

## 📚 Additional Resources

- **API Documentation**: [api-docs.json](../api-docs.json)
- **OpenAPI Specification**: Full API schema
- **Postman Collection**: Import for testing
- **Error Codes Reference**: Complete error handling guide

---

## 🔗 Related Documentation

- [Architecture Overview](ARCHITECTURE.md) - Technical architecture
- [Development Guide](DEVELOPMENT.md) - Setup and development
- [Contributing Guidelines](CONTRIBUTING.md) - Contribution process

---

*This API integration ensures reliable, secure, and efficient communication between the mobile app and backend services.*
