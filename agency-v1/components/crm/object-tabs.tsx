"use client";

import React from 'react';

interface ObjectTabsProps {
    definitionId: string;
    fields: any[];
    relationshipsFrom: any[];
    relationshipsTo: any[];
    permissions: any[];
}

export function ObjectTabs({ definitionId, fields, relationshipsFrom: _relationshipsFrom, relationshipsTo: _relationshipsTo, permissions: _permissions }: ObjectTabsProps) {
    return (
        <div className="w-full">
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <span className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Overview
                    </span>
                    <span className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Fields ({fields?.length || 0})
                    </span>
                </nav>
            </div>
            <div className="py-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                CRM Object Details for {definitionId} (Placeholder)
            </div>
        </div>
    );
}
