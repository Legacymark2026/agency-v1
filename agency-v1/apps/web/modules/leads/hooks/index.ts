/**
 * Leads Module - Custom Hooks
 */

'use client';

import { useState, useEffect } from 'react';
import type { Lead, LeadFilters, LeadStats } from '../types';
import { getLeads, getLeadStats } from '../actions';

/**
 * Hook to fetch leads with filters
 */
export function useLeads(filters?: LeadFilters) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeads = async () => {
            setIsLoading(true);
            const result = await getLeads(filters);

            if (result.success && result.leads) {
                setLeads(result.leads as Lead[]);
                setTotal(result.total || 0);
                setError(null);
            } else {
                setError(result.error || 'Failed to load leads');
            }

            setIsLoading(false);
        };

        fetchLeads();
    }, [filters]);

    return {
        leads,
        total,
        isLoading,
        error,
    };
}

/**
 * Hook to fetch lead statistics
 */
export function useLeadStats(companyId?: string) {
    const [stats, setStats] = useState<LeadStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            const result = await getLeadStats(companyId);

            if (result.success && result.stats) {
                setStats(result.stats as LeadStats);
                setError(null);
            } else {
                setError(result.error || 'Failed to load statistics');
            }

            setIsLoading(false);
        };

        fetchStats();
    }, [companyId]);

    return {
        stats,
        isLoading,
        error,
    };
}
