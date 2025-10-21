/**
 * Family module exports
 * Provides family management functionality including creation, membership, and role management.
 */

// Domain exports
export * from './domain/family';

// Service exports
export * from './services/family.service';

// Repository exports
export * from './repositories/family.repository';
export * from './repositories/family-membership.repository';

// Validator exports
export * from './validators/create-family.validator';
export * from './validators/add-family-member.validator';

// Route exports
export * from './routes';
