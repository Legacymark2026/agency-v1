"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { MessageSquare, Send, X, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
}

export default function FloatingChats() {
  const t = useTranslations("chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      { id: 1, text: t("welcome_msg"), isBot: true }
    ]);
  }, [t]);

  // GSAP animation for toggling chat window
  useEffect(() => {
    if (chatWindowRef.current) {
      if (chatOpen) {
        gsap.killTweensOf(chatWindowRef.current);
        gsap.fromTo(
          chatWindowRef.current,
          { opacity: 0, y: 50, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
        );
        // Scroll to bottom
        scrollToBottom();
      } else {
        gsap.killTweensOf(chatWindowRef.current);
        gsap.to(chatWindowRef.current, {
          opacity: 0,
          y: 30,
          scale: 0.95,
          duration: 0.3,
          ease: "power3.in"
        });
      }
    }
  }, [chatOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (text: string, isUserMessage = true) => {
    if (!text.trim()) return;

    // Add user message
    if (isUserMessage) {
      setMessages(prev => [...prev, { id: Date.now(), text, isBot: false }]);
      setInputValue("");
      
      // Trigger bot response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botReply = getBotReply(text);
        setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, isBot: true }]);

        // Special handling for redirecting to WhatsApp
        if (botReply === t("reply_human")) {
          setTimeout(() => {
            window.open(getWhatsAppLink(), "_blank");
          }, 1500);
        }
      }, 1200);
    } else {
      // Direct insertion for quick replies
      setMessages(prev => [...prev, { id: Date.now(), text, isBot: false }]);
    }
  };

  const handleQuickReply = (optionType: "coffee" | "sub" | "human") => {
    let userText = "";
    let botReply = "";

    if (optionType === "coffee") {
      userText = t("option_coffee");
      botReply = t("reply_coffee");
    } else if (optionType === "sub") {
      userText = t("option_sub");
      botReply = t("reply_sub");
    } else if (optionType === "human") {
      userText = t("option_human");
      botReply = t("reply_human");
    }

    // Add user option
    setMessages(prev => [...prev, { id: Date.now(), text: userText, isBot: false }]);

    // Trigger typing and bot reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, isBot: true }]);

      if (optionType === "human") {
        setTimeout(() => {
          window.open(getWhatsAppLink(), "_blank");
        }, 1500);
      }
    }, 1000);
  };

  const getBotReply = (userText: string): string => {
    const text = userText.toLowerCase();
    
    if (text.includes("café") || text.includes("grano") || text.includes("variedad") || text.includes("tipo") || text.includes("producto")) {
      return t("reply_coffee");
    }
    if (text.includes("suscrip") || text.includes("club") || text.includes("mensual") || text.includes("pausa") || text.includes("frecuencia")) {
      return t("reply_sub");
    }
    if (text.includes("humano") || text.includes("persona") || text.includes("barista") || text.includes("contacto") || text.includes("teléfono") || text.includes("ayuda") || text.includes("whatsapp")) {
      return t("reply_human");
    }
    
    return t("bot_default_reply");
  };

  const getWhatsAppLink = () => {
    return "https://wa.me/573145629141?text=Hola%20Goldneez%21%20Me%20gustar%C3%ADa%20hablar%20con%20un%20barista%20sobre%20sus%20caf%C3%A9s.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      
      {/* Dynamic Web Chat Window */}
      {chatOpen && (
        <div 
          ref={chatWindowRef}
          className="w-[320px] sm:w-[380px] h-[450px] bg-black/90 backdrop-blur-xl border border-aluminum/15 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="bg-amber px-4 py-3 flex items-center justify-between border-b border-aluminum/10 text-black">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider">
                  {t("bot_name")}
                </h4>
                <span className="font-quattrocento text-[10px] text-black/60 font-medium">
                  {t("bot_status")}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`max-w-[80%] p-3 rounded-2xl text-xs font-quattrocento leading-relaxed ${
                  msg.isBot 
                    ? "bg-aluminum/10 text-aluminum self-start rounded-tl-none border border-aluminum/5" 
                    : "bg-amber/15 text-amber self-end rounded-tr-none border border-amber/10"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="bg-aluminum/10 text-aluminum-dark self-start p-3 rounded-2xl rounded-tl-none flex gap-1 items-center w-14 border border-aluminum/5">
                <span className="w-1.5 h-1.5 rounded-full bg-aluminum-dark animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-aluminum-dark animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-aluminum-dark animate-bounce" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Options */}
          {messages.length < 8 && !isTyping && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 justify-start border-t border-aluminum/5 pt-3">
              <button
                onClick={() => handleQuickReply("coffee")}
                className="px-3 py-1.5 rounded-lg border border-aluminum/10 bg-black/40 hover:border-amber/40 hover:bg-amber/5 text-[10px] font-quattrocento text-aluminum hover:text-amber transition-all cursor-pointer"
              >
                {t("option_coffee")}
              </button>
              <button
                onClick={() => handleQuickReply("sub")}
                className="px-3 py-1.5 rounded-lg border border-aluminum/10 bg-black/40 hover:border-amber/40 hover:bg-amber/5 text-[10px] font-quattrocento text-aluminum hover:text-amber transition-all cursor-pointer"
              >
                {t("option_sub")}
              </button>
              <button
                onClick={() => handleQuickReply("human")}
                className="px-3 py-1.5 rounded-lg border border-aluminum/10 bg-black/40 hover:border-amber/40 hover:bg-amber/5 text-[10px] font-quattrocento text-aluminum hover:text-amber transition-all cursor-pointer"
              >
                {t("option_human")}
              </button>
            </div>
          )}

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
            className="p-3 border-t border-aluminum/10 bg-black/40 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t("placeholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-black border border-aluminum/10 focus:border-amber/35 rounded-xl py-2 px-3 text-xs font-quattrocento text-aluminum focus:outline-none placeholder-aluminum-dark"
            />
            <button 
              type="submit"
              className="p-2.5 rounded-xl bg-amber hover:bg-amber-light text-black transition-colors cursor-pointer"
              aria-label={t("send")}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Buttons Bar */}
      <div className="flex flex-col gap-2">
        {/* WhatsApp Chat Button */}
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-115 cursor-pointer relative animate-pulse"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={22} fill="currentColor" className="text-white" />
        </a>

        {/* Web Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-115 cursor-pointer ${
            chatOpen ? "bg-aluminum/15 text-amber border border-amber/30" : "bg-amber text-black hover:bg-amber-light"
          }`}
          aria-label="Toggle Web Chat"
        >
          {chatOpen ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

    </div>
  );
}
