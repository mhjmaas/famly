# Design: Reward Image Upload

## Architecture Overview

This change spans three layers:
1. **Infrastructure**: MinIO S3-compatible object storage
2. **Backend**: File upload endpoint with S3 integration
3. **Frontend**: File picker UI with upload progress

## Infrastructure Design

### MinIO Setup
- Single-container MinIO deployment in Docker Compose
- Persistent volume for uploaded images
- Simple access key authentication (development)
- Bucket created automatically on startup
- Accessible at `localhost:9000` (API) and `localhost:9001` (console)

**Rationale**: MinIO is lightweight, S3-compatible, and perfect for self-hosted deployments. Single container keeps setup simple as requested.

## Backend Design

### File Upload Endpoint
```
POST /v1/families/{familyId}/rewards/upload-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: image file (JPEG, PNG, GIF, WebP)
```

**Response**:
```json
{
  "imageUrl": "/api/images/family-123/reward-uuid.jpg"
}
```

### Storage Strategy
- Bucket: `famly-rewards`
- S3 Path pattern: `{familyId}/{uuid}.{ext}`
- Database stores: `/api/images/{familyId}/{uuid}.{ext}` (relative path)
- UUID v4 for unique filenames
- Preserve original file extension
- Images served through Next.js API proxy (not direct MinIO URLs)

**Rationale**:
- Storing relative paths makes the system portable across environments
- Users can access images from anywhere (not just localhost)
- Next.js API route proxies requests to MinIO internally
- Can add authentication, caching, or optimization later without changing stored URLs

### Validation
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Require parent role (same as reward creation)
- Require family membership

### Libraries
- `multer`: Handle multipart/form-data parsing
- `@aws-sdk/client-s3`: S3 client for MinIO
- `uuid`: Generate unique filenames

**Rationale**:
- Multer is the standard Express middleware for file uploads
- AWS SDK works seamlessly with MinIO's S3 compatibility
- UUID prevents filename conflicts and information leakage

## Image Proxy Design

### Next.js API Route
Create `/api/images/[...path]/route.ts` to proxy image requests to MinIO:

```typescript
GET /api/images/{familyId}/{filename}
```

**Implementation**:
- Parse `familyId` and `filename` from path params
- Construct MinIO S3 key: `{familyId}/{filename}`
- Fetch image from MinIO using `GetObjectCommand`
- Stream response to client with proper Content-Type headers
- Set cache headers for browser caching

**Benefits**:
- Works from any network location
- Hides MinIO internal URLs
- Single public domain for all resources
- Can add access control later if needed
- Can add image optimization in future

## Frontend Design

### UI Components
Use shadcn components for consistency:
- `Input type="file"` with custom styling
- `Button` for upload trigger
- `Label` for file input label
- `Alert` for upload errors
- Native `<img>` tag for preview (uses `/api/images/*` URLs)

### Upload Flow
1. User clicks "Upload Image" button in RewardDialog
2. File picker opens (native browser dialog)
3. User selects image file
4. Preview shows immediately (local File object)
5. On form submit, upload file first
6. Then submit reward with returned imageUrl

### Redux Integration
**New action**: `uploadRewardImage`
- Accepts: `File` object and `familyId`
- Returns: `imageUrl` string
- Updates loading state during upload

**Modified action**: `createReward` / `updateReward`
- Check if `imageFile` is present
- If yes, call `uploadRewardImage` first
- Use returned URL in reward data

### Translation Keys
Add to both `en-US.json` and `nl-NL.json`:
```json
{
  "dashboard": {
    "pages": {
      "rewards": {
        "dialog": {
          "fields": {
            "image": {
              "label": "Image",
              "uploadButton": "Upload Image",
              "orLabel": "or provide URL",
              "uploading": "Uploading...",
              "preview": "Image preview",
              "remove": "Remove image",
              "errors": {
                "fileSize": "File size must be less than 5MB",
                "fileType": "Only JPEG, PNG, GIF, and WebP images are allowed",
                "uploadFailed": "Failed to upload image"
              }
            }
          }
        }
      }
    }
  }
}
```

**Rationale**: Follows existing translation structure in the app.

## Error Handling

### Backend
- 400: Invalid file type, size exceeded, missing file
- 401: Unauthorized
- 403: Not a parent or not family member
- 500: S3 upload failure

### Frontend
- Display error in Alert component below file input
- Keep file selected for retry
- Don't block form submission if upload fails (fallback to URL)

## Testing Strategy

### Unit Tests
- Backend: Upload endpoint validation (file size, type, auth)
- Frontend: Redux action for file upload

### E2E Tests
- Create reward with uploaded image
- Verify image displays in reward card
- Edit reward and change image
- Verify file size/type validation errors

**Test Data**: Use small test images (< 100KB) in `tests/fixtures/`

## Trade-offs

**Considered**: Direct browser-to-S3 upload with presigned URLs
**Chosen**: Upload through API
**Reason**: Simpler implementation, consistent with backend validation patterns, no CORS complexity

**Considered**: Image optimization/resizing
**Chosen**: Store original images
**Reason**: Keeps scope minimal for MVP. Can add optimization in future change.

**Considered**: Multiple file formats (SVG, etc.)
**Chosen**: Limited to raster formats
**Reason**: Security concerns with SVG execution, simpler validation

## Security Considerations

1. **File Size Limit**: Prevents DoS via large uploads
2. **MIME Type Validation**: Backend validates actual file content, not just extension
3. **UUID Filenames**: Prevents path traversal and info leakage
4. **Parent-Only Upload**: Only parents can upload images
5. **Public Images**: Acceptable as reward images are not sensitive

## Configuration

### Environment Variables
```env
# API (.env)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=famly-dev-access
MINIO_SECRET_KEY=famly-dev-secret-min-32-chars
MINIO_BUCKET=famly-rewards
MINIO_USE_SSL=false

# Web (.env)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=famly-dev-access
MINIO_SECRET_KEY=famly-dev-secret-min-32-chars
MINIO_BUCKET=famly-rewards
MINIO_USE_SSL=false
```

### Docker Compose
```yaml
minio:
  image: minio/minio:latest
  container_name: famly-minio-dev
  ports:
    - '9000:9000'  # API
    - '9001:9001'  # Console
  environment:
    MINIO_ROOT_USER: famly-dev-access
    MINIO_ROOT_PASSWORD: famly-dev-secret-min-32-chars
  command: server /data --console-address ":9001"
  volumes:
    - minio-data:/data
  healthcheck:
    test: ["CMD", "mc", "ready", "local"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## Future Enhancements (Out of Scope)

- Image optimization/thumbnails
- CDN integration
- Image cropping UI
- Upload progress bar
- Drag-and-drop upload
- Multiple images per reward
