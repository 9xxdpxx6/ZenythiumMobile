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

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/tabs/home');
  } else {
    next();
  }
});

export default router
