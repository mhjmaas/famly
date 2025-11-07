# Implementation Tasks

## 1. Infrastructure Setup

### 1.1 Add MinIO to Docker Compose
- [x] Add MinIO service to `docker/compose.dev.yml`
  - Image: `minio/minio:latest`
  - Ports: 9000 (API), 9001 (console)
  - Environment: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
  - Command: `server /data --console-address ":9001"`
  - Volume: `minio-data:/data`
  - Healthcheck: `mc ready local`
- [x] Add MinIO volume definition to compose file
- [x] Add MinIO to `docker/compose.test.yml` with same configuration
- [x] Document MinIO access credentials in `.env.example`

### 1.2 Configure MinIO Client
- [x] Add MinIO environment variables to API `.env.example`:
  - `MINIO_ENDPOINT=minio:9000`
  - `MINIO_ACCESS_KEY=famly-dev-access`
  - `MINIO_SECRET_KEY=famly-dev-secret-min-32-chars`
  - `MINIO_BUCKET=famly-rewards`
  - `MINIO_USE_SSL=false`
- [x] Update API Docker Compose service to include MinIO dependency
- [x] Add MinIO environment variables to API service in compose files

## 2. Backend Implementation

### 2.1 Install Dependencies
- [x] Install `@aws-sdk/client-s3` in `apps/api`
- [x] Install `multer` in `apps/api`
- [x] Install `@types/multer` as dev dependency
- [x] Install `uuid` in `apps/api`
- [x] Update `package.json` and run `pnpm install`

### 2.2 Create MinIO Client Module
- [x] Create `apps/api/src/infra/minio/client.ts`
- [x] Initialize S3Client with MinIO configuration from env
- [x] Create `ensureBucketExists` function to create bucket if needed
- [x] Export configured S3Client instance
- [x] Add bucket creation on app startup in `app.ts`

### 2.3 Create File Upload Service
- [x] Create `apps/api/src/modules/rewards/services/upload.service.ts`
- [x] Implement `uploadRewardImage(file, familyId)` function
  - Generate UUID filename with preserved extension
  - Construct S3 key: `{familyId}/{uuid}.{ext}`
  - Upload to MinIO using `PutObjectCommand`
  - Return relative URL: `/api/images/${familyId}/${uuid}.${ext}`
- [x] Add file validation helpers: `validateFileType`, `validateFileSize`
- [x] Export service functions

### 2.4 Create Upload Endpoint
- [x] Create `apps/api/src/modules/rewards/routes/upload-image.route.ts`
- [x] Configure multer middleware with:
  - Memory storage
  - File size limit: 5MB
  - File filter: JPEG, PNG, GIF, WebP only
- [x] Implement POST handler:
  - Validate parent role and family membership
  - Call `uploadRewardImage` service
  - Return `{ imageUrl: string }`
- [x] Add error handling for validation and upload failures
- [x] Register route in rewards router

### 2.5 Update Validators
- [x] Update `apps/api/src/modules/rewards/validators/create-reward.validator.ts`
  - Ensure imageUrl validation accepts MinIO URLs
- [x] Update `apps/api/src/modules/rewards/validators/update-reward.validator.ts`
  - Ensure imageUrl validation accepts MinIO URLs

### 2.6 Write Backend Unit Tests
- [x] Create `apps/api/tests/unit/rewards/upload.service.test.ts`
  - Test successful upload
  - Test filename generation (UUID format)
  - Test file extension preservation
  - Test family-scoped paths
- [ ] Create `apps/api/tests/unit/rewards/upload-image.route.test.ts`
  - Test file size validation
  - Test file type validation
  - Test missing file error
  - Test parent role requirement
  - Test family membership requirement
- [ ] Run unit tests: `pnpm --filter api test:unit`

### 2.7 Write Backend E2E Tests
- [x] Create `apps/api/tests/e2e/rewards/upload-image.e2e.test.ts`
  - Test successful image upload
  - Test file size exceeds limit
  - Test invalid file type
  - Test missing file
  - Test child user forbidden
  - Test non-member forbidden
  - Test returned URL is valid MinIO URL
- [ ] Add test fixtures: small test images in `tests/fixtures/`
- [ ] Run E2E tests: `pnpm --filter api test:e2e`

## 3. Frontend Implementation

### 3.1 Install Frontend Dependencies
- [x] Install `@aws-sdk/client-s3` in `apps/web` (for proxy route)
- [x] Update `package.json` and run `pnpm install`

### 3.2 Create Image Proxy API Route
- [x] Create `apps/web/src/app/api/images/[...path]/route.ts`
- [x] Implement GET handler:
  - Parse `familyId` and `filename` from path params
  - Construct S3 key: `{familyId}/{filename}`
  - Initialize S3Client with MinIO config from env
  - Use `GetObjectCommand` to fetch image from MinIO
  - Stream image data to response
  - Set proper Content-Type header based on file extension
  - Set cache headers: `Cache-Control: public, max-age=31536000, immutable`
- [x] Add error handling for missing images (404)
- [x] Add error handling for S3 failures (500)

### 3.3 Configure Web Environment
- [x] Add MinIO environment variables to `apps/web/.env.example`
- [x] Add MinIO environment variables to web service in `docker/compose.dev.yml`
- [x] Add MinIO environment variables to web service in `docker/compose.test.yml`

### 3.4 Update API Client
- [x] Add `uploadRewardImage` function to `apps/web/src/lib/api-client.ts`
  - Accept `File` object and `familyId`
  - Create `FormData` with file
  - POST to `/v1/families/{familyId}/rewards/upload-image`
  - Return `imageUrl` from response (will be `/api/images/...`)
- [x] Export new function

### 3.5 Update Redux Store
- [x] Add `uploadRewardImage` async thunk to `apps/web/src/store/slices/rewards.slice.ts`
  - Accept `{ file: File, familyId: string }`
  - Call API client `uploadRewardImage`
  - Handle loading and error states
  - Return `imageUrl` on success
- [x] Update `createReward` thunk to support image file upload:
  - Add optional `imageFile: File` to parameters
  - If `imageFile` present, call `uploadRewardImage` first
  - Use returned URL in reward creation payload
- [x] Update `updateReward` thunk to support image file upload:
  - Add optional `imageFile: File` to parameters
  - If `imageFile` present, call `uploadRewardImage` first
  - Use returned URL in reward update payload
- [x] Add image upload error state to slice

### 3.6 Add Translations
- [x] Add to `apps/web/src/dictionaries/en-US.json`:
  ```json
  "dashboard.pages.rewards.dialog.fields.image.label": "Image",
  "dashboard.pages.rewards.dialog.fields.image.uploadButton": "Upload Image",
  "dashboard.pages.rewards.dialog.fields.image.orLabel": "or provide URL",
  "dashboard.pages.rewards.dialog.fields.image.uploading": "Uploading...",
  "dashboard.pages.rewards.dialog.fields.image.preview": "Image preview",
  "dashboard.pages.rewards.dialog.fields.image.remove": "Remove image",
  "dashboard.pages.rewards.dialog.fields.image.errors.fileSize": "File size must be less than 5MB",
  "dashboard.pages.rewards.dialog.fields.image.errors.fileType": "Only JPEG, PNG, GIF, and WebP images are allowed",
  "dashboard.pages.rewards.dialog.fields.image.errors.uploadFailed": "Failed to upload image"
  ```
- [x] Add Dutch translations to `apps/web/src/dictionaries/nl-NL.json` for all keys above
- [x] Use translation keys in RewardDialog component via `dict` prop

### 3.7 Update Reward Dialog Component
- [x] Update `apps/web/src/components/rewards/RewardDialog.tsx`
  - Add state: `selectedFile: File | null`, `imagePreview: string | null`, `uploadError: string | null`
  - Add file input element (hidden) with `accept="image/jpeg,image/png,image/gif,image/webp"`
  - Add "Upload Image" Button that triggers file input click
  - Add "or provide URL" Label between upload and URL input
  - Handle file selection:
    - Validate file size (< 5MB)
    - Validate file type (JPEG, PNG, GIF, WebP)
    - Generate preview URL using `URL.createObjectURL`
    - Store file in state
  - Display image preview when file selected
  - Add "Remove image" Button to clear selection
  - Conditionally hide URL input when file selected
  - Update form submit handler:
    - Upload file first if selected
    - Pass returned imageUrl to create/update action
  - Display upload errors in Alert component
  - Show "Uploading..." text on submit button during upload

### 3.8 Write Frontend Unit Tests
- [x] Update `apps/web/tests/unit/store/slices/rewards.slice.test.ts`
  - Test `uploadRewardImage` thunk (success, error)
  - Test `createReward` with image file upload
  - Test `updateReward` with image file upload
  - Test error state for upload failures
- [ ] Run unit tests: `pnpm --filter web test:unit`

### 3.9 Write Frontend E2E Tests
- [x] Update `apps/web/tests/e2e/pages/rewards.page.ts`
  - Add locators: `uploadImageButton`, `fileInput`, `imagePreview`, `removeImageButton`, `uploadError`
  - Add helper: `uploadImage(filePath: string)`
  - Add helper: `removeUploadedImage()`
  - Add helper: `getUploadError(): string`
- [ ] Create test fixtures: `apps/web/tests/fixtures/test-image.png` (< 100KB)
- [ ] Create test fixtures: `apps/web/tests/fixtures/test-image-large.png` (> 5MB, for error testing)
- [ ] Create test fixtures: `apps/web/tests/fixtures/test-document.pdf` (for invalid type testing)
- [x] Update `apps/web/tests/e2e/app/rewards.spec.ts`
  - Test: Upload image on reward creation
  - Test: Upload image on reward edit
  - Test: File size validation error
  - Test: File type validation error
  - Test: Remove uploaded image
  - Test: Toggle between upload and URL input
  - Test: Display uploaded image in reward card
- [ ] Run E2E tests: `pnpm --filter web test:e2e`

## 4. Testing & Validation

### 4.1 Integration Testing
- [x] Start full stack with `docker compose -f docker/compose.dev.yml up`
- [x] Verify MinIO console accessible at `http://localhost:9001`
- [x] Verify API connects to MinIO on startup
- [x] Manually test upload flow:
  - Create reward with uploaded image
  - Verify image stored in MinIO bucket
  - Verify image displays in reward card
  - Edit reward and upload new image
  - Verify new image replaces old one in UI

### 4.2 Error Scenario Testing
- [ ] Test file size validation (select > 5MB file)
- [ ] Test file type validation (select PDF or TXT file)
- [ ] Test network error handling (stop MinIO, try upload)
- [ ] Test unauthorized access (child user tries to upload)

### 4.3 Test All Locales
- [ ] Test upload flow with locale set to "en-US"
- [ ] Test upload flow with locale set to "nl-NL"
- [ ] Verify all translations display correctly

### 4.4 Run Full Test Suite
- [ ] Run API unit tests: `pnpm --filter api test:unit`
- [ ] Run API E2E tests: `pnpm --filter api test:e2e`
- [ ] Run web unit tests: `pnpm --filter web test:unit`
- [ ] Run web E2E tests: `pnpm --filter web test:e2e`
- [ ] Verify all tests pass

## 5. Documentation

### 5.1 Update README
- [ ] Document MinIO setup in project README
- [ ] Add instructions for accessing MinIO console
- [ ] Document environment variables for MinIO

### 5.2 Code Documentation
- [ ] Add JSDoc comments to upload service functions
- [ ] Add comments explaining MinIO client configuration
- [ ] Document file validation rules in upload route

## 6. Final Validation

### 6.1 Code Review Checklist
- [ ] All code follows SOLID, DRY, KISS principles
- [ ] TypeScript strict mode compliance
- [ ] No hardcoded strings (all translations used)
- [ ] Error handling complete and consistent
- [ ] All TODO comments addressed or removed
- [ ] No console.log or debug code left

### 6.2 Quality Gates
- [ ] All linting passes: `pnpm run lint`
- [ ] All formatting passes: `pnpm run format`
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No TypeScript errors: `pnpm run type-check`

### 6.3 Feature Completeness
- [ ] Image upload works end-to-end
- [ ] File validation works correctly
- [ ] Error messages display properly
- [ ] Translations complete for both locales
- [ ] Image preview works
- [ ] Remove image works
- [ ] Toggle between upload and URL works
- [ ] Both create and edit flows work
- [ ] Images display in reward cards
- [ ] Parent-only access enforced
- [ ] Family membership enforced

## Dependencies

- Task 2.1 must complete before 2.2-2.7
- Task 1.1 must complete before 2.2
- Task 2.2 must complete before 2.3
- Task 2.3 must complete before 2.4
- Task 2.4 must complete before 2.6, 2.7
- Task 3.1 must complete before 3.2
- Task 3.2 must complete before 3.3
- Task 3.4 must complete before 3.3
- Task 3.3 must complete before 3.6
- All implementation (sections 1-3) must complete before section 4
- All testing (section 4) must complete before section 6

## Parallelizable Work

- Tasks 1.1, 1.2 can run in parallel
- Tasks 2.6, 2.7 can run in parallel after 2.4
- Tasks 3.4, 3.5 can run in parallel
- Section 2 (backend) and section 3 (frontend) can largely run in parallel after infrastructure (section 1) completes

## Estimated Effort

- Section 1 (Infrastructure): 1-2 hours
- Section 2 (Backend): 4-6 hours
- Section 3 (Frontend): 6-8 hours
- Section 4 (Testing): 3-4 hours
- Section 5 (Documentation): 1 hour
- Section 6 (Validation): 1-2 hours

**Total**: 16-23 hours
