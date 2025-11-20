## ADDED Requirements
### Requirement: Push Notification Localization
The system SHALL localize push notification payloads using the recipient's stored language preference, reusing the frontend notification dictionary keys and placeholders for consistency.

#### Scenario: Send notification in user's language
- **WHEN** a push notification is generated for a user whose `language` field is a supported locale
- **THEN** the notification title and body are rendered with the matching locale's notification dictionary entries
- **AND** the resulting payload preserves placeholder values (e.g., amount, memberName, rewardName) correctly interpolated.

#### Scenario: Fallback to default locale
- **WHEN** a user's stored language is missing or unsupported
- **THEN** the notification payload uses the default locale defined by the system (currently en-US)
- **AND** the payload still includes all placeholder values.

#### Scenario: Per-recipient localization in batch sends
- **WHEN** notifications are sent to multiple recipients in one operation
- **THEN** each recipient receives a payload localized to their stored language (or default fallback)
- **AND** localization is not shared or reused across users with different languages.

#### Scenario: Dictionary alignment with frontend
- **WHEN** backend notification content is updated
- **THEN** it uses the same keys and message shapes as the frontend notification dictionaries
- **AND** no backend-specific strings drift from the frontend copies.
