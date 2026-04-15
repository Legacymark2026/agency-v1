import React from 'react';
import { Mail, Clock, PlayCircle } from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 shrink-0">
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Triggers
                </h3>
                <div
                    className="dndnode input flex items-center p-3 mb-2 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'triggerNode', 'Start Workflow')}
                    draggable
                >
                    <PlayCircle size={16} className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700"> Trigger</span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Actions
                </h3>
                <div
                    className="dndnode flex items-center p-3 mb-2 bg-white border border-gray-200 rounded cursor-grab hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                    onDragStart={(event) => onDragStart(event, 'actionNode', 'Send Email')}
                    draggable
                >
                    <Mail size={16} className="text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Send Email</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-white border border-gray-200 rounded cursor-grab hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                    onDragStart={(event) => onDragStart(event, 'waitNode', 'Wait')}
                    draggable
                >
                    <Clock size={16} className="text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Wait Delay</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-white border border-gray-200 rounded cursor-grab hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                    onDragStart={(event) => onDragStart(event, 'conditionNode', 'Check If...')}
                    draggable
                >
                    <div className="w-4 h-4 border-2 border-gray-400 transform rotate-45 mr-3 flex-shrink-0"></div>
                    <span className="text-sm font-medium text-gray-700">Condition</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-emerald-50 border border-emerald-200 rounded cursor-grab hover:bg-emerald-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'slackNode', 'Send Slack/Discord')}
                    draggable
                >
                    <div className="w-4 h-4 mr-3 text-emerald-600">💬</div>
                    <span className="text-sm font-medium text-gray-700">Send Message</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-slate-100 border border-slate-200 rounded cursor-grab hover:bg-slate-200 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'httpNode', 'HTTP Request')}
                    draggable
                >
                    <div className="w-4 h-4 mr-3 text-slate-600">🌐</div>
                    <span className="text-sm font-medium text-gray-700">Webhook / API</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-blue-50 border border-blue-200 rounded cursor-grab hover:bg-blue-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'smsNode', 'Send SMS')}
                    draggable
                >
                    <div className="w-4 h-4 mr-3 text-blue-600">📱</div>
                    <span className="text-sm font-medium text-gray-700">SMS</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-green-50 border border-green-200 rounded cursor-grab hover:bg-green-100 transition-colors"
                    onDragStart={(event) => onDragStart(event, 'whatsappNode', 'WhatsApp')}
                    draggable
                >
                    <div className="w-4 h-4 mr-3 text-green-600">💬</div>
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </div>

                <div
                    className="dndnode flex items-center p-3 mb-2 bg-gray-900 border border-gray-700 rounded cursor-grab hover:bg-gray-800 transition-colors shadow-lg group"
                    onDragStart={(event) => onDragStart(event, 'aiNode', 'AI Sentiment Helper')}
                    draggable
                >
                    <div className="w-4 h-4 rounded bg-indigo-500 mr-3 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">AI Brain</span>
                </div>
            </div>

            <div className="mt-auto pt-6 text-xs text-gray-400">
                Drag nodes to the canvas to build your workflow.
            </div>
        </aside>
    );
}
