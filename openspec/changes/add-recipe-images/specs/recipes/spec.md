## ADDED Requirements

### Requirement: Recipe Image Upload

Family members MUST be able to upload image files for recipes, which are stored in S3-compatible object storage and accessible via returned URLs.

#### Scenario: Upload image successfully

- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/recipes/upload-image` with a valid image file (JPEG, PNG, GIF, or WebP) under 5MB
- **THEN** the API responds with HTTP 200 and returns `{ "imageUrl": "/api/images/{familyId}/{uuid}.{ext}" }`
- **AND** the image is stored in the MinIO bucket at path `{familyId}/{uuid}.{ext}`
- **AND** the returned URL is a relative path that can be accessed through the web application proxy

#### Scenario: Reject file exceeding size limit

- **GIVEN** an authenticated family member
- **WHEN** they POST an image file larger than 5MB
- **THEN** the API responds with HTTP 400 indicating file size must be less than 5MB

#### Scenario: Reject invalid file type

- **GIVEN** an authenticated family member
- **WHEN** they POST a file that is not JPEG, PNG, GIF, or WebP (e.g., PDF, SVG)
- **THEN** the API responds with HTTP 400 indicating only JPEG, PNG, GIF, and WebP images are allowed

#### Scenario: Reject request with no file

- **GIVEN** an authenticated family member
- **WHEN** they POST without including a file in the multipart form data
- **THEN** the API responds with HTTP 400 indicating file is required

#### Scenario: Require family membership for upload

- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to upload an image for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Generate unique filenames

- **GIVEN** an authenticated family member uploading multiple images with the same filename
- **WHEN** they POST multiple files
- **THEN** each upload generates a unique UUID-based filename preventing conflicts

#### Scenario: Preserve file extension

- **GIVEN** an authenticated family member uploading an image file
- **WHEN** they POST a file with extension `.jpg`
- **THEN** the returned URL includes the original extension (e.g., `{uuid}.jpg`)

#### Scenario: Store images in family-scoped paths

- **GIVEN** an authenticated family member in familyA
- **WHEN** they upload an image
- **THEN** the image is stored at path `familyA/{uuid}.{ext}` in the bucket
- **AND** images from different families are isolated by path prefix

### Requirement: Recipe Image URL Field Validation

The system MUST validate imageUrl fields on recipe create and update operations.

#### Scenario: Validate uploaded image URLs

- **GIVEN** an authenticated family member
- **WHEN** they create or update a recipe with an imageUrl from the upload endpoint (proxy path format)
- **THEN** the URL is validated as either a full HTTP(S) URL or a relative path starting with `/api/images/`
- **AND** URLs must not exceed 500 characters

#### Scenario: Accept valid HTTP URL

- **GIVEN** an authenticated family member
- **WHEN** they create a recipe with `imageUrl: "https://example.com/image.jpg"`
- **THEN** the recipe is created successfully with the provided URL

#### Scenario: Accept valid relative path

- **GIVEN** an authenticated family member
- **WHEN** they create a recipe with `imageUrl: "/api/images/family-id/uuid.jpg"`
- **THEN** the recipe is created successfully with the provided path

#### Scenario: Reject invalid URL format

- **GIVEN** an authenticated family member
- **WHEN** they create a recipe with `imageUrl: "not-a-valid-url"`
- **THEN** the API responds with HTTP 400 indicating imageUrl must be a valid HTTP(S) URL or relative path

#### Scenario: Clear image URL on update

- **GIVEN** an authenticated family member with a recipe that has an imageUrl
- **WHEN** they PATCH with `{ imageUrl: null }`
- **THEN** the imageUrl field is cleared from the recipe

## MODIFIED Requirements

### Requirement: Recipe Creation

Family members MAY include an optional `imageUrl` string and an optional `durationMinutes` integer (1-1440) when creating recipes. Created recipes MUST echo these values when present.

#### Scenario: Create recipe with image URL

- **GIVEN** an authenticated family member has uploaded an image and received an imageUrl
- **WHEN** they POST to `/v1/families/{familyId}/recipes` with the imageUrl from the upload response
- **THEN** the recipe is created successfully with the uploaded image URL
- **AND** the recipe displays the uploaded image when retrieved

#### Scenario: Create recipe with duration

- **GIVEN** an authenticated family member
- **WHEN** they POST `/v1/families/{familyId}/recipes` with `durationMinutes: 35`
- **THEN** the API responds with HTTP 201 and the response body includes `durationMinutes: 35`
- **AND** the recipe document persists the provided duration

#### Scenario: Reject recipe with invalid duration

- **GIVEN** an authenticated family member
- **WHEN** they POST with `durationMinutes: 0` or `durationMinutes: 2000`
- **THEN** the API responds with HTTP 400 and indicates duration must be between 1 and 1440 minutes

### Requirement: Recipe Listing

Each listed recipe MUST include `imageUrl` and `durationMinutes` when the values exist.

#### Scenario: List recipes shows image and duration

- **GIVEN** an authenticated family member with one recipe saved with `imageUrl` and `durationMinutes: 90`
- **WHEN** they GET `/v1/families/{familyId}/recipes`
- **THEN** the array item for that recipe contains both `imageUrl` and `durationMinutes: 90`
- **AND** recipes without these fields omit them (or return null) unchanged

### Requirement: Recipe Retrieval

Fetched recipes MUST include the stored `imageUrl` and `durationMinutes` values when present.

#### Scenario: Get recipe returns image and duration

- **GIVEN** an authenticated family member whose recipe has `imageUrl` and `durationMinutes: 15`
- **WHEN** they GET `/v1/families/{familyId}/recipes/{recipeId}`
- **THEN** the API responds with HTTP 200 and includes both `imageUrl` and `durationMinutes: 15`

### Requirement: Recipe Update

Recipe updates MUST allow members to set, change, or clear a recipe's `imageUrl` and `durationMinutes` while enforcing validation rules.

#### Scenario: Update recipe image URL

- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/recipes/{recipeId}` with `{ imageUrl: "/api/images/family-id/new-uuid.jpg" }`
- **THEN** the API responds with HTTP 200 and the recipe now reflects the new imageUrl

#### Scenario: Clear recipe image URL

- **GIVEN** an authenticated family member for a recipe that currently has `imageUrl`
- **WHEN** they PATCH with `{ imageUrl: null }`
- **THEN** the API responds with HTTP 200 and subsequent GETs/listings omit the imageUrl field

#### Scenario: Update recipe duration

- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/recipes/{recipeId}` with `{ durationMinutes: 45 }`
- **THEN** the API responds with HTTP 200 and the recipe now reflects `durationMinutes: 45`

#### Scenario: Clear recipe duration

- **GIVEN** an authenticated family member for a recipe that currently has `durationMinutes`
- **WHEN** they PATCH with `{ durationMinutes: null }`
- **THEN** the API responds with HTTP 200 and subsequent GETs/listings omit the field

#### Scenario: Reject update with invalid duration

- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ durationMinutes: 20000 }`
- **THEN** the API responds with HTTP 400 and indicates duration must be between 1 and 1440 minutes

### Requirement: Recipe Search

Search responses MUST include `imageUrl` and `durationMinutes` when set for matching recipes.

#### Scenario: Search results include image and duration

- **GIVEN** an authenticated family member with a recipe (imageUrl and duration 60 minutes) that matches a search query
- **WHEN** they POST `/v1/families/{familyId}/recipes/search` with that query
- **THEN** the matched recipe in the response includes both `imageUrl` and `durationMinutes: 60`
