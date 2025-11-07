# rewards Specification Delta

## ADDED Requirements

### Requirement: Image Upload
Parents MUST be able to upload image files for rewards, which are stored in S3-compatible object storage and accessible via returned URLs.

#### Scenario: Upload image successfully
- **GIVEN** an authenticated parent in a family
- **WHEN** they POST to `/v1/families/{familyId}/rewards/upload-image` with a valid image file (JPEG, PNG, GIF, or WebP) under 5MB
- **THEN** the API responds with HTTP 200 and returns `{ "imageUrl": "http://minio:9000/famly-rewards/family-id/uuid.ext" }`
- **AND** the image is stored in the MinIO bucket at path `{familyId}/{uuid}.{ext}`

#### Scenario: Reject file exceeding size limit
- **GIVEN** an authenticated parent
- **WHEN** they POST an image file larger than 5MB
- **THEN** the API responds with HTTP 400 indicating file size must be less than 5MB

#### Scenario: Reject invalid file type
- **GIVEN** an authenticated parent
- **WHEN** they POST a file that is not JPEG, PNG, GIF, or WebP (e.g., PDF, SVG)
- **THEN** the API responds with HTTP 400 indicating only JPEG, PNG, GIF, and WebP images are allowed

#### Scenario: Reject request with no file
- **GIVEN** an authenticated parent
- **WHEN** they POST without including a file in the multipart form data
- **THEN** the API responds with HTTP 400 indicating file is required

#### Scenario: Require parent role for upload
- **GIVEN** an authenticated child member
- **WHEN** they attempt to POST to the upload endpoint
- **THEN** the API responds with HTTP 403 Forbidden indicating parent role required

#### Scenario: Require family membership for upload
- **GIVEN** an authenticated parent who is NOT a member of the specified family
- **WHEN** they attempt to upload an image for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Generate unique filenames
- **GIVEN** an authenticated parent uploading multiple images with the same filename
- **WHEN** they POST multiple files
- **THEN** each upload generates a unique UUID-based filename preventing conflicts

#### Scenario: Preserve file extension
- **GIVEN** an authenticated parent uploading an image file
- **WHEN** they POST a file with extension `.jpg`
- **THEN** the returned URL includes the original extension (e.g., `uuid.jpg`)

#### Scenario: Store images in family-scoped paths
- **GIVEN** an authenticated parent in familyA
- **WHEN** they upload an image
- **THEN** the image is stored at path `familyA/{uuid}.{ext}` in the bucket
- **AND** images from different families are isolated by path prefix

#### Scenario: Return publicly accessible URL
- **GIVEN** an authenticated parent successfully uploads an image
- **WHEN** the API returns the imageUrl
- **THEN** the URL is publicly accessible without authentication (images are not sensitive)
- **AND** the URL can be used directly in the `imageUrl` field when creating or updating rewards

## MODIFIED Requirements

### Requirement: Reward Creation
Parents MUST be able to create family-specific rewards with a name, karma cost, optional description, and optional image URL or uploaded image.

#### Scenario: Create reward with uploaded image
- **GIVEN** an authenticated parent has uploaded an image and received an imageUrl
- **WHEN** they POST to `/v1/families/{familyId}/rewards` with the imageUrl from the upload response
- **THEN** the reward is created successfully with the uploaded image URL
- **AND** the reward displays the uploaded image when retrieved

#### Scenario: Create reward with both upload and URL input supported
- **GIVEN** an authenticated parent
- **WHEN** they provide either an uploaded imageUrl OR an external URL
- **THEN** both methods are equally valid and result in the reward storing the imageUrl

### Requirement: Field Validation
The system MUST enforce field length, type, and format constraints for all reward and claim operations.

#### Scenario: Validate uploaded image URLs
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with an imageUrl from the upload endpoint (MinIO URL)
- **THEN** the URL is validated as a valid HTTP(S) URL and accepted
- **AND** URLs must not exceed 500 characters
