# AI Provider Selection Enhancement

## Overview
Extend the AI settings configuration to allow families to specify which AI provider backend they want to use: **LM Studio**, **Ollama**, or **OpenAI**. This enables flexible AI service selection while maintaining a single, unified settings interface.

## Why
Currently, families can configure custom AI endpoints but have no way to indicate which provider backend is being used. This causes ambiguity and makes it harder for the system to handle provider-specific behavior, optimization, or feature flags in the future. Adding an explicit provider selection makes the configuration self-documenting and enables provider-aware logic.

## What Changes
- Added `provider` field to `AISettings` domain model with enum values: `"LM Studio" | "Ollama" | "OpenAI"`
- Extended API validators (Zod schemas) to validate and require provider field
- Updated family settings service to persist and retrieve provider configuration
- Enhanced web UI with provider dropdown selector in `AISettingsTab` component
- Added comprehensive test coverage for provider validation, persistence, and selection across unit and E2E tests

## Scope
- Add `provider` field to `AISettings` domain model (values: `"LM Studio" | "Ollama" | "OpenAI"`)
- Update API validators and schemas to accept provider field
- Update family settings service and repository to persist and retrieve provider
- Update web UI to display provider dropdown in AI settings tab
- Add/update tests to cover new provider field

## Goals
1. **User-facing**: Parents can select their AI provider from a dropdown (no manual text entry)
2. **Backend**: Provider choice is persisted in the database and exposed through the API
3. **Privacy-first**: Default to LM Studio (local, private execution) while allowing families to choose cloud-based alternatives if desired
4. **Testability**: Tests verify provider is correctly stored, retrieved, and displayed

## Out of Scope
- Implementing provider-specific behavior (routing, configuration transformations)
- Encryption of provider metadata
- Migration of existing settings records (start fresh or treat as optional field with sensible default)

## Cross-Team Alignment
- **API**: Extends `AISettings` model; backward compatible (provider field optional, defaults to user selection)
- **Web**: New dropdown input in existing `AISettingsTab` component
- **Database**: Single field addition to `aiSettings` subdocument in `family_settings` collection
