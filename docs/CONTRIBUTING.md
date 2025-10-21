# 🤝 Contributing Guidelines

Thank you for your interest in contributing to Zenythium! This document provides guidelines and information for contributors to help maintain code quality and project consistency.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and follow our code of conduct:

- **Be respectful** - Treat everyone with respect and kindness
- **Be inclusive** - Welcome newcomers and help them learn
- **Be constructive** - Provide helpful feedback and suggestions
- **Be professional** - Maintain a professional tone in all interactions

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Spam or off-topic discussions
- Sharing private information without consent

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your name and email
- **VS Code** with recommended extensions
- **Android Studio** (for mobile development)
- **Java 21** (for Android builds)

### Initial Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ionic-vue-fitness-app.git
cd ionic-vue-fitness-app

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/ionic-vue-fitness-app.git

# 4. Install dependencies
npm install

# 5. Create development branch
git checkout -b development
```

### Development Environment

```bash
# Start development server
npm run dev

# Run tests
npm run test:unit
npm run test:e2e

# Check code quality
npm run lint
npm run type-check
```

## 🔄 Development Process

### Branch Strategy

We use a **Git Flow** approach:

```
main (production)
├── develop (integration)
├── feature/feature-name
├── bugfix/bug-description
└── hotfix/critical-fix
```

### Branch Naming Convention

```bash
# Features
feature/workout-timer
feature/biometric-auth
feature/offline-sync

# Bug fixes
bugfix/login-validation
bugfix/workout-sync-issue
bugfix/memory-leak

# Hotfixes
hotfix/security-patch
hotfix/critical-crash
```

### Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# 2. Make your changes
# Write code, tests, and documentation

# 3. Test your changes
npm run test:unit
npm run test:e2e
npm run lint

# 4. Commit your changes
git add .
git commit -m "feat: add workout timer functionality"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create Pull Request
# Go to GitHub and create PR from your branch to develop
```

## 📝 Pull Request Process

### Before Submitting

- [ ] **Code follows project standards** (see [Coding Standards](#coding-standards))
- [ ] **Tests pass** (`npm run test:unit && npm run test:e2e`)
- [ ] **Linting passes** (`npm run lint`)
- [ ] **Type checking passes** (`npm run type-check`)
- [ ] **Documentation updated** (if needed)
- [ ] **No console.log statements** in production code
- [ ] **Commit messages follow convention** (see below)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Tested on Android device

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

### Review Process

1. **Automated Checks** - CI/CD pipeline runs tests and linting
2. **Code Review** - At least one maintainer reviews the code
3. **Testing** - Changes are tested on multiple devices
4. **Approval** - Maintainer approves and merges the PR

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and interfaces
interface WorkoutData {
  id: number
  name: string
  exercises: Exercise[]
}

const processWorkout = (workout: WorkoutData): ProcessedWorkout => {
  // Implementation
}

// ❌ Bad: Implicit any types
const processWorkout = (workout) => {
  // Implementation
}
```

### Vue Component Standards

```vue
<template>
  <!-- Use semantic HTML -->
  <section class="workout-section">
    <h2>{{ workout.name }}</h2>
    <div class="exercise-list">
      <ExerciseItem 
        v-for="exercise in workout.exercises" 
        :key="exercise.id"
        :exercise="exercise"
        @update="handleExerciseUpdate"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Props and emits
interface Props {
  workout: Workout
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const emit = defineEmits<{
  update: [workout: Workout]
  delete: [id: number]
}>()

// 3. Reactive data
const isLoading = ref(false)
const exercises = ref<Exercise[]>([])

// 4. Computed properties
const filteredExercises = computed(() => 
  exercises.value.filter(ex => ex.isActive)
)

// 5. Methods
const handleExerciseUpdate = (exercise: Exercise) => {
  // Implementation
}

// 6. Lifecycle hooks
onMounted(() => {
  // Initialization
})
</script>

<style scoped>
.workout-section {
  padding: 1rem;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userWorkouts = ref<Workout[]>([])
const isWorkoutActive = computed(() => workout.value?.status === 'active')
const handleStartWorkout = () => { /* ... */ }

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api-zenythium.ru/'
const MAX_WORKOUT_DURATION = 180 // minutes

// Types and interfaces: PascalCase
interface WorkoutData { }
type WorkoutStatus = 'active' | 'completed' | 'paused'

// Files: PascalCase for components, camelCase for utilities
// CustomButton.vue, useAuth.ts, workoutService.ts
```

### Code Organization

```typescript
// ✅ Good: Logical grouping
export const workoutService = {
  // CRUD operations
  async getWorkouts(): Promise<Workout[]> { },
  async createWorkout(data: CreateWorkoutRequest): Promise<Workout> { },
  async updateWorkout(id: number, data: UpdateWorkoutRequest): Promise<Workout> { },
  async deleteWorkout(id: number): Promise<void> { },
  
  // Business logic
  async startWorkout(planId?: number): Promise<Workout> { },
  async finishWorkout(id: number): Promise<Workout> { },
  
  // Utilities
  calculateWorkoutDuration(workout: Workout): number { },
  validateWorkoutData(data: WorkoutData): boolean { }
}
```

## 🧪 Testing Requirements

### Unit Testing

```typescript
// tests/unit/services/workoutService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { workoutService } from '@/services/workoutService'

describe('WorkoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWorkouts', () => {
    it('should return user workouts', async () => {
      const mockWorkouts = [
        { id: 1, name: 'Push Day', status: 'completed' },
        { id: 2, name: 'Pull Day', status: 'active' }
      ]
      
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockWorkouts }
      })
      
      const result = await workoutService.getWorkouts()
      
      expect(result).toEqual(mockWorkouts)
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/workouts')
    })
  })
})
```

### E2E Testing

```typescript
// tests/e2e/specs/workout-flow.cy.ts
describe('Workout Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123')
  })

  it('should complete a full workout session', () => {
    cy.visit('/tabs/home')
    cy.get('[data-cy=start-workout]').click()
    
    // Select plan
    cy.get('[data-cy=plan-item]').first().click()
    cy.get('[data-cy=confirm-plan]').click()
    
    // Complete exercises
    cy.get('[data-cy=exercise-item]').first().click()
    cy.get('[data-cy=add-set]').click()
    cy.get('[data-cy=weight-input]').type('100')
    cy.get('[data-cy=reps-input]').type('10')
    cy.get('[data-cy=save-set]').click()
    
    // Finish workout
    cy.get('[data-cy=finish-workout]').click()
    cy.get('[data-cy=success-message]').should('be.visible')
  })
})
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage (authentication, workout flow)
- **Edge cases**: Test error conditions and boundary values

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Starts a new workout session for the user
 * @param planId - Optional plan ID to use for the workout
 * @returns Promise resolving to the created workout
 * @throws {ValidationError} When plan ID is invalid
 * @throws {ApiError} When API request fails
 * 
 * @example
 * ```typescript
 * const workout = await workoutService.startWorkout(1)
 * console.log(`Started workout: ${workout.name}`)
 * ```
 */
export const startWorkout = async (planId?: number): Promise<Workout> => {
  // Implementation
}
```

### Component Documentation

```vue
<template>
  <!--
    CustomButton - Reusable button component with loading state
  
    Features:
    - Loading state with spinner
    - Disabled state handling
    - Custom styling support
    - Accessibility compliance
  
    Usage:
    <CustomButton 
      :loading="isLoading"
      :disabled="!isValid"
      @click="handleClick"
    >
      Save Workout
    </CustomButton>
  -->
</template>
```

### README Updates

When adding new features, update relevant documentation:

- **README.md** - Add feature to overview
- **API.md** - Document new endpoints
- **ARCHITECTURE.md** - Update architecture diagrams
- **DEVELOPMENT.md** - Add setup instructions

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable, add screenshots

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- App Version: [e.g. 0.0.2]
- Device: [e.g. Samsung Galaxy S21]

## Additional Context
Any other context about the problem
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Screenshots, mockups, or examples
```

## 🏷️ Commit Message Convention

We use **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(workout): add timer functionality to active workouts
fix(auth): resolve token expiration handling
docs(api): update authentication endpoints documentation
style(ui): improve button hover effects
refactor(services): extract workout logic to composable
test(components): add unit tests for CustomButton
chore(deps): update dependencies to latest versions
```

## 🎯 Contribution Areas

### High Priority

- **Bug fixes** - Critical issues affecting user experience
- **Performance improvements** - App speed and responsiveness
- **Accessibility** - Screen reader support, keyboard navigation
- **Testing** - Increase test coverage and quality

### Medium Priority

- **New features** - Additional functionality
- **UI/UX improvements** - Better user interface
- **Documentation** - Code documentation and guides
- **Code refactoring** - Improve code quality

### Low Priority

- **Code style** - Formatting and minor style changes
- **Dependencies** - Update packages and libraries
- **Build improvements** - Development tooling

## 📞 Getting Help

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Pull Request Comments** - Code review discussions

### Resources

- [Development Guide](DEVELOPMENT.md) - Setup and development
- [Architecture Overview](ARCHITECTURE.md) - Technical architecture
- [API Documentation](API.md) - Backend integration

## 🎉 Recognition

Contributors will be recognized in:

- **README.md** - Contributor list
- **Release notes** - Feature acknowledgments
- **GitHub contributors** - Automatic recognition

---

## 🔗 Related Documentation

- [Development Guide](DEVELOPMENT.md) - Setup and development
- [Architecture Overview](ARCHITECTURE.md) - Technical architecture
- [API Integration](API.md) - Backend API details

---

**Thank you for contributing to Zenythium! Your efforts help make fitness tracking more accessible and effective for everyone.** 🏋️‍♂️
