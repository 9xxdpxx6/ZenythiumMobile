## Purpose

Internal reference for implementing and evolving the app according to our refactored architecture. This is for my own use when creating new components/composables/services or updating existing ones.

## High-level Architecture

- Pages (`src/views`) orchestrate data fetching, route logic, and user flows.
- Components (`src/components`) render UI and handle local user input. Keep them dumb; push reusable behavior into composables.
- Composables (`src/composables`) encapsulate reusable behavior/state and expose typed APIs.
- Services (`src/services`) are the only layer that talks to the backend (via the enhanced Axios client). Services use relative endpoint constants and return domain-shaped data.
- Types (`src/types`) define domain models (models/*), API compatibility types (`types/api.ts`) and DTO aggregations (`types/dtos`).
- Constants (`src/constants`) hold endpoint paths and stable constant values.
- Utilities (`src/utils`) provide formatting, logging, and error handling.
- Config (`src/config`) centralizes env-driven settings and builds `appConfig` (baseURL with `/api/v1`).

## Coding Conventions

### TypeScript & Naming
- Prefer explicit, descriptive names. Avoid abbreviations and 1–2 character variables.
- Exported function signatures must be typed. Avoid `any` except at API integration boundaries, and narrow ASAP.
- Domain model naming in `types/models` uses camelCase; API-shape compatibility in `types/api.ts` uses backend casing.

### Control Flow & Error Handling
- Favor early returns instead of deep nesting.
- Do not swallow errors; log using `errorHandler.log()` with a clear context.
- In services, log successful mutations with `logger.info()` and route all errors through `errorHandler`.

### Imports
- Use `@/` alias for app-local modules.
- Import composables from `@/composables` (index barrel) to keep import sites stable.

## Services Layer

### Principles
- One service per domain (`workouts.service.ts`, `plans.service.ts`, etc). Extend `BaseService<T, CreateDto, UpdateDto>` for common CRUD.
- Use endpoint paths from `API_ENDPOINTS` and pass relative paths only. The Axios client already scopes to `appConfig.apiBaseUrl` which includes `/api/v1`.
- Map to domain types at the service boundary if API shape differs (example: `cycles.service.ts` maps API response to domain `Cycle`).

### Enhanced API Client
- Automatically adds `Authorization` header when token is present.
- Centralized logging for requests/responses.
- Retry policy for network errors and 5xx (excludes `/workouts/active`).
- Error transformation to a consistent `{ message, errors }` shape.

### Workouts Service Cheatsheet
- Complete workout: PUT `/workouts/{id}` with `{ plan_id, started_at, finished_at, notes? }`.
- Set operations (create/update/delete): use relative `/workout-sets` paths without duplicating `/api/v1`.

## Composables Layer

### Principles
- Encapsulate reusable behavior/state. Keep the public API small and typed.
- Side effects are allowed, but coordinate via clear function names (e.g., `fetchWorkout`, `execute`, `open`, `close`).
- Return references and functions, not raw state objects (avoid unexpected reactivity pitfalls).

### Existing Composables (key ones)
- `useDataFetching<T>(fetchFn, options)`: standardized loading/error/data lifecycle with `execute()` and `refresh()`.
- `useToast()`: thin wrapper for Ionic toasts; only sets `icon` if provided to avoid Ionicons base-URL warnings.
- `useModal<T>()`: local modal state with typed `data` and `open/close/toggle`.
- `useWorkoutTimer()`: timer logic for active workouts.
- `useLongPress(options)`: long-press gesture with swipe cancellation (see below).

### useLongPress
Reusable gesture handling for tap/long-press without false triggers on slow swipes.

API:
- Options: `{ threshold?: number; onPressStart?: () => void; onPressEnd?: () => void }`
- Returns handlers for template: `handleTouchStart/Move/End`, `handleMouseDown/Move/Up/Leave`, and `handleClick(onClick?)`.
- Behavior: movement beyond `threshold` (default 10px) marks `hasMoved=true` and cancels long-press. `handleClick` triggers the provided callback only if no significant movement occurred.

Usage pattern in a component:
```vue
<CustomCard
  @click="handleClick"
  @touchstart="longPress.handleTouchStart"
  @touchmove="longPress.handleTouchMove"
  @touchend="longPress.handleTouchEnd"
  @mousedown="longPress.handleMouseDown"
  @mousemove="longPress.handleMouseMove"
  @mouseup="longPress.handleMouseUp"
  @mouseleave="longPress.handleMouseLeave"
/>
```

```ts
const longPress = useLongPress({
  threshold: 10,
  onPressStart: () => emit('press-start', payload),
  onPressEnd: () => emit('press-end'),
});

const handleClick = () => {
  longPress.handleClick(() => emit('click', payload));
};
```

## Components Layer

### Principles
- Stateless where possible. Use props/emit for interactions.
- Keep UI-only; push business/gesture logic into composables.
- Format data close to where it is rendered if formatting is view-specific, or add to `utils/formatters.ts` if reused.

Form handling note:
- If a modal maintains a local copy of form state (e.g., `localForm`), always emit the local values on submit and let the parent normalize/cast (ids to numbers, name trim). Parents should accept an optional payload in submit handlers and prefer it over stale parent form refs.

### Lists & Cards
- For list items with long-press actions, prefer `useLongPress` to avoid accidental activation during scrolling.
- Emit three events to hosting page: `click`, `press-start`, `press-end`.

## Views (Pages)

### Principles
- Own page-level state and orchestration. Use composables + services.
- Fetch with `useDataFetching` where feasible for consistent UX.
- Avoid embedding domain logic directly; defer to services/composables.

### WorkoutsPage patterns
- Filtering via date pickers → build ISO range filters and pass to `workoutsService.getAll`.
- Card click routes to either active or view page based on `finished_at`.
- Long-press opens action modal; cancellation occurs on movement via `useLongPress`.

## Formatting Utilities

- `formatDuration(minutes)` for human-readable durations (app-wide):
  - `> 60m` → `Xh Ymin` (English standard in utils); for page-local Russian variants, use local formatter (e.g., `Xч Yм`).
- `formatters` export a consistent set of helpers (`date`, `time`, `duration`, `number`, `weight`, etc.).

## API Endpoints & URL Composition

- `appConfig.apiBaseUrl` already contains `/api/v1`. All service paths MUST be relative (e.g., `/workout-sets`).
- Add new endpoints to `constants/api-endpoints.ts` as relative strings or builder functions.
- Never hardcode full URLs in services.

## Logging

- Use `logger.info()` for successful writes/mutations.
- Use `errorHandler.log(error, 'Context')` everywhere errors are caught.
- Keep logs terse and actionable. Avoid leaking PII.

## Patterns to Reuse When Adding Features

1) Add DTOs/types in `types/models` (domain) and `types/api.ts` (API) if shapes differ.
2) Add endpoints in `constants/api-endpoints.ts`.
3) Implement service methods (map API → domain if necessary). Ensure relative URLs.
4) Build/reuse composables for view logic; keep components slim.
5) Use `useLongPress` for any card/item with long-press to avoid scroll/press conflicts.
6) Use `useToast` for feedback, passing `icon` only when explicitly available.
7) Validate no duplication of `/api/v1` in requests.

## Reference Snippets

Service call with domain mapping:
```ts
const response = await apiClient.get<{ data: ApiCycle }>(`${this.baseUrl}/${id}`);
return this.mapCycleFromApi(response.data.data);
```

Data fetching in a page:
```ts
const { data, loading, error, execute } = useDataFetching(() => service.getAll(filters), { immediate: true });
```

Card with long-press:
```vue
@click="handleClick" @touchstart="lp.handleTouchStart" @touchmove="lp.handleTouchMove" @touchend="lp.handleTouchEnd"
```

Toast without implicit icon loading:
```ts
await showSuccess('Готово'); // no icon unless explicitly provided
```


