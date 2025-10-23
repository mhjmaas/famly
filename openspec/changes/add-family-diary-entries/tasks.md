## 1. Family Diary Routes Implementation
- [ ] 1.1 Create family diary router following tasks pattern (`createFamilyDiaryRouter`)
- [ ] 1.2 Implement family diary CRUD routes with family role authorization
- [ ] 1.3 Mount family diary router in families router at `/:familyId/diary`
- [ ] 1.4 Add family diary route exports to diary module index

## 2. Authorization and Validation
- [ ] 2.1 Integrate `authorizeFamilyRole` middleware for all family diary endpoints
- [ ] 2.2 Create family diary validators (reuse existing with `isPersonal: false`)
- [ ] 2.3 Ensure family membership validation in route handlers

## 3. Service and Repository Updates
- [ ] 3.1 Extend diary service to handle family-scoped operations
- [ ] 3.2 Update diary repository queries to filter by `isPersonal` and `familyId` context
- [ ] 3.3 Add family diary entry creation with `isPersonal: false`

## 4. Data Model Extensions
- [ ] 4.1 Extend diary entry domain types to support family context
- [ ] 4.2 Update diary mappers to handle family diary entries
- [ ] 4.3 Ensure `familyId` context is properly tracked in operations

## 5. Testing
- [ ] 5.1 Write unit tests for family diary validators
- [ ] 5.2 Write e2e tests for family diary CRUD operations
- [ ] 5.3 Write e2e tests for family role authorization scenarios
- [ ] 5.4 Test family member access to shared diary entries
