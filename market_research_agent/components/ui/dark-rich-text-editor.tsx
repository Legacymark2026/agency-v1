'use client';

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import CharacterCount from '@tiptap/extension-character-count';
import FontFamily from '@tiptap/extension-font-family';
import Typography from '@tiptap/extension-typography';
import Dropcursor from '@tiptap/extension-dropcursor';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2,
    Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Eraser,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, ListTodo,
    Heading1, Heading2, Heading3, Quote,
    Minus, Maximize2, Minimize2,
    Undo, Redo,
    Link2, Image as ImageIcon, Youtube as YoutubeIcon,
    Table as TableIcon, Trash2, ArrowRightSquare, ArrowDownSquare,
    Palette, Highlighter
} from 'lucide-react';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            setFontSize: (size: string) => ReturnType
            unsetFontSize: () => ReturnType
        }
    }
}

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] } },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {}
                            return { style: `font-size: ${attributes.fontSize}` }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
            unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
        }
    },
});

interface DarkRichTextEditorProps {
    initialValue: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function DarkRichTextEditor({ initialValue, onChange, placeholder = "Escribe tu contenido aquí..." }: DarkRichTextEditorProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Placeholder.configure({ placeholder }),
            TextStyle,
            FontSize,
            FontFamily,
            Typography,
            Dropcursor.configure({ color: '#14b8a6', width: 2 }), // teal-500
            Underline,
            Subscript,
            Superscript,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Color,
            Highlight.configure({ multicolor: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({ nested: true }),
            Image,
            Youtube.configure({ inline: false, controls: true }),
            CharacterCount.configure({ limit: null }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-teal-400 underline decoration-teal-400/30 hover:decoration-teal-400 transition-colors cursor-pointer',
                },
            })
        ],
        content: initialValue,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-slate max-w-none focus:outline-none min-h-[400px] p-6 font-mono text-sm leading-relaxed text-slate-300 [&_p:empty]:h-6 [&_h1]:text-white [&_h2]:text-slate-100 [&_h3]:text-slate-200 [&_li]:text-slate-300 [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-slate-700 [&_td]:p-2 [&_th]:border [&_th]:border-slate-700 [&_th]:bg-slate-800 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold',
            },
        },
    });

    const addLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL del enlace:', previousUrl || '');
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('URL de la imagen:');
        if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const addYoutube = useCallback(() => {
        const url = window.prompt('URL del video de YouTube:');
        if (url) {
            editor?.commands.setYoutubeVideo({ src: url });
        }
    }, [editor]);

    if (!editor) {
        return <div className="min-h-[400px] bg-slate-950/50 border border-slate-800 rounded-lg animate-pulse" />;
    }

    const Btn = ({ onClick, active = false, icon: Icon, title, disabled = false }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-sm transition-all focus:outline-none ${active ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
            <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
        </button>
    );

    const Divider = () => <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />;

    return (
        <div className={`flex flex-col border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50 text-slate-200 focus-within:ring-1 focus-within:ring-teal-500/50 focus-within:border-teal-500/50 transition-all ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none bg-slate-950' : ''}`}>
            {/* Primary Toolbar */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center gap-y-2 gap-x-0.5 sticky top-0 z-10 shadow-sm shadow-slate-950/50">
                
                {/* History */}
                <Btn icon={Undo} title="Deshacer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
                <Btn icon={Redo} title="Rehacer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
                <Divider />

                {/* Typography / Format */}
                <select
                    onChange={(e) => {
                        if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
                        else editor.chain().focus().unsetFontFamily().run();
                    }}
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    className="p-1 rounded bg-transparent focus:outline-none text-xs text-slate-300 cursor-pointer max-w-[100px] hover:text-white"
                >
                    <option value="" className="bg-slate-800">Fuente Auto</option>
                    <option value="Inter, sans-serif" className="bg-slate-800">Inter (Sans)</option>
                    <option value="ui-serif, Georgia, serif" className="bg-slate-800">Georgia (Serif)</option>
                    <option value="ui-monospace, monospace" className="bg-slate-800">Mono</option>
                </select>

                <select
                    onChange={(e) => {
                        if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
                        else editor.chain().focus().unsetFontSize().run();
                    }}
                    value={editor.getAttributes('textStyle').fontSize || ''}
                    className="p-1 ml-1 rounded bg-transparent focus:outline-none text-xs text-slate-300 font-medium cursor-pointer max-w-[80px] border-r border-slate-800 hover:text-white"
                >
                    <option value="" className="bg-slate-800">Tamaño</option>
                    <option value="12px" className="bg-slate-800">12px</option>
                    <option value="14px" className="bg-slate-800">14px</option>
                    <option value="16px" className="bg-slate-800">16px</option>
                    <option value="18px" className="bg-slate-800">18px</option>
                    <option value="24px" className="bg-slate-800">24px</option>
                    <option value="32px" className="bg-slate-800">32px</option>
                </select>

                <Btn icon={Heading1} title="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} />
                <Btn icon={Heading2} title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} />
                <Btn icon={Heading3} title="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} />
                
                <Divider />

                {/* Inline Styles */}
                <Btn icon={Bold} title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
                <Btn icon={Italic} title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
                <Btn icon={UnderlineIcon} title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} />
                <Btn icon={Strikethrough} title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} />
                <Btn icon={Code} title="Código en línea" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} />
                <Btn icon={SubscriptIcon} title="Subíndice" onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} />
                <Btn icon={SuperscriptIcon} title="Superíndice" onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} />
                <Btn icon={Eraser} title="Borrar Formato" onClick={() => editor.chain().focus().unsetAllMarks().run()} />

                <Divider />

                {/* Alignment & Lists */}
                <Btn icon={AlignLeft} title="Izquierda" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} />
                <Btn icon={AlignCenter} title="Centro" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} />
                <Btn icon={AlignRight} title="Derecha" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} />
                <Btn icon={AlignJustify} title="Justificado" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} />
                
                <Divider />

                <Btn icon={List} title="Viñetas" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} />
                <Btn icon={ListOrdered} title="Numérica" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} />
                <Btn icon={ListTodo} title="Lista de Tareas" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} />
                
                <Divider />

                {/* Blocks */}
                <Btn icon={Quote} title="Cita" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} />
                <Btn icon={Code2} title="Bloque de Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} />
                <Btn icon={Minus} title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()} />

                <Divider />

                {/* Colors (HTML native color pickers styled invisibly over icons) */}
                <label title="Color de Texto" className="relative p-1.5 rounded-sm transition-all focus:outline-none text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer overflow-hidden">
                    <Palette className="w-4 h-4" />
                    <input type="color" className="absolute opacity-0 -left-10" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} value={editor.getAttributes('textStyle').color || '#ffffff'} />
                </label>
                <label title="Resaltado" className="relative p-1.5 rounded-sm transition-all focus:outline-none text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer overflow-hidden">
                    <Highlighter className="w-4 h-4" />
                    <input type="color" className="absolute opacity-0 -left-10" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
                </label>

                <Divider />

                {/* Media */}
                <Btn icon={Link2} title="Enlace" onClick={addLink} active={editor.isActive('link')} />
                <Btn icon={ImageIcon} title="Imagen" onClick={addImage} />
                <Btn icon={YoutubeIcon} title="YouTube" onClick={addYoutube} active={editor.isActive('youtube')} />
                <Btn icon={TableIcon} title="Insertar Tabla" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />

                <div className="flex-1" />

                {/* Controls */}
                <Btn icon={isFullscreen ? Minimize2 : Maximize2} title="Pantalla Completa" onClick={() => setIsFullscreen(!isFullscreen)} />
            </div>

            {/* Table Secondary Toolbar (only shows if table is focused) */}
            {editor.isActive('table') && (
                <div className="bg-slate-800/50 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-teal-400 uppercase tracking-widest text-[10px] mr-2">Tabla:</span>
                    <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="text-slate-300 hover:text-white flex items-center gap-1"><ArrowRightSquare className="w-3 h-3 rotate-180" /> Col. Antes</button>
                    <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="text-slate-300 hover:text-white flex items-center gap-1"><ArrowRightSquare className="w-3 h-3" /> Col. Después</button>
                    <button onClick={() => editor.chain().focus().deleteColumn().run()} className="text-red-400 hover:text-red-300 px-1 border-r border-slate-700 mr-1">Eliminar Col.</button>
                    
                    <button onClick={() => editor.chain().focus().addRowBefore().run()} className="text-slate-300 hover:text-white flex items-center gap-1"><ArrowDownSquare className="w-3 h-3 rotate-180" /> Fila Arriba</button>
                    <button onClick={() => editor.chain().focus().addRowAfter().run()} className="text-slate-300 hover:text-white flex items-center gap-1"><ArrowDownSquare className="w-3 h-3" /> Fila Abajo</button>
                    <button onClick={() => editor.chain().focus().deleteRow().run()} className="text-red-400 hover:text-red-300 px-1 border-r border-slate-700 mr-1">Eliminar Fila</button>
                    
                    <button onClick={() => editor.chain().focus().mergeCells().run()} disabled={!editor.can().mergeCells()} className="text-slate-300 hover:text-white disabled:opacity-30">Unir Celdas</button>
                    <button onClick={() => editor.chain().focus().splitCell().run()} disabled={!editor.can().splitCell()} className="text-slate-300 hover:text-white disabled:opacity-30 border-r border-slate-700 pr-2 mr-1">Separar Celdas</button>
                    
                    <button onClick={() => editor.chain().focus().deleteTable().run()} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button>
                </div>
            )}

            {/* Floating Bubble Menu */}
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 bg-slate-800 border border-slate-700 shadow-xl shadow-slate-950/50 rounded-lg p-1">
                <Btn icon={Bold} title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
                <Btn icon={Italic} title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
                <Btn icon={UnderlineIcon} title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} />
                <Btn icon={Strikethrough} title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} />
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <Btn icon={Link2} title="Enlace" onClick={addLink} active={editor.isActive('link')} />
                <Btn icon={Code} title="Código inline" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} />
            </BubbleMenu>

            {/* Editor Content Area */}
            <div className={`bg-slate-950/50 overflow-y-auto flex-1 ${isFullscreen ? 'p-10 max-w-5xl mx-auto w-full' : ''}`}>
                <style jsx global>{`
                    .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #475569;
                        pointer-events: none;
                        height: 0;
                    }
                    /* Task Lists Style overrides */
                    ul[data-type="taskList"] {
                        list-style: none;
                        padding: 0;
                    }
                    ul[data-type="taskList"] li {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 0.5rem;
                    }
                    ul[data-type="taskList"] li > label {
                        flex: 0 0 auto;
                        margin-right: 0.5rem;
                        user-select: none;
                    }
                    ul[data-type="taskList"] li > label input {
                        accent-color: #14b8a6; /* Teal 500 */
                        width: 1rem;
                        height: 1rem;
                        margin-top: 0.25rem;
                        cursor: pointer;
                    }
                    ul[data-type="taskList"] li > div {
                        flex: 1 1 auto;
                    }
                `}</style>
                <EditorContent editor={editor} />
            </div>

            {/* Footer / Status bar */}
            <div className="bg-slate-900 border-t border-slate-800 p-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest flex justify-between items-center selection:bg-teal-500/30">
                <div className="flex gap-4">
                    <span>{editor.storage.characterCount.words()} palabras</span>
                    <span>{editor.storage.characterCount.characters()} caracteres</span>
                </div>
                <div>
                    LegacyMark Engine · Tiptap Cortex
                </div>
            </div>
        </div>
    );
}
