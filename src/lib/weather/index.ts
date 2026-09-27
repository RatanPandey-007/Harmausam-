/**
 * Centralized Weather Data Architecture
 * Harmausam Meteorological Intelligence Platform
 *
 * Public barrel exports for all domain types, providers, repository,
 * caching engines, and meteorological normalization utilities.
 */

// Core Domain Types
export * from './types';

// Provider Contracts
export * from './provider';

// Normalization & Quality Control Utilities
export * from './normalization';

// In-Memory Caching & Request Deduplication
export * from './cache';

// Mock Research Benchmark Provider
export * from './mock-provider';

// Real NWP & Observation Model Providers (Phase 2)
export * from './providers/base-open-meteo';
export * from './providers/ecmwf-provider';
export * from './providers/gfs-provider';
export * from './providers/icon-provider';
export * from './providers/meteostat-provider';

// Data Alignment & Quality Control (Phase 3)
export * from './alignment';

// Skill & Error Metrics (Phase 4)
export * from './skill';

// Context & Regime Engines (Phase 4)
export * from './context';

// Adaptive & Baseline Blending Engines (Phase 4)
export * from './blending';

// Uncertainty & Model Disagreement Engines (Phase 5)
export * from './uncertainty';

// Extreme-Event Detection & Evaluation Engines (Phase 6)
export * from './events';

// Central Repository Facade
export * from './repository';

// Automated Research Pipeline & Evaluation Engine (Phase 7)
export * from './pipeline';


