'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Unlink,
  Image as ImageIcon,
  Code,
  Undo2,
  Redo2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  IndentIncrease,
  IndentDecrease,
  Eraser,
  HelpCircle,
  Film,
  ArrowDownLeft,
  Settings,
} from 'lucide-react';

const btnClass =
  'p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40';
const sepClass = 'w-px h-5 bg-slate-300 mx-0.5';

const BLOCK_OPTIONS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'pre', label: 'Preformatted' },
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
];

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'เขียนเนื้อหาบทความที่นี่...',
  minHeight = '320px',
  className = '',
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = React.useState(false);
  const [htmlInput, setHtmlInput] = React.useState(value);
  const [blockTag, setBlockTag] = React.useState('p');
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showSpecialChar, setShowSpecialChar] = React.useState(false);
  const [linkPopup, setLinkPopup] = React.useState<{ top: number; left: number } | null>(null);
  const [linkUrl, setLinkUrl] = React.useState('');
  const linkPopupRef = React.useRef<HTMLDivElement>(null);
  const savedSelectionRef = React.useRef<Range | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInternalUpdate = React.useRef(false);

  React.useEffect(() => {
    if (editorRef.current && !showHtml) {
      if (value !== editorRef.current.innerHTML) {
        isInternalUpdate.current = true;
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, showHtml]);

  React.useEffect(() => {
    setHtmlInput(value);
  }, [value]);

  const execCmd = React.useCallback((command: string, valueArg?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, valueArg ?? undefined);
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = React.useCallback(() => {
    if (!editorRef.current || isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleBlockChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const tag = e.target.value;
    setBlockTag(tag);
    execCmd('formatBlock', tag);
  }, [execCmd]);

  const handleInsertLink = React.useCallback(() => {
    if (showHtml) return;
    const sel = window.getSelection();
    const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current &&
      editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (hasSelection) {
      const range = sel!.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      setLinkUrl('');
      setLinkPopup({ left: rect.left + rect.width / 2, top: rect.bottom });
    } else {
      const url = window.prompt('ใส่ URL ลิงก์ (เลือกข้อความที่ต้องการก่อน แล้วกดแทรกลิงก์):');
      if (url) execCmd('createLink', url.startsWith('http') ? url : `https://${url}`);
    }
  }, [execCmd, showHtml]);

  const handleApplyLink = React.useCallback(() => {
    const url = linkUrl.trim();
    if (!url || !editorRef.current) {
      setLinkPopup(null);
      return;
    }
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
      savedSelectionRef.current = null;
    }
    const finalUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    document.execCommand('createLink', false, finalUrl);
    onChange(editorRef.current.innerHTML);
    setLinkPopup(null);
    setLinkUrl('');
  }, [linkUrl, onChange]);

  const closeLinkPopup = React.useCallback(() => {
    savedSelectionRef.current = null;
    setLinkPopup(null);
    setLinkUrl('');
  }, []);

  React.useEffect(() => {
    if (!linkPopup) return;
    const onMouseDown = (e: MouseEvent) => {
      if (linkPopupRef.current?.contains(e.target as Node)) return;
      if (editorRef.current?.contains(e.target as Node)) return;
      closeLinkPopup();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [linkPopup, closeLinkPopup]);

  const handleUnlink = React.useCallback(() => execCmd('unlink'), [execCmd]);

  const handleAddMediaFromFile = React.useCallback((files: FileList | null) => {
    if (!files?.length || !editorRef.current) return;
    editorRef.current.focus();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      document.execCommand('insertImage', false, url);
      onChange(editorRef.current.innerHTML);
      URL.revokeObjectURL(url);
    }
  }, [onChange]);

  const handleEditorDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    handleAddMediaFromFile(files);
  }, [handleAddMediaFromFile]);

  const handleEditorDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleInsertReadMore = React.useCallback(() => {
    execCmd('insertHTML', '<!--more-->');
  }, [execCmd]);

  const handleTextColor = React.useCallback((color: string) => {
    execCmd('foreColor', color);
    setShowColorPicker(false);
  }, [execCmd]);

  const handleClearFormat = React.useCallback(() => execCmd('removeFormat'), [execCmd]);

  const handleSpecialChar = React.useCallback((char: string) => {
    execCmd('insertText', char);
    setShowSpecialChar(false);
  }, [execCmd]);

  const handleToggleHtml = React.useCallback(() => {
    if (showHtml) {
      const html = htmlInput.trim();
      onChange(html);
      if (editorRef.current) editorRef.current.innerHTML = html || '';
      setShowHtml(false);
    } else {
      setHtmlInput(editorRef.current?.innerHTML ?? value);
      setShowHtml(true);
    }
  }, [showHtml, htmlInput, value, onChange]);

  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden bg-white ${className}`}>
      {/* Top bar: Visual / Code only */}
      <div className="flex items-center justify-end px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex rounded overflow-hidden border border-slate-200">
          <button
            type="button"
            onClick={() => showHtml && handleToggleHtml()}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${!showHtml ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => !showHtml && handleToggleHtml()}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${showHtml ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
          >
            Code
          </button>
        </div>
      </div>

      {!showHtml && (
        <>
          {/* Toolbar Row 1 */}
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200 text-slate-600">
            <select
              value={blockTag}
              onChange={handleBlockChange}
              className="h-7 pl-2 pr-6 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {BLOCK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className={sepClass} />
            <button type="button" onClick={() => execCmd('bold')} className={btnClass} title="ตัวหนา (Bold)">
              <Bold className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('italic')} className={btnClass} title="ตัวเอียง (Italic)">
              <Italic className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('underline')} className={btnClass} title="ขีดเส้นใต้">
              <Underline className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <button type="button" onClick={() => execCmd('insertUnorderedList')} className={btnClass} title="รายการ">
              <List className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('insertOrderedList')} className={btnClass} title="เลขลำดับ">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('formatBlock', 'blockquote')} className={btnClass} title="อ้างอิง">
              <Quote className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <button type="button" onClick={() => execCmd('justifyLeft')} className={btnClass} title="ชิดซ้าย">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('justifyCenter')} className={btnClass} title="กึ่งกลาง">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('justifyRight')} className={btnClass} title="ชิดขวา">
              <AlignRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('justifyFull')} className={btnClass} title="จัดเต็ม">
              <AlignJustify className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddMediaFromFile(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={btnClass}
              title="Add Media (เลือกรูปจากเครื่อง หรือลากวางในพื้นที่เขียน)"
            >
              <Film className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={btnClass}
              title="อัพโหลดรูป (เลือกรูปจากเครื่อง)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <button type="button" onClick={handleInsertLink} className={btnClass} title="แทรกลิงก์">
              <Link className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleUnlink} className={btnClass} title="เอาลิงก์ออก">
              <Unlink className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleInsertReadMore} className={btnClass} title="แทรก Read More">
              <ReadMoreIcon />
            </button>
          </div>

          {/* Toolbar Row 2 */}
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200 text-slate-600">
            <button type="button" onClick={() => execCmd('strikeThrough')} className={btnClass} title="ขีดฆ่า">
              <StrikethroughIcon />
            </button>
            <button type="button" onClick={() => execCmd('insertHorizontalRule')} className={btnClass} title="เส้นคั่น">
              <Minus className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${showColorPicker ? 'bg-slate-200 border-slate-300' : 'border-slate-200 hover:bg-slate-100'}`}
                title="สีตัวอักษร"
              >
                <span className="font-bold underline text-slate-700">A</span>
                <span className="w-3 h-3 rounded border border-slate-300 bg-black" />
              </button>
              {showColorPicker && (
                <div className="absolute left-0 top-full mt-1 p-2 rounded-lg bg-white border border-slate-200 shadow-xl z-10 grid grid-cols-5 gap-1">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleTextColor(c)}
                      className="w-6 h-6 rounded border border-slate-200 hover:ring-2 hover:ring-emerald-500"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={handleClearFormat} className={btnClass} title="ล้างรูปแบบ">
              <Eraser className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpecialChar((v) => !v)}
                className={`px-2 py-1 rounded text-sm font-medium text-slate-700 ${showSpecialChar ? 'bg-slate-200' : 'hover:bg-slate-200'}`}
                title="อักขระพิเศษ"
              >
                Ω
              </button>
              {showSpecialChar && (
                <div className="absolute left-0 top-full mt-1 p-2 rounded-lg bg-white border border-slate-200 shadow-xl z-10 flex flex-wrap gap-1 max-w-[200px]">
                  {['©', '®', '™', '°', '±', '×', '÷', '€', '£', '¥', '…', '—', '–', '§', '¶', '\u00A0'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleSpecialChar(char)}
                      className="w-8 h-8 rounded hover:bg-slate-100 text-slate-700 text-sm"
                    >
                      {char === '\u00A0' ? '␣' : char}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className={sepClass} />
            <button type="button" onClick={() => execCmd('outdent')} className={btnClass} title="ลดเยื้อง">
              <IndentDecrease className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('indent')} className={btnClass} title="เพิ่มเยื้อง">
              <IndentIncrease className="w-4 h-4" />
            </button>
            <span className={sepClass} />
            <button type="button" onClick={() => execCmd('undo')} className={btnClass} title="ยกเลิก">
              <Undo2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => execCmd('redo')} className={btnClass} title="ทำซ้ำ">
              <Redo2 className="w-4 h-4" />
            </button>
            <span className="ml-auto" />
            <button type="button" className={btnClass} title="ความช่วยเหลือ">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Editor area — scrollable so toolbar stays visible when content is long */}
      <div className="max-h-[480px] overflow-y-auto">
        {showHtml ? (
          <textarea
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 text-sm font-mono bg-slate-50 text-slate-800 border-0 focus:outline-none resize-y min-h-[200px]"
            style={{ minHeight }}
            spellCheck={false}
          />
        ) : (
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              onDrop={handleEditorDrop}
              onDragOver={handleEditorDragOver}
              data-placeholder={placeholder}
              data-rich-editor
              className="w-full px-4 py-3 text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_a:hover]:text-blue-800 [&_a:hover]:underline [&_img]:max-w-full [&_img]:h-auto"
              style={{ minHeight }}
              suppressContentEditableWarning
            />
          {linkPopup && (
            <div
              ref={linkPopupRef}
              className="fixed z-50 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-lg"
              style={{
                left: linkPopup.left,
                top: linkPopup.top + 8,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-200" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyLink();
                  if (e.key === 'Escape') closeLinkPopup();
                }}
                placeholder="Paste URL or type to search"
                className="w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleApplyLink}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="แทรกลิงก์"
              >
                <ArrowDownLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={closeLinkPopup}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title="ตั้งค่า"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono pointer-events-none">
            {blockTag.toUpperCase()}
          </div>
        </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        [data-rich-editor]:empty::before { content: attr(data-placeholder); color: #94a3b8; }
        [data-rich-editor] a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
        }
        [data-rich-editor] a:hover { color: #1d4ed8; text-decoration-thickness: 2px; }
      `}} />
    </div>
  );
}

function StrikethroughIcon() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold border-b-2 border-current leading-none">
      S
    </span>
  );
}

function ReadMoreIcon() {
  return (
    <span className="inline-flex flex-col items-center justify-center w-4 h-4">
      <span className="w-full border-t border-dashed border-current" />
      <span className="w-full border-t border-dashed border-current mt-0.5" />
    </span>
  );
}
