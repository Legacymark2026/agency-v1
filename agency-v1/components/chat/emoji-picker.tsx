"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = {
    frequently: { label: "Favoritos", emojis: ["👍", "👋", "✅", "❌", "❤️", "🎉", "🙏", "🔥", "💯", "😊", "😄", "🙌"] },
    smileys: { label: "Emociones", emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😜", "🤔", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤧", "🥵", "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😢", "😭", "😱"] },
    gestures: { label: "Gestos", emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "✌️", "🤞", "🤟", "🤘", "👍", "👎", "✊", "👊", "👏", "🙌", "👐", "🤝", "🙏", "💪", "🦾", "🦿"] },
    nature: { label: "Naturaleza", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴", "🦄", "🐝", "🦋", "🐌", "🐞", "🐜", "🐢", "🐍", "🦎", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐕", "🐩", "🐈", "🐇"] },
    food: { label: "Comida", emojis: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪"] },
    activities: { label: "Actividades", emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🏹", "🎣", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤼", "🤸", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🚴", "🚵", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰"] },
    objects: { label: "Objetos", emojis: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💽", "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "🔋", "🔌", "💡", "🔦", "🕯️", "🧯", "💸", "💵", "💴", "💶", "💷", "💰", "💳", "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🔫", "💣", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️"] },
    symbols: { label: "Símbolos", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅"] }
};

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<CategoryKey>("frequently");

    const filteredEmojis = useMemo(() => {
        if (!search) return null;
        const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(c => c.emojis);
        return allEmojis;
    }, [search]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full mb-2 left-0 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-50"
        >
            <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar emoji..."
                        className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10 transition-all"
                        autoFocus
                    />
                </div>
            </div>

            {!search && (
                <div className="flex gap-1 p-2 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                    {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key as CategoryKey)}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                                activeCategory === key
                                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
                                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="h-56 overflow-y-auto p-2.5">
                {filteredEmojis ? (
                    <div className="grid grid-cols-8 gap-1">
                        {filteredEmojis.slice(0, 64).map((emoji, i) => (
                            <button key={i} onClick={() => { onSelect(emoji); onClose(); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-lg transition-colors">
                                {emoji}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-8 gap-1">
                        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                            <button key={i} onClick={() => { onSelect(emoji); onClose(); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-lg transition-colors">
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function EmojiButton({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 transition-colors"
            >
                <span className="text-lg">😀</span>
            </button>
            <AnimatePresence>
                {isOpen && <EmojiPicker onSelect={onEmojiSelect} onClose={() => setIsOpen(false)} />}
            </AnimatePresence>
        </div>
    );
}