'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send, Paperclip, Smile, Image as ImageIcon,
    Phone, Video, MoreHorizontal, Check, CheckCheck,
    Reply, Forward, Trash2, Copy, Clock, Sparkles, Download, Timer, Volume2, X, GitMerge, MessageSquareMore
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendMessage, updateConversationStatus, draftCopilotServerAction, updateLeadStatusFromInbox, deleteConversation, deleteMessage } from '@/actions/inbox';
import { sendMessage_Advanced } from '@/actions/inbox-advanced';
import { ChannelIcon } from './channel-icon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { QuickReplies } from './quick-replies';
import { useInboxShortcuts } from '@/hooks/use-inbox-shortcuts';
import { Mic, CheckCircle2, Maximize2, Minimize2, MonitorUp, UserPlus, MicOff, VideoOff, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { MergeModal } from './merge-modal';
import { DraftComposer } from './draft-composer';

function AudioPlayer({ durationText, audioSrc, isMe }: { durationText: string, audioSrc?: string, isMe?: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Force reload when src changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            setIsPlaying(false);
            setProgress(0);
        }
    }, [audioSrc]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => { setIsPlaying(true); }).catch(error => {
                    console.error("Audio playback prevented:", error);
                    toast.error("Error al reproducir el audio");
                    setIsPlaying(false);
                });
            } else { setIsPlaying(true); }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && isPlaying && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-3 min-w-[220px] max-w-[300px] py-1.5 px-3 rounded-2xl border transition-all",
            isMe 
                ? "bg-white/10 border-white/20" 
                : "bg-black/20 border-white/5"
        )}>
            <audio
                ref={audioRef}
                src={audioSrc || ""}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => { setIsPlaying(false); setProgress(0); }}
                onError={() => setIsPlaying(false)}
            />
            <Button 
                variant="secondary" 
                size="icon" 
                className={cn(
                    "h-8 w-8 rounded-full shrink-0 shadow-lg flex items-center justify-center transition-all",
                    isMe ? "bg-teal-400 hover:bg-teal-300 text-teal-950" : "bg-teal-600 hover:bg-teal-500 text-white"
                )} 
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
            </Button>
            
            <div className="flex-1 space-y-1.5">
                <div className="h-1 bg-white/10 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
                    if (audioRef.current && audioRef.current.duration) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const per = (e.clientX - rect.left) / rect.width;
                        audioRef.current.currentTime = per * audioRef.current.duration;
                        setProgress(per * 100);
                    }
                }}>
                    <div className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-75", isMe ? "bg-white" : "bg-teal-500")} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between items-center px-0.5">
                    <span className="text-xs font-mono opacity-60 uppercase tracking-tighter">{durationText}</span>
                    <span className="text-xs font-bold opacity-40">AUDIO WAVE</span>
                </div>
            </div>
        </div>
    );
}

export function ChatWindow({ conversation, messages: initialMessages, currentUserId }: any) {
    const [messages, setMessages] = useState(initialMessages);

    // Update messages when server component re-fetches (e.g. from RealtimeRefresher)
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);
    const [newItem, setNewItem] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [isRecording, setIsRecording] = useState(false); // Visual state for Voice Note
    const [isTyping, setIsTyping] = useState(false); // Simulated typing state
    const [isPrivateNote, setIsPrivateNote] = useState(false); // Internal Private Notes Toggle
    const isAdmin = true; // Simulate Admin check for deletion
    const [showMergeModal, setShowMergeModal] = useState(false);

    const [showBackgroundAlert, setShowBackgroundAlert] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    // Call UI State
    const [activeCall, setActiveCall] = useState<'video' | 'audio' | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [recordDuration, setRecordDuration] = useState(0);
    const [isCallMinimized, setIsCallMinimized] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [newParticipant, setNewParticipant] = useState('');

    // Real Media Streams
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    // WebRTC Real Media Controls
    useEffect(() => {
        let stream: MediaStream | null = null;
        if (activeCall === 'video' && !isVideoOff) {
            if (!window.isSecureContext) {
                toast.error('La cámara requiere una conexión segura (HTTPS).');
                setIsVideoOff(true);
                return;
            }

            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(s => {
                    stream = s;
                    setLocalStream(s);
                    if (localVideoRef.current) localVideoRef.current.srcObject = s;
                })
                .catch(err => {
                    console.error("Camera access denied or failed", err);
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        toast.error("Permiso de cámara/micro denegado. Actívalo en el candado (🔒) de tu navegador.");
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        toast.error("No se encontró cámara o micrófono en este equipo.");
                    } else {
                        toast.error("Error al acceder a la cámara o micrófono.");
                    }
                    setIsVideoOff(true);
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        };
    }, [activeCall, isVideoOff]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isSharingScreen) {
            navigator.mediaDevices.getDisplayMedia({ video: true })
                .then(s => {
                    stream = s;
                    setScreenStream(s);
                    if (screenVideoRef.current) screenVideoRef.current.srcObject = s;

                    // Listen for native "stop sharing" button in the browser UI
                    s.getVideoTracks()[0].onended = () => {
                        setIsSharingScreen(false);
                    };
                })
                .catch(err => {
                    console.error("Screen share denied or failed", err);
                    toast.error("No se pudo compartir la pantalla.");
                    setIsSharingScreen(false);
                });
        }
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            setScreenStream(null);
        };
    }, [isSharingScreen]);

    // Handle Mute State
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);


    // Advanced Chat Features State
    const [pendingFiles, setPendingFiles] = useState<(File | { name: string, type: string })[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSendLaterModal, setShowSendLaterModal] = useState(false);
    const [sendLaterDate, setSendLaterDate] = useState('');

    // Effect for call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeCall) {
            interval = setInterval(() => setCallDuration(p => p + 1), 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [activeCall]);

    // Effect for record duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setRecordDuration(p => p + 1), 1000);
        } else {
            setRecordDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Simulate typing effect for demo
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        }, 2000);

        // Simulate a background message arriving from another channel
        const alertTimer = setTimeout(() => {
            setShowBackgroundAlert(true);
            setTimeout(() => setShowBackgroundAlert(false), 5000); // hide after 5s
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearTimeout(alertTimer);
        }
    }, []);

    // Shortcuts
    useInboxShortcuts({
        onSend: () => handleSend(),
        onEscape: () => setShowQuickReplies(false),
        onQuickReply: () => {
            setNewItem(prev => prev + '/');
            setShowQuickReplies(true);
            textareaRef.current?.focus();
        }
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Auto-resize textarea
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    // Returns a promise that resolves with the recorded File once onstop fires
    const stopRecordingAndGetFile = (): Promise<File> => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorderRef.current) return reject(new Error('No recorder'));
            const rec = mediaRecorderRef.current;

            rec.onstop = () => {
                const mimeType = rec.mimeType || 'audio/ogg';
                const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const file = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
                // Stop microphone light
                rec.stream.getTracks().forEach(t => t.stop());
                audioChunksRef.current = [];
                resolve(file);
            };

            rec.stop();
        });
    };

    const toggleRecording = async () => {
        if (!isRecording) {
            try {
                if (!window.isSecureContext) {
                    toast.error('Acceso bloqueado: El micrófono requiere una conexión segura (HTTPS).');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                    ? 'audio/ogg;codecs=opus'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                            ? 'audio/webm;codecs=opus'
                            : 'audio/webm';
                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.start(200);
                setIsRecording(true);
                toast.success('Grabando nota de voz...');
            } catch (error: any) {
                console.error("Mic error:", error);
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    toast.error('Permiso denegado: Haz clic en el ícono del candado (🔒) en la barra de direcciones y permite el micrófono.');
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    toast.error('No se encontró ningún micrófono conectado a este dispositivo.');
                } else {
                    toast.error('Error al acceder al micrófono. Verifica la configuración de tu sistema.');
                }
            }
        } else {
            // Stop recording — file will be obtained via stopRecordingAndGetFile()
            setIsRecording(false);
            try {
                const file = await stopRecordingAndGetFile();
                setPendingFiles(prev => [...prev, file]);
            } catch (err) {
                console.error('Error stopping recording:', err);
                toast.error('Error al procesar la nota de voz');
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            setRecordDuration(0);
            audioChunksRef.current = [];
            toast.info('Grabación cancelada');
        }
    };

    const handleSend = async () => {
        if (!newItem.trim() && !isRecording && pendingFiles.length === 0) return;

        // Si estaba grabando al apretar enviar, detener y esperar los chunks
        if (isRecording && mediaRecorderRef.current) {
            setIsRecording(false);
            try {
                const file = await stopRecordingAndGetFile();
                setPendingFiles(prev => [...prev, file]);
                // Now re-trigger send with the file in state
                setTimeout(handleSend, 50);
            } catch {
                toast.error('Error al procesar la nota de voz');
            }
            return;
        }

        setIsSending(true);
        let content = newItem;

        // Pre-set content for voice notes so the message always has content
        const hasAudioFile = pendingFiles.some((f: any) => f instanceof File && f.type?.includes('audio'));
        if (hasAudioFile && !content) {
            content = `🎤 Nota de Voz`;
        }

        try {
            // Subir archivos
            const uploadedAttachments: { url: string; type: string }[] = [];

            for (const file of pendingFiles) {
                if (file instanceof File) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const isAudio = file.type.includes('audio');
                    const mediaType = isAudio ? 'AUDIO' : (file.type.includes('image') ? 'IMAGE' : 'DOCUMENT');

                    // Try WhatsApp upload first
                    let uploaded = false;
                    try {
                        const res = await fetch("/api/media/whatsapp-upload", { method: "POST", body: formData });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.id) {
                                uploadedAttachments.push({
                                    url: `/api/media/whatsapp/${data.id}`,
                                    type: mediaType
                                });
                                uploaded = true;
                            }
                        }
                    } catch (err) {
                        console.warn("WhatsApp media upload failed, trying Cloudinary fallback...", err);
                    }

                    // Fallback: upload to Cloudinary if WhatsApp upload didn't work
                    if (!uploaded) {
                        try {
                            const cloudinaryForm = new FormData();
                            cloudinaryForm.append("file", file);
                            cloudinaryForm.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "legacymark_unsigned");
                            cloudinaryForm.append("resource_type", isAudio ? "video" : "auto");
                            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "legacymark";
                            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${isAudio ? 'video' : 'auto'}/upload`, {
                                method: "POST",
                                body: cloudinaryForm
                            });
                            if (cloudRes.ok) {
                                const cloudData = await cloudRes.json();
                                uploadedAttachments.push({
                                    url: cloudData.secure_url,
                                    type: mediaType
                                });
                                uploaded = true;
                            }
                        } catch (cloudErr) {
                            console.warn("Cloudinary fallback also failed:", cloudErr);
                        }
                    }

                    if (!uploaded) {
                        toast.warning(`Media no subida (${file.name}), el mensaje se enviará sin adjunto.`);
                    }
                } else {
                    // It's a mock old string file
                }
            }

            const optimisticAttachments = uploadedAttachments.map((a, idx) => ({
                id: 'temp-a-' + Math.random(),
                fileName: pendingFiles[idx] instanceof File ? (pendingFiles[idx] as File).name : 'attachment',
                mediaUrl: a.url,
                mediaType: a.type
            }));

            const optimisticMsg = {
                id: 'temp-' + Date.now(),
                content: content,
                direction: isPrivateNote ? 'INTERNAL' : 'OUTBOUND',
                status: 'SENT',
                createdAt: new Date(),
                senderId: currentUserId,
                attachments: optimisticAttachments,
            };

            setMessages((prev: any) => [...prev, optimisticMsg]);
            setNewItem('');
            setShowQuickReplies(false);
            setIsRecording(false);
            setIsPrivateNote(false);
            setPendingFiles([]); // Clear pending files
            if (textareaRef.current) textareaRef.current.style.height = '44px'; // Reset height

            // Format for advanced action
            const advancedAttachments = uploadedAttachments.map((a, idx) => ({
                fileName: pendingFiles[idx] instanceof File ? (pendingFiles[idx] as File).name : 'attachment',
                mediaUrl: a.url,
                mediaType: a.type,
                fileSize: pendingFiles[idx] instanceof File ? (pendingFiles[idx] as File).size : 0
            }));

            // Call Server Action
            const result = await sendMessage_Advanced(conversation.id, content, isPrivateNote ? 'INTERNAL' : 'OUTBOUND', null, advancedAttachments);
            if (result && result.success === false) {
                toast.error((result as any).error);
                setMessages((prev: any) => prev.map((m: any) => m.id === optimisticMsg.id ? { ...m, status: 'FAILED' } : m));
            } else {
                setMessages((prev: any) => prev.map((m: any) => m.id === optimisticMsg.id ? { ...m, status: 'SENT' } : m));
            }
        } catch (error) {
            console.error("Error sending message", error);
            toast.error("Error enviando el mensaje.");
            setMessages((prev: any) => prev.map((m: any) => m.status === 'SENT' && m.id.startsWith('temp-') ? { ...m, status: 'FAILED' } : m));
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickReplySelect = (content: string) => {
        setNewItem(content);
        setShowQuickReplies(false);
        if (textareaRef.current) textareaRef.current.focus();
        // optionally auto-send or just fill
    };

    const handleCloseDeal = async () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        toast.success("Deal Won! Updating status...");
        await updateLeadStatusFromInbox(conversation.id, 'WON');
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/20 overflow-hidden relative">
            {/* Header - Glassmorphism touch */}
            <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/95 backdrop-blur-md sticky top-0 z-10 shrink-0">
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ position: "relative" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "13px", fontFamily: "monospace" }}>
                            {conversation.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div style={{ position: "absolute", bottom: "-3px", right: "-3px", background: "rgba(8,12,20,0.95)", borderRadius: "50%", padding: "2px", border: "1px solid rgba(30,41,59,0.9)" }}>
                            <ChannelIcon channel={conversation.channel} className="text-xs" />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <h2 style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", fontFamily: "monospace", margin: 0 }}>{conversation.lead?.name || 'Unknown Lead'}</h2>
                            <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "2px 6px", borderRadius: "99px", border: "1px solid rgba(16,185,129,0.3)" }}>😊 Positive</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>{conversation.channel}</span>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#1e293b" }} />
                            <span style={{ fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
                                Active
                            </span>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#1e293b" }} />
                            <span style={{ fontSize: "10px", color: "#334155", display: "flex", alignItems: "center", gap: "3px", background: "rgba(30,41,59,0.6)", padding: "1px 6px", borderRadius: "6px", fontFamily: "monospace" }}>
                                <Timer size={9} style={{ color: "#475569" }} /> FRT: 3m
                            </span>
                            <span style={{ fontSize: "10px", color: "#334155", display: "flex", alignItems: "center", gap: "3px", background: "rgba(30,41,59,0.6)", padding: "1px 6px", borderRadius: "6px", fontFamily: "monospace" }}>
                                <Clock size={9} style={{ color: "#475569" }} /> TRT: 45m
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                    {/* Status Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "monospace", border: conversation.status === 'OPEN' ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(30,41,59,0.9)", background: conversation.status === 'OPEN' ? "rgba(16,185,129,0.1)" : "rgba(30,41,59,0.6)", color: conversation.status === 'OPEN' ? "#10b981" : "#475569" }}>
                                {conversation.status === 'OPEN' ? <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} /> : <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#334155", display: "inline-block" }} />}
                                {conversation.status}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateConversationStatus(conversation.id, 'OPEN')}>Mark as Open</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationStatus(conversation.id, 'CLOSED')}>Mark as Closed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationStatus(conversation.id, 'SNOOZED')}>Snooze</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div style={{ width: "1px", height: "20px", background: "rgba(30,41,59,0.8)", margin: "0 4px" }} />

                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#334155", display: "flex" }} onClick={() => setActiveCall('audio')}>
                        <Phone size={17} />
                    </button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#334155", display: "flex" }} onClick={() => setActiveCall('video')}>
                        <Video size={17} />
                    </button>
                    <div style={{ width: "1px", height: "20px", background: "rgba(30,41,59,0.8)", margin: "0 4px" }} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#334155", display: "flex" }}>
                                <MoreHorizontal size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => toast.info('Opening contact details...')}>View Contact Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('Pinned to top')}>Pin to Top</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationStatus(conversation.id, 'SNOOZED')}>Snooze Conversation</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-teal-600 focus:text-teal-600" onClick={() => toast.success('Transcript exported as PDF')}>
                                <Download size={14} /> Export Transcript
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-purple-500 focus:text-purple-500" onClick={() => setShowMergeModal(true)}>
                                <GitMerge size={14} /> Merge Conversation
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-amber-600 focus:text-amber-600" onClick={() => toast.warning('Conversation marked as spam')}>Mark as Spam</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { updateConversationStatus(conversation.id, 'CLOSED'); handleCloseDeal(); }}>Close Conversation</DropdownMenuItem>
                            {isAdmin && (
                                <>
                                    <div className="h-px bg-[rgba(30,41,59,0.8)] my-1" />
                                    <DropdownMenuItem className="text-red-700 bg-red-50 focus:text-white focus:bg-red-600 font-bold gap-2" onClick={async () => {
                                        toast.info("Eliminando chat...");
                                        const res = await deleteConversation(conversation.id);
                                        if (res.success) {
                                            toast.success('Chat deleted permanently');
                                            window.location.href = '/dashboard/inbox';
                                        } else {
                                            toast.error("Error eliminando chat");
                                        }
                                    }}>
                                        <Trash2 size={14} /> Delete Chat (Admin)
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Floating Background Notification Bubble */}
            <AnimatePresence>
                {showBackgroundAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-xs ring-2 ring-slate-900">
                                WA
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-100">Nuevo mensaje de WhatsApp</span>
                            <span className="text-xs text-slate-300">Carlos Díaz: "¡Listo, gracias!"</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Call Overlay */}
            <AnimatePresence>
                {activeCall && !isCallMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6"
                    >
                        {/* Top Bar for Call */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-red-500/20 text-red-100 px-3 py-1.5 rounded-full border border-red-500/30">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
                                <span className="text-xs font-bold tracking-widest">REC</span>
                            </div>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsCallMinimized(true)}>
                                <Minimize2 size={20} />
                            </Button>
                        </div>

                        {activeCall === 'video' ? (
                            <div className="w-full max-w-6xl flex-1 flex flex-col lg:flex-row gap-6 mt-8 mb-6 relative">
                                {isSharingScreen ? (
                                    <>
                                        {/* Shared Screen Canvas */}
                                        <div className="flex-[3] rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center group">
                                            <div className="absolute inset-x-0 top-0 h-10 bg-slate-900/80 backdrop-blur-md flex items-center px-4 z-20 border-b border-white/5">
                                                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    Transmitting Screen: Application Window
                                                </div>
                                            </div>
                                            {/* Real Desktop Screen Content */}
                                            <div className="w-full h-full bg-slate-100 flex flex-col relative">
                                                <video
                                                    ref={screenVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-contain bg-black"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-transparent ring-inset ring-2 ring-indigo-500 pointer-events-none rounded-2xl z-20 transition-all opacity-0 group-hover:opacity-100 duration-500"></div>
                                        </div>

                                        {/* Side PIPs */}
                                        <div className="flex-1 flex flex-col gap-4 w-full max-w-sm shrink-0">
                                            {/* Client Camera PIP */}
                                            <div className="flex-1 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative shadow-lg group">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/80 to-purple-900/80">
                                                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-4xl font-bold text-white shadow-xl backdrop-blur-md border border-white/20">
                                                        {conversation.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white/90 border border-white/10">{conversation.lead?.name || 'Client'}</div>
                                            </div>
                                            {/* Agent Camera PIP */}
                                            <div className="flex-1 rounded-2xl bg-black border border-slate-700 overflow-hidden relative shadow-lg group">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    {isVideoOff ? (
                                                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold border-2 border-slate-700 text-slate-400">AG</div>
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
                                                            {/* Real webcam feed */}
                                                            <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
                                                            <span className="bg-black/40 px-2 py-0.5 rounded text-white font-medium z-10 font-mono text-xs tracking-widest absolute top-2 right-2 backdrop-blur-sm pointer-events-none border border-white/10">LIVE</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white/90 border border-white/10">You (Agent)</div>
                                                {isMuted && <div className="absolute top-3 right-3 bg-red-500/90 p-1.5 rounded-full shadow-lg backdrop-blur-sm border border-red-400/50"><MicOff size={14} className="text-white" /></div>}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Regular 50/50 Layout */}
                                        {/* Agent Camera */}
                                        <div className="flex-1 rounded-3xl bg-black border border-slate-800 overflow-hidden relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group transition-all duration-300 hover:ring-2 ring-indigo-500/30">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                {isVideoOff ? (
                                                    <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-slate-500 border-2 border-slate-800 shadow-inner">AG</div>
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center relative overflow-hidden">
                                                        {/* Real webcam feed */}
                                                        <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10 pointer-events-none"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold border border-white/5 z-20 flex items-center gap-2 text-white">
                                                You (Agent)
                                                {!isVideoOff && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1"></span>}
                                            </div>
                                            {isMuted && <div className="absolute top-6 right-6 bg-red-500 p-2.5 rounded-full shadow-lg z-20 border border-red-400/30"><MicOff size={18} className="text-white" /></div>}
                                        </div>

                                        {/* Client Camera */}
                                        <div className="flex-1 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group transition-all duration-300 hover:ring-2 ring-indigo-500/30">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-slate-900/90 relative overflow-hidden">
                                                {/* Decorative background rings */}
                                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.5)_0,transparent_50%))]"></div>
                                                <div className="w-40 h-40 rounded-full bg-indigo-500/10 flex items-center justify-center text-6xl font-bold text-indigo-100 shadow-2xl backdrop-blur-sm border border-indigo-500/20 z-10 relative">
                                                    {conversation.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center z-20">
                                                        <VideoOff size={16} className="text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-6 left-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold border border-white/5 z-20 text-white">
                                                {conversation.lead?.name || 'Cliente'}
                                            </div>
                                            <div className="absolute top-6 right-6 bg-slate-800/80 backdrop-blur p-2.5 rounded-full z-20 border border-white/5"><MicOff size={18} className="text-slate-400" /></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative mb-8 mt-12">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl font-bold shadow-2xl ring-4 ring-indigo-500/30 relative z-10">
                                    {conversation.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                                </div>
                            </div>
                        )}

                        {activeCall === 'audio' && (
                            <h2 className="text-3xl font-bold mb-2">{conversation.lead?.name || 'Unknown Lead'}</h2>
                        )}
                        <p className="text-slate-300 font-mono text-xl mb-12 flex items-center gap-3 bg-slate-800/50 px-4 py-1.5 rounded-full">
                            {formatDuration(callDuration)}
                        </p>

                        <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur p-4 rounded-3xl border border-slate-700">
                            <Button variant="outline" size="icon" className={cn("w-14 h-14 rounded-full border-transparent transition-all", isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-slate-700 hover:bg-slate-600 text-white")} onClick={() => setIsMuted(!isMuted)}>
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </Button>

                            {activeCall === 'video' && (
                                <Button variant="outline" size="icon" className={cn("w-14 h-14 rounded-full border-transparent transition-all", isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-slate-700 hover:bg-slate-600 text-white")} onClick={() => setIsVideoOff(!isVideoOff)}>
                                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                </Button>
                            )}

                            <Button variant="outline" size="icon" className={cn("w-14 h-14 rounded-full border-transparent transition-all", isSharingScreen ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-slate-700 hover:bg-slate-600 text-white")} onClick={() => setIsSharingScreen(!isSharingScreen)}>
                                <MonitorUp className="w-6 h-6" />
                            </Button>

                            <Button variant="primary" size="icon" className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 mx-2" onClick={() => {
                                setActiveCall(null);
                                setIsCallMinimized(false);
                                setIsSharingScreen(false);
                                setMessages((prev: any) => [...prev, {
                                    id: 'call-' + Date.now(),
                                    content: `📞 ${activeCall === 'video' ? 'Video' : ''} Llamada finalizada (${formatDuration(callDuration)})`,
                                    direction: 'INTERNAL',
                                    status: 'SENT',
                                    createdAt: new Date(),
                                    senderId: currentUserId
                                }]);
                            }}>
                                <Phone className="w-7 h-7 rotate-[135deg]" />
                            </Button>

                            <Button variant="outline" size="icon" className="w-14 h-14 rounded-full border-transparent bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setShowAddParticipant(true)}>
                                <UserPlus className="w-6 h-6" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimized Call Widget (PIP) */}
            <AnimatePresence>
                {activeCall && isCallMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="absolute bottom-24 right-6 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 cursor-move"
                        drag
                        dragConstraints={{ left: -800, right: 20, top: -800, bottom: 20 }}
                        dragMomentum={false}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">
                                {conversation.lead?.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </div>
                            <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-pulse border-2 border-slate-900"></div>
                        </div>
                        <div className="flex flex-col flex-1 min-w-[100px]">
                            <span className="text-sm font-semibold truncate">{conversation.lead?.name || 'Llamada Activa'}</span>
                            <span className="text-xs text-indigo-300 font-mono">{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-800 text-slate-300" onClick={() => setIsCallMinimized(false)}>
                                <Maximize2 size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-slate-800", isMuted ? "text-red-400" : "text-slate-300")} onClick={() => setIsMuted(!isMuted)}>
                                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-500/20 text-red-500 bg-red-500/10" onClick={() => {
                                setActiveCall(null);
                                setIsCallMinimized(false);
                            }}>
                                <Phone className="w-4 h-4 rotate-[135deg]" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,41,59,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    background: "rgba(11,15,25,0.97)",
                }}
            >
                {/* Date Separator */}
                <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800/50 backdrop-blur-sm">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                </div>

                <ThreadView messages={messages} currentUserId={currentUserId} />
                <div style={{ height: "60px" }} />
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: "8px 10px", paddingBottom: "max(12px, env(safe-area-inset-bottom))", background: "rgba(8,12,20,0.98)", borderTop: "1px solid rgba(30,41,59,0.8)", zIndex: 20, flexShrink: 0, width: "100%", maxWidth: "100%", overflowX: "hidden", display: "flex", justifyContent: "center" }}>
                <div className="flex gap-2 items-end w-full max-w-4xl mx-auto">

                    {/* Attachments */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={(e) => {
                            if (e.target.files) {
                                const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, type: f.type }));
                                setPendingFiles(prev => [...prev, ...newFiles]);
                            }
                        }}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button style={{ height: "40px", width: "40px", flexShrink: 0, borderRadius: "10px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}>
                                <PlusIcon size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 p-2">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon size={16} className="text-purple-500" /> Image
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip size={16} className="text-blue-500" /> Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>


                    {/* Input Container */}
                    <div style={{
                        flex: 1, position: "relative", minWidth: 0,
                        border: isPrivateNote ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(30,41,59,0.9)",
                        borderRadius: "10px",
                        background: isPrivateNote ? "rgba(234,179,8,0.06)" : "rgba(15,23,42,0.8)",
                        display: "flex", flexDirection: "column", padding: "2px",
                    }}>

                        {/* Pending Attachments UI */}
                        {pendingFiles.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "6px 10px 0" }}>
                                {pendingFiles.map((file, idx) => (
                                    <div key={idx} style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace" }}>
                                        {file.type.includes('image') ? <ImageIcon size={11} style={{ color: "#a78bfa" }} /> : <Paperclip size={11} style={{ color: "#60a5fa" }} />}
                                        <span style={{ maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8" }}>{file.name}</span>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }} onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}><X size={11} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Private Note Toggle Label */}
                        {isPrivateNote && (
                            <div style={{ position: "absolute", top: "-12px", left: "12px", background: "rgba(234,179,8,0.15)", color: "#fbbf24", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "99px", border: "1px solid rgba(234,179,8,0.3)", zIndex: 10, display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace" }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} /> Internal Note
                            </div>
                        )}

                        {/* Quick Replies Popover */}
                        {showQuickReplies && (
                            <div className="absolute bottom-full left-0 mb-2 z-50">
                                <QuickReplies
                                    query={newItem}
                                    onSelect={handleQuickReplySelect}
                                />
                            </div>
                        )}

                        {/* AI Copilot Action Bar */}
                        <div className="absolute bottom-full right-4 mb-4 z-40 hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-xl p-1 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-violet-500/30">
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                <Sparkles size={12} className="text-amber-300 animate-pulse" />
                                <span className="text-xs text-white font-black uppercase tracking-widest">COPILOT</span>
                            </div>
                            <div className="flex items-center gap-1 pr-2">
                                <button className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all" onClick={(e) => { e.preventDefault(); toast.success('AI: Resumen copiado al portapapeles'); }}>Resumir Chat</button>
                                <div className="w-px h-3 bg-white/10"></div>
                                <button className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all" onClick={(e) => { e.preventDefault(); toast.loading('IA Mejorando tono...', { duration: 1500 }); setTimeout(() => setNewItem('Hola! Excelente día. ¿En qué puedo apoyarte hoy?'), 1500); }}>Mejorar Tono</button>
                                <div className="w-px h-3 bg-white/10"></div>
                                <button className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all" onClick={async (e) => { 
                                    e.preventDefault(); 
                                    const id = toast.loading('IA Sugiriendo respuesta...');
                                    const res = await draftCopilotServerAction(conversation.id);
                                    if (res.success && res.draft) {
                                        setNewItem(res.draft);
                                        toast.success('Borrador generado', { id });
                                    } else {
                                        toast.error('Error generando borrador', { id });
                                    }
                                }}>Sugerir Respuesta</button>
                            </div>
                        </div>

                        {/* Audio Recording UI or Textarea */}
                        {isRecording ? (
                            <div style={{ width: "100%", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "10px", padding: "8px 14px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "ping 1.5s infinite" }} />
                                    <span style={{ color: "#ef4444", fontFamily: "monospace", fontWeight: 800, fontSize: "16px" }}>{formatDuration(recordDuration)}</span>
                                    <span style={{ color: "rgba(239,68,68,0.8)", fontSize: "12px" }}>Grabando audio...</span>
                                </div>
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }} onClick={cancelRecording}>Cancelar</button>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={newItem}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewItem(val);
                                    if (val.endsWith('/')) setShowQuickReplies(true);
                                    else if (!val.includes('/')) setShowQuickReplies(false);
                                    adjustHeight();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type your message..."
                                style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", padding: "10px 12px", minHeight: "44px", maxHeight: "128px", fontSize: "13px", color: "#cbd5e1", fontFamily: "inherit" }}
                                rows={1}
                            />
                        )}

                        {/* Rich Text Toolbar */}
                        <div style={{ display: "flex", paddingBottom: "6px", paddingRight: "4px", gap: "2px", alignItems: "center", borderTop: "1px solid rgba(30,41,59,0.6)", paddingTop: "4px", margin: "0 6px" }}>
                            <button style={{ height: "22px", width: "22px", background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: "11px", fontWeight: 800, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>B</button>
                            <button style={{ height: "22px", width: "22px", background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: "11px", fontStyle: "italic", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>I</button>
                            <div style={{ width: "1px", height: "10px", background: "rgba(30,41,59,0.8)", margin: "0 3px" }} />
                            <button
                                style={{ height: "22px", padding: "0 6px", background: isPrivateNote ? "rgba(234,179,8,0.15)" : "none", border: isPrivateNote ? "1px solid rgba(234,179,8,0.3)" : "none", cursor: "pointer", color: isPrivateNote ? "#fbbf24" : "#334155", fontSize: "10px", fontWeight: 800, borderRadius: "4px", fontFamily: "monospace" }}
                                onClick={() => setIsPrivateNote(!isPrivateNote)}
                            >/Note</button>
                            <div style={{ flex: 1 }} />
                            <button
                                style={{ height: "28px", width: "28px", background: "none", border: "none", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: isRecording ? "#ef4444" : "#334155" }}
                                onClick={toggleRecording}
                            >
                                <Mic size={isRecording ? 18 : 16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", borderRadius: "10px", overflow: "hidden" }}>
                        <button
                            onClick={handleSend}
                            disabled={(!newItem.trim() && !isRecording && pendingFiles.length === 0) || isSending}
                            style={{
                                height: "40px", padding: "0 16px", flexShrink: 0, borderRadius: "10px 0 0 10px", transition: "all 0.15s", borderRight: "1px solid rgba(0,0,0,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, fontFamily: "monospace",
                                background: (newItem.trim() || isRecording || pendingFiles.length > 0)
                                    ? (isPrivateNote ? "rgba(234,179,8,0.2)" : "linear-gradient(135deg, #0d7a72, #0d9488)")
                                    : "rgba(15,23,42,0.8)",
                                color: (newItem.trim() || isRecording || pendingFiles.length > 0) ? (isPrivateNote ? "#fbbf24" : "#2dd4bf") : "#1e293b",
                                border: (newItem.trim() || isRecording || pendingFiles.length > 0) ? (isPrivateNote ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(13,148,136,0.4)") : "1px solid rgba(30,41,59,0.9)",
                            }}
                        >
                            <Send size={15} />
                            <span>{isPrivateNote ? 'Save' : 'Send'}</span>
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    disabled={(!newItem.trim() && !isRecording && pendingFiles.length === 0) || isSending}
                                    style={{
                                        height: "40px", width: "28px", flexShrink: 0, borderRadius: "0 10px 10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                        background: (newItem.trim() || isRecording || pendingFiles.length > 0)
                                            ? (isPrivateNote ? "rgba(234,179,8,0.15)" : "rgba(13,148,136,0.15)")
                                            : "rgba(15,23,42,0.8)",
                                        color: (newItem.trim() || isRecording || pendingFiles.length > 0) ? (isPrivateNote ? "#fbbf24" : "#2dd4bf") : "#1e293b",
                                        border: (newItem.trim() || isRecording || pendingFiles.length > 0) ? (isPrivateNote ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(13,148,136,0.4)") : "1px solid rgba(30,41,59,0.9)",
                                        borderLeft: "none",
                                    }}
                                >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2" onClick={() => setShowSendLaterModal(true)}><Clock size={14} className="text-teal-500" /> Send Later...</DropdownMenuItem>
                                <DropdownMenuItem className="gap-2" onClick={() => { handleSend(); handleCloseDeal(); updateConversationStatus(conversation.id, 'CLOSED'); }}><CheckCheck size={14} className="text-green-500" /> Send & Mark Resolved</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* ── Draft Composer ─────────────────────────────────────── */}
            <DraftComposer
                conversationId={conversation.id}
                currentUserId={currentUserId}
                userRole="admin" /* Using admin to allow all approval features in this phase */
                onDraftApproved={(content) => {
                    setNewItem(content);
                }}
            />

            {/* Send Later Modal Simulation */}
            {showSendLaterModal && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "16px", width: "100%", maxWidth: "320px", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,12,20,0.9)" }}>
                            <h3 style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", fontFamily: "monospace", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><Clock size={13} style={{ color: "#2dd4bf" }} /> Schedule Message</h3>
                            <button onClick={() => setShowSendLaterModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", display: "block", marginBottom: "5px" }}>Select Date & Time</label>
                                <input type="datetime-local" style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} value={sendLaterDate} onChange={e => setSendLaterDate(e.target.value)} />
                            </div>
                            <button style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.12)", color: "#2dd4bf", fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }} onClick={() => { if (!sendLaterDate) { toast.error('Please select a date'); return; } toast.success(`Scheduled for ${new Date(sendLaterDate).toLocaleString()}`); setShowSendLaterModal(false); setNewItem(''); setPendingFiles([]); }}>Schedule Send</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Participant Modal Simulation */}
            {showAddParticipant && (
                <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "16px", width: "100%", maxWidth: "320px", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,12,20,0.9)" }}>
                            <h3 style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", fontFamily: "monospace", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><UserPlus size={13} style={{ color: "#2dd4bf" }} /> Añadir Participante</h3>
                            <button onClick={() => setShowAddParticipant(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}><X size={14} /></button>
                        </div>
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", display: "block", marginBottom: "5px" }}>Nombre o Correo del Agente</label>
                                <input type="text" placeholder="Ej. Juan Pérez" style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", color: "#cbd5e1", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} value={newParticipant} onChange={e => setNewParticipant(e.target.value)} />
                            </div>
                            <button style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.12)", color: "#2dd4bf", fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }} onClick={() => { if (!newParticipant) { toast.error('Ingresa un nombre'); return; } toast.success(`${newParticipant} invocado a la llamada`); setShowAddParticipant(false); setNewParticipant(''); }}>Invitar a la llamada</button>
                        </div>
                    </div>
                </div>
            {/* ── Merge Modal ─────────────────────────────────────── */}
            {showMergeModal && (
                <MergeModal
                    primaryConversation={conversation}
                    companyId={conversation.companyId || ''}
                    onClose={() => setShowMergeModal(false)}
                    onSuccess={() => {
                        setShowMergeModal(false);
                        window.location.href = '/dashboard/inbox';
                    }}
                />
            )}
        </div>
    );
}

function PlusIcon({ size, className }: any) {
    return (
        <svg
            width={size}
            height={size}
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}
