<!--
Sync Impact Report
==================
Version change: 1.0.1 → 1.1.0
Modified principles:
  - Introduced Principle VI (KISS) emphasizing simple, minimal solutions and discouraging overengineering
  - Expanded rationale to highlight cognitive load considerations
Added sections:
  - KISS (Keep It Simple, Stupid)
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - No updates needed (Constitution Check remains valid)
  ✅ spec-template.md - No updates needed (user scenarios remain aligned)
  ✅ tasks-template.md - No updates needed (test-first approach remains aligned)
  ⚠ agent-file-template.md - No updates needed (general template)
  ⚠ checklist-template.md - No updates needed (general template)
Follow-up TODOs: None
-->

# Famly Project Constitution

## Core Principles

### I. SOLID Architecture

Code MUST adhere to SOLID principles to ensure maintainability and extensibility:

- **Single Responsibility Principle**: Every class, module, and function MUST have one clearly defined purpose. If you cannot describe what a component does in a single sentence without using "and", it violates SRP.

- **Open/Closed Principle**: Components MUST be open for extension but closed for modification. Prefer composition, inheritance, and dependency injection over modifying existing code when adding new features.

- **Liskov Substitution Principle**: Derived classes or implementations MUST be substitutable for their base types without breaking functionality. Any function accepting a base type MUST work correctly with any derived type.

- **Interface Segregation Principle**: Interfaces MUST be small and focused. Classes MUST NOT be forced to implement methods they do not use. Prefer multiple specific interfaces over one large general-purpose interface.

- **Dependency Inversion Principle**: High-level modules MUST depend on abstractions, not concrete implementations. Both high-level and low-level modules MUST depend on interfaces or abstract classes.

**Rationale**: SOLID principles reduce coupling, increase cohesion, and make code easier to test, maintain, and extend. They are fundamental to sustainable software development.

### II. Don't Repeat Yourself (DRY)

Every piece of knowledge or logic MUST have a single, authoritative representation in the codebase:

- Duplicate logic MUST be extracted into shared functions, modules, or services.
- Configuration values MUST be defined once and referenced, never hardcoded in multiple locations.
- Business rules MUST exist in exactly one place.
- Data transformations MUST be centralized and reusable.

**Exceptions**: Duplication is acceptable when:
- Removing it would introduce inappropriate coupling between unrelated domains
- The duplication is coincidental rather than conceptual (e.g., two different features happen to have similar code but represent different concepts)
- The abstraction would violate Single Responsibility by forcing unrelated concerns into a shared component

**Rule of Three**: Consider allowing duplication twice before abstracting. Wait until you have three instances to understand the true pattern and avoid premature abstraction.

**Rationale**: DRY reduces maintenance burden, prevents inconsistencies, and makes refactoring safer. When a concept changes, there should be exactly one place to update it. However, inappropriate abstraction is worse than duplication—forced abstractions create rigid coupling and violate SOLID principles.

### III. Test-Driven Development (TDD)

Testing is NON-NEGOTIABLE and MUST follow the test-first approach:

- Tests MUST be written BEFORE implementation code.
- Tests MUST fail initially (Red phase).
- Implementation MUST make tests pass (Green phase).
- Code MUST be refactored after tests pass (Refactor phase).
- All new features MUST have corresponding tests.
- Bug fixes MUST include a failing test that reproduces the bug before the fix.

**Test Coverage Requirements**:
- Unit tests for utilities, pure functions, validators and mappers
- Integration (e2e) tests for API endpoints, service interactions, and data access layers
- Contract tests for external API boundaries
- End-to-end tests for critical user journeys (at minimum, P1 user stories)

**Rationale**: TDD ensures code is testable by design, provides living documentation, catches regressions early, and gives confidence during refactoring. Test-first development produces better architecture than test-after.

### IV. User Experience Consistency

User-facing features MUST provide consistent, predictable experiences:

- UI components MUST follow established design patterns and component libraries.
- User interactions MUST behave consistently across the application (e.g., buttons, forms, navigation).
- Error messages MUST be clear, actionable, and consistent in tone and format.
- Loading states, empty states, and error states MUST be handled consistently.
- Accessibility standards (WCAG 2.1 AA minimum) MUST be met for all user interfaces.
- User flows MUST be intuitive and require minimal cognitive load.

**Quality Gates**:
- User stories MUST include acceptance criteria that define expected behavior.
- Features MUST be reviewed for UX consistency before merging.
- Breaking changes to user workflows MUST be documented and communicated.

**Rationale**: Consistency reduces user confusion, builds trust, and decreases support burden. Users should be able to predict how the application will behave based on past interactions.

### V. Maintainability First

Code MUST be written for long-term maintainability, not short-term convenience:

- Code MUST be self-documenting through clear naming and structure.
- Complex logic MUST include explanatory comments describing the "why", not the "what".
- Functions MUST be small and focused (prefer <50 lines, MUST NOT exceed 200 lines without justification).
- Modules MUST have clear boundaries and minimal interdependencies.
- Technical debt MUST be tracked, documented, and addressed systematically.
- Deprecated code MUST be removed, not commented out.

**Code Review Standards**:
- All code changes MUST pass peer review before merging.
- Reviewers MUST verify adherence to all constitution principles.
- Complexity MUST be justified in review comments when unavoidable.

**Rationale**: Code is read far more often than it is written. Maintainable code reduces onboarding time, enables faster feature development, and minimizes bugs introduced during changes.

### VI. KISS (Keep It Simple, Stupid)

Solutions MUST favor simplicity and minimalism to reduce cognitive load:

- Implement the smallest viable change that fulfills the requirements before considering additional abstractions.
- Prefer straightforward control flow, data structures, and dependency graphs unless complexity is justified in writing.
- Avoid speculative features, hooks, or extension points until a real need is proven by the product roadmap or third confirmed use case.
- Replace intricate patterns with simpler alternatives when they offer equivalent clarity, safety, and performance.
- Remove obsolete code paths, toggles, and indirection layers once their purpose expires.

**Rationale**: Simple, elegant code is easier to comprehend, test, and maintain for both humans and tooling. Minimizing moving parts limits regression risk, speeds up reviews, and keeps the system adaptable to change.

## Quality Standards

### Code Quality Metrics

Projects MUST maintain:
- Linting and formatting tools configured and enforced (e.g., ESLint, Prettier, Biome for JavaScript/TypeScript)
- Type safety where applicable (TypeScript strict mode enabled)
- Zero linting errors at merge time
- Automated formatting on save or pre-commit

### Documentation Requirements

The following MUST be documented:
- Public APIs and their contracts
- Complex algorithms or business logic
- Setup and development workflow (README.md)
- Deployment procedures

## Development Workflow

### Feature Development Process

1. **Specification**: Feature MUST have a spec.md with user stories and acceptance criteria.
2. **Planning**: Implementation plan MUST be created (plan.md) with technical approach.
3. **Test Writing**: Tests MUST be written first and MUST fail.
4. **Implementation**: Code MUST pass all tests and adhere to all principles.
5. **Review**: Code MUST pass peer review for correctness, principles compliance, and UX consistency.
6. **Validation**: Feature MUST be validated against acceptance criteria before deployment.

### Continuous Integration

CI/CD pipelines MUST:
- Run all tests on every pull request
- Enforce linting and formatting rules
- Block merges if tests fail or quality gates are not met
- Validate test coverage meets minimum thresholds

## Governance

### Amendment Procedure

- Constitution changes MUST be proposed with clear rationale.
- Major changes (adding/removing principles) require team consensus.
- Minor changes (clarifications, wording) can be approved by technical lead.
- All changes MUST update the version number according to semantic versioning.
- All changes MUST include an impact analysis on affected templates and documentation.

### Compliance Review

- Pull requests MUST include a self-assessment of constitution compliance.
- Violations MUST be documented in the "Complexity Tracking" section of plan.md with justification.
- Repeated violations without justification MUST be addressed through team discussion.
- Constitution compliance is part of the definition of done for all features.

### Versioning Policy

Constitution versions follow semantic versioning:
- **MAJOR**: Backward incompatible principle removals or redefinitions
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, typo fixes, non-semantic wording improvements

**Version**: 1.1.0 | **Ratified**: 2025-10-19 | **Last Amended**: 2025-10-20
