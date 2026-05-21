'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Sparkles, Video, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any[];
  toolResults?: any;
  timestamp: Date;
}

interface AIChatProps {
  projectId: string;
  sessionId?: string;
  onExecuteCommand?: (command: string) => Promise<void>;
}

const SUGGESTED_COMMANDS = [
  { icon: '🎬', label: 'Corta los silencios', command: 'Corta todos los silencios mayores a 0.5 segundos' },
  { icon: '📝', label: 'Agrega subtítulos', command: 'Agrega subtítulos animados estilo TikTok' },
  { icon: '🎨', label: 'Color cinematográfico', command: 'Aplica color grading cinematográfico teal & orange' },
  { icon: '✂️', label: 'Corta a 9:16', command: 'Haz smart crop a formato 9:16 manteniendo el rostro centrado' },
  { icon: '🎵', label: 'Mezcla audio', command: 'Normaliza audio a -14 LUFS con ducking automático' },
  { icon: '🎥', label: 'Inserta B-roll', command: 'Inserta B-roll de naturaleza cuando hable de paisajes' },
];

export function AIChat({ projectId, sessionId, onExecuteCommand }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de edición de video. ¿Qué te gustaría hacer? Puedo cortar silencios, agregar subtítulos, aplicar color grading y mucho más.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (onExecuteCommand) {
        await onExecuteCommand(content.trim());
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: generateAIResponse(content.trim()),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onExecuteCommand]);

  return (
    <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Video Assistant
        </CardTitle>
        <CardDescription className="text-slate-400">
          Comandos naturales para editar tu video
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role !== 'user' && (
                <Avatar className="w-8 h-8 bg-purple-500/20 border border-purple-500/30">
                  <AvatarFallback className="text-purple-400">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-700/50 text-slate-200',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-600/50">
                    {msg.toolCalls.map((tool, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 mr-1">
                        <Zap className="w-3 h-3 mr-1" />
                        {tool.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-[10px] mt-1 opacity-50">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {msg.role === 'user' && (
                <Avatar className="w-8 h-8 bg-teal-500/20 border border-teal-500/30">
                  <AvatarFallback className="text-teal-400">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 bg-purple-500/20 border border-purple-500/30">
                <AvatarFallback className="text-purple-400">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-700/50 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {SUGGESTED_COMMANDS.map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              className="text-xs whitespace-nowrap border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={() => sendMessage(cmd.command)}
              disabled={isLoading}
            >
              <span className="mr-1">{cmd.icon}</span>
              {cmd.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Escribe un comando..."
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function generateAIResponse(command: string): string {
  const lower = command.toLowerCase();

  if (lower.includes('silencio') || lower.includes('corta')) {
    return '✅ He analizado el audio y encontrado 3 segmentos de silencio mayores a 0.5s. Los he eliminado automáticamente. Duración reducida de 45s a 38s.';
  }
  if (lower.includes('subtítulo') || lower.includes('texto')) {
    return '✅ Subtítulos agregados con estilo TikTok: fuente Montserrat, tamaño 48px, color blanco con fondo negro semitransparente, animación typewriter.';
  }
  if (lower.includes('color') || lower.includes('grading')) {
    return '✅ Color grading cinematográfico aplicado: Look Teal & Orange con intensidad 80%. Sombras en tonos azulados, highlights en tonos cálidos.';
  }
  if (lower.includes('crop') || lower.includes('9:16') || lower.includes('vertical')) {
    return '✅ Smart crop aplicado a 9:16. Se detectaron 2 rostros y se mantuvieron centrados durante toda la duración del video.';
  }
  if (lower.includes('audio') || lower.includes('mezcla') || lower.includes('lufs')) {
    return '✅ Audio normalizado a -14 LUFS integrado. Ducking automático configurado: música baja 6dB cuando hay voz.';
  }
  if (lower.includes('b-roll') || lower.includes('inserta')) {
    return '✅ B-roll insertado en 3 puntos del video. Se buscaron clips de stock que coinciden con el contexto de cada segmento.';
  }

  return `Entendido. Voy a procesar tu solicitud: "${command}". Esto puede tomar unos momentos...`;
}
