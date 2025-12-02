# web-personal-diary Specification

## Purpose
TBD - created by archiving change add-personal-diary-page. Update Purpose after archive.
## Requirements
### Requirement: Personal Diary Page Display
The web app MUST display a personal diary page accessible to authenticated users.

#### Scenario: Page loads with header and title
- **GIVEN** an authenticated user
- **WHEN** they navigate to `/[lang]/app/diary`
- **THEN** the page displays the title "Personal Diary" (localized)
- **AND** a subtitle "Write your thoughts and memories" (localized)
- **AND** the page uses the DashboardLayout component

#### Scenario: Page redirects unauthenticated users
- **GIVEN** an unauthenticated user
- **WHEN** they attempt to access `/[lang]/app/diary`
- **THEN** they are redirected to the sign-in page

### Requirement: Diary Entry Creation
Users MUST be able to create new personal diary entries from the diary page.

#### Scenario: Create entry with valid content
- **GIVEN** an authenticated user on the diary page
- **WHEN** they enter text in the entry textarea
- **AND** click the "Add Entry" button
- **THEN** the entry is saved via POST to `/v1/diary`
- **AND** the new entry appears at the top of the entry list
- **AND** the textarea is cleared

#### Scenario: Prevent empty entry submission
- **GIVEN** an authenticated user on the diary page
- **WHEN** the entry textarea is empty or contains only whitespace
- **THEN** the "Add Entry" button is disabled

#### Scenario: Show loading state during creation
- **GIVEN** an authenticated user submitting a new entry
- **WHEN** the API request is in progress
- **THEN** the submit button shows a loading indicator
- **AND** the button is disabled until the request completes

### Requirement: Diary Entry Listing
Users MUST see their personal diary entries displayed in chronological order.

#### Scenario: Display entries grouped by date
- **GIVEN** an authenticated user with multiple diary entries
- **WHEN** they view the diary page
- **THEN** entries are grouped by date with date separators
- **AND** each group shows the date in "EEEE, MMMM d, yyyy" format (e.g., "Monday, January 27, 2025")
- **AND** entries within each group are sorted by time descending

#### Scenario: Display individual entry details
- **GIVEN** an authenticated user viewing diary entries
- **WHEN** an entry is displayed
- **THEN** it shows the entry content text
- **AND** the time in "h:mm a" format (e.g., "8:30 PM")
- **AND** a diary icon indicator

#### Scenario: Show empty state when no entries exist
- **GIVEN** an authenticated user with no diary entries
- **WHEN** they view the diary page
- **THEN** an empty state is displayed with a diary icon
- **AND** the message "No diary entries yet. Start writing!" (localized)

### Requirement: Diary Entry Search
Users MUST be able to search their diary entries by content.

#### Scenario: Search filters entries by content
- **GIVEN** an authenticated user with multiple diary entries
- **WHEN** they type in the search input
- **THEN** only entries containing the search text (case-insensitive) are displayed
- **AND** a filter indicator shows the active search query

#### Scenario: Clear search restores all entries
- **GIVEN** an authenticated user with an active search filter
- **WHEN** they clear the search input or click "Clear filters"
- **THEN** all entries are displayed again

#### Scenario: Show no results message
- **GIVEN** an authenticated user searching their entries
- **WHEN** no entries match the search query
- **THEN** the message "No entries found matching your search" (localized) is displayed

### Requirement: Diary Date Filter
Users MUST be able to filter diary entries by a specific date.

#### Scenario: Filter entries by selected date
- **GIVEN** an authenticated user with entries across multiple dates
- **WHEN** they select a date from the date picker
- **THEN** only entries from that date are displayed
- **AND** a filter indicator shows the selected date

#### Scenario: Clear date filter
- **GIVEN** an authenticated user with an active date filter
- **WHEN** they click "Clear filters" or the scroll-to-top button
- **THEN** the date filter is cleared
- **AND** all entries are displayed

### Requirement: Responsive Layout
The diary page MUST be responsive and work on both desktop and mobile devices.

#### Scenario: Desktop layout
- **GIVEN** a user on a desktop viewport (lg breakpoint and above)
- **WHEN** viewing the diary page
- **THEN** the header shows title, description, search input, and date picker inline
- **AND** the new entry form is displayed as a card

#### Scenario: Mobile layout
- **GIVEN** a user on a mobile viewport (below lg breakpoint)
- **WHEN** viewing the diary page
- **THEN** the search input and date picker are displayed in a compact row
- **AND** the header title is hidden (shown in mobile nav)
- **AND** a floating action button appears for scroll-to-top when scrolled

### Requirement: Scroll to Top
Users MUST be able to quickly scroll to the top of the diary page.

#### Scenario: Show scroll button when scrolled
- **GIVEN** an authenticated user who has scrolled down the diary page
- **WHEN** the top of the page is more than 100px above the viewport
- **THEN** a floating scroll-to-top button appears

#### Scenario: Scroll to top and clear filters
- **GIVEN** an authenticated user with the scroll button visible
- **WHEN** they click the scroll-to-top button
- **THEN** the page scrolls smoothly to the top
- **AND** any active search or date filters are cleared

### Requirement: Redux State Management
The diary page MUST use Redux for state management following existing patterns.

#### Scenario: Fetch entries on page load
- **GIVEN** an authenticated user navigating to the diary page
- **WHEN** the DiaryView component mounts
- **THEN** the `fetchDiaryEntries` thunk is dispatched
- **AND** entries are loaded into the Redux store

#### Scenario: Optimistic create updates
- **GIVEN** a user creating a new diary entry
- **WHEN** the create request succeeds
- **THEN** the new entry is added to the Redux store
- **AND** the entry list updates without a full refetch

#### Scenario: Handle API errors
- **GIVEN** an API request fails
- **WHEN** fetching or creating entries
- **THEN** the error is stored in Redux state
- **AND** an appropriate error message can be displayed

### Requirement: Internationalization
The diary page MUST support multiple languages (en-US, nl-NL).

#### Scenario: English translations
- **GIVEN** a user with locale set to en-US
- **WHEN** viewing the diary page
- **THEN** all text is displayed in English

#### Scenario: Dutch translations
- **GIVEN** a user with locale set to nl-NL
- **WHEN** viewing the diary page
- **THEN** all text is displayed in Dutch

### Requirement: Test Coverage
The diary feature MUST have comprehensive test coverage.

#### Scenario: Unit tests for Redux slice
- **GIVEN** the diary Redux slice
- **WHEN** running unit tests
- **THEN** all reducers, thunks, and selectors have 100% coverage

#### Scenario: E2E tests with page object
- **GIVEN** the diary E2E test suite
- **WHEN** tests are executed
- **THEN** all tests use the DiaryPage page object
- **AND** all locators use data-testid attributes

### Requirement: Data Test IDs
All interactive elements MUST have data-testid attributes for E2E testing.

#### Scenario: Header elements have test IDs
- **GIVEN** the diary page header
- **WHEN** rendered
- **THEN** the title has `data-testid="diary-title"`
- **AND** the description has `data-testid="diary-description"`

#### Scenario: Form elements have test IDs
- **GIVEN** the new entry form
- **WHEN** rendered
- **THEN** the textarea has `data-testid="diary-entry-input"`
- **AND** the submit button has `data-testid="diary-submit-button"`

#### Scenario: Entry elements have test IDs
- **GIVEN** a diary entry card
- **WHEN** rendered
- **THEN** the card has `data-testid="diary-entry-card"`
- **AND** the content has `data-testid="diary-entry-content"`
- **AND** the time has `data-testid="diary-entry-time"`

#### Scenario: Filter elements have test IDs
- **GIVEN** the filter controls
- **WHEN** rendered
- **THEN** the search input has `data-testid="diary-search-input"`
- **AND** the date picker trigger has `data-testid="diary-date-picker"`
- **AND** the clear filters button has `data-testid="diary-clear-filters"`

