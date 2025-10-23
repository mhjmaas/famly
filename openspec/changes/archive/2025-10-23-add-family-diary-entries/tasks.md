## 1. Family Diary Routes Implementation
- [x] 1.1 Create family diary router following tasks pattern (`createFamilyDiaryRouter`)
- [x] 1.2 Implement family diary CRUD routes with family role authorization
- [x] 1.3 Mount family diary router in families router at `/:familyId/diary`
- [x] 1.4 Add family diary route exports to diary module index

## 2. Authorization and Validation
- [x] 2.1 Integrate `authorizeFamilyRole` middleware for all family diary endpoints
- [x] 2.2 Create family diary validators (reuse existing with `isPersonal: false`)
- [x] 2.3 Ensure family membership validation in route handlers

## 3. Service and Repository Updates
- [x] 3.1 Extend diary service to handle family-scoped operations
- [x] 3.2 Update diary repository queries to filter by `isPersonal` and `familyId` context
- [x] 3.3 Add family diary entry creation with `isPersonal: false`

## 4. Data Model Extensions
- [x] 4.1 Extend diary entry domain types to support family context
- [x] 4.2 Update diary mappers to handle family diary entries
- [x] 4.3 Ensure `familyId` context is properly tracked in operations

## 5. Testing
- [x] 5.1 Write unit tests for family diary validators
- [x] 5.2 Write e2e tests for family diary CRUD operations
- [x] 5.3 Write e2e tests for family role authorization scenarios
- [x] 5.4 Test family member access to shared diary entries
