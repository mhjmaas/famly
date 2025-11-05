# Proposal: Update Member Role

## Change ID
`update-member-role`

## Why
Families need the ability to correct role assignment errors and adapt to changing family dynamics. Without an update endpoint, parents must remove and re-add members to fix incorrect roles, which:
- Loses membership history and metadata (addedBy, createdAt)
- Disrupts user experience and requires password resets
- Creates unnecessary friction for simple corrections
- Prevents organic family structure evolution (e.g., children becoming co-parents)

This change provides a surgical, non-destructive way to adjust member roles while preserving all membership data and user accounts.

## Problem Statement
Parents currently cannot update a family member's role after the member has been added to the family. Once a user is added as either a Parent or Child, their role is fixed. This prevents families from correcting mistakes (e.g., accidentally adding someone as Child instead of Parent) or adjusting roles as family dynamics change (e.g., promoting a Child to Parent when they become an adult).

## Proposed Solution
Add a new API endpoint `PATCH /v1/families/:familyId/members/:memberId` that allows Parents to update the role of any family member. The endpoint will support toggling between Parent and Child roles only.

## Scope
- **Backend API only**: No frontend changes in this proposal
- **Single capability**: Role switching for existing family members
- **Minimal permissions**: Only Parents can update roles
- **Simple validation**: Only allow Parent ↔ Child transitions

## Out of Scope
- Updating other member properties (name, email, birthdate)
- Removing members (already covered by existing DELETE endpoint)
- Role-based restrictions (e.g., preventing removal of last parent)
- Frontend UI for role management
- Audit logging or notification system

## Dependencies
- Existing family membership system
- Existing authentication and authorization middleware
- MongoDB family_memberships collection

## Success Criteria
1. Parents can successfully update a member's role from Parent to Child
2. Parents can successfully update a member's role from Child to Parent
3. Non-parents are rejected with HTTP 403
4. Invalid member IDs return HTTP 404
5. E2E test coverage validates all scenarios
6. Existing family functionality remains unaffected

## Risk Assessment
**Low Risk**
- Minimal code changes (single route, validator, repository method)
- Uses existing patterns and infrastructure
- No data migration required
- Clear rollback path (remove route)
- Comprehensive test coverage required

## Timeline Estimate
- Implementation: 2-3 hours
- Testing: 1-2 hours
- Review: 1 hour
- **Total: 4-6 hours**
