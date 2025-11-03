## 1. Domain and Infrastructure
- [x] 1.1 Create `ActivityEvent` domain entity with type enum, title, description, date, metadata, and user reference
- [x] 1.2 Create activity event mapper for DTO conversion
- [x] 1.3 Create activity event repository with date range query support and indexes
- [x] 1.4 Write unit tests for domain and mapper

## 2. Service Layer
- [x] 2.1 Create `ActivityEventService` with method to record events
- [x] 2.2 Add utility method for other modules to easily create activity events
- [x] 2.3 Implement date range filtering logic
- [x] 2.4 Write unit tests for service layer

## 3. API Endpoints
- [x] 3.1 Create validator for list activity events query parameters (startDate, endDate)
- [x] 3.2 Implement GET `/api/activity-events` route with authentication
- [x] 3.3 Add activity events router to main app
- [x] 3.4 Write e2e tests for activity events endpoint (list, date filtering, authentication)
- [x] 3.5 Extend existing tasks e2e tests to verify activity event creation

## 4. Tasks Module Integration
- [x] 4.1 Update module index to export ActivityEventService for cross-module usage
- [x] 4.2 Integrate activity event recording in task creation (non-recurring tasks only)
- [x] 4.3 Integrate activity event recording in schedule creation (recurring tasks)
- [x] 4.4 Integrate activity event recording in task completion hook
- [x] 4.5 Update tasks e2e tests to verify activity events are created on task operations
- [X] 4.6 Add unit tests for activity event integration in task service
- [x] 4.7 Add GET endpoint in BRUNO collection for /api/activity-events.

## 5. Documentation and Validation
- [x] 5.1 Run all tests (`pnpm test`)
- [x] 5.2 Run linter (`pnpm run lint`)
- [x] 5.3 Validate OpenSpec proposal (`openspec validate add-activity-events --strict`)
