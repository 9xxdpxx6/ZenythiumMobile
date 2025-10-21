# 🏗️ Architecture Overview

This document describes the technical architecture and project structure of the Zenythium mobile fitness application.

## 📋 Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Routing Architecture](#routing-architecture)

## 🏛️ High-Level Architecture

Zenythium follows a **hybrid mobile architecture** combining web technologies with native mobile capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Device                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Ionic Vue     │  │   Capacitor     │                  │
│  │   Frontend      │  │   Native Bridge │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              WebView Container                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │   Vue.js    │ │  TypeScript │ │   CSS/SCSS   │      │ │
│  │  │   Framework │ │   Language  │ │   Styling    │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Laravel/PHP API                           │ │
│  │  • Authentication & Authorization                      │ │
│  │  • Workout Management                                  │ │
│  │  • Statistics & Analytics                              │ │
│  │  • User Data Management                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ionic-vue-fitness-app/
├── 📱 android/                    # Android native project
│   ├── app/
│   │   ├── build.gradle           # Android build configuration
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── assets/
│   └── gradle/                    # Gradle wrapper
├── 📦 src/                        # Source code
│   ├── 🧩 components/            # Reusable UI components
│   │   ├── CustomButton.vue
│   │   ├── CustomCard.vue
│   │   ├── CustomInput.vue
│   │   └── ...
│   ├── 🎯 views/                  # Page components
│   │   ├── HomePage.vue
│   │   ├── LoginPage.vue
│   │   ├── ActiveWorkoutPage.vue
│   │   └── ...
│   ├── 🔧 services/               # Business logic & API
│   │   ├── api.ts                 # HTTP client configuration
│   │   ├── auth.ts                # Authentication service
│   │   └── data.ts                # Data management
│   ├── 📝 types/                  # TypeScript definitions
│   │   └── api.ts                 # API response types
│   ├── 🎣 composables/            # Vue composables
│   │   ├── useAuth.ts
│   │   └── useCycleFormValidation.ts
│   ├── 🛣️ router/                 # Navigation configuration
│   │   └── index.ts
│   ├── 🎨 theme/                   # Styling and themes
│   │   ├── variables.css
│   │   └── modern-dark.css
│   └── App.vue                    # Root component
├── 📚 docs/                       # Documentation
├── 🧪 tests/                      # Test files
│   ├── unit/
│   └── e2e/
├── ⚙️ scripts/                    # Build scripts
│   └── version.js
├── 📄 Configuration Files
│   ├── package.json
│   ├── capacitor.config.ts
│   ├── vite.config.ts
│   └── tsconfig.json
└── 📋 Documentation
    ├── README.md
    ├── VERSIONING.md
    └── api-docs.json
```

## 🛠️ Technology Stack

### Frontend Technologies
- **Ionic Vue 8** - Mobile-first UI framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Vue Router** - Client-side routing

### Mobile Technologies
- **Capacitor 7** - Native mobile runtime
- **Android SDK** - Android platform support
- **Gradle** - Android build system

### Data & API
- **Axios** - HTTP client for API communication
- **REST API** - Backend communication protocol
- **JWT** - Authentication tokens

### Development Tools
- **ESLint** - Code linting
- **Cypress** - End-to-end testing
- **Vitest** - Unit testing framework
- **Chart.js** - Data visualization

## 🧩 Component Architecture

### Component Hierarchy

```
App.vue
├── Router Outlet
    ├── Public Routes
    │   ├── LoginPage
    │   └── RegisterPage
    └── Protected Routes (TabsLayout)
        ├── HomePage
        ├── CyclesPage
        ├── PlansPage
        ├── WorkoutsPage
        └── ProfilePage
```

### Component Categories

#### 🎯 **Page Components** (`views/`)
- **Purpose**: Top-level page components
- **Responsibilities**: Page layout, data fetching, user interactions
- **Examples**: `HomePage.vue`, `ActiveWorkoutPage.vue`, `StatisticsPage.vue`

#### 🧩 **Reusable Components** (`components/`)
- **Purpose**: Reusable UI building blocks
- **Responsibilities**: UI rendering, user input handling
- **Examples**: `CustomButton.vue`, `CustomInput.vue`, `CustomCard.vue`

#### 🎣 **Composables** (`composables/`)
- **Purpose**: Reusable reactive logic
- **Responsibilities**: State management, business logic
- **Examples**: `useAuth.ts`, `useCycleFormValidation.ts`

## 🔄 Data Flow

### API Communication Flow

```
Component → Service → API Client → Backend API
    ↑                              ↓
    └── Response ←── Interceptor ←──┘
```

### Authentication Flow

```
1. User Login → AuthService.login()
2. Store JWT → localStorage
3. Add to Headers → Axios Interceptor
4. Protected Routes → Router Guard
5. Auto Logout → Token Expiry
```

### Workout Data Flow

```
1. Select Plan → PlanSelectionModal
2. Start Workout → ActiveWorkoutPage
3. Track Sets → WorkoutSet Management
4. Save Progress → API Sync
5. View History → WorkoutsPage
```

## 📊 State Management

### Local State Management
- **Vue 3 Composition API** - Reactive state
- **Composables** - Shared logic
- **Props/Emit** - Parent-child communication

### Persistent State
- **localStorage** - Authentication tokens
- **Backend API** - User data, workouts, statistics

### State Patterns
```typescript
// Composable pattern
export function useAuth() {
  const isAuthenticated = ref(false)
  const user = ref(null)
  
  const login = async (credentials) => {
    // Login logic
  }
  
  return { isAuthenticated, user, login }
}
```

## 🛣️ Routing Architecture

### Route Structure
```typescript
const routes = [
  // Public routes
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  
  // Protected routes
  { path: '/tabs/', component: TabsLayout, meta: { requiresAuth: true } },
  
  // Feature routes
  { path: '/workout/:id', component: ActiveWorkoutPage },
  { path: '/plan/:id', component: PlanFormPage },
]
```

### Navigation Guards
- **Authentication Guard** - Protects private routes
- **Route Meta** - Defines route requirements
- **Auto Redirect** - Handles authentication state

### Deep Linking
- **Dynamic Routes** - Parameterized URLs
- **State Preservation** - Maintains app state
- **Back Navigation** - Native-like behavior

## 🔒 Security Architecture

### Authentication
- **JWT Tokens** - Stateless authentication
- **Token Refresh** - Automatic renewal
- **Secure Storage** - Encrypted token storage

### API Security
- **HTTPS Only** - Encrypted communication
- **Request Interceptors** - Automatic token injection
- **Error Handling** - Secure error responses

### Data Protection
- **Input Validation** - Client-side validation
- **XSS Prevention** - Sanitized user input
- **CSRF Protection** - Token-based protection

## 📱 Mobile-Specific Architecture

### Capacitor Integration
- **Native APIs** - Device functionality access
- **Plugin System** - Extended capabilities
- **Platform Detection** - Cross-platform compatibility

### Performance Optimization
- **Lazy Loading** - Route-based code splitting
- **Image Optimization** - Responsive images
- **Bundle Splitting** - Reduced initial load

### Offline Capabilities
- **Service Workers** - Background processing
- **Local Storage** - Offline data persistence
- **Sync Mechanisms** - Data synchronization

---

## 🔗 Related Documentation

- [API Integration](API.md) - Backend API details
- [Development Guide](DEVELOPMENT.md) - Setup and development
- [Contributing Guidelines](CONTRIBUTING.md) - Contribution process

---

*This architecture ensures scalability, maintainability, and optimal user experience across mobile platforms.*
