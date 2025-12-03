import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { AuthService } from '@/services/auth';
import TabsLayout from '../views/TabsLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  // Public routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordPage.vue'),
    meta: { requiresAuth: false }
  },
  // Protected routes
  {
    path: '/tabs/',
    component: TabsLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'cycles',
        name: 'Cycles',
        component: () => import('@/views/CyclesPage.vue')
      },
      {
        path: 'plans',
        name: 'Plans',
        component: () => import('@/views/PlansPage.vue')
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomePage.vue')
      },
      {
        path: 'workouts',
        name: 'Workouts',
        component: () => import('@/views/WorkoutsPage.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfilePage.vue')
      }
    ]
  },
  // Cycle management routes
  {
    path: '/cycle/:id',
    name: 'CycleForm',
    component: () => import('@/views/CycleFormPage.vue'),
    meta: { requiresAuth: true }
  },
  // Plan management routes
  {
    path: '/plan/:id',
    name: 'PlanForm',
    component: () => import('@/views/PlanFormPage.vue'),
    meta: { requiresAuth: true }
  },
  // Workout flow routes
  {
    path: '/select-plan',
    name: 'SelectPlan',
    component: () => import('@/views/SelectPlanPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/workout/:id',
    name: 'ActiveWorkout',
    component: () => import('@/views/ActiveWorkoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-workout/:id',
    name: 'EditWorkout',
    component: () => import('@/views/EditWorkoutPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/view-workout/:id',
    name: 'ViewWorkout',
    component: () => import('@/views/ViewWorkoutPage.vue'),
    meta: { requiresAuth: true }
  },
  // Data pages
  {
    path: '/exercises',
    name: 'Exercises',
    component: () => import('@/views/ExercisesPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/muscle-groups',
    name: 'MuscleGroups',
    component: () => import('@/views/MuscleGroupsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/metrics',
    name: 'Metrics',
    component: () => import('@/views/MetricsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/StatisticsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/training-programs',
    name: 'TrainingPrograms',
    component: () => import('@/views/TrainingProgramsPage.vue'),
    meta: { requiresAuth: true }
  },
  // Training Program detail route
  {
    path: '/training-program/:id',
    name: 'TrainingProgramDetail',
    component: () => import('@/views/TrainingProgramDetailPage.vue'),
    meta: { 
      requiresAuth: true,
      disableSwipeBack: true // Disable swipe-back for this page due to conflicts with Ionic Router
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = AuthService.isAuthenticated();

  // Save previous route for swipe-back navigation
  if (from.path && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('previousRoute', from.path);
  }

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/tabs/home');
  } else {
    next();
  }
});

export default router
