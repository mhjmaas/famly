# Add Profile Page - Technical Design

## Architecture Overview

### Redux State Management Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Root Layout (Server)                       │
│  - Fetches user data from /v1/auth/me                       │
│  - Fetches karma from /v1/families/:id/karma/balance/:uid   │
│  - Passes initial state to Redux Provider                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Redux Provider (Client Component)               │
│  Store:                                                      │
│    slices/                                                   │
│      ├── user.slice.ts  (user profile, families)            │
│      └── karma.slice.ts (karma balances per user/family)    │
│  Future:                                                     │
│      ├── tasks.slice.ts                                     │
│      ├── rewards.slice.ts                                   │
│      ├── family.slice.ts                                    │
│      ├── chat.slice.ts                                      │
│      └── shoppingLists.slice.ts                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ Dashboard Nav    │      │  Profile Page    │
│ - useAppSelector │      │  - useAppSelector│
│ - selectUser     │      │  - selectKarma   │
│ - selectKarma    │      │  - Server loads  │
│ - Auto-updates   │      │    activity data │
└──────────────────┘      └──────────────────┘
```

### Data Flow
1. **Initial Load (Server Side):**
   - Root layout fetches user data from `/v1/auth/me` server-side
   - Root layout fetches karma data from karma endpoint server-side
   - Passes serialized data as Redux store preloadedState
   - Profile page fetches additional data (activity events) server-side

2. **Client Side:**
   - Redux store hydrates with preloadedState from server
   - Components use `useAppSelector` to subscribe to specific slices
   - Only components whose data changed will re-render (selective updates)
   - Actions dispatched via `useAppDispatch` hook

3. **Updates:**
   - Profile edits (future) dispatch actions → API call → update slice
   - Task completions dispatch `karmaSlice.increment()` → updates everywhere
   - Reward claims dispatch `karmaSlice.decrement()` → updates everywhere
   - Activity events refetch dispatches action → updates timeline

## Component Architecture

### New Redux Structure
```
src/
├── store/
│   ├── store.ts                   # Configure Redux store
│   ├── hooks.ts                   # Typed useAppSelector, useAppDispatch
│   └── slices/
│       ├── user.slice.ts          # User profile, families, auth state
│       └── karma.slice.ts         # Karma balances (userId → balance map)
├── components/
│   ├── profile/
│   │   ├── profile-view.tsx       # Main profile page component
│   │   ├── user-profile-card.tsx  # User info card
│   │   ├── preferences-card.tsx   # Theme/language preferences
│   │   └── activity-timeline.tsx  # Activity events timeline
│   └── ui/
│       ├── avatar.tsx             # Avatar component (shadcn)
│       ├── dropdown-menu.tsx      # DropdownMenu component (shadcn)
│       ├── dialog.tsx             # Dialog component (shadcn)
│       └── select.tsx             # Select component (shadcn)
└── lib/
    └── api-client.ts              # Extended with new API methods
```

### API Client Extensions
```typescript
// Add to api-client.ts

export interface UserProfile {
  id: string
  email: string
  name: string
  birthdate?: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  families: Array<{
    id: string
    name: string
    role: "parent" | "child"
  }>
}

export interface MeResponse {
  user: UserProfile
  authType: "cookie" | "bearer-jwt" | "bearer-session"
}

export async function getMe(): Promise<MeResponse> {
  return apiClient<MeResponse>("/v1/auth/me")
}

export interface KarmaBalance {
  userId: string
  familyId: string
  balance: number
  lastUpdated: string
}

export async function getKarmaBalance(
  familyId: string,
  userId: string
): Promise<KarmaBalance> {
  return apiClient<KarmaBalance>(
    `/v1/families/${familyId}/karma/balance/${userId}`
  )
}

export interface ActivityEvent {
  id: string
  userId: string
  familyId: string
  type: "task_completed" | "reward_claimed"
  entityType: "task" | "reward"
  entityId: string
  entityName: string
  karmaChange: number
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface ListEventsResponse {
  events: ActivityEvent[]
}

export async function getActivityEvents(
  startDate?: string,
  endDate?: string
): Promise<ActivityEvent[]> {
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const queryString = params.toString()
  const endpoint = `/v1/activity-events${queryString ? `?${queryString}` : ""}`

  return apiClient<ActivityEvent[]>(endpoint)
}
```

## Redux Implementation

### Store Configuration
```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/user.slice'
import karmaReducer from './slices/karma.slice'

export const makeStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      user: userReducer,
      karma: karmaReducer,
    },
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production',
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
```

### Typed Hooks
```typescript
// src/store/hooks.ts
import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
```

### User Slice
```typescript
// src/store/slices/user.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getMe, type UserProfile } from '@/lib/api-client'

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
}

// Async thunk for fetching user
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async () => {
    const response = await getMe()
    return response.user
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload
      state.error = null
    },
    clearUser: (state) => {
      state.profile = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch user'
      })
  },
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer

// Selectors
export const selectUser = (state: RootState) => state.user.profile
export const selectUserLoading = (state: RootState) => state.user.isLoading
export const selectUserError = (state: RootState) => state.user.error
export const selectCurrentFamily = (state: RootState) =>
  state.user.profile?.families?.[0] || null
```

### Karma Slice
```typescript
// src/store/slices/karma.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getKarmaBalance } from '@/lib/api-client'
import type { RootState } from '../store'

interface KarmaState {
  // Map of userId → karma balance
  balances: Record<string, number>
  isLoading: boolean
  error: string | null
}

const initialState: KarmaState = {
  balances: {},
  isLoading: false,
  error: null,
}

// Async thunk for fetching karma
export const fetchKarma = createAsyncThunk(
  'karma/fetchKarma',
  async ({ familyId, userId }: { familyId: string; userId: string }) => {
    const response = await getKarmaBalance(familyId, userId)
    return { userId, balance: response.balance }
  }
)

const karmaSlice = createSlice({
  name: 'karma',
  initialState,
  reducers: {
    setKarma: (state, action: PayloadAction<{ userId: string; balance: number }>) => {
      state.balances[action.payload.userId] = action.payload.balance
    },
    incrementKarma: (state, action: PayloadAction<{ userId: string; amount: number }>) => {
      const current = state.balances[action.payload.userId] || 0
      state.balances[action.payload.userId] = current + action.payload.amount
    },
    decrementKarma: (state, action: PayloadAction<{ userId: string; amount: number }>) => {
      const current = state.balances[action.payload.userId] || 0
      state.balances[action.payload.userId] = Math.max(0, current - action.payload.amount)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKarma.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchKarma.fulfilled, (state, action) => {
        state.isLoading = false
        state.balances[action.payload.userId] = action.payload.balance
      })
      .addCase(fetchKarma.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch karma'
      })
  },
})

export const { setKarma, incrementKarma, decrementKarma } = karmaSlice.actions
export default karmaSlice.reducer

// Selectors
export const selectKarmaBalance = (userId: string) => (state: RootState) =>
  state.karma.balances[userId] || 0
export const selectKarmaLoading = (state: RootState) => state.karma.isLoading
export const selectKarmaError = (state: RootState) => state.karma.error
```

### Integration Points

#### 1. Redux Provider Component (Client)
```typescript
// src/store/provider.tsx
"use client"

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from './store'
import type { RootState } from './store'

interface StoreProviderProps {
  children: React.ReactNode
  preloadedState?: Partial<RootState>
}

export function StoreProvider({ children, preloadedState }: StoreProviderProps) {
  const storeRef = useRef<AppStore>()

  if (!storeRef.current) {
    storeRef.current = makeStore(preloadedState)
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
```

#### 2. Root Layout (Server Component)
```typescript
// src/app/[lang]/layout.tsx

import { cookies } from "next/headers"
import { StoreProvider } from "@/store/provider"
import { getMe, getKarmaBalance } from "@/lib/api-client"
import type { RootState } from "@/store/store"

export default async function RootLayout({ children }) {
  let preloadedState: Partial<RootState> | undefined

  try {
    // Check if user is authenticated
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (sessionCookie) {
      // Fetch user data
      const response = await getMe()
      const user = response.user

      // Fetch karma for the current user
      let karmaBalance = 0
      if (user.families?.[0]) {
        const karmaData = await getKarmaBalance(user.families[0].id, user.id)
        karmaBalance = karmaData.balance
      }

      // Preload Redux state
      preloadedState = {
        user: {
          profile: user,
          isLoading: false,
          error: null,
        },
        karma: {
          balances: {
            [user.id]: karmaBalance,
          },
          isLoading: false,
          error: null,
        },
      }
    }
  } catch (error) {
    console.error("Failed to load initial state:", error)
  }

  return (
    <html>
      <body>
        <StoreProvider preloadedState={preloadedState}>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}
```

#### 3. Dashboard Navigation (Client Component)
```typescript
// src/components/layouts/dashboard-layout.tsx

"use client"

import { useAppSelector } from "@/store/hooks"
import { selectUser, selectUserLoading } from "@/store/slices/user.slice"
import { selectKarmaBalance } from "@/store/slices/karma.slice"

export function DashboardLayout({ children }) {
  const user = useAppSelector(selectUser)
  const isLoading = useAppSelector(selectUserLoading)
  const karma = useAppSelector(selectKarmaBalance(user?.id || ''))

  return (
    <div>
      {/* Sidebar */}
      <aside>
        {/* Navigation items */}

        {/* User Profile */}
        <div>
          <div>{user?.name || "Loading..."}</div>
          <div>{karma ?? "—"} Karma</div>
        </div>
      </aside>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}
```

#### 4. Profile Page (Server Component with Client Islands)
```typescript
// src/app/[lang]/app/profile/page.tsx

import { getActivityEvents } from "@/lib/api-client"
import { ProfileView } from "@/components/profile/profile-view"

export default async function ProfilePage() {
  let activityEvents = []

  try {
    activityEvents = await getActivityEvents()
  } catch (error) {
    console.error("Failed to load activity events:", error)
  }

  return <ProfileView initialEvents={activityEvents} />
}
```

```typescript
// src/components/profile/profile-view.tsx

"use client"

import { useAppSelector } from "@/store/hooks"
import { selectUser, selectUserLoading } from "@/store/slices/user.slice"
import { selectKarmaBalance } from "@/store/slices/karma.slice"
import { UserProfileCard } from "./user-profile-card"
import { PreferencesCard } from "./preferences-card"
import { ActivityTimeline } from "./activity-timeline"

export function ProfileView({ initialEvents }) {
  const user = useAppSelector(selectUser)
  const isLoading = useAppSelector(selectUserLoading)
  const karma = useAppSelector(selectKarmaBalance(user?.id || ''))

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <UserProfileCard user={user} karma={karma} />
      <PreferencesCard />
      <ActivityTimeline events={initialEvents} />
    </div>
  )
}
```

## Activity Timeline Design

### Event Grouping
Events are grouped by date for better readability:
```typescript
interface EventGroup {
  date: string // YYYY-MM-DD
  displayDate: string // "Monday, November 3, 2025"
  events: ActivityEvent[]
}

function groupEventsByDate(events: ActivityEvent[]): EventGroup[] {
  const groups = new Map<string, ActivityEvent[]>()

  for (const event of events) {
    const date = event.timestamp.split("T")[0]
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(event)
  }

  return Array.from(groups.entries()).map(([date, events]) => ({
    date,
    displayDate: formatDate(date),
    events,
  }))
}
```

### Event Display
Each event shows:
- Icon based on type (CheckCircle2 for tasks, Gift for rewards)
- Entity name (task or reward name)
- Timestamp (time only, date is in group header)
- Karma change with appropriate color (green for positive, red for negative)

### Performance Considerations
- Limit to 100 most recent events (handled by API)
- Server-side rendering for initial load
- No infinite scroll or pagination in MVP
- Future: Add pagination or virtual scrolling for large datasets

## Missing UI Components

Need to add these shadcn/ui components:

1. **Avatar** - For user profile pictures (with fallback to initials)
2. **DropdownMenu** - For future edit profile / logout actions
3. **Dialog** - For future edit profile modal
4. **Select** - For future role selection in edit profile

Installation command:
```bash
npx shadcn@latest add avatar dropdown-menu dialog select
```

## Internationalization

Add to dictionary files:

```typescript
// en-US.json
{
  "profile": {
    "title": "Profile",
    "subtitle": "Manage your profile and view your activity",
    "karma": "Karma",
    "yearsOld": "years old",
    "parent": "Parent",
    "child": "Child",
    "preferences": {
      "title": "Preferences",
      "subtitle": "Customize your app experience",
      "language": "Language",
      "languageDescription": "Choose your preferred language",
      "theme": "Theme",
      "themeDescription": "Choose your preferred theme"
    },
    "activity": {
      "title": "Activity Timeline",
      "subtitle": "Your recent tasks and rewards",
      "taskCompleted": "Completed {taskName}",
      "rewardClaimed": "Claimed reward: {rewardName}"
    }
  }
}

// nl-NL.json (similar structure with Dutch translations)
```

## Testing Strategy

### Unit Tests
1. **UserContext**
   - Renders provider with initial user
   - Loads karma when user is available
   - Refetch updates user and karma
   - Throws error when useUser used outside provider

2. **ProfileView Components**
   - UserProfileCard displays user info correctly
   - PreferencesCard renders theme and language selectors
   - ActivityTimeline groups events by date
   - ActivityTimeline formats events correctly

3. **API Client**
   - getMe returns user profile
   - getKarmaBalance returns karma data
   - getActivityEvents returns events list
   - Error handling for failed requests

### E2E Tests
1. **Profile Page**
   - Authenticated user can view profile page
   - Profile displays correct user information
   - Karma balance displays correctly
   - Activity timeline shows recent events
   - Theme selector changes theme
   - Language selector changes language
   - Dashboard navigation shows real user data

2. **Navigation Integration**
   - Dashboard shows authenticated user name
   - Dashboard shows current karma balance
   - Clicking profile in nav navigates to settings

## Future Expansion Path

Redux Toolkit is already set up for future growth:

1. **Phase 1 (Now - Profile Page):**
   - `user.slice.ts` - User profile and auth
   - `karma.slice.ts` - Karma balances

2. **Phase 2 (Tasks Feature):**
   - `tasks.slice.ts` - Tasks list, filters, completion status
   - Hook into `karma.slice` for automatic karma updates

3. **Phase 3 (Rewards Feature):**
   - `rewards.slice.ts` - Rewards catalog, favorites, claims
   - Hook into `karma.slice` for deductions

4. **Phase 4 (Full App):**
   - `family.slice.ts` - Family members, locations
   - `chat.slice.ts` - Conversations, messages, unread counts
   - `shoppingLists.slice.ts` - Lists and items

5. **Phase 5 (Advanced):**
   - Add RTK Query for API caching and optimistic updates
   - Add persistence middleware for offline support
   - Add real-time middleware for WebSocket integration

## Error Handling

1. **API Errors:**
   - Display user-friendly error messages
   - Fallback to "—" for missing karma
   - Empty state for failed activity events

2. **Authentication Errors:**
   - Redirect to signin if 401
   - Show error message for other failures

3. **Loading States:**
   - Skeleton loading for initial render
   - Spinner for refetch operations

## Performance Optimization

1. **Server-Side Rendering:** Profile page data loaded server-side
2. **Minimal Client JS:** Only interactive elements are client components
3. **Memoization:** Use React.memo for timeline items
4. **Code Splitting:** Dynamic imports for heavy components (future)

## Accessibility

1. **Semantic HTML:** Use appropriate heading levels
2. **ARIA Labels:** Add labels for icons and interactive elements
3. **Keyboard Navigation:** All interactive elements keyboard accessible
4. **Focus Management:** Proper focus indicators
5. **Screen Readers:** Meaningful alt text and descriptions
