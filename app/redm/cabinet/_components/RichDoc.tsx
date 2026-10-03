'use client';

import { useEffect, useMemo, useRef } from 'react';

/* Contenu des documents du cabinet : texte enrichi (gras, italique, titres, listes…).
   Stocké dans le champ `contenu` existant sous forme de HTML nettoyé, précédé d'un marqueur.
   Les anciens documents (texte brut, avec éventuellement **gras** / *italique*) restent lisibles. */

export const RICH_MARKER = '<!--rich-->';

const MONO = "'Libre Baskerville', 'Courier New', monospace";

export const RICH_CSS = `
  .rich-doc div, .rich-doc p { margin: 0; }
  .rich-doc p { margin: 0 0 0.6em; }
  .rich-doc h1, .rich-doc h2, .rich-doc h3, .rich-doc h4, .rich-doc h5, .rich-doc h6 { font-size: 1.12em; font-weight: 700; margin: 0.9em 0 0.3em; }
  .rich-doc ul, .rich-doc ol { margin: 0.3em 0 0.6em; padding-left: 1.6em; }
  .rich-doc ul { list-style: disc; } .rich-doc ol { list-style: decimal; }
  .rich-doc hr { border: 0; border-top: 1px solid #8a7a60; margin: 0.8em 0; }
  .rich-doc blockquote { margin: 0.4em 0; padding-left: 1em; border-left: 3px solid #b9a77a; }
  .rich-doc table { border-collapse: collapse; margin: 0.5em 0; }
  .rich-doc td, .rich-doc th { border: 1px solid #8a7a60; padding: 4px 8px; }
  .rich-doc strong, .rich-doc b { font-weight: 700; }
  .rich-doc em, .rich-doc i { font-style: italic; }
`;

/* ── Utilitaires texte ── */
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(escaped: string) {
  return escaped
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`\n]+)`/g, '$1');
}

/* Anciens documents / modèles en texte brut → HTML */
function legacyToHtml(text: string, boldHeadings = false) {
  return text.replace(/\r/g, '').split('\n').map(line => {
    if (!line.trim()) return '<div><br></div>';
    const isHeading = boldHeadings && line.trim().length >= 4 && line === line.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(line) && !/[\[\]•→]/.test(line);
    const html = inlineMd(escapeHtml(line));
    return `<div>${isHeading ? `<strong>${html}</strong>` : html}</div>`;
  }).join('');
}

const MD_DETECT = /(\*\*[^*\n]+\*\*|^#{1,6}\s+\S|^\s*[-*+]\s+\S|^\s*\d+[.)]\s+\S|^\s*(-{3,}|_{3,})\s*$)/m;

/* Collage texte brut (ex. « Copier » de ChatGPT en markdown) → HTML */
function markdownToHtml(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of lines) {
    let m: RegExpMatchArray | null;
    if ((m = raw.match(/^\s*(#{1,6})\s+(.*)$/))) { closeList(); out.push(`<h3>${inlineMd(escapeHtml(m[2]))}</h3>`); continue; }
    if (/^\s*(-{3,}|_{3,})\s*$/.test(raw)) { closeList(); out.push('<hr>'); continue; }
    if ((m = raw.match(/^\s*[-*+]\s+(.*)$/))) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inlineMd(escapeHtml(m[1]))}</li>`); continue;
    }
    if ((m = raw.match(/^\s*\d+[.)]\s+(.*)$/))) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inlineMd(escapeHtml(m[1]))}</li>`); continue;
    }
    closeList();
    out.push(raw.trim() ? `<div>${inlineMd(escapeHtml(raw))}</div>` : '<div><br></div>');
  }
  closeList();
  return out.join('');
}

function plainTextToHtml(text: string) {
  return text.replace(/\r/g, '').split('\n').map(l => l.trim() ? `<div>${escapeHtml(l)}</div>` : '<div><br></div>').join('');
}

/* ── Nettoyage HTML (liste blanche, aucun attribut) ── */
const KEEP = new Set(['P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD']);
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'TITLE', 'HEAD', 'SVG', 'CANVAS', 'NOSCRIPT', 'TEMPLATE', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'IMG', 'VIDEO', 'AUDIO']);

function cleanChildren(src: Node, dst: Node, doc: Document) {
  src.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = (child.textContent ?? '').replace(/[\r\n]+\s*/g, ' ');
      if (t) dst.appendChild(doc.createTextNode(t));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (DROP.has(tag)) return;

    const st = el.style;
    const fw = (st?.fontWeight ?? '').toLowerCase();
    const weightNum = Number(fw);
    const styleBold   = fw === 'bold' || fw === 'bolder' || (!isNaN(weightNum) && weightNum >= 600);
    const styleNormal = fw === 'normal' || (!isNaN(weightNum) && fw !== '' && weightNum < 600);
    const styleItalic = (st?.fontStyle ?? '').toLowerCase() === 'italic';
    const styleUnder  = (st?.textDecorationLine || st?.textDecoration || '').toLowerCase().includes('underline');

    const isBoldTag   = (tag === 'B' || tag === 'STRONG') && !styleNormal;
    const isItalicTag = tag === 'I' || tag === 'EM';
    const isUnderTag  = tag === 'U';

    let container: Node;
    if (KEEP.has(tag)) {
      container = doc.createElement(tag.toLowerCase());
    } else if (isBoldTag) {
      container = doc.createElement('strong');
    } else if (isItalicTag) {
      container = doc.createElement('em');
    } else if (isUnderTag) {
      container = doc.createElement('u');
    } else {
      container = doc.createDocumentFragment();
    }

    cleanChildren(el, container, doc);

    /* Mise en forme portée par le style en ligne (Google Docs, Word, navigateurs…) */
    let node: Node = container;
    const wrap = (name: string) => { const w = doc.createElement(name); w.appendChild(node); node = w; };
    if (styleBold   && !isBoldTag)   wrap('strong');
    if (styleItalic && !isItalicTag) wrap('em');
    if (styleUnder  && !isUnderTag)  wrap('u');

    dst.appendChild(node);
  });
}

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return escapeHtml(html.replace(/<[^>]*>/g, ''));
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const out = parsed.createElement('div');
  cleanChildren(parsed.body, out, parsed);
  return out.innerHTML;
}

/* Valeur stockée → HTML à afficher / éditer */
export function toHtml(value: string): string {
  if (!value) return '';
  if (value.startsWith(RICH_MARKER)) return sanitizeHtml(value.slice(RICH_MARKER.length));
  return legacyToHtml(value);
}

/* Modèle texte → valeur enrichie (titres en MAJUSCULES mis en gras) */
export function templateToRich(text: string): string {
  return RICH_MARKER + legacyToHtml(text, true);
}

export function isRichEmpty(value: string): boolean {
  return value.replace(RICH_MARKER, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
}

export function plainLength(value: string): number {
  return value.replace(RICH_MARKER, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').length;
}

/* ── Affichage (certificat, aperçu) ── */
export function RichContent({ value, style }: { value: string; style?: React.CSSProperties }) {
  const html = useMemo(() => toHtml(value), [value]);
  return (
    <>
      <style>{RICH_CSS}</style>
      <div className="rich-doc" style={style} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

/* ── Éditeur ── */
export function RichEditor({ value, onChange, minHeight = 420, placeholder }: {
  value: string; onChange: (v: string) => void; minHeight?: number | string; placeholder?: string;
}) {
  const ref  = useRef<HTMLDivElement>(null);
  const last = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (value !== last.current) { el.innerHTML = toHtml(value); last.current = value; }
  }, [value]);

  function emit() {
    const el = ref.current; if (!el) return;
    const v = RICH_MARKER + sanitizeHtml(el.innerHTML);
    last.current = v;
    onChange(v);
  }

  function exec(cmd: string) {
    ref.current?.focus();
    document.execCommand(cmd, false);
    emit();
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    let out: string;
    if (html && /<(b|strong|i|em|u|h[1-6]|ul|ol|li|p|div|br|table|span)\b/i.test(html)) out = sanitizeHtml(html);
    else out = MD_DETECT.test(text) ? markdownToHtml(text) : plainTextToHtml(text);
    document.execCommand('insertHTML', false, out);
    emit();
  }

  const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 15, minWidth: 36, padding: '5px 12px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: '#D1B77C', border: '1px solid rgba(209,183,124,0.35)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <style>{RICH_CSS}</style>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" title="Gras" onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={{ ...btn, fontWeight: 700 }}>B</button>
        <button type="button" title="Italique" onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={{ ...btn, fontStyle: 'italic' }}>I</button>
        <button type="button" title="Souligné" onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={{ ...btn, textDecoration: 'underline' }}>U</button>
        <button type="button" title="Liste à puces" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} style={btn}>• Liste</button>
        <button type="button" title="Retirer la mise en forme de la sélection" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }} style={btn}>⌫ Format</button>
        <span style={{ fontFamily: MONO, fontSize: 13, color: '#C8BEA5', marginLeft: 4 }}>Collez directement depuis ChatGPT : gras, italique, titres et listes sont conservés.</span>
      </div>
      <div
        ref={ref}
        className="rich-doc"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        style={{ flex: 1, minHeight, background: '#FFFFFF', color: '#1A1A1A', border: '2px solid #C8BEA5', padding: '28px 34px', fontFamily: MONO, fontSize: 15, lineHeight: 1.9, outline: 'none', overflowY: 'auto', boxSizing: 'border-box' }}
      />
    </div>
  );
}
