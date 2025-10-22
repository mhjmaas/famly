## 1. Auth Module

### 1.1 Configure better-auth with additionalFields
- [x] 1.1.1 Add `user.additionalFields` configuration to `apps/api/src/modules/auth/better-auth.ts`
  - Add `birthdate` field with type `"date"`, `required: true`, `input: true`
  - Note: `name` is already a built-in field in better-auth, so we only need to make it required via validation
  - **Research finding**: Use the `additionalFields` property in the betterAuth config to extend the user schema
  - **Example pattern**:
    ```typescript
    user: {
      additionalFields: {
        birthdate: {
          type: "date",
          required: true,
          input: true, // Allow users to provide value during signup
        },
      },
    }
    ```

### 1.2 Update registration validation and flow
- [x] 1.2.1 Update `apps/api/src/modules/auth/routes/register.route.ts`:
  - Add Zod validation for `name` (required string, min 1 char) and `birthdate` (required date string in ISO YYYY-MM-DD format)
  - Pass `birthdate` to `auth.api.signUpEmail` in the body (it will be automatically handled by better-auth)
  - Update response JSON to include `birthdate: data.user.birthdate`
  - **Research finding**: Fields with `input: true` can be passed directly in the signUpEmail body and will be persisted automatically

### 1.3 Update /v1/auth/me endpoint
- [x] 1.3.1 Update `apps/api/src/modules/auth/routes/me.route.ts`:
  - Add `birthdate: req.user!.birthdate` to the response JSON user object
  - **Note**: TypeScript types will be automatically inferred from better-auth config

### 1.4 Update authenticate middleware types
- [x] 1.4.1 Update `apps/api/src/modules/auth/domain/user.ts` (AuthenticatedRequest interface):
  - Add `birthdate: Date` to the `User` interface
  - This ensures req.user has the correct type throughout the app

### 1.5 Update tests
- [x] 1.5.1 Update e2e registration tests (`apps/api/tests/e2e/auth/register.e2e.test.ts`):
  - Add test case for successful registration with name and birthdate
  - Add test case for registration failure when birthdate is missing
  - Add test case for registration failure when birthdate has invalid format
- [x] 1.5.2 Update e2e /me tests (`apps/api/tests/e2e/auth/me.e2e.test.ts`):
  - Update existing tests to expect `birthdate` in response
  - Ensure test fixtures include birthdate field

## 2. Family Module

### 2.1 Update add-member validation and service
- [x] 2.1.1 Update `apps/api/src/modules/family/validators/add-family-member.validator.ts`:
  - Add `name` (required string, min 1 char) to Zod schema
  - Add `birthdate` (required date string in ISO YYYY-MM-DD format) to Zod schema

- [x] 2.1.2 Update `apps/api/src/modules/family/services/family.service.ts` in the `addFamilyMember` method:
  - Pass `name: input.name` to the `auth.api.signUpEmail` body
  - Pass `birthdate: input.birthdate` to the `auth.api.signUpEmail` body
  - Remove the line that generates name from email
  - **Research finding**: Additional fields are passed directly in the signUpEmail body

- [x] 2.1.3 Update `apps/api/src/modules/family/domain/family.ts`:
  - Add `name: string` to `AddFamilyMemberRequest` interface
  - Add `birthdate: string` to `AddFamilyMemberRequest` interface

### 2.2 Update family list responses to include member profiles
- [x] 2.2.1 Update family list endpoint (`apps/api/src/modules/family/routes/families.route.ts`):
  - Query user details from MongoDB `user` collection for all family members
  - Include `name` and `birthdate` in the members array of the response

- [x] 2.2.2 Update `apps/api/src/modules/family/lib/family.mapper.ts`:
  - Add member profile fields to response DTOs (add `name` and `birthdate` to `FamilyMemberView`)
  - Ensure `buildFamiliesWithMembersResponse` includes member details with profiles

### 2.3 Update tests
- [x] 2.3.1 Update unit tests for add-member validator (`apps/api/tests/unit/family/add-family-member.validator.test.ts`):
  - Add test cases for required `name` field
  - Add test cases for required `birthdate` field
  - Add test case for invalid birthdate format

- [x] 2.3.2 Update e2e add-member tests (`apps/api/tests/e2e/family/add-*-member.e2e.test.ts`):
  - Update all add-member test payloads to include `name` and `birthdate`
  - Add test case verifying validation errors when name is missing
  - Add test case verifying validation errors when birthdate is missing

- [x] 2.3.3 Update e2e family list tests (`apps/api/tests/e2e/family/list-families.e2e.test.ts`):
  - Assert that response includes `name` and `birthdate` for each member
  - Ensure test fixtures include these fields

## 3. Documentation
- [x] 3.1 Ensure API documentation/README reflects the new required `name` and `birthdate` fields in registration and family member endpoints.

---

## Research Summary

### Better-Auth Custom Fields Pattern
Based on better-auth documentation research:

1. **Adding custom fields**: Use `user.additionalFields` in betterAuth config
   - Each field needs: `type`, `required`, `input` (whether users can provide value)
   - Types supported: "string", "number", "boolean", "date"

2. **Built-in fields**:
   - `name` is already a built-in optional field in better-auth
   - We just need to add validation to make it required

3. **Persistence**:
   - Fields with `input: true` are automatically persisted when passed to `signUpEmail`
   - No manual database operations needed - better-auth handles it

4. **Type inference**:
   - TypeScript types are automatically inferred from the config
   - The user object returned from better-auth will include these fields

5. **Accessing fields**:
   - Fields are available on `user` object from better-auth responses
   - Fields are available in session/authentication middleware

### Implementation Strategy
- Use better-auth's built-in schema extension rather than manual database operations
- Leverage automatic type inference for TypeScript support
- Validate input at API layer with Zod before passing to better-auth
