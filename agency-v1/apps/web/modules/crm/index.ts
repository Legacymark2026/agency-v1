// CRM Module - Public API
// This is the single entry point for importing from the CRM module

// Actions
export * from './actions';

// Components  
export * from './components';

// Hooks (to be implemented)
export * from './hooks';

// Types - use explicit import/export to avoid conflicts
export type {
    Deal as CRMDeal,
    DealStage,
    LeadSource,
    Activity,
    ActivityType,
    CRMMetrics,
    KanbanColumn
} from './types';

// Utilities
export * from './lib';
