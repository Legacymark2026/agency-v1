'use client'; 

import { useState } from 'react';
import {
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { simulateIncomingMessage } from '@/actions/inbox';
import { toast } from 'sonner';
import { ChannelType } from '@/types/inbox';

export function SimulationPanel({ companyId = "default-company-id" }: { companyId?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [channel, setChannel] = useState<ChannelType>('WHATSAPP');
    const [senderName, setSenderName] = useState('Jane Doe');
    const [senderHandle, setSenderHandle] = useState('+15550123456');
    const [content, setContent] = useState('Hello! I would like to inquire about your Enterprise plan.');

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const result = await simulateIncomingMessage({
                channel,
                senderName,
                senderHandle,
                content,
                companyId
            });

            if (result.success) {
                toast.success("Message Simulated!", {
                    description: `Received on ${channel} from ${senderName}`
                });
                setOpen(false);
            } else {
                toast.error("Simulation Failed", {
                    description: result.error
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 shadow-sm">
                    <Zap size={14} className="fill-indigo-700" />
                    Simulate Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Channel Simulation (Dev Tools)</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        Trigger a fake incoming message to test the Inbox data flow without external API keys.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Channel</label>
                        <Select value={channel} onValueChange={(val) => setChannel(val as ChannelType)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                <SelectItem value="MESSENGER">Facebook Messenger</SelectItem>
                                <SelectItem value="INSTAGRAM">Instagram DM</SelectItem>
                                <SelectItem value="TWITTER">X (Twitter) DM</SelectItem>
                                <SelectItem value="LINKEDIN">LinkedIn Message</SelectItem>
                                <SelectItem value="YOUTUBE">YouTube Comment</SelectItem>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="SMS">SMS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sender Name</label>
                        <Input 
                            value={senderName} 
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="Jane Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sender Handle (Phone/Email/Username)</label>
                        <Input 
                            value={senderHandle} 
                            onChange={(e) => setSenderHandle(e.target.value)}
                            placeholder="+15550123456"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message Content</label>
                        <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type the message content here..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSimulate} 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {loading ? "Simulating..." : "Send Test Message"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
