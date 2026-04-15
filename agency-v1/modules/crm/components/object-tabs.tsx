'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldsManager } from "./fields-manager";
import { RelationshipsManager } from "./relationships-manager";
import { PermissionsManager } from "./permissions-manager";

export function ObjectTabs({
    definitionId,
    fields,
    relationshipsFrom,
    relationshipsTo,
    permissions
}: {
    definitionId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    relationshipsFrom: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    relationshipsTo: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    permissions: any[];
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <div className="px-3 py-1.5 text-sm font-medium">Campos (0)</div>
                    <div className="px-3 py-1.5 text-sm font-medium">Relaciones (0)</div>
                    <div className="px-3 py-1.5 text-sm font-medium">Permisos (0)</div>
                </div>
            </div>
        );
    }

    return (
        <Tabs defaultValue="fields" className="w-full">
            <TabsList>
                <TabsTrigger value="fields">Campos ({fields.length})</TabsTrigger>
                <TabsTrigger value="relationships">
                    Relaciones ({relationshipsFrom.length + relationshipsTo.length})
                </TabsTrigger>
                <TabsTrigger value="permissions">Permisos ({permissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="mt-6">
                <FieldsManager definitionId={definitionId} fields={fields} />
            </TabsContent>

            <TabsContent value="relationships" className="mt-6">
                <RelationshipsManager
                    definitionId={definitionId}
                    relationshipsFrom={relationshipsFrom}
                    relationshipsTo={relationshipsTo}
                />
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
                <PermissionsManager
                    definitionId={definitionId}
                    permissions={permissions}
                />
            </TabsContent>
        </Tabs>
    );
}
