## ADDED Requirements
### Requirement: Profile page change-password flow
The profile page dropdown MUST let authenticated users rotate their password via a responsive dialog/drawer experience, localized to the active language.

#### Scenario: Menu surfaces change password action
- **GIVEN** an authenticated user viewing the profile card menu
- **WHEN** the user opens the existing More menu
- **THEN** a "Change Password" option appears between "Edit Profile" and "Logout"
- **AND** the label and description use strings from `dict.profile.security.changePassword` for the active locale.

#### Scenario: Desktop dialog vs mobile drawer
- **GIVEN** the user selects "Change Password"
- **WHEN** the viewport width is ≥768px
- **THEN** a modal dialog opens with localized title/description, inputs for current password, new password, and confirmation, and primary/secondary buttons
- **AND** when the viewport width is <768px the same content renders inside a bottom drawer with identical validation rules
- **AND** the submit button remains disabled until all fields are filled and new/confirm match with minimum-length validation feedback inline.

#### Scenario: Successful password update logs the user out
- **GIVEN** the change-password form is valid
- **WHEN** the form submits successfully (API 204)
- **THEN** the UI displays a transient success toast or inline banner explaining the user must sign in again
- **AND** the flow immediately calls the existing logout helper, clears Redux user state, and routes the browser to `/{lang}/signin`.

#### Scenario: Localization coverage for errors and success
- **GIVEN** the user triggers validation errors (mismatch passwords, too short, missing current password) or server errors (invalid current password)
- **WHEN** the UI renders helper/error text
- **THEN** every string (labels, descriptions, button text, error messages, success confirmation) is sourced from the profile dictionary in both `en-US` and `nl-NL`.
