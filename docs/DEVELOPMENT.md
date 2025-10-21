# 👨‍💻 Development Guide

This guide provides comprehensive instructions for setting up, developing, and maintaining the Zenythium mobile fitness application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **Java** | 21 LTS | Android build system |
| **Android Studio** | Latest | Android development |
| **Git** | Latest | Version control |

### Development Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **VS Code** | Code editor | [Download](https://code.visualstudio.com/) |
| **Ionic CLI** | Ionic development | `npm install -g @ionic/cli` |
| **Capacitor CLI** | Mobile development | `npm install -g @capacitor/cli` |

### VS Code Extensions

```json
{
  "recommendations": [
    "vue.volar",
    "vue.vscode-typescript-vue-plugin",
    "ionic.ionic",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

## 🚀 Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd ionic-vue-fitness-app
```

### 2. Install Dependencies

```bash
# Install project dependencies
npm install

# Install global tools (if not already installed)
npm install -g @ionic/cli @capacitor/cli
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# API_URL=https://api-zenythium.ru/
# DEBUG=true
```

### 4. Start Development Server

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

### 5. Android Development Setup

```bash
# Sync with Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# Run on device/emulator
npx cap run android
```

## 📁 Project Structure

### Source Code Organization

```
src/
├── 🧩 components/           # Reusable UI components
│   ├── CustomButton.vue     # Custom button component
│   ├── CustomInput.vue      # Custom input component
│   ├── CustomCard.vue       # Custom card component
│   └── ...
├── 🎯 views/                # Page components
│   ├── HomePage.vue         # Main dashboard
│   ├── LoginPage.vue        # Authentication
│   ├── ActiveWorkoutPage.vue # Workout interface
│   └── ...
├── 🔧 services/             # Business logic
│   ├── api.ts              # HTTP client
│   ├── auth.ts             # Authentication
│   └── data.ts             # Data management
├── 📝 types/                # TypeScript definitions
│   └── api.ts              # API types
├── 🎣 composables/          # Vue composables
│   ├── useAuth.ts          # Authentication logic
│   └── useCycleFormValidation.ts # Form validation
├── 🛣️ router/               # Navigation
│   └── index.ts            # Route configuration
├── 🎨 theme/                # Styling
│   ├── variables.css       # CSS variables
│   └── modern-dark.css     # Dark theme
└── App.vue                 # Root component
```

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `capacitor.config.ts` | Mobile app configuration |
| `vite.config.ts` | Build tool configuration |
| `tsconfig.json` | TypeScript configuration |
| `ionic.config.json` | Ionic framework settings |

## 📝 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit typing
interface User {
  id: number
  name: string
  email: string
}

const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`)
  return response.data
}

// ❌ Bad: Implicit any
const getUser = async (id) => {
  const response = await apiClient.get(`/users/${id}`)
  return response.data
}
```

### Vue Component Structure

```vue
<template>
  <!-- Template content -->
  <div class="component-container">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Props
interface Props {
  title: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

// Emits
const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// Reactive data
const isLoading = ref(false)
const data = ref<User[]>([])

// Computed properties
const filteredData = computed(() => 
  data.value.filter(item => item.isActive)
)

// Methods
const handleClick = () => {
  emit('update', 'new-value')
}

// Lifecycle
onMounted(() => {
  // Initialization logic
})
</script>

<style scoped>
.component-container {
  padding: 1rem;
}
</style>
```

### Naming Conventions

```typescript
// ✅ Good naming
const userWorkouts = ref<Workout[]>([])
const isWorkoutActive = computed(() => workout.value?.status === 'active')
const handleStartWorkout = () => { /* ... */ }

// ❌ Bad naming
const data = ref([])
const flag = computed(() => workout.value?.status === 'active')
const click = () => { /* ... */ }
```

### File Naming

```
✅ Good:
- HomePage.vue
- CustomButton.vue
- useAuth.ts
- api.ts

❌ Bad:
- homePage.vue
- custom-button.vue
- use_auth.ts
- Api.ts
```

## 🔄 Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/workout-timer

# 2. Make changes and commit
git add .
git commit -m "feat: add workout timer functionality"

# 3. Push branch
git push origin feature/workout-timer

# 4. Create pull request
# 5. Code review
# 6. Merge to main
```

### Commit Message Format

```
<type>(<scope>): <description>

feat(auth): add biometric login support
fix(workout): resolve timer synchronization issue
docs(api): update authentication endpoints
style(ui): improve button hover effects
refactor(services): extract workout logic to composable
test(components): add unit tests for CustomButton
```

### Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking

# Testing
npm run test:unit        # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Test coverage

# Mobile Development
npm run build:android    # Build Android app
npm run version:patch   # Update patch version
```

## 🧪 Testing

### Unit Testing Setup

```typescript
// tests/unit/components/CustomButton.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CustomButton from '@/components/CustomButton.vue'

describe('CustomButton', () => {
  it('renders button with correct text', () => {
    const wrapper = mount(CustomButton, {
      props: { text: 'Click me' }
    })
    
    expect(wrapper.text()).toBe('Click me')
  })
  
  it('emits click event when clicked', async () => {
    const wrapper = mount(CustomButton)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### E2E Testing

```typescript
// tests/e2e/specs/workout-flow.cy.ts
describe('Workout Flow', () => {
  it('should complete workout session', () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type('test@example.com')
    cy.get('[data-cy=password]').type('password123')
    cy.get('[data-cy=login-button]').click()
    
    cy.url().should('include', '/tabs/home')
    cy.get('[data-cy=start-workout]').click()
    
    // Complete workout flow
    cy.get('[data-cy=exercise-item]').first().click()
    cy.get('[data-cy=add-set]').click()
    cy.get('[data-cy=finish-workout]').click()
    
    cy.get('[data-cy=success-message]').should('be.visible')
  })
})
```

### Testing Best Practices

```typescript
// ✅ Good: Test behavior, not implementation
it('should display workout statistics', () => {
  const wrapper = mount(StatisticsPage, {
    props: { workouts: mockWorkouts }
  })
  
  expect(wrapper.find('[data-cy=total-workouts]').text()).toBe('5')
})

// ❌ Bad: Testing implementation details
it('should call fetchWorkouts method', () => {
  const fetchWorkouts = vi.fn()
  // Testing internal method calls
})
```

## 🐛 Debugging

### Browser DevTools

```typescript
// Debug logging
console.log('Workout data:', workout.value)
console.table(exercises.value)

// Conditional debugging
if (import.meta.env.DEV) {
  console.log('Debug info:', debugData)
}
```

### Vue DevTools

```bash
# Install Vue DevTools browser extension
# Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/
```

### Mobile Debugging

```bash
# Android debugging
npx cap run android --livereload

# View logs
adb logcat | grep -i zenythium

# Remote debugging
chrome://inspect/#devices
```

### Error Handling

```typescript
// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
  
  // Send to error tracking service
  errorTracking.captureException(err)
}

// Component error handling
const handleError = (error: Error) => {
  console.error('Component error:', error)
  toast.error('Something went wrong. Please try again.')
}
```

## ⚡ Performance Optimization

### Code Splitting

```typescript
// Lazy load routes
const routes = [
  {
    path: '/statistics',
    component: () => import('@/views/StatisticsPage.vue')
  }
]

// Lazy load components
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

### Image Optimization

```vue
<template>
  <!-- Optimized images -->
  <img 
    :src="optimizedImageUrl" 
    :alt="imageAlt"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup lang="ts">
const optimizedImageUrl = computed(() => {
  // Use appropriate image size based on device
  const isMobile = window.innerWidth < 768
  return isMobile ? image.mobile : image.desktop
})
</script>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npx depcheck
```

### Memory Management

```typescript
// Clean up subscriptions
onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
})

// Use weak references for large objects
const cache = new WeakMap()
```

## 🔧 Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

#### Android Build Issues

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Re-sync Capacitor
npx cap sync android

# Check Java version
java -version  # Should be Java 21
```

#### TypeScript Errors

```bash
# Type check
npm run type-check

# Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Performance Issues

```typescript
// Identify performance bottlenecks
const startTime = performance.now()
// ... expensive operation
const endTime = performance.now()
console.log(`Operation took ${endTime - startTime} milliseconds`)

// Use Vue DevTools Profiler
// Monitor component render times
```

### Network Issues

```typescript
// Debug API calls
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url)
  return config
})

apiClient.interceptors.response.use((response) => {
  console.log('Response:', response.status, response.config.url)
  return response
})
```

## 📚 Additional Resources

### Documentation Links

- [Vue 3 Documentation](https://vuejs.org/)
- [Ionic Vue Documentation](https://ionicframework.com/docs/vue/overview)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Development Tools

- [Vue DevTools](https://devtools.vuejs.org/)
- [Ionic DevApp](https://ionicframework.com/docs/appflow/devapp)
- [Android Studio](https://developer.android.com/studio)

---

## 🔗 Related Documentation

- [Architecture Overview](ARCHITECTURE.md) - Technical architecture
- [API Integration](API.md) - Backend API details
- [Contributing Guidelines](CONTRIBUTING.md) - Contribution process

---

*This development guide ensures consistent, high-quality development practices across the Zenythium project.*
