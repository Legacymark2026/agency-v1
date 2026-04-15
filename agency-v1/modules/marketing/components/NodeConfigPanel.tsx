import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NodeConfigPanelProps {
    selectedNode: any | null;
    onChange: (nodeId: string, data: any) => void;
    onClose: () => void;
}

export default function NodeConfigPanel({ selectedNode, onChange, onClose }: NodeConfigPanelProps) {
    const [localData, setLocalData] = useState<any>({});

    useEffect(() => {
        if (selectedNode) {
            const timer = setTimeout(() => setLocalData(selectedNode.data || {}), 0);
            return () => clearTimeout(timer);
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const handleChange = (key: string, value: any) => {
        const newData = { ...localData, [key]: value };
        setLocalData(newData);
        onChange(selectedNode.id, newData);
    };

    return (
        <div className="w-80 border-l border-gray-200 bg-white h-full overflow-y-auto flex flex-col shadow-xl absolute right-0 top-0 z-20">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-700">Configuration</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X size={16} />
                </Button>
            </div>

            <div className="p-6 space-y-6 flex-1">
                <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                        value={localData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        placeholder="Node Name"
                    />
                </div>

                {selectedNode.type === 'triggerNode' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 border border-blue-100">
                            <strong>Trigger Type:</strong> Form Submission
                            <p className="mt-1 opacity-80">This workflow will start when a user submits a specific form.</p>
                        </div>
                    </div>
                )}

                {selectedNode.type === 'actionNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Template ID</Label>
                            <Input
                                value={localData.templateId || ''}
                                onChange={(e) => handleChange('templateId', e.target.value)}
                                placeholder="e.g. welcome-email-v1"
                            />
                            <p className="text-xs text-gray-500">The ID of the email template to send.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject Line</Label>
                            <Input
                                value={localData.subject || ''}
                                onChange={(e) => handleChange('subject', e.target.value)}
                                placeholder="Welcome to our service!"
                            />
                        </div>
                    </div>
                )}

                {selectedNode.type === 'waitNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Delay Duration</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={localData.delayValue || '24'}
                                    onChange={(e) => handleChange('delayValue', e.target.value)}
                                    placeholder="24"
                                />
                                <select
                                    className="border rounded px-2 text-sm bg-white"
                                    value={localData.delayUnit || 'h'}
                                    onChange={(e) => handleChange('delayUnit', e.target.value)}
                                >
                                    <option value="m">Minutes</option>
                                    <option value="h">Hours</option>
                                    <option value="d">Days</option>
                                </select>
                            </div>
                            <p className="text-xs text-gray-500">Wait specific time before proceeding.</p>
                        </div>
                    </div>
                )}

                {selectedNode.type === 'conditionNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Variable</Label>
                            <select className="flex w-full h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors text-sm">
                                <option value="email">Contact Email</option>
                                <option value="name">Contact Name</option>
                                <option value="company">Company Name</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Operator</Label>
                            <select className="flex w-full h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors text-sm">
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="starts_with">Starts With</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                                value={localData.conditionValue || ''}
                                onChange={(e) => handleChange('conditionValue', e.target.value)}
                                placeholder="e.g. @gmail.com"
                            />
                        </div>




                        <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
                            <strong>Note:</strong> Conditions are visual-only in this beta version. The workflow will follow the &quot;True&quot; path.
                        </div>
                    </div>
                )}

                {selectedNode.type === 'aiNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>AI Task</Label>
                            <select
                                className="flex w-full h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors text-sm"
                                value={localData.aiTask || 'SENTIMENT'}
                                onChange={(e) => handleChange('aiTask', e.target.value)}
                            >
                                <option value="SENTIMENT">Analyze Sentiment</option>
                                <option value="GENERATION">Draft Response</option>
                            </select>
                        </div>

                        {localData.aiTask === 'GENERATION' && (
                            <div className="space-y-2">
                                <Label>Prompt Context</Label>
                                <Input
                                    value={localData.promptContext || ''}
                                    onChange={(e) => handleChange('promptContext', e.target.value)}
                                    placeholder="e.g. Write a friendly reply..."
                                />
                            </div>
                        )}

                        <div className="bg-indigo-50 p-3 rounded text-xs text-indigo-800 border border-indigo-100">
                            <strong>AI Powered:</strong> This node uses the Neural Engine to process data intelligently.
                        </div>
                    </div>
                )}

                {selectedNode.type === 'slackNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Webhook URL</Label>
                            <Input
                                value={localData.webhookUrl || ''}
                                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                                placeholder="https://hooks.slack.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Message</Label>
                            <Input
                                value={localData.message || ''}
                                onChange={(e) => handleChange('message', e.target.value)}
                                placeholder="New lead: {{email}}"
                            />
                        </div>
                    </div>
                )}

                {selectedNode.type === 'httpNode' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Method</Label>
                            <select
                                className="flex w-full h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors text-sm"
                                value={localData.method || 'POST'}
                                onChange={(e) => handleChange('method', e.target.value)}
                            >
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={localData.url || ''}
                                onChange={(e) => handleChange('url', e.target.value)}
                                placeholder="https://api.example.com/v1/..."
                            />
                        </div>
                    </div>
                )}

                {(selectedNode.type === 'smsNode' || selectedNode.type === 'whatsappNode') && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={localData.phoneNumber || ''}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                placeholder="+1234567890 (or {{phone}})"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Message Body</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={localData.message || ''}
                                onChange={(e) => handleChange('message', e.target.value)}
                                placeholder="Hello {{name}}, welcome to..."
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
                Changes are auto-saved to canvas.
            </div>
        </div>
    );
}
