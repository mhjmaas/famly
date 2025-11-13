# web-rewards Specification

## Purpose
TBD - created by archiving change implement-rewards-page. Update Purpose after archive.
## Requirements
### Requirement: Rewards Page Display
The web application MUST display a rewards page showing all family rewards with metadata, karma balance, and claim status.

#### Scenario: Load rewards page with rewards
- **GIVEN** an authenticated family member accessing `/app/rewards`
- **WHEN** the page loads
- **THEN** the page displays the user's current karma balance
- **AND** displays all rewards for the family in a grid layout
- **AND** each reward shows name, description, image, karma cost, and claim count
- **AND** each reward shows the user's favourite status
- **AND** each reward shows pending claim status if user has pending claim
- **AND** favourited rewards display a progress bar showing karma savings progress

#### Scenario: Load rewards page with no rewards
- **GIVEN** an authenticated family member in a family with no rewards
- **WHEN** the page loads
- **THEN** an empty state card is displayed
- **AND** if user is a parent, a "Create Reward" button is shown
- **AND** if user is a child, message says "Ask a parent to add rewards"

#### Scenario: Reward grid responsive layout
- **GIVEN** rewards are displayed
- **WHEN** the viewport changes size
- **THEN** rewards display in 1 column on mobile (< 768px)
- **AND** rewards display in 2 columns on tablet (768px - 1024px)
- **AND** rewards display in 3 columns on desktop (>= 1024px)

#### Scenario: Karma balance display
- **GIVEN** the rewards page is loaded
- **WHEN** displaying the karma balance card
- **THEN** it shows the current user's total karma
- **AND** uses a Sparkles icon with primary color fill
- **AND** displays "Your Available Karma" label
- **AND** shows the karma amount prominently

### Requirement: Reward Favouriting
Family members MUST be able to mark rewards as favourites and track their savings progress toward favourite rewards.

#### Scenario: Toggle reward as favourite
- **GIVEN** an authenticated family member viewing a reward
- **WHEN** they click the heart icon on the reward card
- **THEN** the reward is marked as favourite
- **AND** the heart icon fills with red color
- **AND** a progress bar appears showing karma savings progress
- **AND** the API endpoint `/v1/families/{familyId}/rewards/{rewardId}/favourite` is called with `{ isFavourite: true }`

#### Scenario: Remove reward from favourites
- **GIVEN** a reward is marked as favourite
- **WHEN** the user clicks the filled heart icon
- **THEN** the favourite status is removed
- **AND** the heart icon becomes unfilled
- **AND** the progress bar is hidden
- **AND** the API is called with `{ isFavourite: false }`

#### Scenario: Progress bar calculation
- **GIVEN** a reward is favourited with karma cost of 100
- **AND** the user has 75 karma
- **WHEN** displaying the progress bar
- **THEN** the progress bar shows 75% filled
- **AND** displays "75 / 100" text
- **AND** displays "25 more karma needed" message

#### Scenario: Progress bar at 100%
- **GIVEN** a favourited reward with karma cost of 50
- **AND** the user has 75 karma
- **WHEN** displaying the progress bar
- **THEN** the progress bar shows 100% filled (capped at 100%)
- **AND** displays "75 / 50" text
- **AND** displays "You have enough karma!" message in green

#### Scenario: Favourite status persists across sessions
- **GIVEN** a user has favourited rewardA
- **WHEN** they reload the page or sign in from another device
- **THEN** rewardA still shows as favourited with progress bar

### Requirement: Reward Claiming
Family members MUST be able to claim rewards when they have sufficient karma, triggering a confirmation workflow and pending status.

#### Scenario: Claim reward with sufficient karma
- **GIVEN** a family member with 100 karma viewing a reward costing 50 karma
- **WHEN** they click the "Claim" button
- **THEN** a confirmation sheet opens
- **AND** the sheet displays the reward details (image, name, description, karma cost)
- **AND** the sheet explains what happens next (4 steps)
- **WHEN** the user clicks "Confirm Claim"
- **THEN** the API endpoint POST `/v1/families/{familyId}/rewards/{rewardId}/claim` is called
- **AND** a claim is created with status "pending"
- **AND** the reward card updates to show "Pending" button (disabled)
- **AND** the confirmation sheet closes

#### Scenario: Claim button disabled with insufficient karma
- **GIVEN** a family member with 30 karma viewing a reward costing 50 karma
- **WHEN** viewing the reward card
- **THEN** the claim button is disabled
- **AND** the button text shows "Not enough karma"

#### Scenario: Cannot claim reward with pending claim
- **GIVEN** a family member with a pending claim for rewardA
- **WHEN** viewing rewardA card
- **THEN** the button shows "Pending" and is disabled
- **AND** the claim button is not clickable

#### Scenario: Cancel claim confirmation sheet
- **GIVEN** the claim confirmation sheet is open
- **WHEN** the user clicks "Cancel"
- **THEN** the sheet closes
- **AND** no claim is created
- **AND** the reward card remains in claimable state

### Requirement: Pending Claim Management
Family members MUST be able to view and cancel their pending claims while parents can cancel any pending claim.

#### Scenario: Cancel own pending claim
- **GIVEN** a family member with a pending claim for rewardA
- **WHEN** they open the reward card dropdown menu
- **AND** click "Cancel Claim"
- **THEN** the API endpoint DELETE `/v1/families/{familyId}/claims/{claimId}` is called
- **AND** the claim status updates to "cancelled"
- **AND** the reward card claim button shows "Claim" and is enabled again

#### Scenario: Parent cancels member's pending claim
- **GIVEN** a parent viewing a reward with another member's pending claim
- **WHEN** they open the reward card dropdown
- **AND** click "Cancel Claim"
- **THEN** the claim is cancelled
- **AND** the reward card updates for that member

#### Scenario: Pending claim indicator on reward card
- **GIVEN** a reward with a user's pending claim
- **WHEN** viewing the reward card
- **THEN** the claim button shows "Pending" text
- **AND** displays a Clock icon
- **AND** the button is disabled

### Requirement: Reward Management (Parent Only)
Parents MUST be able to create, update, and delete rewards through dialog forms with validation, including image upload support.

#### Scenario: Create reward with uploaded image
- **GIVEN** a parent has uploaded an image via the file picker
- **AND** filled in name "Ice Cream Trip" and karma cost "100"
- **WHEN** they click "Create Reward"
- **THEN** the image is uploaded to MinIO first
- **AND** the reward is created with the returned imageUrl
- **AND** the reward card displays the uploaded image

#### Scenario: Create reward form shows upload option
- **GIVEN** the create reward dialog is open
- **WHEN** viewing the image input section
- **THEN** the dialog shows both "Upload Image" button and "or provide URL" label with URL input
- **AND** the parent can choose either method

#### Scenario: Update reward with new uploaded image
- **GIVEN** the edit reward dialog is open for a reward with an existing image URL
- **WHEN** the parent uploads a new image file
- **AND** clicks "Update Reward"
- **THEN** the new image is uploaded first
- **AND** the reward is updated with the new imageUrl
- **AND** the old image remains in storage (no cleanup in this change)

### Requirement: State Management
The rewards page MUST use Redux for state management with slices for rewards and claims, coordinated with karma state, including image upload state.

#### Scenario: Redux action for image upload
- **GIVEN** the rewards Redux slice
- **WHEN** creating or updating a reward with an uploaded image
- **THEN** a new async thunk `uploadRewardImage` is dispatched
- **AND** the thunk accepts `File` object and `familyId`
- **AND** the thunk returns the imageUrl from the API response
- **AND** loading state is tracked during upload

#### Scenario: Image upload error handling in Redux
- **GIVEN** the image upload thunk is dispatched
- **WHEN** the API call fails
- **THEN** the Redux error state is updated with error message
- **AND** the error is propagated to the component
- **AND** the user sees an error notification

### Requirement: Internationalization
All text content on the rewards page MUST be translated and support both English (en-US) and Dutch (nl-NL) locales, including new image upload UI text.

#### Scenario: Image upload UI translations in English
- **GIVEN** the user's locale is set to "en-US"
- **WHEN** viewing the reward dialog image section
- **THEN** the "Upload Image" button displays in English
- **AND** the "or provide URL" label displays in English
- **AND** the "Image preview" alt text displays in English
- **AND** the "Remove image" button displays in English
- **AND** all error messages display in English

#### Scenario: Image upload UI translations in Dutch
- **GIVEN** the user's locale is set to "nl-NL"
- **WHEN** viewing the reward dialog image section
- **THEN** all image upload UI text displays in Dutch
- **AND** error messages display in Dutch
- **AND** all labels and buttons use Dutch translations

#### Scenario: All new translation keys exist
- **GIVEN** the image upload feature implementation
- **WHEN** rendering image upload UI
- **THEN** translation keys exist for: "Upload Image", "or provide URL", "Image preview", "Remove image", "Uploading...", "File size must be less than 5MB", "Only JPEG, PNG, GIF, and WebP images are allowed", "Failed to upload image"
- **AND** all keys have values in both en-US.json and nl-NL.json

### Requirement: End-to-End Testing
The rewards page MUST have comprehensive E2E tests using Playwright with page object pattern and data-testid attributes, including image upload workflows.

#### Scenario: E2E test for uploading image on reward creation
- **GIVEN** a test parent user
- **WHEN** the test opens the create reward dialog
- **AND** selects a test image file via the file picker
- **AND** fills the required fields
- **AND** submits the form
- **THEN** the test verifies the image upload API call was made
- **AND** verifies the reward creation API call includes the imageUrl
- **AND** verifies the new reward displays with the uploaded image

#### Scenario: E2E test for uploading image on reward edit
- **GIVEN** a test reward with an existing image
- **WHEN** the test opens the edit dialog
- **AND** uploads a new image file
- **AND** submits the form
- **THEN** the test verifies the new image upload API call was made
- **AND** verifies the reward update includes the new imageUrl
- **AND** verifies the reward card displays the new image

#### Scenario: E2E test for file validation errors
- **GIVEN** the create reward dialog is open
- **WHEN** the test selects an invalid file (too large or wrong type)
- **THEN** the test verifies the error message displays
- **AND** verifies the form cannot be submitted

#### Scenario: E2E test for removing uploaded image
- **GIVEN** a test has selected an image file
- **WHEN** the test clicks "Remove image"
- **THEN** the test verifies the preview disappears
- **AND** verifies the file input is reset
- **AND** verifies the upload button is shown again

#### Scenario: Page object provides image upload helpers
- **GIVEN** the RewardsPage page object class
- **WHEN** tests use image upload functionality
- **THEN** helper methods exist for: uploadImage(filePath), removeImage(), verifyImagePreview(), verifyUploadError(message)
- **AND** all image-related locators use data-testid attributes

### Requirement: Unit Testing
Redux slices for rewards and claims MUST have 100% unit test coverage, including new image upload actions.

#### Scenario: Unit test for uploadRewardImage thunk
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing the uploadRewardImage thunk
- **THEN** tests cover: successful upload, API error, multipart form data construction
- **AND** tests verify the thunk returns the imageUrl on success
- **AND** tests verify error handling and state updates

#### Scenario: Unit test for createReward with image upload
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing createReward with an image file
- **THEN** tests verify uploadRewardImage is called first
- **AND** tests verify the returned imageUrl is used in the create payload
- **AND** tests verify error handling if upload fails

### Requirement: Accessibility
The rewards page MUST follow accessibility best practices with proper ARIA labels and keyboard navigation.

#### Scenario: Keyboard navigation through rewards
- **GIVEN** a user navigating with keyboard only
- **WHEN** they tab through the rewards page
- **THEN** all interactive elements are reachable
- **AND** focus indicators are visible
- **AND** Enter or Space activates buttons

#### Scenario: Screen reader announces reward information
- **GIVEN** a screen reader user on the rewards page
- **WHEN** navigating to a reward card
- **THEN** the reward name, karma cost, and status are announced
- **AND** buttons have descriptive labels
- **AND** favourite toggle announces current state

#### Scenario: Form inputs have proper labels
- **GIVEN** the create/edit reward dialog
- **WHEN** a screen reader user navigates the form
- **THEN** all inputs have associated labels
- **AND** required fields are indicated
- **AND** error messages are announced

### Requirement: Image Proxy API
The web application MUST provide a Next.js API route that proxies image requests from clients to MinIO storage.

#### Scenario: Fetch image through proxy
- **GIVEN** an image stored in MinIO at path `family-123/reward-uuid.jpg`
- **WHEN** a client requests GET `/api/images/family-123/reward-uuid.jpg`
- **THEN** the API route fetches the image from MinIO using S3 GetObjectCommand
- **AND** streams the image data to the client response
- **AND** sets Content-Type header based on file extension (e.g., `image/jpeg`)
- **AND** sets cache headers: `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: Handle missing image
- **GIVEN** a client requests an image that does not exist in MinIO
- **WHEN** GET `/api/images/family-123/nonexistent.jpg` is called
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Handle S3 errors
- **GIVEN** MinIO is unavailable or returns an error
- **WHEN** a client requests an image
- **THEN** the API responds with HTTP 500 Internal Server Error
- **AND** logs the error for debugging

#### Scenario: Serve images from any network location
- **GIVEN** a user accessing the web app from a remote location (not localhost)
- **WHEN** they view a reward with an uploaded image at `/api/images/family-123/reward-uuid.jpg`
- **THEN** the image loads successfully through the proxy
- **AND** the user does not need direct access to MinIO

#### Scenario: Cache images in browser
- **GIVEN** a client has fetched an image through the proxy
- **WHEN** the same image is requested again
- **THEN** the browser uses the cached version (based on Cache-Control header)
- **AND** no additional request is made to the server

### Requirement: Image Upload UI
Parents MUST be able to upload images directly through the reward dialog using a file picker, with preview and validation feedback.

#### Scenario: Upload image through file picker
- **GIVEN** a parent with the create/edit reward dialog open
- **WHEN** they click the "Upload Image" button
- **THEN** a native file picker dialog opens
- **AND** the picker accepts only image files (JPEG, PNG, GIF, WebP)
- **WHEN** they select an image file
- **THEN** the image preview displays immediately
- **AND** the file is stored in component state ready for upload

#### Scenario: Display image preview after selection
- **GIVEN** a parent has selected an image file
- **WHEN** the preview is shown
- **THEN** the image displays at a reasonable preview size (max 200px height)
- **AND** a "Remove image" button appears
- **AND** the image URL input field is hidden or disabled

#### Scenario: Remove uploaded image
- **GIVEN** an image file is selected with preview showing
- **WHEN** the parent clicks "Remove image"
- **THEN** the preview is cleared
- **AND** the file selection is reset
- **AND** the "Upload Image" button is shown again
- **AND** the image URL input field becomes available again

#### Scenario: Toggle between upload and URL input
- **GIVEN** the reward dialog is open
- **WHEN** viewing the image input section
- **THEN** both "Upload Image" button and URL input are visible
- **AND** the user can choose either method
- **AND** selecting a file hides the URL input
- **AND** entering a URL disables the file upload button

#### Scenario: Show upload progress indicator
- **GIVEN** a parent is submitting the reward form with an uploaded image
- **WHEN** the upload is in progress
- **THEN** the submit button shows "Uploading..." text
- **AND** the submit button is disabled during upload
- **AND** a loading spinner or indicator is visible

#### Scenario: Validate file size before upload
- **GIVEN** a parent selects an image file larger than 5MB
- **WHEN** the file is selected
- **THEN** an error message displays: "File size must be less than 5MB"
- **AND** the preview does not show
- **AND** the file is not accepted

#### Scenario: Validate file type before upload
- **GIVEN** a parent selects a non-image file (e.g., PDF, TXT)
- **WHEN** the file is selected
- **THEN** an error message displays: "Only JPEG, PNG, GIF, and WebP images are allowed"
- **AND** the preview does not show
- **AND** the file is not accepted

#### Scenario: Handle upload errors gracefully
- **GIVEN** a parent submits the form with an image file
- **WHEN** the upload API call fails (network error, server error)
- **THEN** an error message displays: "Failed to upload image"
- **AND** the form remains open
- **AND** the file stays selected
- **AND** the parent can retry by submitting again

#### Scenario: Upload image before creating reward
- **GIVEN** a parent has filled the create reward form with an uploaded image
- **WHEN** they click "Create Reward"
- **THEN** the image is uploaded first via POST `/v1/families/{familyId}/rewards/upload-image`
- **AND** the returned imageUrl is used in the reward creation payload
- **AND** the reward is created with the uploaded image URL
- **AND** the dialog closes on success

#### Scenario: Upload image before updating reward
- **GIVEN** a parent is editing a reward and uploads a new image
- **WHEN** they click "Update Reward"
- **THEN** the new image is uploaded first
- **AND** the returned imageUrl replaces the old imageUrl in the update payload
- **AND** the reward is updated with the new image

#### Scenario: Display uploaded image in reward card
- **GIVEN** a reward was created with an uploaded image
- **WHEN** viewing the reward card
- **THEN** the uploaded image displays in the card
- **AND** the image is fetched from the MinIO URL
- **AND** the image displays with proper aspect ratio and sizing

#### Scenario: Pre-fill image in edit dialog
- **GIVEN** a parent opens the edit dialog for a reward with an uploaded image
- **WHEN** the dialog opens
- **THEN** the image preview shows the current reward image
- **AND** the image URL field (if visible) shows the MinIO URL
- **AND** the parent can replace the image by uploading a new one

### Requirement: Real-time Reward Event Subscriptions

The web application SHALL subscribe to real-time reward claim events and update the UI automatically when events are received.

#### Scenario: Connect to WebSocket server
- **WHEN** a user navigates to the rewards page
- **THEN** the application SHALL establish a WebSocket connection to the API
- **AND** SHALL authenticate using the user's session token
- **AND** SHALL automatically join the user's personal event room

#### Scenario: Claim created event received (child)
- **WHEN** a child receives a `claim.created` event for their own claim
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** a toast notification SHALL be displayed confirming the claim
- **AND** the toast SHALL indicate the claim is pending approval

#### Scenario: Approval task created event received (parent)
- **WHEN** a parent receives an `approval_task.created` event
- **THEN** a toast notification SHALL be displayed
- **AND** the toast title SHALL be "New reward approval needed"
- **AND** the toast description SHALL include the child's name and reward name
- **AND** clicking the toast SHALL navigate to the tasks page

#### Scenario: Claim completed event received
- **WHEN** a user receives a `claim.completed` event
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** a toast notification SHALL be displayed
- **AND** the toast SHALL indicate the reward was provided
- **AND** the claim status SHALL update to completed in the UI

#### Scenario: Claim cancelled event received
- **WHEN** a user receives a `claim.cancelled` event
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** the claim SHALL be removed or marked as cancelled in the UI

#### Scenario: Connection lost
- **WHEN** the WebSocket connection is lost
- **THEN** the application SHALL attempt to reconnect automatically
- **AND** upon reconnection, SHALL refetch the current claims list

### Requirement: Reward Claim Notifications

The web application SHALL display contextual toast notifications for different reward claim scenarios based on user role.

#### Scenario: Child claim confirmation
- **WHEN** a child successfully creates a claim
- **THEN** a success toast SHALL be displayed
- **AND** the toast SHALL confirm the reward was claimed
- **AND** the toast SHALL indicate waiting for parent approval

#### Scenario: Parent approval notification
- **WHEN** a parent is notified of a new claim
- **THEN** an info toast SHALL be displayed
- **AND** the toast SHALL show the child's name and requested reward
- **AND** the toast SHALL include the karma cost
- **AND** the toast SHALL be actionable (click to view task)

#### Scenario: Claim fulfillment notification (child)
- **WHEN** a child's claim is marked as completed
- **THEN** a success toast SHALL be displayed
- **AND** the toast SHALL congratulate the child
- **AND** the toast SHALL show the karma deducted

#### Scenario: Claim cancellation notification
- **WHEN** a claim is cancelled
- **THEN** a warning toast SHALL be displayed
- **AND** the toast SHALL indicate the claim was cancelled
- **AND** SHALL show to both the child and any involved parents

### Requirement: Connection State Management

The web application SHALL manage WebSocket connection state for the rewards page.

#### Scenario: Connection established
- **WHEN** the WebSocket connection is successfully established
- **THEN** real-time claim updates SHALL be enabled
- **AND** the user SHALL receive notifications for relevant events

#### Scenario: Connection lost
- **WHEN** the WebSocket connection is lost
- **THEN** a warning SHALL be displayed indicating real-time updates are paused
- **AND** automatic reconnection SHALL be attempted
- **AND** the claims list SHALL still display cached data

#### Scenario: Reconnection
- **WHEN** the WebSocket connection is re-established
- **THEN** the warning SHALL be dismissed
- **AND** the claims list SHALL be refetched
- **AND** real-time updates SHALL resume

### Requirement: Event Subscription Lifecycle

The web application SHALL properly manage reward event subscription lifecycle.

#### Scenario: Subscribe on page mount
- **WHEN** the rewards page component mounts
- **THEN** the WebSocket connection SHALL be established if not already active
- **AND** event listeners SHALL be registered for claim events

#### Scenario: Unsubscribe on page unmount
- **WHEN** the user navigates away from the rewards page
- **THEN** event listeners for reward events SHALL be removed
- **AND** the WebSocket connection SHALL remain active for other modules
- **AND** no reward events SHALL trigger UI updates after unmount

#### Scenario: Multi-page subscriptions
- **WHEN** multiple pages are subscribed to events simultaneously
- **THEN** each page's event handlers SHALL operate independently
- **AND** the WebSocket connection SHALL be shared across all pages
- **AND** events SHALL be delivered to all relevant subscribed pages

