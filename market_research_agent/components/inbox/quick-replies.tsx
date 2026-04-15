
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Zap, Clock, ThumbsUp } from "lucide-react";

export interface QuickReply {
    id: string;
    trigger: string;
    content: string;
    category: 'Greeting' | 'Closing' | 'info';
}

const MOCK_REPLIES: QuickReply[] = [
    { id: '1', trigger: 'hello', content: 'Hi there! How can I help you today?', category: 'Greeting' },
    { id: '2', trigger: 'price', content: 'Our pricing starts at $49/mo. You can view full details at legacymark.com/pricing', category: 'info' },
    { id: '3', trigger: 'calendly', content: 'Feel free to book a demo time that works for you: calendly.com/legacymark/demo', category: 'info' },
    { id: '4', trigger: 'thanks', content: 'Thanks for reaching out! Let us know if you have any other questions.', category: 'Closing' },
    { id: '5', trigger: 'wait', content: 'Please give me a moment to check on that for you.', category: 'Greeting' },
];

interface QuickRepliesProps {
    onSelect: (content: string) => void;
    query: string;
}

export function QuickReplies({ onSelect, query }: QuickRepliesProps) {
    // Filter locally for now, typically Command handles this but we might want custom logic
    return (
        <Command className="border shadow-lg rounded-xl overflow-hidden mb-2 w-[350px] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 border-b flex items-center gap-2">
                <Zap size={12} className="text-amber-500 fill-amber-500" />
                Quick Replies
            </div>
            {/* Hidden input because we drive search from the main textarea usually, 
                but for standalone usage we might keep it. 
                Here we rely on the parent parsing the '/' command. 
            */}

            <CommandList className="max-h-[200px] overflow-y-auto p-1">
                <CommandEmpty className="py-4 text-center text-xs text-gray-400">No matching templates.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    {MOCK_REPLIES.map((reply) => (
                        <CommandItem
                            key={reply.id}
                            onSelect={() => onSelect(reply.content)}
                            className="cursor-pointer rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700"
                        >
                            <div className="flex flex-col w-full">
                                <span className="font-bold text-xs flex items-center gap-2">
                                    /{reply.trigger}
                                </span>
                                <span className="text-xs text-gray-500 truncate mt-0.5">
                                    {reply.content}
                                </span>
                            </div>
                            <span className="ml-auto text-[10px] text-gray-300 capitalize">{reply.category}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
