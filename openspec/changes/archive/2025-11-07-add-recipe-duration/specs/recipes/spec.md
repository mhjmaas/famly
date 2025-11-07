## MODIFIED Requirements
### Requirement: Recipe Creation
Family members MAY include an optional `durationMinutes` integer (1-1440) when creating recipes. Created recipes MUST echo this value when present.

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
Each listed recipe MUST include `durationMinutes` when the value exists.

#### Scenario: List recipes shows duration
- **GIVEN** an authenticated family member with one recipe saved with `durationMinutes: 90`
- **WHEN** they GET `/v1/families/{familyId}/recipes`
- **THEN** the array item for that recipe contains `durationMinutes: 90`
- **AND** recipes without a duration omit the field (or return null) unchanged

### Requirement: Recipe Retrieval
Fetched recipes MUST include the stored duration value when present.

#### Scenario: Get recipe returns duration
- **GIVEN** an authenticated family member whose recipe has `durationMinutes: 15`
- **WHEN** they GET `/v1/families/{familyId}/recipes/{recipeId}`
- **THEN** the API responds with HTTP 200 and includes `durationMinutes: 15`

### Requirement: Recipe Update
Recipe updates MUST allow members to set, change, or clear a recipe's duration while enforcing the same validation limits.

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
Search responses MUST include `durationMinutes` when set for matching recipes.

#### Scenario: Search results include duration
- **GIVEN** an authenticated family member with a recipe (duration 60 minutes) that matches a search query
- **WHEN** they POST `/v1/families/{familyId}/recipes/search` with that query
- **THEN** the matched recipe in the response includes `durationMinutes: 60`

### Requirement: Field Validation
Duration MUST be a whole number of minutes between 1 and 1440 inclusive when provided; `null` MAY be used in PATCH requests to remove the value.

#### Scenario: Enforce duration bounds
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a recipe with `durationMinutes` less than 1, greater than 1440, or non-integer
- **THEN** the API responds with HTTP 400 and indicates the allowed range and integer requirement
