'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link2,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Type,
    Table as TableIcon,
    Trash2,
    Plus,
    Minus
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
    addOptions() {
        return {
            types: ['textStyle'],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {}
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run()
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run()
            },
        }
    },
})

interface RichTextEditorProps {
    initialValue: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ initialValue, onChange, placeholder = "Write your content here..." }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false, // Fix SSR hydration mismatch
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextStyle,
            FontSize,
            Table.configure({
                resizable: true,
                allowTableNodeSelection: true,
                HTMLAttributes: {
                    class: 'tiptap-table',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
        ],
        content: initialValue,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-gray prose-lg max-w-none focus:outline-none min-h-[300px] p-4 [&_p:empty]:h-6',
            },
            handlePaste: (view, event) => {
                const html = event.clipboardData?.getData('text/html');
                if (!html) return false;

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const tables = doc.querySelectorAll('table');

                if (tables.length > 0) {
                    event.preventDefault();
                    
                    const { state } = view;
                    const schema = state.schema;
                    const { $from } = state.selection;
                    const insertPos = $from.pos;

                    const createTable = (tableEl: Element) => {
                        const rows: any[] = [];
                        const trs = tableEl.querySelectorAll('tr');
                        
                        trs.forEach((tr, rowIdx) => {
                            const cells: any[] = [];
                            const cellEls = tr.querySelectorAll('th, td');
                            
                            cellEls.forEach((cell) => {
                                const isHeader = cell.tagName.toLowerCase() === 'th';
                                const cellText = cell.textContent?.trim() || '';
                                const textNode = schema.text(cellText);
                                const cellNode = isHeader
                                    ? schema.nodes.tableHeader.create(null, [textNode])
                                    : schema.nodes.tableCell.create(null, [textNode]);
                                cells.push(cellNode);
                            });
                            
                            if (cells.length > 0) {
                                rows.push(schema.nodes.tableRow.create(null, cells));
                            }
                        });
                        
                        if (rows.length > 0) {
                            return schema.nodes.table.create(null, rows);
                        }
                        return null;
                    };

                    let insertOffset = 0;
                    const tr = state.tr;

                    tables.forEach((table) => {
                        const tableNode = createTable(table);
                        if (tableNode) {
                            tr.insert(insertPos + insertOffset, tableNode);
                            insertOffset += tableNode.nodeSize;
                        }
                    });

                    if (insertOffset > 0) {
                        view.dispatch(tr);
                        return true;
                    }
                }

                return false;
            },
        },
    });

    if (!editor) {
        return null;
    }

    const toggleLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl || '');

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white text-gray-900 focus-within:ring-2 focus-within:ring-black">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">

                <div className="flex items-center space-x-1 mr-2 bg-white rounded border border-gray-200 p-0.5">
                    <Type className="h-4 w-4 text-gray-400 ml-2" />
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                editor.chain().focus().setFontSize(e.target.value).run();
                            } else {
                                editor.chain().focus().unsetFontSize().run();
                            }
                        }}
                        value={editor.getAttributes('textStyle').fontSize || ''}
                        className="p-1 rounded bg-transparent hover:bg-gray-50 focus:outline-none text-sm text-gray-700 font-medium cursor-pointer"
                        title="Tamaño de Letra"
                    >
                        <option value="">Automático</option>
                        <option value="12px">12px (Mini)</option>
                        <option value="14px">14px (Pequeño)</option>
                        <option value="16px">16px (Normal)</option>
                        <option value="18px">18px (Lectura)</option>
                        <option value="20px">20px (Grande)</option>
                        <option value="24px">24px (Subtítulo)</option>
                        <option value="30px">30px (Título)</option>
                    </select>
                </div>

                <div className="w-px bg-gray-300 mx-1 h-6" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                        }`}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                        }`}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                        }`}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 4 }) ? 'bg-gray-300' : ''
                        }`}
                    title="Heading 4"
                >
                    <Heading4 className="h-4 w-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1 h-6" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bold') ? 'bg-gray-300' : ''
                        }`}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('italic') ? 'bg-gray-300' : ''
                        }`}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1 h-6" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bulletList') ? 'bg-gray-300' : ''
                        }`}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('orderedList') ? 'bg-gray-300' : ''
                        }`}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1 h-6" />

                <button
                    type="button"
                    onClick={toggleLink}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('link') ? 'bg-gray-300' : ''
                        }`}
                    title="Insert Link"
                >
                    <Link2 className="h-4 w-4" />
                </button>

                <div className="w-px bg-gray-300 mx-1 h-6" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('table') ? 'bg-gray-300' : ''
                        }`}
                    title="Insert Table"
                >
                    <TableIcon className="h-4 w-4" />
                </button>

                {editor.isActive('table') && (
                    <>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            className="p-2 rounded hover:bg-gray-200 transition"
                            title="Add Column"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            className="p-2 rounded hover:bg-gray-200 transition"
                            title="Add Row"
                        >
                            <Plus className="h-4 w-4 rotate-90" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            className="p-2 rounded hover:bg-gray-200 transition"
                            title="Delete Column"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            className="p-2 rounded hover:bg-gray-200 transition"
                            title="Delete Row"
                        >
                            <Minus className="h-4 w-4 rotate-90" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            className="p-2 rounded hover:bg-gray-200 transition text-red-500"
                            title="Delete Table"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
