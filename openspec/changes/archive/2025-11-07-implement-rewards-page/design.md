# Design: Implement Rewards Page

## Architecture Overview

This implementation follows the established patterns from the Tasks and Family pages, adapting them for the rewards domain. The architecture consists of:

1. **Page Component** (`apps/web/src/app/[lang]/app/rewards/page.tsx`) - Server-side rendered entry point
2. **View Component** (`apps/web/src/components/rewards/RewardsView.tsx`) - Client-side container with business logic
3. **Redux State Management** - Two slices for rewards and claims
4. **Presentation Components** - Modular, reusable components for UI elements
5. **E2E Tests** - Page object pattern for comprehensive workflow testing
6. **Unit Tests** - 100% coverage of Redux slices

## Component Structure

### Component Breakdown from Reference Design

The reference design's large `rewards-view.tsx` (554 lines) will be decomposed as follows:

```
RewardsView.tsx (main container, ~150 lines)
├── KarmaBalanceCard.tsx (~50 lines)
│   └── Displays user's current karma with visual indicator
├── RewardsGrid.tsx (~80 lines)
│   └── Maps rewards array to RewardCard components
├── RewardCard.tsx (~120 lines)
│   ├── RewardImage with favourite toggle
│   ├── RewardDetails (name, description, karma cost)
│   ├── ProgressBar (for favourited rewards)
│   ├── RewardMetadata (claim count)
│   └── RewardActions (claim button, parent menu)
├── RewardDialog.tsx (~100 lines)
│   └── RewardForm for create/edit operations
├── ClaimConfirmationSheet.tsx (~80 lines)
│   └── Displays reward details and confirms claim action
└── EmptyState.tsx (~40 lines)
    └── Shows when no rewards exist
```

### Component Responsibilities

**RewardsView.tsx** (Client Component)
- Fetches data using Redux thunks on mount
- Manages dialog/sheet open/close state
- Coordinates between child components
- Handles create/edit/delete/claim user actions
- Props: `dict`, `familyId`, `userId`, `userRole`, `userKarma`

**KarmaBalanceCard.tsx**
- Pure presentational component
- Displays current karma balance with Sparkles icon
- Props: `karma: number`, `dict`

**RewardsGrid.tsx**
- Maps rewards array to RewardCard components
- Handles empty state when no rewards
- Props: `rewards`, `onClaim`, `onEdit`, `onDelete`, `onToggleFavourite`, `userRole`, `userKarma`, `dict`

**RewardCard.tsx**
- Displays single reward with all metadata
- Handles favourite toggle
- Shows progress bar if favourited
- Displays claim button with status (available/insufficient karma/pending)
- Shows parent actions menu (edit/delete)
- Props: `reward`, `isFavourited`, `isPending`, `canClaim`, `onClaim`, `onEdit`, `onDelete`, `onToggleFavourite`, `userRole`, `dict`

**RewardDialog.tsx**
- Controlled dialog for create/edit
- Form with name, karma cost, description (optional), imageUrl (optional)
- Client-side validation before submission
- Props: `isOpen`, `mode: 'create' | 'edit'`, `reward?`, `onSubmit`, `onClose`, `dict`

**ClaimConfirmationSheet.tsx**
- Shows reward details and claim consequences
- Explains pending workflow
- Props: `reward`, `isOpen`, `onConfirm`, `onCancel`, `dict`

**EmptyState.tsx**
- Shows appropriate message for parent vs child
- Provides create button for parents
- Props: `userRole`, `onCreateClick`, `dict`

## State Management

### Redux Slice: `rewards.slice.ts`

```typescript
interface RewardsState {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Async Thunks
- fetchRewards(familyId: string)
- createReward({ familyId, data: CreateRewardRequest })
- updateReward({ familyId, rewardId, data: UpdateRewardRequest })
- deleteReward({ familyId, rewardId })
- toggleFavourite({ familyId, rewardId, isFavourite: boolean })

// Selectors
- selectRewards
- selectRewardsLoading
- selectRewardsError
- selectRewardById(rewardId)
- selectFavouritedRewards(userId)
```

### Redux Slice: `claims.slice.ts`

```typescript
interface ClaimsState {
  claims: Claim[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Async Thunks
- fetchClaims(familyId: string)
- claimReward({ familyId, rewardId })
- cancelClaim({ familyId, claimId })

// Selectors
- selectClaims
- selectClaimsLoading
- selectClaimsError
- selectPendingClaims
- selectClaimByReward(rewardId, userId)
- selectUserPendingClaims(userId)
```

### State Coordination

**Rewards + Claims Integration**:
- RewardsView fetches both rewards and claims on mount
- RewardCard determines pending status by checking claims for matching rewardId + userId
- Claiming a reward dispatches `claimReward` thunk which:
  1. Calls API to create claim
  2. Updates claims slice with new claim
  3. Automatically triggers parent task creation (backend handles this)

**Rewards + Karma Integration**:
- RewardsView receives `userKarma` from parent page component
- Karma slice is updated when parent completes claim approval task (backend deducts karma)
- RewardCard uses `userKarma` to determine if claim button is enabled

**Optimistic Updates**:
- Favourite toggle updates Redux state immediately, reverts on API error
- Reward creation adds to local state immediately, updates with API response
- Claim creation updates claims state immediately

## Data Flow

### Page Load Flow
```
1. Page.tsx (RSC)
   ↓ fetch user, family, karma via API
2. RewardsView.tsx (Client)
   ↓ useEffect on mount
3. Redux: dispatch(fetchRewards(familyId))
   ↓ API call
4. Redux: dispatch(fetchClaims(familyId))
   ↓ API call
5. Components re-render with data
```

### Claim Reward Flow
```
1. User clicks "Claim" on RewardCard
   ↓
2. RewardsView opens ClaimConfirmationSheet
   ↓
3. User confirms in sheet
   ↓
4. Redux: dispatch(claimReward({ familyId, rewardId }))
   ↓ API: POST /v1/families/{familyId}/rewards/{rewardId}/claim
5. Backend creates claim + auto-task for parent
   ↓
6. Redux updates claims state
   ↓
7. RewardCard shows "Pending" status
```

### Cancel Claim Flow
```
1. User clicks cancel on pending claim (from reward card dropdown or separate UI)
   ↓
2. Redux: dispatch(cancelClaim({ familyId, claimId }))
   ↓ API: DELETE /v1/families/{familyId}/claims/{claimId}
3. Backend cancels claim + deletes auto-task
   ↓
4. Redux updates claims state (claim.status = 'cancelled')
   ↓
5. RewardCard re-renders showing "Claim" button
```

### Parent Completes Claim Flow (handled by backend)
```
1. Parent completes auto-task via Tasks page
   ↓ Backend task completion hook
2. Backend updates claim status to 'completed'
3. Backend deducts karma from member
   ↓
4. On next rewards page refresh:
5. Redux: fetchClaims() gets updated claim
6. Redux: karma slice has updated balance
7. RewardCard shows updated claim count
```

## API Integration

### Endpoints Used

All endpoints exist per `openspec/specs/rewards/spec.md`:

**Rewards**:
- `GET /v1/families/{familyId}/rewards` - List rewards with metadata
- `POST /v1/families/{familyId}/rewards` - Create reward (parent only)
- `GET /v1/families/{familyId}/rewards/{rewardId}` - Get reward details
- `PATCH /v1/families/{familyId}/rewards/{rewardId}` - Update reward (parent only)
- `DELETE /v1/families/{familyId}/rewards/{rewardId}` - Delete reward (parent only)
- `POST /v1/families/{familyId}/rewards/{rewardId}/favourite` - Toggle favourite

**Claims**:
- `GET /v1/families/{familyId}/claims` - List claims (own or all if parent)
- `POST /v1/families/{familyId}/rewards/{rewardId}/claim` - Claim reward
- `GET /v1/families/{familyId}/claims/{claimId}` - Get claim details
- `DELETE /v1/families/{familyId}/claims/{claimId}` - Cancel claim

### API Client Functions

New functions to add to `apps/web/src/lib/api-client.ts`:

```typescript
// Rewards
export async function getRewards(familyId: string, cookieString?: string): Promise<Reward[]>
export async function createReward(familyId: string, data: CreateRewardRequest, cookieString?: string): Promise<Reward>
export async function updateReward(familyId: string, rewardId: string, data: UpdateRewardRequest, cookieString?: string): Promise<Reward>
export async function deleteReward(familyId: string, rewardId: string, cookieString?: string): Promise<void>
export async function toggleRewardFavourite(familyId: string, rewardId: string, isFavourite: boolean, cookieString?: string): Promise<void>

// Claims
export async function getClaims(familyId: string, status?: 'pending' | 'completed' | 'cancelled', cookieString?: string): Promise<Claim[]>
export async function claimReward(familyId: string, rewardId: string, cookieString?: string): Promise<Claim>
export async function cancelClaim(familyId: string, claimId: string, cookieString?: string): Promise<Claim>
```

## Type Definitions

### New Types for `apps/web/src/types/api.types.ts`

```typescript
export interface Reward {
  _id: string;
  familyId: string;
  name: string;
  karmaCost: number;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Metadata (computed per user)
  claimCount?: number;
  isFavourite?: boolean;
}

export interface Claim {
  _id: string;
  familyId: string;
  rewardId: string;
  memberId: string;
  status: 'pending' | 'completed' | 'cancelled';
  karmaCost: number;
  autoTaskId?: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  // Populated fields
  reward?: Reward;
  member?: FamilyMember;
}

export interface CreateRewardRequest {
  name: string;
  karmaCost: number;
  description?: string;
  imageUrl?: string;
}

export interface UpdateRewardRequest {
  name?: string;
  karmaCost?: number;
  description?: string | null;
  imageUrl?: string | null;
}
```

## Translation Keys

### Structure in `en-US.json` and `nl-NL.json`

```json
{
  "dashboard": {
    "pages": {
      "rewards": {
        "title": "Rewards",
        "description": "Redeem your karma points for exciting rewards",
        "karmaBalance": {
          "title": "Your Available Karma",
          "amount": "{amount}"
        },
        "emptyState": {
          "title": "No rewards yet",
          "parentDescription": "Create your first reward to motivate your family",
          "childDescription": "Ask a parent to add rewards",
          "createButton": "Create Reward"
        },
        "card": {
          "claimCount": "Claimed {count}x",
          "claimButton": "Claim",
          "pendingButton": "Pending",
          "insufficientKarma": "Not enough karma",
          "progress": {
            "saving": "Saving progress",
            "complete": "You have enough karma!",
            "needed": "{amount} more karma needed"
          },
          "favourite": "Favourite this reward",
          "unfavourite": "Remove from favourites",
          "edit": "Edit",
          "delete": "Delete"
        },
        "dialog": {
          "create": {
            "title": "Create New Reward",
            "description": "Add a new reward for family members to claim"
          },
          "edit": {
            "title": "Edit Reward",
            "description": "Update the reward details"
          },
          "fields": {
            "name": {
              "label": "Reward Name",
              "placeholder": "e.g., Extra Screen Time",
              "required": "required"
            },
            "karmaCost": {
              "label": "Karma Points Required",
              "placeholder": "e.g., 50",
              "required": "required"
            },
            "imageUrl": {
              "label": "Image URL",
              "placeholder": "https://example.com/image.jpg (optional)",
              "help": "Leave empty to auto-generate a placeholder based on the reward name"
            },
            "description": {
              "label": "Description",
              "placeholder": "Describe what this reward includes...",
              "addButton": "Description"
            }
          },
          "actions": {
            "cancel": "Cancel",
            "create": "Create Reward",
            "update": "Update Reward"
          }
        },
        "claimSheet": {
          "title": "Claim Reward",
          "description": "Are you sure you want to claim this reward? The karma points will be deducted and a parent will be notified to fulfill your reward.",
          "cost": "Cost",
          "karma": "{amount} Karma",
          "whatHappensNext": {
            "title": "What happens next?",
            "steps": [
              "{amount} karma points will be deducted from your balance",
              "A task will be created for parents to fulfill your reward",
              "Your reward status will show as \"Pending\" until a parent completes the task",
              "Once fulfilled, you'll be able to claim rewards again"
            ]
          },
          "actions": {
            "cancel": "Cancel",
            "confirm": "Confirm Claim"
          }
        },
        "actions": {
          "createButton": "New Reward"
        }
      }
    }
  }
}
```

## Testing Strategy

### E2E Tests (`apps/web/tests/e2e/app/rewards.spec.ts`)

**Test Scenarios**:
1. Page loads and displays rewards
2. Parent can create a new reward
3. Parent can edit an existing reward
4. Parent can delete a reward
5. Member can favourite a reward
6. Favourited reward shows progress bar
7. Member can claim a reward with sufficient karma
8. Claim button is disabled with insufficient karma
9. Pending claim shows correct status
10. Member can cancel pending claim
11. Empty state shows for family with no rewards
12. Mobile, tablet, desktop responsive layouts

**Page Object** (`apps/web/tests/e2e/pages/rewards.page.ts`):
```typescript
export class RewardsPage {
  // Locators
  readonly pageTitle: Locator;
  readonly karmaBalanceCard: Locator;
  readonly createRewardButton: Locator;
  readonly rewardsGrid: Locator;
  readonly rewardCards: Locator;
  readonly rewardNames: Locator;
  readonly claimButtons: Locator;
  readonly favouriteButtons: Locator;
  readonly progressBars: Locator;
  readonly rewardActionsMenus: Locator;
  readonly emptyState: Locator;

  // Dialog locators
  readonly rewardDialog: Locator;
  readonly nameInput: Locator;
  readonly karmaCostInput: Locator;
  readonly descriptionInput: Locator;
  readonly imageUrlInput: Locator;
  readonly dialogSubmitButton: Locator;

  // Sheet locators
  readonly claimSheet: Locator;
  readonly claimConfirmButton: Locator;

  // Helpers
  async gotoRewards(locale?: string): Promise<void>;
  async createReward(data: CreateRewardRequest): Promise<void>;
  async claimReward(rewardIndex: number): Promise<void>;
  async toggleFavourite(rewardIndex: number): Promise<void>;
  async getRewardCount(): Promise<number>;
  async isRewardPending(rewardIndex: number): Promise<boolean>;
}
```

### Unit Tests

**`rewards.slice.test.ts`** - 100% coverage including:
- Initial state
- fetchRewards thunk (success, error, loading)
- createReward thunk with optimistic update
- updateReward thunk
- deleteReward thunk with optimistic removal
- toggleFavourite with optimistic toggle
- All selectors

**`claims.slice.test.ts`** - 100% coverage including:
- Initial state
- fetchClaims thunk (success, error, loading)
- claimReward thunk
- cancelClaim thunk
- selectPendingClaims selector
- selectClaimByReward selector

## Open Design Decisions

### 1. Claim Cancellation UI Placement

**Options**:
A. Add cancel option to reward card dropdown menu (alongside edit/delete for parents)
B. Create separate "My Claims" section/page
C. Show pending claims in a banner at top of rewards page

**Recommendation**: **Option A** - Add cancel to reward card dropdown when claim is pending
- Keeps UI simple and contextual
- User sees cancel option right where they claimed
- Follows pattern of task actions in tasks page

### 2. Progress Bar Overflow Behavior

**Already decided in reference design (line 218)**: Cap at 100%
- `Math.min(progress, 100)`
- Shows "You have enough karma!" message when >= 100%

### 3. Reward Image Fallback

**Options**:
A. Use placeholder.svg with query param (reference design approach)
B. Use placeholder images from public folder
C. Use CSS background with reward emoji/icon

**Recommendation**: **Option A** - Follow reference design
- Consistent with reference implementation
- Allows server-side placeholder generation
- Can enhance later with actual image service

### 4. Favourites Persistence

**Question**: Store favourites in backend or localStorage?

**Answer**: Backend (via `/rewards/:id/favourite` endpoint)
- Favourites sync across devices
- Metadata persists correctly
- Follows existing API design

### 5. Real-time Updates

**Question**: Should we poll for claim status updates or rely on manual refresh?

**Recommendation**: Manual refresh (page reload) for MVP
- Parent approvals happen via tasks page
- User can refresh to see updated claim status
- Avoid complexity of websockets/polling
- Can add later as enhancement

## File Structure

```
apps/web/src/
├── app/[lang]/app/rewards/
│   └── page.tsx                          # Server component page
├── components/rewards/
│   ├── RewardsView.tsx                   # Main client container
│   ├── KarmaBalanceCard.tsx             # Karma display
│   ├── RewardsGrid.tsx                  # Grid wrapper
│   ├── RewardCard.tsx                   # Individual reward
│   ├── RewardDialog.tsx                 # Create/edit dialog
│   ├── ClaimConfirmationSheet.tsx       # Claim confirmation
│   └── EmptyState.tsx                   # No rewards state
├── store/slices/
│   ├── rewards.slice.ts                 # Rewards state
│   └── claims.slice.ts                  # Claims state
├── lib/
│   └── api-client.ts                    # Add rewards/claims functions
└── types/
    └── api.types.ts                     # Add Reward, Claim types

apps/web/tests/
├── e2e/app/
│   └── rewards.spec.ts                  # E2E tests
├── e2e/pages/
│   └── rewards.page.ts                  # Page object
└── unit/store/
    ├── rewards.slice.test.ts            # Redux unit tests
    └── claims.slice.test.ts             # Redux unit tests
```
