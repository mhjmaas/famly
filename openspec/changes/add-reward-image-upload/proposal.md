# Change: Add Image Upload for Rewards

## Why
Currently, rewards only support providing an external image URL. Users want to upload their own images directly through the web app, which provides a better UX and allows for custom reward visuals without needing external hosting. This eliminates friction and makes reward creation more accessible.

## What Changes
- Add MinIO as object storage service to Docker Compose (single-container, minimal setup)
- Implement multipart file upload API endpoint for reward images
- Add file upload UI component in reward dialog using shadcn components
- Store uploaded image URLs (MinIO S3 URLs) in existing `imageUrl` field
- Support both upload and URL input methods in the UI
- Add translations for image upload functionality (en-US and nl-NL)
- Update Redux store to handle file upload flow
- Add E2E tests for image upload workflow

## Impact
- **Affected specs**: `rewards`, `web-rewards`
- **Affected infrastructure**: Docker Compose (adds MinIO service)
- **Affected code**:
  - Backend: New upload endpoint, MinIO client setup
  - Frontend: RewardDialog component, Redux rewards slice, API client
  - Tests: E2E tests for upload workflow
- **New dependencies**: `@aws-sdk/client-s3` (backend), `multer` (backend multipart handling)
