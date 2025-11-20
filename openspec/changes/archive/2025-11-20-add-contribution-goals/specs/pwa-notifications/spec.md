# PWA Notifications Specification Changes

## ADDED Requirements

### Requirement: Contribution Goal Weekly Award Notification
The notification system SHALL send push notifications when contribution goal karma is awarded weekly.

#### Scenario: Send weekly contribution goal notification
- **WHEN** contribution goal karma is awarded at week end
- **THEN** send push notification to the member
- **AND** use title "Weekly Contribution Goal Complete!"
- **AND** use body "{karmaAmount} karma earned for {goalTitle}"
- **AND** include deeplink to dashboard showing contribution goal

#### Scenario: Send notification even when zero karma awarded
- **WHEN** contribution goal week ends with zero remaining karma
- **THEN** send push notification with title "Weekly Contribution Goal Ended"
- **AND** use body "No karma earned this week due to deductions. Keep trying!"
- **AND** provide encouragement and link to view activity trail
