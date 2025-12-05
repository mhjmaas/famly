## ADDED Requirements

### Requirement: Recipe Image Display

The web application MUST display recipe images on recipe cards in the overview grid.

#### Scenario: Display recipe with uploaded image

- **GIVEN** a recipe with an imageUrl from the upload endpoint
- **WHEN** viewing the recipes grid
- **THEN** the recipe card displays the uploaded image at the top of the card
- **AND** the image is fetched via the `/api/images/` proxy path
- **AND** the image displays with proper aspect ratio and sizing

#### Scenario: Display recipe without image

- **GIVEN** a recipe without an imageUrl
- **WHEN** viewing the recipes grid
- **THEN** the recipe card displays a fallback icon (e.g., UtensilsCrossed)
- **AND** the fallback is styled consistently with the card design

#### Scenario: Handle image load error

- **GIVEN** a recipe with an imageUrl that fails to load
- **WHEN** the image request fails
- **THEN** the recipe card displays the fallback icon
- **AND** no error is shown to the user

### Requirement: Recipe Image Upload UI

Family members MUST be able to upload images directly through the recipe dialog using a file picker, with preview and validation feedback.

#### Scenario: Upload image through file picker

- **GIVEN** a family member with the create/edit recipe dialog open
- **WHEN** they click the "Upload Image" button
- **THEN** a native file picker dialog opens
- **AND** the picker accepts only image files (JPEG, PNG, GIF, WebP)
- **WHEN** they select an image file
- **THEN** the image preview displays immediately
- **AND** the file is stored in component state ready for upload

#### Scenario: Display image preview after selection

- **GIVEN** a family member has selected an image file
- **WHEN** the preview is shown
- **THEN** the image displays at a reasonable preview size (max 200px height)
- **AND** a "Remove image" button appears
- **AND** the image URL input field is hidden or disabled

#### Scenario: Remove uploaded image

- **GIVEN** an image file is selected with preview showing
- **WHEN** the family member clicks "Remove image"
- **THEN** the preview is cleared
- **AND** the file selection is reset
- **AND** the "Upload Image" button is shown again
- **AND** the image URL input field becomes available again

#### Scenario: Toggle between upload and URL input

- **GIVEN** the recipe dialog is open
- **WHEN** viewing the image input section
- **THEN** both "Upload Image" button and URL input are visible
- **AND** the user can choose either method
- **AND** selecting a file hides the URL input
- **AND** entering a URL disables the file upload button

#### Scenario: Show upload progress indicator

- **GIVEN** a family member is submitting the recipe form with an uploaded image
- **WHEN** the upload is in progress
- **THEN** the submit button shows "Uploading..." text
- **AND** the submit button is disabled during upload
- **AND** a loading spinner or indicator is visible

#### Scenario: Validate file size before upload

- **GIVEN** a family member selects an image file larger than 5MB
- **WHEN** the file is selected
- **THEN** an error message displays: "File size must be less than 5MB"
- **AND** the preview does not show
- **AND** the file is not accepted

#### Scenario: Validate file type before upload

- **GIVEN** a family member selects a non-image file (e.g., PDF, TXT)
- **WHEN** the file is selected
- **THEN** an error message displays: "Only JPEG, PNG, GIF, and WebP images are allowed"
- **AND** the preview does not show
- **AND** the file is not accepted

#### Scenario: Handle upload errors gracefully

- **GIVEN** a family member submits the form with an image file
- **WHEN** the upload API call fails (network error, server error)
- **THEN** an error message displays: "Failed to upload image"
- **AND** the form remains open
- **AND** the file stays selected
- **AND** the family member can retry by submitting again

#### Scenario: Upload image before creating recipe

- **GIVEN** a family member has filled the create recipe form with an uploaded image
- **WHEN** they click "Create Recipe"
- **THEN** the image is uploaded first via POST `/v1/families/{familyId}/recipes/upload-image`
- **AND** the returned imageUrl is used in the recipe creation payload
- **AND** the recipe is created with the uploaded image URL
- **AND** the dialog closes on success

#### Scenario: Upload image before updating recipe

- **GIVEN** a family member is editing a recipe and uploads a new image
- **WHEN** they click "Update Recipe"
- **THEN** the new image is uploaded first
- **AND** the returned imageUrl replaces the old imageUrl in the update payload
- **AND** the recipe is updated with the new image

#### Scenario: Pre-fill image in edit dialog

- **GIVEN** a family member opens the edit dialog for a recipe with an uploaded image
- **WHEN** the dialog opens
- **THEN** the image preview shows the current recipe image
- **AND** the image URL field (if visible) shows the current URL
- **AND** the family member can replace the image by uploading a new one

### Requirement: Recipe Image State Management

The recipes Redux slice MUST manage image upload state including loading, errors, and the upload thunk.

#### Scenario: Redux action for image upload

- **GIVEN** the recipes Redux slice
- **WHEN** creating or updating a recipe with an uploaded image
- **THEN** a new async thunk `uploadRecipeImage` is dispatched
- **AND** the thunk accepts `File` object and `familyId`
- **AND** the thunk returns the imageUrl from the API response
- **AND** loading state is tracked during upload

#### Scenario: Image upload error handling in Redux

- **GIVEN** the image upload thunk is dispatched
- **WHEN** the API call fails
- **THEN** the Redux error state is updated with error message
- **AND** the error is propagated to the component
- **AND** the user sees an error notification

#### Scenario: Create recipe with image file

- **GIVEN** the createRecipe thunk is dispatched with an imageFile
- **WHEN** the thunk executes
- **THEN** the image is uploaded first
- **AND** the returned imageUrl is included in the create request
- **AND** the recipe is created with the image

#### Scenario: Update recipe with image file

- **GIVEN** the updateRecipe thunk is dispatched with an imageFile
- **WHEN** the thunk executes
- **THEN** the new image is uploaded first
- **AND** the returned imageUrl replaces any existing imageUrl
- **AND** the recipe is updated with the new image

### Requirement: Recipe Image Internationalization

All recipe image UI text MUST be translated and support both English (en-US) and Dutch (nl-NL) locales.

#### Scenario: Image upload UI translations in English

- **GIVEN** the user's locale is set to "en-US"
- **WHEN** viewing the recipe dialog image section
- **THEN** the "Upload Image" button displays in English
- **AND** the "or provide URL" label displays in English
- **AND** the "Image preview" alt text displays in English
- **AND** the "Remove image" button displays in English
- **AND** all error messages display in English

#### Scenario: Image upload UI translations in Dutch

- **GIVEN** the user's locale is set to "nl-NL"
- **WHEN** viewing the recipe dialog image section
- **THEN** all image upload UI text displays in Dutch
- **AND** error messages display in Dutch
- **AND** all labels and buttons use Dutch translations

#### Scenario: All new translation keys exist

- **GIVEN** the image upload feature implementation
- **WHEN** rendering image upload UI
- **THEN** translation keys exist for: "Upload Image", "or provide URL", "Image preview", "Remove image", "Uploading...", "File size must be less than 5MB", "Only JPEG, PNG, GIF, and WebP images are allowed", "Failed to upload image"
- **AND** all keys have values in both en-US.json and nl-NL.json

### Requirement: Recipe Image E2E Testing

The recipes page MUST have comprehensive E2E tests for image upload workflows using Playwright with page object pattern and data-testid attributes.

#### Scenario: E2E test for uploading image on recipe creation

- **GIVEN** a test family member user
- **WHEN** the test opens the create recipe dialog
- **AND** selects a test image file via the file picker
- **AND** fills the required fields
- **AND** submits the form
- **THEN** the test verifies the image upload API call was made
- **AND** verifies the recipe creation API call includes the imageUrl
- **AND** verifies the new recipe displays with the uploaded image

#### Scenario: E2E test for uploading image on recipe edit

- **GIVEN** a test recipe with an existing image
- **WHEN** the test opens the edit dialog
- **AND** uploads a new image file
- **AND** submits the form
- **THEN** the test verifies the new image upload API call was made
- **AND** verifies the recipe update includes the new imageUrl
- **AND** verifies the recipe card displays the new image

#### Scenario: E2E test for file validation errors

- **GIVEN** the create recipe dialog is open
- **WHEN** the test selects an invalid file (too large or wrong type)
- **THEN** the test verifies the error message displays
- **AND** verifies the form cannot be submitted with invalid file

#### Scenario: E2E test for removing uploaded image

- **GIVEN** a test has selected an image file
- **WHEN** the test clicks "Remove image"
- **THEN** the test verifies the preview disappears
- **AND** verifies the file input is reset
- **AND** verifies the upload button is shown again

#### Scenario: Page object provides image upload helpers

- **GIVEN** the RecipesPage page object class
- **WHEN** tests use image upload functionality
- **THEN** helper methods exist for: uploadImage(filePath), removeUploadedImage(), getUploadError(), hasImagePreview()
- **AND** all image-related locators use data-testid attributes

### Requirement: Recipe Image Unit Testing

Redux slice for recipes MUST have 100% unit test coverage for new image upload functionality.

#### Scenario: Unit test for uploadRecipeImage thunk

- **GIVEN** the recipes slice unit test suite
- **WHEN** testing the uploadRecipeImage thunk
- **THEN** tests cover: successful upload, API error, multipart form data construction
- **AND** tests verify the thunk returns the imageUrl on success
- **AND** tests verify error handling and state updates

#### Scenario: Unit test for createRecipe with image upload

- **GIVEN** the recipes slice unit test suite
- **WHEN** testing createRecipe with an image file
- **THEN** tests verify uploadRecipeImage is called first
- **AND** tests verify the returned imageUrl is used in the create payload
- **AND** tests verify error handling if upload fails

#### Scenario: Unit test for updateRecipe with image upload

- **GIVEN** the recipes slice unit test suite
- **WHEN** testing updateRecipe with an image file
- **THEN** tests verify uploadRecipeImage is called first
- **AND** tests verify the returned imageUrl is used in the update payload
- **AND** tests verify error handling if upload fails

#### Scenario: Unit test coverage requirement

- **GIVEN** the recipes slice with image upload functionality
- **WHEN** running unit tests with coverage
- **THEN** all new image upload code has 100% line coverage
- **AND** all new image upload code has 100% branch coverage

### Requirement: Recipe Image Accessibility

Recipe image UI MUST follow accessibility best practices.

#### Scenario: Image has alt text

- **GIVEN** a recipe card with an image
- **WHEN** a screen reader reads the card
- **THEN** the image has appropriate alt text (recipe name)

#### Scenario: Upload button is keyboard accessible

- **GIVEN** a user navigating with keyboard
- **WHEN** they tab to the upload button
- **THEN** the button is focusable
- **AND** Enter or Space activates the file picker

#### Scenario: Error messages are announced

- **GIVEN** a screen reader user
- **WHEN** a file validation error occurs
- **THEN** the error message is announced to the screen reader
