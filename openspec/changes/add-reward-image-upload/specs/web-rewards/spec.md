# web-rewards Specification Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
