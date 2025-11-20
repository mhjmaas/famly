# web-profile Specification

## Purpose
TBD - created by archiving change add-profile-page. Update Purpose after archive.
## Requirements
### Requirement: User profile display
The web application MUST display authenticated user profile information including personal details and karma balance, with options to edit profile or logout.

#### Scenario: Profile page displays user information
- **GIVEN** an authenticated user with name "John Doe", birthdate "1985-03-15", role "parent", and karma balance 245
- **WHEN** the user navigates to `/app/profile`
- **THEN** the page displays a profile card
- **AND** the card shows an avatar with user initials "JD"
- **AND** the card displays the user name "John Doe"
- **AND** the card displays the calculated age from birthdate
- **AND** the card displays a role badge showing "Parent"
- **AND** the card displays karma balance "245 Karma" with a Sparkles icon
- **AND** the card displays a dropdown menu trigger (three vertical dots icon)

#### Scenario: Profile card dropdown menu displays options
- **GIVEN** an authenticated user viewing the profile page
- **WHEN** the user clicks the dropdown menu trigger (MoreVertical icon)
- **THEN** a dropdown menu opens aligned to the right
- **AND** the menu displays "Edit Profile" option with an Edit icon
- **AND** the menu displays "Logout" option with a LogOut icon in destructive color

#### Scenario: Profile page handles missing birthdate
- **GIVEN** an authenticated user without a birthdate
- **WHEN** the profile page renders
- **THEN** the age display is omitted
- **AND** all other profile information displays normally

#### Scenario: Profile page displays child role
- **GIVEN** an authenticated user with role "child"
- **WHEN** the profile page renders
- **THEN** the role badge displays "Child" with secondary variant styling
- **AND** the badge is visually distinct from the parent badge

#### Scenario: Profile page loads karma from API
- **GIVEN** an authenticated user in a family
- **WHEN** the profile page renders
- **THEN** the karma balance is fetched from `/v1/families/:familyId/karma/balance/:userId`
- **AND** the karma displays in the user profile card
- **AND** loading state shows "—" while karma is being fetched

### Requirement: Edit profile functionality
The web application MUST allow users to edit their profile information through a dialog modal.

#### Scenario: User opens edit profile dialog
- **GIVEN** an authenticated user viewing the profile page
- **WHEN** the user clicks "Edit Profile" from the dropdown menu
- **THEN** a dialog modal opens with title "Edit Profile"
- **AND** the dialog displays a description "Update your profile information"
- **AND** the dialog contains an input field for "Name" pre-filled with current name
- **AND** the dialog contains a date input field for "Birthdate" pre-filled with current birthdate
- **AND** the dialog contains a select dropdown for "Role" pre-filled with current role
- **AND** the dialog displays "Cancel" and "Save Changes" buttons

#### Scenario: User edits profile information
- **GIVEN** the edit profile dialog is open
- **WHEN** the user changes the name field to "Jane Smith"
- **AND** the user changes the birthdate to "1990-05-20"
- **AND** the user changes the role to "child"
- **AND** the user clicks "Save Changes"
- **THEN** the profile updates are saved (API call to be implemented)
- **AND** the dialog closes
- **AND** the profile card reflects the updated information

#### Scenario: User cancels profile edit
- **GIVEN** the edit profile dialog is open with modified fields
- **WHEN** the user clicks "Cancel" or closes the dialog
- **THEN** the dialog closes without saving changes
- **AND** the profile card displays original information

#### Scenario: Save button is disabled for invalid data
- **GIVEN** the edit profile dialog is open
- **WHEN** the user clears the name field or birthdate field
- **THEN** the "Save Changes" button is disabled
- **AND** the user cannot save the profile with incomplete data

### Requirement: Logout functionality
The web application MUST allow users to logout and clear their session securely.

#### Scenario: User initiates logout
- **GIVEN** an authenticated user viewing the profile page
- **WHEN** the user clicks "Logout" from the dropdown menu
- **THEN** the Redux user state is cleared via clearUser() action
- **AND** the session cookie is deleted via clearInvalidSession() server action
- **AND** the user is redirected to "/signin" page
- **AND** the user can no longer access authenticated routes

#### Scenario: Logout handles errors gracefully
- **GIVEN** an authenticated user initiating logout
- **WHEN** the session cookie deletion fails
- **THEN** an error is logged to the console
- **AND** the Redux user state is still cleared
- **AND** the user is still redirected to "/signin"
- **AND** the application remains stable despite the error

#### Scenario: Logout clears all user data from Redux
- **GIVEN** an authenticated user with data in Redux store (user profile, karma, etc.)
- **WHEN** the user logs out
- **THEN** the user slice profile is set to null
- **AND** the user slice error is cleared
- **AND** the application treats the user as unauthenticated

### Requirement: User preferences management
The web application MUST allow users to view and modify their theme and language preferences.

#### Scenario: Preferences card displays theme and language options
- **GIVEN** an authenticated user viewing the profile page
- **WHEN** the preferences card renders
- **THEN** the card displays a "Preferences" heading
- **AND** the card shows a "Language" option with the language selector component
- **AND** the card shows a "Theme" option with the theme toggle component
- **AND** each option includes a description of its purpose

#### Scenario: User changes theme preference
- **GIVEN** an authenticated user viewing the profile page with light theme active
- **WHEN** the user clicks the theme toggle to switch to dark mode
- **THEN** the entire application theme changes to dark mode
- **AND** the theme preference persists across page reloads
- **AND** the theme toggle reflects the new state

#### Scenario: User changes language preference
- **GIVEN** an authenticated user viewing the profile page with English language active
- **WHEN** the user selects Dutch from the language selector
- **THEN** the page content immediately updates to Dutch
- **AND** the navigation labels update to Dutch
- **AND** the language preference persists across page reloads

### Requirement: Activity timeline display
The web application MUST display a chronological timeline of user activity showing tasks completed and rewards claimed.

#### Scenario: Activity timeline displays recent events
- **GIVEN** an authenticated user with multiple activity events
- **WHEN** the profile page loads
- **THEN** an "Activity Timeline" section displays below preferences
- **AND** the timeline shows up to 100 most recent events
- **AND** events are fetched from `/v1/activity-events` endpoint
- **AND** events are sorted by timestamp descending (most recent first)

#### Scenario: Activity events are grouped by date
- **GIVEN** an activity timeline with events from multiple dates
- **WHEN** the timeline renders
- **THEN** events are grouped under date headers
- **AND** each date header displays the full date format "Monday, November 3, 2025"
- **AND** events under each date are sorted by time descending
- **AND** date headers are visually separated with horizontal lines

#### Scenario: Task completion event displays correctly
- **GIVEN** an activity event of type "task_completed" with name "Grocery shopping", karma change +15, and timestamp "2025-01-27T14:30:00Z"
- **WHEN** the event renders in the timeline
- **THEN** a CheckCircle2 icon displays with green background
- **AND** the task name "Grocery shopping" displays as the heading
- **AND** the description displays "Completed grocery shopping"
- **AND** the time displays as "2:30 PM"
- **AND** the karma change displays as "+15" in green with an upward arrow
- **AND** a Sparkles icon appears next to the karma change

#### Scenario: Reward claim event displays correctly
- **GIVEN** an activity event of type "reward_claimed" with name "Extra Screen Time", karma change -50, and timestamp "2025-01-26T18:45:00Z"
- **WHEN** the event renders in the timeline
- **THEN** a Gift icon displays with primary color background
- **AND** the reward name "Extra Screen Time" displays as the heading
- **AND** the description displays "Claimed reward: Extra Screen Time"
- **AND** the time displays as "6:45 PM"
- **AND** the karma change displays as "-50" in red with a downward arrow
- **AND** a Sparkles icon appears next to the karma change

#### Scenario: Empty activity timeline displays appropriate message
- **GIVEN** an authenticated user with no activity events
- **WHEN** the activity timeline renders
- **THEN** the timeline section displays
- **AND** an empty state message displays "No activity yet"
- **AND** the message encourages the user to complete tasks or claim rewards

### Requirement: Redux store for global state
The web application MUST provide a Redux store that makes authenticated user data and karma available throughout the application with selective re-rendering.

#### Scenario: Redux store loads with server-side preloaded state
- **GIVEN** an authenticated user with session cookie
- **WHEN** the application root layout renders
- **THEN** the layout fetches user data from `/v1/auth/me` endpoint server-side
- **AND** the layout fetches karma balance from karma endpoint server-side
- **AND** the Redux store is created with preloadedState containing user and karma
- **AND** the user data is immediately available in Redux store
- **AND** no loading state is shown on initial render

#### Scenario: Redux store provides user slice
- **GIVEN** a Redux store with preloaded user data
- **WHEN** the store is initialized
- **THEN** the user slice contains profile, isLoading, and error state
- **AND** the user slice provides setUser and clearUser actions
- **AND** the user slice provides fetchUser async thunk for refetching
- **AND** selectors are available for accessing user data

#### Scenario: Redux store provides karma slice
- **GIVEN** a Redux store with preloaded karma data
- **WHEN** the store is initialized
- **THEN** the karma slice contains balances map (userId → balance)
- **AND** the karma slice provides setKarma, incrementKarma, decrementKarma actions
- **AND** the karma slice provides fetchKarma async thunk for refetching
- **AND** selectors are available for accessing karma by userId

#### Scenario: Components use Redux selectors for data access
- **GIVEN** a component within the StoreProvider tree
- **WHEN** the component calls useAppSelector(selectUser)
- **THEN** the hook returns the current user object from Redux store
- **AND** the component only re-renders when user data changes
- **AND** the component can access karma via useAppSelector(selectKarmaBalance(userId))
- **AND** the component only re-renders when that specific karma value changes

#### Scenario: Redux store handles unauthenticated state
- **GIVEN** an unauthenticated user (no session cookie)
- **WHEN** the application root layout renders
- **THEN** the Redux store is created with empty preloadedState
- **AND** components using selectUser receive null for user
- **AND** the application handles the unauthenticated state gracefully

#### Scenario: Redux async thunks update data
- **GIVEN** a component with access to useAppDispatch
- **WHEN** the component dispatches fetchUser() thunk
- **THEN** fresh user data is fetched from `/v1/auth/me`
- **AND** the user slice state updates with new data
- **AND** only components using selectUser re-render
- **WHEN** the component dispatches fetchKarma({ familyId, userId }) thunk
- **THEN** fresh karma balance is fetched from the karma endpoint
- **AND** the karma slice balances map updates
- **AND** only components using that userId's karma re-render

#### Scenario: Redux actions provide type-safe state updates
- **GIVEN** a component with access to useAppDispatch
- **WHEN** the component dispatches incrementKarma({ userId: 'user123', amount: 10 })
- **THEN** the karma balance for user123 increases by 10 in the store
- **AND** all components displaying user123's karma re-render with new value
- **WHEN** the component dispatches decrementKarma({ userId: 'user123', amount: 50 })
- **THEN** the karma balance for user123 decreases by 50 in the store
- **AND** all components displaying user123's karma re-render with new value

### Requirement: Dashboard navigation integration
The web application MUST display real authenticated user data in the dashboard navigation instead of hardcoded values.

#### Scenario: Desktop navigation displays real user data from Redux
- **GIVEN** an authenticated user with name "Jane Smith" and karma balance 180 in Redux store
- **WHEN** the desktop sidebar renders
- **THEN** the component uses useAppSelector(selectUser) to get user data
- **AND** the component uses useAppSelector(selectKarmaBalance(userId)) to get karma
- **AND** the user profile section displays "Jane Smith"
- **AND** the karma display shows "180 Karma"
- **AND** the avatar displays initials "JS"
- **AND** the component only re-renders when user or karma data changes in Redux

#### Scenario: Tablet navigation displays real karma from Redux
- **GIVEN** an authenticated user with karma balance 245 in Redux store
- **WHEN** the tablet sidebar renders
- **THEN** the component uses useAppSelector(selectKarmaBalance(userId)) to get karma
- **AND** the user profile section displays the karma "245"
- **AND** the component only re-renders when karma data changes in Redux

#### Scenario: Mobile drawer displays real user data from Redux
- **GIVEN** an authenticated user with name "John Doe", family "The Doe Family", and karma 245 in Redux store
- **WHEN** the mobile navigation drawer opens
- **THEN** the component uses useAppSelector(selectUser) and useAppSelector(selectKarmaBalance(userId))
- **AND** the user profile section displays "John Doe"
- **AND** the family name displays "The Doe Family"
- **AND** the karma display shows "245 Karma"
- **AND** the component only re-renders when relevant Redux state changes

#### Scenario: Navigation handles missing user data gracefully
- **GIVEN** an unauthenticated user or Redux store with no user data
- **WHEN** the navigation renders
- **THEN** the component uses useAppSelector(selectUser) which returns null
- **AND** loading placeholders display for name and karma
- **AND** the avatar displays a generic placeholder
- **AND** no errors are thrown

### Requirement: API client extensions
The web application MUST extend the API client to support new profile-related endpoints.

#### Scenario: API client fetches user profile
- **GIVEN** an authenticated session with valid cookie
- **WHEN** getMe() is called
- **THEN** a GET request is sent to `/v1/auth/me`
- **AND** the request includes credentials (cookies)
- **AND** the response includes user object with id, email, name, birthdate, families
- **AND** the response includes authType indicating authentication method

#### Scenario: API client fetches karma balance
- **GIVEN** an authenticated session and family ID "abc123" and user ID "user456"
- **WHEN** getKarmaBalance("abc123", "user456") is called
- **THEN** a GET request is sent to `/v1/families/abc123/karma/balance/user456`
- **AND** the request includes credentials (cookies)
- **AND** the response includes balance as a number
- **AND** the response includes last updated timestamp

#### Scenario: API client fetches activity events
- **GIVEN** an authenticated session
- **WHEN** getActivityEvents() is called with no date filters
- **THEN** a GET request is sent to `/v1/activity-events`
- **AND** the request includes credentials (cookies)
- **AND** the response includes an array of activity events
- **AND** each event includes id, type, entityName, karmaChange, timestamp

#### Scenario: API client fetches filtered activity events
- **GIVEN** an authenticated session
- **WHEN** getActivityEvents("2025-01-01", "2025-01-31") is called
- **THEN** a GET request is sent to `/v1/activity-events?startDate=2025-01-01&endDate=2025-01-31`
- **AND** the request includes credentials (cookies)
- **AND** the response includes only events within the date range

#### Scenario: API client handles errors
- **GIVEN** an authenticated session
- **WHEN** an API call fails with 401 Unauthorized
- **THEN** an ApiError is thrown with status 401
- **AND** the error message indicates authentication failure
- **AND** the error can be caught and handled by calling code

### Requirement: Responsive design
The web application MUST ensure the profile page is fully responsive across mobile, tablet, and desktop breakpoints.

#### Scenario: Profile page adapts to mobile layout
- **GIVEN** a user viewing the profile page on a mobile device (viewport < 768px)
- **WHEN** the page renders
- **THEN** the header with theme/language selectors is hidden
- **AND** all cards stack vertically with full width
- **AND** the avatar size is appropriate for mobile
- **AND** the activity timeline events display in single column

#### Scenario: Profile page adapts to tablet layout
- **GIVEN** a user viewing the profile page on a tablet device (768px <= viewport < 1024px)
- **WHEN** the page renders
- **THEN** the page layout is similar to desktop
- **AND** cards may have slightly reduced padding
- **AND** all content remains readable and accessible

#### Scenario: Profile page displays desktop layout
- **GIVEN** a user viewing the profile page on a desktop device (viewport >= 1024px)
- **WHEN** the page renders
- **THEN** the header displays with theme and language selectors
- **AND** cards have appropriate spacing and padding
- **AND** the activity timeline displays with optimal width

### Requirement: Internationalization
The web application MUST provide translations for all profile page content in supported languages.

#### Scenario: Profile page displays in English
- **GIVEN** a user with language preference set to English
- **WHEN** the profile page renders
- **THEN** the page title displays "Profile"
- **AND** the subtitle displays "Manage your profile and view your activity"
- **AND** the preferences heading displays "Preferences"
- **AND** the activity timeline heading displays "Activity Timeline"
- **AND** all labels and descriptions display in English

#### Scenario: Profile page displays in Dutch
- **GIVEN** a user with language preference set to Dutch
- **WHEN** the profile page renders
- **THEN** the page title displays "Profiel"
- **AND** the subtitle displays "Beheer je profiel en bekijk je activiteit"
- **AND** all content displays in Dutch translations

#### Scenario: Activity events are formatted with correct locale
- **GIVEN** a user with language preference set to Dutch
- **WHEN** activity events render
- **THEN** date headers display in Dutch format "maandag 3 november 2025"
- **AND** time displays in 24-hour format for Dutch locale
- **AND** karma descriptions use Dutch translations

### Requirement: Missing UI components
The web application MUST include all necessary UI components from shadcn/ui for the profile page.

#### Scenario: Avatar component is available
- **GIVEN** the profile page needs to display user avatars
- **WHEN** the Avatar component is imported from @/components/ui/avatar
- **THEN** the component is available and properly typed
- **AND** the component supports AvatarImage and AvatarFallback sub-components
- **AND** the component is styled consistently with the design system

#### Scenario: DropdownMenu component is available
- **GIVEN** the profile page needs dropdown menus (future edit/logout actions)
- **WHEN** the DropdownMenu component is imported from @/components/ui/dropdown-menu
- **THEN** the component is available and properly typed
- **AND** the component supports all sub-components (Trigger, Content, Item, etc.)

#### Scenario: Dialog component is available
- **GIVEN** the profile page needs modal dialogs (future edit profile)
- **WHEN** the Dialog component is imported from @/components/ui/dialog
- **THEN** the component is available and properly typed
- **AND** the component supports all sub-components (Header, Title, Description, Footer)

#### Scenario: Select component is available
- **GIVEN** the profile page needs select dropdowns (future role selection)
- **WHEN** the Select component is imported from @/components/ui/select
- **THEN** the component is available and properly typed
- **AND** the component supports all sub-components (Trigger, Content, Item, Value)

### Requirement: Error handling
The web application MUST handle errors gracefully throughout the profile page.

#### Scenario: Profile page handles failed user data fetch
- **GIVEN** the `/v1/auth/me` endpoint returns 401 Unauthorized
- **WHEN** the root layout attempts to fetch user data
- **THEN** the error is caught and logged
- **AND** the UserProvider receives null for initial user
- **AND** the user is redirected to signin page
- **AND** no error message is displayed to the user on the profile page

#### Scenario: Profile page handles failed karma fetch
- **GIVEN** the karma balance endpoint returns an error
- **WHEN** the user context attempts to load karma
- **THEN** the error is caught and stored in context
- **AND** the karma display shows "—" as a fallback
- **AND** the rest of the profile page continues to function

#### Scenario: Profile page handles failed activity events fetch
- **GIVEN** the activity events endpoint returns an error
- **WHEN** the profile page attempts to load events
- **THEN** the error is caught and logged
- **AND** the activity timeline displays an empty state
- **AND** the rest of the profile page continues to function

#### Scenario: Profile page handles network errors
- **GIVEN** a network error occurs during any API call
- **WHEN** the error is caught
- **THEN** an appropriate user-friendly error message is displayed
- **AND** the user can retry the operation if applicable
- **AND** the application remains stable and functional

### Requirement: Accessibility
The web application MUST ensure the profile page is accessible to users with disabilities.

#### Scenario: Profile page uses semantic HTML
- **GIVEN** a user viewing the profile page
- **WHEN** the HTML structure is inspected
- **THEN** the page uses appropriate heading hierarchy (h1, h2, h3)
- **AND** the activity timeline uses semantic list elements
- **AND** all interactive elements are keyboard accessible

#### Scenario: Profile page has proper ARIA labels
- **GIVEN** a screen reader user viewing the profile page
- **WHEN** navigating through the page
- **THEN** all icons have appropriate aria-label or aria-hidden attributes
- **AND** all interactive elements have clear accessible names
- **AND** loading states announce to screen readers

#### Scenario: Profile page supports keyboard navigation
- **GIVEN** a keyboard user viewing the profile page
- **WHEN** navigating with Tab key
- **THEN** all interactive elements can be reached
- **AND** focus indicators are clearly visible
- **AND** the tab order is logical and follows visual order

#### Scenario: Profile page has sufficient color contrast
- **GIVEN** a user with visual impairments viewing the profile page
- **WHEN** viewing in both light and dark themes
- **THEN** all text has minimum 4.5:1 contrast ratio for normal text
- **AND** all text has minimum 3:1 contrast ratio for large text
- **AND** interactive elements have sufficient contrast in all states

### Requirement: Profile page change-password flow
The profile page dropdown MUST let authenticated users rotate their password via a responsive dialog/drawer experience, localized to the active language.

#### Scenario: Menu surfaces change password action
- **GIVEN** an authenticated user viewing the profile card menu
- **WHEN** the user opens the existing More menu
- **THEN** a "Change Password" option appears between "Edit Profile" and "Logout"
- **AND** the label and description use strings from `dict.profile.security.changePassword` for the active locale.

#### Scenario: Desktop dialog vs mobile drawer
- **GIVEN** the user selects "Change Password"
- **WHEN** the viewport width is ≥768px
- **THEN** a modal dialog opens with localized title/description, inputs for current password, new password, and confirmation, and primary/secondary buttons
- **AND** when the viewport width is <768px the same content renders inside a bottom drawer with identical validation rules
- **AND** the submit button remains disabled until all fields are filled and new/confirm match with minimum-length validation feedback inline.

#### Scenario: Successful password update logs the user out
- **GIVEN** the change-password form is valid
- **WHEN** the form submits successfully (API 204)
- **THEN** the UI displays a transient success toast or inline banner explaining the user must sign in again
- **AND** the flow immediately calls the existing logout helper, clears Redux user state, and routes the browser to `/{lang}/signin`.

#### Scenario: Localization coverage for errors and success
- **GIVEN** the user triggers validation errors (mismatch passwords, too short, missing current password) or server errors (invalid current password)
- **WHEN** the UI renders helper/error text
- **THEN** every string (labels, descriptions, button text, error messages, success confirmation) is sourced from the profile dictionary in both `en-US` and `nl-NL`.

### Requirement: Language selector syncs with backend preference
The web application MUST treat the backend-stored `user.language` as the source of truth for authenticated users and keep it in sync when the user changes locale.

#### Scenario: Changing language updates user profile
- **GIVEN** an authenticated user viewing any page with the language selector
- **WHEN** the user switches from `"en-US"` to `"nl-NL"`
- **THEN** the app calls the profile update endpoint with `language: "nl-NL"`
- **AND** refreshes the local user state so subsequent renders use `"nl-NL"` without a full reload

#### Scenario: Login/registration seeds stored language
- **GIVEN** an authenticated login or registration flow occurring under the route locale `/nl-NL`
- **WHEN** the auth request is completed
- **THEN** the client includes the active locale in the auth request
- **AND** the stored `user.language` matches the route locale used for the session

#### Scenario: Stored language drives locale for authenticated routes
- **GIVEN** an authenticated user with `user.language: "nl-NL"` and a request to `/` from a browser whose Accept-Language prefers English
- **WHEN** the app selects the locale for rendering/redirects
- **THEN** it uses the stored `user.language` (`"nl-NL"`) and routes the user to the Dutch locale variant of the page

