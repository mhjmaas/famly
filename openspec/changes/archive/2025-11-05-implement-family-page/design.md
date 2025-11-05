# Design: implement-family-page

## Architecture Overview

This change implements a complete family management page in the web application, connecting the frontend UI to existing backend APIs through a new Redux slice for state management.

### Component Architecture

```
FamilyPage (apps/web/src/app/[lang]/app/family/page.tsx)
└── DashboardLayout
    └── FamilyView (apps/web/src/components/family/family-view.tsx)
        ├── Family Members Grid
        │   └── FamilyMemberCard[] (apps/web/src/components/family/family-member-card.tsx)
        │       ├── Avatar with initials
        │       ├── Name and age
        │       ├── Role badge
        │       ├── Karma display
        │       └── Actions dropdown (parent-only)
        │           ├── Give Karma
        │           ├── Edit Role
        │           └── Remove Member
        ├── EditRoleDialog (apps/web/src/components/family/edit-role-dialog.tsx)
        ├── RemoveMemberDialog (apps/web/src/components/family/remove-member-dialog.tsx)
        ├── GiveKarmaDialog (apps/web/src/components/family/give-karma-dialog.tsx)
        └── AddMemberDialog (apps/web/src/components/family/add-member-dialog.tsx)
```

### State Management Architecture

**Redux Slice**: `apps/web/src/store/slices/family.slice.ts`

State shape:
```typescript
interface FamilyState {
  families: FamilyWithMembers[] | null;
  currentFamily: FamilyWithMembers | null;
  isLoading: boolean;
  error: string | null;
  operations: {
    updateRole: { isLoading: boolean; error: string | null };
    removeMember: { isLoading: boolean; error: string | null };
    grantKarma: { isLoading: boolean; error: string | null };
    addMember: { isLoading: boolean; error: string | null };
  };
}
```

**Async Thunks**:
- `fetchFamilies` - GET /v1/families
- `updateMemberRole` - PATCH /v1/families/{familyId}/members/{memberId}
- `removeFamilyMember` - DELETE /v1/families/{familyId}/members/{memberId}
- `grantMemberKarma` - POST /v1/families/{familyId}/karma/grant
- `addFamilyMember` - POST /v1/families/{familyId}/members

**Selectors**:
- `selectFamilies` - All families
- `selectCurrentFamily` - First family (MVP assumes single family)
- `selectFamilyMembers` - Members of current family
- `selectFamilyLoading` - Loading state
- `selectFamilyError` - Error state
- `selectOperationLoading(operation)` - Loading state for specific operation
- `selectOperationError(operation)` - Error state for specific operation

### API Client Extensions

**New types** (`apps/web/src/lib/api-client.ts`):
```typescript
interface FamilyWithMembers {
  familyId: string;
  name: string;
  role: 'Parent' | 'Child';
  linkedAt: string;
  members: FamilyMember[];
}

interface FamilyMember {
  memberId: string;
  name: string;
  birthdate: string;
  role: 'Parent' | 'Child';
  linkedAt: string;
  addedBy?: string;
}

interface UpdateMemberRoleRequest {
  role: 'Parent' | 'Child';
}

interface UpdateMemberRoleResponse {
  memberId: string;
  familyId: string;
  role: 'Parent' | 'Child';
  updatedAt: string;
}

interface GrantKarmaRequest {
  userId: string;
  amount: number; // -100000 to 100000
  description?: string; // max 500 chars
}

interface GrantKarmaResponse {
  eventId: string;
  familyId: string;
  userId: string;
  amount: number;
  totalKarma: number;
  description: string;
  grantedBy: string;
  createdAt: string;
}

interface AddFamilyMemberRequest {
  email: string;
  password: string;
  role: 'Parent' | 'Child';
  name: string;
  birthdate: string; // ISO YYYY-MM-DD
}

interface AddFamilyMemberResponse {
  memberId: string;
  familyId: string;
  role: 'Parent' | 'Child';
  linkedAt: string;
  addedBy: string;
}
```

**New API functions**:
```typescript
getFamilies(): Promise<FamilyWithMembers[]>
updateMemberRole(familyId: string, memberId: string, data: UpdateMemberRoleRequest): Promise<UpdateMemberRoleResponse>
removeMember(familyId: string, memberId: string): Promise<void>
grantKarma(familyId: string, data: GrantKarmaRequest): Promise<GrantKarmaResponse>
addFamilyMember(familyId: string, data: AddFamilyMemberRequest): Promise<AddFamilyMemberResponse>
```

## Component Design Details

### FamilyView Component

**Responsibilities**:
- Fetch families on mount using Redux thunk
- Display loading state while fetching
- Display error state if fetch fails
- Display empty state if no members
- Render family members grid
- Manage dialog open/close states
- Coordinate between member cards and dialogs

**State** (local component state):
```typescript
const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
const [isGiveKarmaDialogOpen, setIsGiveKarmaDialogOpen] = useState(false);
const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
```

**Props**:
```typescript
interface FamilyViewProps {
  mobileActionTrigger?: number; // For mobile + button trigger
  lang: Locale;
  dict: Dictionary;
}
```

### FamilyMemberCard Component

**Responsibilities**:
- Display member avatar (initials from name)
- Display member name and calculated age
- Display role badge (styled differently for Parent vs Child)
- Display karma count with Sparkles icon
- Show actions dropdown (parent-only, hidden for child users)
- Emit events when actions are selected

**Props**:
```typescript
interface FamilyMemberCardProps {
  member: FamilyMember;
  currentUserRole: 'Parent' | 'Child';
  onEditRole: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
  onGiveKarma: (member: FamilyMember) => void;
  dict: Dictionary;
}
```

**Utilities**:
```typescript
// Calculate age from birthdate
function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
```

### EditRoleDialog Component

**Responsibilities**:
- Display current member's name and current role
- Provide Select component for choosing new role
- Disable submit if role hasn't changed
- Call Redux thunk to update role
- Show loading state during update
- Show error if update fails
- Close on success with success feedback
- Optimistically update UI (or refetch)

**Props**:
```typescript
interface EditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: Dictionary;
}
```

**Validation**:
- Role must be either "Parent" or "Child"
- Role must be different from current role

### RemoveMemberDialog Component

**Responsibilities**:
- Display AlertDialog with warning message
- Show member name being removed
- Prevent removing last parent (validation)
- Call Redux thunk to remove member
- Show loading state during removal
- Show error if removal fails
- Close on success with success feedback
- Optimistically update UI (or refetch)

**Props**:
```typescript
interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: Dictionary;
}
```

**Validation**:
- Cannot remove last parent in the family (check member count and roles)

### GiveKarmaDialog Component

**Responsibilities**:
- Display member name receiving karma
- Provide RadioGroup for positive/negative karma type
- Provide number Input for amount (1 to 100,000)
- Provide Textarea for description (required, max 500 chars)
- Apply correct sign to amount based on karma type
- Call Redux thunk to grant karma
- Show loading state during grant
- Show error if grant fails
- Close on success with success feedback
- Optimistically update member's karma (or refetch)

**Props**:
```typescript
interface GiveKarmaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: Dictionary;
}
```

**State**:
```typescript
const [karmaType, setKarmaType] = useState<'positive' | 'negative'>('positive');
const [amount, setAmount] = useState('');
const [description, setDescription] = useState('');
```

**Validation**:
- Amount must be > 0 and <= 100,000
- Description must not be empty and <= 500 chars
- Apply sign based on karmaType: positive → +amount, negative → -amount

### AddMemberDialog Component

**Responsibilities**:
- Provide form fields: email, password, name, birthdate, role
- Validate all fields client-side
- Call Redux thunk to add member
- Show loading state during addition
- Show error if addition fails
- Close on success with success feedback
- Refetch families to show new member

**Props**:
```typescript
interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  dict: Dictionary;
}
```

**State**:
```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  name: '',
  birthdate: '',
  role: 'Child' as 'Parent' | 'Child',
});
```

**Validation**:
- Email: required, valid email format
- Password: required, min 8 characters
- Name: required, max 120 characters
- Birthdate: required, valid date in YYYY-MM-DD format, not in future
- Role: required, "Parent" or "Child"

## Data Flow

### Fetch Families on Page Load
1. User navigates to `/app/family`
2. FamilyPage renders → FamilyView component mounts
3. FamilyView dispatches `fetchFamilies()` thunk in useEffect
4. Redux marks state as loading
5. API client calls `GET /v1/families`
6. Response contains families with members array
7. Redux stores families in state and marks loading as false
8. FamilyView receives families from selector and renders member cards

### Update Member Role
1. User clicks "Edit" in member card dropdown
2. FamilyView opens EditRoleDialog with selected member
3. User selects new role and clicks "Save"
4. EditRoleDialog dispatches `updateMemberRole()` thunk
5. Redux marks operation as loading
6. API client calls `PATCH /v1/families/{familyId}/members/{memberId}`
7. Backend validates parent role, updates membership, returns updated data
8. Redux updates member in state (or refetches families)
9. EditRoleDialog closes and shows success message
10. FamilyView re-renders with updated role

### Remove Member
1. User clicks "Remove" in member card dropdown
2. FamilyView opens RemoveMemberDialog with selected member
3. Dialog validates not removing last parent
4. User clicks "Confirm"
5. RemoveMemberDialog dispatches `removeFamilyMember()` thunk
6. Redux marks operation as loading
7. API client calls `DELETE /v1/families/{familyId}/members/{memberId}`
8. Backend validates parent role, removes membership
9. Redux removes member from state (or refetches families)
10. RemoveMemberDialog closes and shows success message
11. FamilyView re-renders without removed member

### Grant Karma
1. User clicks "Give Karma" in member card dropdown
2. FamilyView opens GiveKarmaDialog with selected member
3. User selects type, enters amount and description, clicks "Give Karma"
4. GiveKarmaDialog dispatches `grantMemberKarma()` thunk
5. Redux marks operation as loading
6. API client calls `POST /v1/families/{familyId}/karma/grant`
7. Backend validates parent role, creates karma event, updates member karma
8. Response includes new total karma
9. Redux updates member's karma in state (or refetches families)
10. GiveKarmaDialog closes and shows success message
11. FamilyView re-renders with updated karma

### Add Member
1. User clicks "Add Member" button (desktop) or + icon (mobile)
2. FamilyView opens AddMemberDialog
3. User fills form and clicks "Add Member"
4. AddMemberDialog validates form client-side
5. AddMemberDialog dispatches `addFamilyMember()` thunk
6. Redux marks operation as loading
7. API client calls `POST /v1/families/{familyId}/members`
8. Backend validates parent role, creates user account, creates membership
9. Response includes new member data
10. Redux refetches families to include new member
11. AddMemberDialog closes and shows success message
12. FamilyView re-renders with new member

## Error Handling Strategy

### API Errors
- All API client functions throw `ApiError` with status and message
- Redux thunks catch errors and store them in slice state
- Components display errors using shadcn/ui Alert component
- Parent-only operations return 403 → show "You don't have permission" message
- Validation errors return 400 → show specific validation message
- Not found errors return 404 → show "Member not found" message

### Form Validation
- Client-side validation mirrors backend Zod validators
- Show validation errors inline before API call
- Prevent submission if validation fails
- Clear errors when user corrects input

### Loading States
- Disable form submit buttons during loading
- Show spinner or loading indicator in dialogs
- Disable member cards during operations
- Prevent multiple simultaneous operations

## Testing Strategy

### Unit Tests (`family.slice.test.ts`)

Test async thunks:
- `fetchFamilies` - success, failure, empty response
- `updateMemberRole` - success, failure, 403 error
- `removeFamilyMember` - success, failure, 403 error, 404 error
- `grantMemberKarma` - success, failure, validation error
- `addFamilyMember` - success, failure, validation error

Test reducers:
- Initial state
- Pending states set loading flags
- Fulfilled states update data and clear loading
- Rejected states set errors and clear loading

Test selectors:
- `selectCurrentFamily` returns first family
- `selectFamilyMembers` returns members of current family
- Operation selectors return correct loading/error states

### E2E Tests (Playwright)

**Test file**: `apps/web/tests/e2e/app/family.spec.ts`

Scenarios:
1. Display family members correctly
   - Setup: Create family with 2 parents and 2 children
   - Navigate to /app/family
   - Verify all 4 members displayed
   - Verify names, roles, karma counts visible

2. Update member role (parent user)
   - Setup: Parent user, family with child member
   - Open edit role dialog for child
   - Change role to "Parent"
   - Verify success message
   - Verify role badge updated to "Parent"

3. Update member role (unauthorized - child user)
   - Setup: Child user
   - Verify "Edit" action not visible in dropdown

4. Remove member (parent user)
   - Setup: Parent user, family with 2 parents and 1 child
   - Open remove dialog for child
   - Confirm removal
   - Verify success message
   - Verify member no longer displayed

5. Remove member (last parent protection)
   - Setup: Parent user, family with 1 parent and 1 child
   - Attempt to remove the parent
   - Verify removal prevented with error message

6. Give positive karma (parent user)
   - Setup: Parent user, family with child (karma: 100)
   - Open give karma dialog
   - Select "Positive", enter amount 50, enter message
   - Submit
   - Verify success message
   - Verify karma updated to 150

7. Give negative karma (parent user)
   - Setup: Parent user, family with child (karma: 100)
   - Open give karma dialog
   - Select "Negative", enter amount 30, enter message
   - Submit
   - Verify success message
   - Verify karma updated to 70

8. Give karma validation errors
   - Setup: Parent user
   - Open give karma dialog
   - Submit without message → verify error
   - Submit with amount 0 → verify error
   - Submit with amount > 100000 → verify error

9. Add new member (parent user)
   - Setup: Parent user
   - Open add member dialog
   - Fill form: email, password, name, birthdate, role
   - Submit
   - Verify success message
   - Verify new member displayed

10. Add member validation errors
    - Setup: Parent user
    - Open add member dialog
    - Submit without email → verify error
    - Submit with invalid email → verify error
    - Submit without name → verify error
    - Submit without birthdate → verify error

11. Empty state display
    - Setup: Family with only current user
    - Navigate to /app/family
    - Verify empty state message displayed

12. Responsive layout
    - Test mobile (< 768px), tablet (768-1023px), desktop (>= 1024px)
    - Verify member grid adjusts columns
    - Verify mobile + button triggers add dialog

## Internationalization

**Dictionary keys** (add to `apps/web/src/dictionaries/en-US.json` and `nl-NL.json`):

```json
{
  "dashboard": {
    "pages": {
      "family": {
        "title": "Family Members",
        "description": "Manage your family members",
        "addMember": "Add Member",
        "emptyState": {
          "title": "No family members yet",
          "description": "Click 'Add Member' to get started"
        },
        "memberCard": {
          "yearsOld": "years old",
          "karma": "Karma",
          "roleParent": "Parent",
          "roleChild": "Child",
          "actions": {
            "giveKarma": "Give Karma",
            "editRole": "Edit Role",
            "remove": "Remove"
          }
        },
        "editRoleDialog": {
          "title": "Edit Member Role",
          "description": "Update the member's role in the family",
          "currentRole": "Current role",
          "newRole": "New role",
          "cancel": "Cancel",
          "save": "Save Changes",
          "success": "Member role updated successfully"
        },
        "removeDialog": {
          "title": "Remove Family Member",
          "description": "Are you sure you want to remove {{name}} from the family?",
          "warning": "This action cannot be undone.",
          "lastParentError": "Cannot remove the last parent from the family",
          "cancel": "Cancel",
          "confirm": "Remove Member",
          "success": "Member removed successfully"
        },
        "giveKarmaDialog": {
          "title": "Give Karma to {{name}}",
          "description": "Award or deduct karma with a message explaining why",
          "karmaType": "Karma Type",
          "positive": "Positive (Award)",
          "negative": "Negative (Deduct)",
          "amount": "Amount",
          "amountPlaceholder": "Enter karma amount",
          "message": "Message",
          "messagePlaceholder": "Explain why you're giving or deducting karma...",
          "messageRequired": "Message is required",
          "cancel": "Cancel",
          "submit": "Give Karma",
          "success": "Karma updated successfully"
        },
        "addMemberDialog": {
          "title": "Add Family Member",
          "description": "Add a new member to your family",
          "email": "Email",
          "emailPlaceholder": "Enter email",
          "password": "Password",
          "passwordPlaceholder": "Enter password",
          "name": "Name",
          "namePlaceholder": "Enter name",
          "birthdate": "Birthdate",
          "birthdatePlaceholder": "Select birthdate",
          "role": "Role",
          "roleParent": "Parent",
          "roleChild": "Child",
          "cancel": "Cancel",
          "submit": "Add Member",
          "success": "Member added successfully"
        },
        "errors": {
          "loadFailed": "Failed to load family members",
          "updateRoleFailed": "Failed to update member role",
          "removeFailed": "Failed to remove member",
          "grantKarmaFailed": "Failed to grant karma",
          "addMemberFailed": "Failed to add member",
          "unauthorized": "You don't have permission to perform this action",
          "notFound": "Member not found",
          "invalidAmount": "Amount must be between 1 and 100,000",
          "invalidEmail": "Please enter a valid email address",
          "passwordTooShort": "Password must be at least 8 characters",
          "invalidDate": "Please enter a valid date",
          "futureDateNotAllowed": "Birthdate cannot be in the future"
        }
      }
    }
  }
}
```

## Design System Alignment

### Colors
- Role badges: Parent → `bg-primary/10 text-primary`, Child → `bg-chart-2/10 text-chart-2`
- Karma icon: `text-primary fill-primary` with Sparkles icon
- Card hover: `hover:shadow-lg transition-shadow`
- Error messages: `text-destructive`

### Components
- All dialogs use shadcn/ui Dialog or AlertDialog
- All buttons use shadcn/ui Button component
- All form inputs use shadcn/ui Input, Select, Textarea, Label
- All cards use shadcn/ui Card, CardContent
- All avatars use shadcn/ui Avatar, AvatarFallback
- All badges use shadcn/ui Badge
- All dropdowns use shadcn/ui DropdownMenu

### Typography
- Member name: `font-semibold text-lg`
- Member age: `text-sm text-muted-foreground`
- Dialog titles: `text-lg font-semibold`
- Dialog descriptions: `text-sm text-muted-foreground`
- Form labels: `text-sm font-medium`

### Spacing
- Card padding: `p-6`
- Grid gap: `gap-6`
- Form field gap: `space-y-4`
- Dialog content padding: `p-6`

### Responsive Breakpoints
- Mobile (< 768px): 1 column grid, mobile header with + button
- Tablet (768px - 1023px): 2 column grid
- Desktop (≥ 1024px): 3 column grid, desktop header with "Add Member" button

## Implementation Notes

### Optimistic Updates vs Refetch
For this implementation, we'll use a **refetch strategy** after mutations to ensure data consistency:
- After updating role, removing member, granting karma, or adding member
- Dispatch `fetchFamilies()` again to get fresh data
- This is simpler and more reliable than optimistic updates for MVP
- Can optimize to optimistic updates in future iterations

### Current Family Selection
- MVP assumes user belongs to exactly one family
- Redux selector `selectCurrentFamily` returns `families[0]`
- Future enhancement: support multiple families with family switcher

### Authorization Checks
- Frontend checks current user's role to show/hide actions
- Backend always validates authorization (don't trust frontend)
- If backend returns 403, show appropriate error message

### Form Reset on Dialog Close
- Always reset form state when dialog closes
- Clear validation errors
- Reset to initial/empty values

### Loading States
- Individual operation loading states (don't block entire page)
- Show loading spinner in dialog submit button
- Disable dialog submit button during loading

### Error Display
- Show errors in AlertDialog or inline in dialogs
- Auto-dismiss success messages after 3 seconds
- Keep error messages visible until user dismisses
