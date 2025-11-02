# Proposal: add-recipes

## Summary
Add a **Recipes** capability that allows family members to create, list, retrieve, and search for recipes within their family. Recipes include a name, description, steps, and optional tags (e.g., "breakfast", "bread", "high-class") for easy organization and discovery. This enables families to centralize and share cooking knowledge.

## Motivation
Families often use different recipes and want to organize and share culinary ideas easily. A shared recipe repository within Famly allows family members to discover tried-and-tested recipes without needing external tools or scattered notes.

## Scope
- **Added**: new `recipes` capability with CRUD endpoints and search functionality
- **Requirements**: family membership gates all access; no role-based restrictions
- **Out of scope**: tag-based filtering (future enhancement)

## Change ID
`add-recipes`

## Affected Capabilities
- **New**: `recipes` capability (spec to be created)

## Acceptance Criteria
- [ ] Proposal passes `openspec validate add-recipes --strict`
- [ ] All scenarios are clearly defined with Gherkin structure
- [ ] Tasks are ordered and verifiable
- [ ] Design decisions are documented (if needed)

## Questions for Clarification
None—request is clear and well-scoped.
